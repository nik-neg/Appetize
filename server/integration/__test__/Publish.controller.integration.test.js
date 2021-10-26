/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-undef */
const supertest = require('supertest');
const _ = require('lodash');
const sinon = require('sinon');
const axios = require('axios');
const User = require('../../models/User');
const DailyTreat = require('../../models/DailyTreat');
const db = require('../../models/db');
const helper = require('../../helpers/db.helpers');
const startServer = require('../integrationServer');

jest.unmock('mongoose');
jest.unmock('jsonwebtoken');
jest.unmock('lodash');
jest.unmock('../../models/User');
jest.unmock('../../models/DailyTreat');
jest.unmock('axios');

let resolvedServer;
let request;

async function removeAllCollections() {
  const collections = Object.keys(db.mongoose.connection.collections);
  for (const collectionName of collections) {
    const collection = db.mongoose.connection.collections[collectionName];
    await collection.deleteMany();
  }
}
// hint: --runInBand or --maxWorkers=1 resolves port already in use issue
let sandbox;
beforeEach(() => startServer()
  .then(({ server, app }) => {
    resolvedServer = server;
    request = supertest(app);
    sandbox = sinon.createSandbox();
  }));

afterEach(async () => {
  if (resolvedServer) resolvedServer.close();
  if (sandbox) sandbox.restore();
  await removeAllCollections();
  await db.mongoose.disconnect();
});
describe('integration test of publish controller - publishDish', () => {
  test('should return 500, because of internal server error', async () => {
    const createResult = await request.post('/register')
      .send({
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'testing@test.com',
        password: 'password',
      })
      .expect(201);
    const { body: { user } } = createResult;
    sandbox.stub(User, 'findOne').throws(Error('User.findOne'));

    const { _id } = user;
    await request.post(`/profile/${_id}/dashboard`)
      .send()
      .expect(500);
  });
  test('should return 400, because user could not be found', async () => {
    const createResult = await request.post('/register')
      .send({
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'testing@test.com',
        password: 'password',
      })
      .expect(201);
    const { body: { user } } = createResult;
    sandbox.stub(User, 'findOne').returns(null);
    const { _id } = user;
    await request.post(`/profile/${_id}/dashboard`)
      .send()
      .expect(400);
  });
  test('should return 500, because of internal server error', async () => {
    const createResult = await request.post('/register')
      .send({
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'testing@test.com',
        password: 'password',
      })
      .expect(201);
    const { body: { user } } = createResult;
    sandbox.stub(DailyTreat, 'create').throws(Error('DailyTreat.create'));

    const { _id } = user;
    await request.post(`/profile/${_id}/dashboard`)
      .send()
      .expect(500);
  });
  test('should return 201, because no error occured', async () => {
    const createResult = await request.post('/register')
      .send({
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'testing@test.com',
        password: 'password',
      })
      .expect(201);
    const { body: { user } } = createResult;
    const { _id } = user;
    await request.post(`/profile/${_id}/dashboard`)
      .send()
      .expect(201);
  });
});

describe('integration test of publish controller - removeDish', () => {
  test('should return 500, because of internal server error', async () => {
    const createResult = await request.post('/register')
      .send({
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'testing@test.com',
        password: 'password',
      })
      .expect(201);
    const { body: { user } } = createResult;
    const { _id } = user;
    const dailyTreat = await request.post(`/profile/${_id}/dashboard`)
      .send()
      .expect(201);
    const dailyTreatID = dailyTreat.body._id;

    sandbox.stub(DailyTreat, 'findOne').throws(Error('DailyTreat.findOne'));
    await request.delete(`/profile/${_id}/dashboard/${dailyTreatID}`)
      .send()
      .expect(500);
  });
  test('should return 500, because of internal server error', async () => {
    const createResult = await request.post('/register')
      .send({
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'testing@test.com',
        password: 'password',
      })
      .expect(201);
    const { body: { user } } = createResult;
    const { _id } = user;
    const dailyTreat = await request.post(`/profile/${_id}/dashboard`)
      .send()
      .expect(201);
    const dailyTreatID = dailyTreat.body._id;

    sandbox.stub(DailyTreat, 'deleteOne').throws(Error('DailyTreat.deleteOne'));
    await request.delete(`/profile/${_id}/dashboard/${dailyTreatID}`)
      .send()
      .expect(500);
  });
  test('should return 500, because of internal server error', async () => {
    const createResult = await request.post('/register')
      .send({
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'testing@test.com',
        password: 'password',
      })
      .expect(201);
    const { body: { user } } = createResult;
    const { _id } = user;
    const dailyTreat = await request.post(`/profile/${_id}/dashboard`)
      .send()
      .expect(201);
    const dailyTreatID = dailyTreat.body._id;

    sandbox.stub(User, 'findOne').throws(Error('User.findOne'));
    await request.delete(`/profile/${_id}/dashboard/${dailyTreatID}`)
      .send()
      .expect(500);
  });
  test('should return 409, because image could not be remvoved', async () => {
    const createResult = await request.post('/register')
      .send({
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'testing@test.com',
        password: 'password',
      })
      .expect(201);
    const { body: { user } } = createResult;
    const { _id } = user;
    const dailyTreat = await request.post(`/profile/${_id}/dashboard`)
      .send()
      .expect(201);
    const dailyTreatID = dailyTreat.body._id;

    sandbox.stub(helper, 'removeImageData').returns(null);
    await request.delete(`/profile/${_id}/dashboard/${dailyTreatID}`)
      .send()
      .expect(409);
  });
  test('should return 200, because image could be removed', async () => {
    const createResult = await request.post('/register')
      .send({
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'testing@test.com',
        password: 'password',
      })
      .expect(201);
    const { body: { user } } = createResult;
    const { _id } = user;

    // TODO: upload image or test middleware isolated?

    // then publish daily treat
    const dailyTreat = await request.post(`/profile/${_id}/dashboard`)
      .send({ chosenImageDate: new Date().getTime() })
      .expect(201);
    const dailyTreatID = dailyTreat.body._id;

    // then remove daily treat with image
    sandbox.stub(helper, 'removeImageData').returns(true);
    await request.delete(`/profile/${_id}/dashboard/${dailyTreatID}`)
      .send()
      .expect(200);
  });
});

