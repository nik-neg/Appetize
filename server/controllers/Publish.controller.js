/* eslint-disable no-shadow */
/* eslint-disable eqeqeq */
/* eslint-disable no-plusplus */
const axios = require('axios');

const _ = require('lodash');

const User = require('../models/User');

const DailyTreat = require('../models/DailyTreat');

const helper = require('../helpers/db.helpers');

module.exports.publishDish = async (req, res) => {
  const { id } = req.params;
  let user;
  try {
    user = await User.findOne({
      _id: id,
    });
    if (!user) {
      return res.status(400).send({ error: '400', message: 'Could not find user' });
    }
  } catch (e) {
    return res.status(500).send({ error: '500', message: 'Could not find user - Internal server error' });
  }
  const {
    title, description, recipe, firstName, cookedNotOrdered, chosenImageDate, userZipCode,
  } = req.body;
  const imageUrl = `http://localhost:3001/profile/${id}/download?created=${chosenImageDate}`;
  // create dish to publish
  try {
    const dailyTreat = await DailyTreat.create({
      userID: id,
      creatorName: firstName,
      likedByUserID: [],
      zipCode: userZipCode,
      cookedNotOrdered,
    });
    dailyTreat.title = title;
    dailyTreat.description = description;
    dailyTreat.recipe = recipe;
    dailyTreat.votes = 0;
    dailyTreat.created = new Date().getTime();
    dailyTreat.imageUrl = imageUrl;

    const dailyTreatSaveResponse = await dailyTreat.save();
    const { _id } = dailyTreatSaveResponse;
    user.dailyFood.push(_id);
    await user.save();
    res.status(201).send(dailyTreatSaveResponse);
  } catch (e) {
    res.status(500).send({ error: '500', message: 'Could not save daily treat - Internal server error' });
  }
};

module.exports.removeDish = async (req, res) => {
  const { id, dailyTreatID } = req.params;
  // get created time of dailytreat from image url
  try {
    const dailyTreat = await DailyTreat.findOne({ _id: dailyTreatID });
    let createdTime = Array.from(dailyTreat.imageUrl).reverse();
    const cutIndex = createdTime.indexOf('=');
    createdTime = createdTime.slice(0, cutIndex).reverse().join('');
    // remove from dailytreats
    await DailyTreat.deleteOne({ _id: dailyTreatID });
    // remove from dailyFood list in user
    const user = await User.findOne({ _id: id });
    user.dailyFood = user.dailyFood.filter((dailyTreat) => dailyTreat != dailyTreatID);
    await user.save();
    // remove from files and chunks
    const excludeDeletePattern = new RegExp(`${id}/${createdTime}`);
    const result = await helper.removeImageData(excludeDeletePattern, 'deleteOne');
    if (result) {
      res.status(200).send({ message: 'Image removed' });
    } else {
      res.status(409).send({ message: 'Image could not be removed' });
    }
  } catch (e) {
    res.status(500).send({ error: '500', message: 'Could not remove daily treat and image - Internal server error' });
  }
};

module.exports.checkDishesInRadius = async (req, res) => {
  // hint: detailed error handling for integration test
  const {
    id, radius, cookedOrdered, pageNumber,
  } = req.query;
  const parsedCookedOrdered = JSON.parse(cookedOrdered);
  let user;
  try {
    // get zip code from user
    user = await User.findOne({
      _id: id,
    });
    if (!user) return res.status(409).send({ error: '409', message: 'User doesn\'t exist' });
    const { zipCode } = user;
    if (!zipCode) return res.status(409).send({ error: '409', message: 'Zip code doesn\'t exist' });
    const url = `https://app.zipcodebase.com/api/v1/radius?apikey=${process.env.API_KEY}&code=${zipCode}&radius=${radius}&country=de`;
    const response = await axios.get(url);
    if (response.data.results.error) {
      return res.status(404).send({ error: '404', message: 'API doesn\'t respond with data.' });
    }
    const zipCodesInRadius = response.data.results.map((element) => (
      { zipCode: element.code, city: element.city }));
    const dailyTreats = await helper.findDishesInDB(
      zipCodesInRadius, parsedCookedOrdered, pageNumber,
    );
    return res.status(200).send(dailyTreats);
  } catch (e) {
    return res.status(500).send({ error: '500', message: 'checkDishesInRadius - Internal server error' });
  }
};

module.exports.upDownVote = async (req, res) => {
  const { id, dailyTreatID } = req.params;
  const { upDownVote } = req.query;
  const upVoteStatement = {
    dailyTreat: { $inc: { votes: 1 }, $push: { likedByUserID: id } },
    user: { $push: { liked: dailyTreatID } },
  };
  const downVoteStatement = {
    dailyTreat: { $inc: { votes: -1 }, $pull: { likedByUserID: id } },
    user: { $pull: { liked: dailyTreatID } },
  };
  let dailyTreat;
  let user;

  try {
    const dailyTreatToCheck = await DailyTreat.findOne({ _id: dailyTreatID });
    if (dailyTreatToCheck && ((dailyTreatToCheck.userID == id) || (dailyTreatToCheck.votes === 0 && upDownVote !== 'up'))) {
      return res.status(409).send({ error: '409', message: 'User cannot vote for this dish!' });
    }
  } catch (e) {
    return res.status(500).send({ error: '500', message: 'Could not find daily treat - Internal server error' });
  }

  try {
    if (upDownVote === 'up') {
      // like dish
      dailyTreat = await DailyTreat.findOneAndUpdate(
        {
          _id: dailyTreatID,
          userID: { $ne: id },
        },
        upVoteStatement.dailyTreat,
        { new: true },
      );
      user = await User.findOneAndUpdate(
        { _id: id },
        upVoteStatement.user,
        { new: true },
      );
    } else {
      // unlike dish
      dailyTreat = await DailyTreat.findOneAndUpdate(
        {
          _id: dailyTreatID,
          userID: { $ne: id },
        },
        downVoteStatement.dailyTreat,
        { new: true },
      );
      user = await User.findOneAndUpdate(
        { _id: id },
        downVoteStatement.user,
        { new: true },
      );
    }
    user = _.omit(user, ['password']);
    return res.status(200).send({ user, dailyTreat });
  } catch (e) {
    return res.status(500).send({ error: '500', message: 'Could not up/down vote daily treat - Internal server error' });
  }
};

module.exports.updateDish = async (req, res) => {
  const { dishText, cookedOrdered } = req.body;
  const { dailyTreatsID } = req.query;
  let updatedDailyTreat;
  try {
    updatedDailyTreat = await DailyTreat.findOneAndUpdate(
      {
        _id: dailyTreatsID,
      },
      { ...dishText, cookedNotOrdered: cookedOrdered.cooked },
      { new: true },
    );
  } catch (e) {
    return res.status(500).send({ error: '500', message: 'Could not update daily treat - Internal server error' });
  }

  return res.status(200).send(updatedDailyTreat);
};
