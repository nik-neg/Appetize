const axios = require('axios');

const User = require('../models/User');

const DailyTreat = require('../models/DailyTreat');

module.exports.publishDish = async (req, res) => {
  // console.log('PUBLISH DISH')
  // console.log(req.params.id, req.body)
  const { id } = req.params;
  const {
    title, description, recipe, firstName,
  } = req.body;
  const imageUrl = `http://localhost:3001/profile/${id}/download`;

  let alreadyPublished = await DailyTreat.findOne({
    userID: id,
  });
  if (alreadyPublished) {
    return res
      .status(409)
      .send({ error: '409', message: 'DailyTreat already published!' });
  }
  // create dish to publish
  const dailyTreat = new DailyTreat();
  dailyTreat.userID = id;
  dailyTreat.creatorName = firstName;
  dailyTreat.likedByUserID = [];
  // get user for zip code
  let user;
  try {
    user = await User.findOne({
      _id: id,
    });
  } catch (e) {
    console.log(e);
  }
  dailyTreat.zipCode = user.zipCode ? user.zipCode : '10000'; // default zip code

  dailyTreat.title = title;
  dailyTreat.description = description;
  dailyTreat.recipe = recipe;
  dailyTreat.imageUrl = imageUrl;
  dailyTreat.votes = 0;
  dailyTreat.created = new Date().toISOString();
  // save to db
  try {
    const dailyTreatSaveResponse = await dailyTreat.save();
    console.log(dailyTreatSaveResponse);
    res.status(201).send(dailyTreatSaveResponse);
  } catch (e) {
    console.log(e);
  }
};

module.exports.checkDishesInRadius = async (req, res) => {
  // console.log('SERVER - CHECK DISHES');
  // console.log(req.params.id, req.params.radius)
  const { id, radius } = req.params;
  let user;
  try {
    // get zip code of user
    user = await User.findOne({
      _id: id,
    });
  } catch (e) {
    console.log(e);
  }
  let zipCode;
  if (user) {
    zipCode = user.zipCode;
  } else {
    return res
      .status(409)
      .send({ error: '409', message: 'User doesn\'t exist' });
  }
  if (zipCode) {
    // console.log(zipCode);
    const url = `https://app.zipcodebase.com/api/v1/radius?apikey=${process.env.API_KEY}&code=${zipCode}&radius=${radius}&country=de`;
    axios
      .get(url)
      .then(function (response) {
        const zipCodesInRadius = response.data.results.map((element) => {
          return { zipCode: element.code, city: element.city };
        });
        // console.log(zipCodesInRadius);
        helperFindDishesInDB(res, res, zipCodesInRadius);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .then(function () {
        // always executed
      });
  }

  const helperFindDishesInDB = async (req, res, zipCodesInRadius) => {
    let dishesForClient = [];
    for (let i = 0; i < zipCodesInRadius.length; i++) {
      try {
        let dailyTreatsFromDB = [];
        await DailyTreat.find(
          { zipCode: zipCodesInRadius[i].zipCode },
          (err, dailyTreats) => {
            // console.log('found in: '+zipCodesInRadius[i].zipCode)
            // console.log(dailyTreats)
            dailyTreats.forEach((dailyTreat) => {
              const copyDailyTreat = Object.assign(
                {},
                { ...dailyTreat._doc, city: zipCodesInRadius[i].city },
              );
              // console.log('copy');
              // console.log(copyDailyTreat);
              dailyTreatsFromDB.push(copyDailyTreat);
            });
          },
        );
        // console.log('dailyTreats')
        // console.log(dailyTreatsFromDB)
        if (dailyTreatsFromDB && dailyTreatsFromDB.length > 0) {
          dishesForClient.push(...dailyTreatsFromDB); // not only one elements
        }
      } catch (e) {
        console.log(e);
      }
    }
    // console.log(dishesForClient);
    res.send(dishesForClient);
  };
};

module.exports.upDownVote = async (req, res) => {
  const { id, dailyTreatsID, upDown } = req.params;
  //console.log('VOTE ')
  //console.log(id, dailyTreatsID, upDown)
  try {
    if (upDown === 'up') {
      // console.log('like', upDown)
      // like dish
      await DailyTreat.updateOne(
        {
          _id: dailyTreatsID,
          userID: { $ne: id },
        },
        { $inc: { votes: 1 }, $push: { likedByUserID: id } },
        { new: true },
      );
    } else {
      // unlike dish
      // console.log('unlike', upDown)
      await DailyTreat.updateOne(
        {
          _id: dailyTreatsID,
          userID: { $ne: id },
        },
        { $inc: { votes: -1 }, $pull: { likedByUserID: id } },
        { new: true },
      );
    }
    // broadcast votes for zipCode
    // let user;
    // try {
    //   user = await User.findOne({_id: id}); /// ?
    //   if(user) {
    //     const updatedDailyTreat = await DailyTreat.findOne({_id: dailyTreatsID});
    //     console.log(updatedDailyTreat)
    //     io.on('connection', function(socket) {
    //       console.log(`Broadcast to ${user.zipCode} room.`)
    //       io.emit(`${user.zipCode}`, updatedDailyTreat.votes);
    //     });
    //   }
    // } catch(e) {
    //   console.log(e)
    // }

    // get updated votes for the realted user
    let dailyTreat;
    try {
      dailyTreat = await DailyTreat.findOne({ _id: dailyTreatsID });
      // console.log(dailyTreat)
      res.send({ votes: dailyTreat.votes });
    } catch (e) {
      console.log(e);
    }
  } catch (e) {
    console.log(e);
  }
};