describe('integration test of publish controller - checkDishesInRadius', () => {
  test('should return 500, because of internal server error', async () => {
    sandbox.stub(User, 'findOne').throws(Error('User.findOne'));
    const id = 123;
    await request.get(`/profile/${id}/dashboard`)
      .send()
      .query({
        id, radius: 2, cookedOrdered: '{}', pageNumber: 1,
      })
      .expect(500);
  });
  test('should return 409, because user could not be found', async () => {
    sandbox.stub(User, 'findOne').returns(null);
    const id = 123;
    await request.get(`/profile/${id}/dashboard`)
      .send()
      .query({
        id, radius: 2, cookedOrdered: '{}', pageNumber: 1,
      })
      .expect(409);
  });
  test('should return 409, because the user didn\'t set the zip code', async () => {
    const createResult = await request.post('/register')
      .send({
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'testing@test.com',
        password: 'password',
      })
      .expect(201);
    const { body: { user } } = createResult;
    const { _id } = user;

    const cookedOrdered = JSON.stringify({ cooked: true, ordered: true });
    await request.get(`/profile/${_id}/dashboard`)
      .send()
      .query({
        id: _id, radius: 2, cookedOrdered, pageNumber: 1,
      })
      .expect(409);
  });
  test('should return 500, because axios has errored during the request', async () => {
    sandbox.stub(axios, 'get').throws(Error('axios.get'));
    const id = 123;
    await request.get(`/profile/${id}/dashboard`)
      .send()
      .query({
        id, radius: 2, cookedOrdered: '{}', pageNumber: 1,
      })
      .expect(500);
  });
  test('should return 404, because axios respond with an error', async () => {
    const createResult = await request.post('/register')
      .send({
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'testing@test.com',
        password: 'password',
      })
      .expect(201);
    const { body: { user } } = createResult;
    const { _id } = user;

    await request.put(`/profile/${_id}`)
      .send({ zipCode: 10169 })
      .expect(201);

    sandbox.stub(helper, 'findDishesInDB').throws(Error('helper.findDishesInDB'));
    sandbox.stub(axios, 'get').returns({ data: { results: { error: 'ERROR' } } });
    const cookedOrdered = JSON.stringify({ cooked: true, ordered: true });
    await request.get(`/profile/${_id}/dashboard`)
      .send()
      .query({
        id: _id, radius: 2, cookedOrdered, pageNumber: 1,
      })
      .expect(404);
  });
  test('should return 500, because of internal server error in the helper method', async () => {
    sandbox.stub(axios, 'get').returns({ data: { results: ['some data'] } });
    sandbox.stub(helper, 'findDishesInDB').throws(Error('helper.findDishesInDB'));
    const id = 123;
    await request.get(`/profile/${id}/dashboard`)
      .send()
      .query({
        id, radius: 2, cookedOrdered: '{}', pageNumber: 1,
      })
      .expect(500);
  });
  test('should return 200, because they are no errors with the api and database requests', async () => {
    const createResult = await request.post('/register')
      .send({
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'testing@test.com',
        password: 'password',
      })
      .expect(201);
    const { body: { user } } = createResult;
    const { _id } = user;

    await request.put(`/profile/${_id}`)
      .send({ zipCode: 10169 })
      .expect(201);

    sandbox.stub(axios, 'get').returns({ data: { results: ['some zip code data'] } });
    sandbox.stub(helper, 'findDishesInDB').returns(['some daily treats data']);
    await request.get(`/profile/${_id}/dashboard`)
      .send()
      .query({
        id: _id, radius: 2, cookedOrdered: '{}', pageNumber: 1,
      })
      .expect(200);
  });
});

describe('integration test of publish controller - upDownVote', () => {
  test('should return 500, because of internal server error', async () => {
    const createResult = await request.post('/register')
      .send({
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'testing@test.com',
        password: 'password',
      })
      .expect(201);
    const { body: { user } } = createResult;
    const { _id } = user;
    const dailyTreat = await request.post(`/profile/${_id}/dashboard`)
      .send()
      .expect(201);
    const dailyTreatID = dailyTreat.body._id;
    sandbox.stub(DailyTreat, 'findOneAndUpdate').throws(Error('DailyTreat.findOneAndUpdate'));
    await request.patch(`/profile/${_id}/dashboard/${dailyTreatID}`)
      .send()
      .query({
        upDownVote: 'up',
      })
      .expect(500);
  });
  test('should return 500, because of internal server error', async () => {
    const createResult = await request.post('/register')
      .send({
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'testing@test.com',
        password: 'password',
      })
      .expect(201);
    const { body: { user } } = createResult;
    const { _id } = user;
    const dailyTreat = await request.post(`/profile/${_id}/dashboard`)
      .send()
      .expect(201);
    const dailyTreatID = dailyTreat.body._id;
    sandbox.stub(User, 'findOneAndUpdate').throws(Error('User.findOneAndUpdate'));
    await request.patch(`/profile/${_id}/dashboard/${dailyTreatID}`)
      .send()
      .query({
        upDownVote: 'up',
      })
      .expect(500);
  });
  test('should return 500, because of internal server error', async () => {
    const createResult = await request.post('/register')
      .send({
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'testing@test.com',
        password: 'password',
      })
      .expect(201);
    const { body: { user } } = createResult;
    const { _id } = user;
    const dailyTreat = await request.post(`/profile/${_id}/dashboard`)
      .send()
      .expect(201);
    const dailyTreatID = dailyTreat.body._id;
    sandbox.stub(DailyTreat, 'findOneAndUpdate').throws(Error('DailyTreat.findOneAndUpdate'));
    await request.patch(`/profile/${_id}/dashboard/${dailyTreatID}`)
      .send()
      .query({
        upDownVote: 'down',
      })
      .expect(500);
  });
  test('should return 500, because of internal server error', async () => {
    const createResult = await request.post('/register')
      .send({
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'testing@test.com',
        password: 'password',
      })
      .expect(201);
    const { body: { user } } = createResult;
    const { _id } = user;
    const dailyTreat = await request.post(`/profile/${_id}/dashboard`)
      .send()
      .expect(201);
    const dailyTreatID = dailyTreat.body._id;
    sandbox.stub(User, 'findOneAndUpdate').throws(Error('User.findOneAndUpdate'));
    await request.patch(`/profile/${_id}/dashboard/${dailyTreatID}`)
      .send()
      .query({
        upDownVote: 'down',
      })
      .expect(500);
  });
  test('should return 200, because upvote dish request succeeded', async () => {
    let createResult = await request.post('/register')
      .send({
        firstName: 'dish create user',
        lastName: 'lastName',
        email: 'testing@test.com',
        password: 'password',
      })
      .expect(201);

    const { body: { user } } = createResult;
    let { _id } = user;
    const dailyTreat = await request.post(`/profile/${_id}/dashboard`)
      .send()
      .expect(201);
    const dailyTreatID = dailyTreat.body._id;
    createResult = await request.post('/register')
      .send({
        firstName: 'dish vote user',
        lastName: 'lastName',
        email: 'testing123@test.com',
        password: 'password',
      })
      .expect(201);
    _id = createResult.body.user._id;
    await request.patch(`/profile/${_id}/dashboard/${dailyTreatID}`)
      .send()
      .query({
        upDownVote: 'up',
      })
      .expect(200);
    const updatedDailyTreat = await DailyTreat.findOne({ _id: dailyTreatID });
    expect(updatedDailyTreat.votes).toBe(1);
    const updatedUser = await User.findOne({ _id });

    const updatedLikedByUserIdArray = [...updatedDailyTreat.likedByUserID.map((el) => el.toString())];
    expect(updatedLikedByUserIdArray).toContain(_id);
    const updatedUserLikedArray = [...updatedUser.liked.map((el) => el.toString())];
    expect(updatedUserLikedArray).toContain(dailyTreatID);
  });
});
