/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */

const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const _ = require('lodash');

const User = require('../../models/User');
const userController = require('../User.controller');

jest.mock('../../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('lodash');

const SECRET_KEY = process.env.SECRET_KEY || 'loading';

beforeEach(() => {
  User.findOne = jest.fn();
  User.create = jest.fn();
});

const setup = () => { // test object factory
  const req = {
    body: {},
  };
  const res = {
    status: jest.fn(
      function status() {
        return this;
      },
    ),
    json: jest.fn(
      function json() {
        return this;
      },
    ),
    send: jest.fn(
      function send() {
        return this;
      },
    ),
  };
  return { req, res };
};

describe('createUser method', () => {
  test('createUser throws 409, because user already exists', async () => {
    const { req, res } = setup();
    const {
      firstName, lastName, email, password,
    } = User;
    const mockUser = {
      firstName, lastName, email, password,
    };
    req.body = {
      ...mockUser,
    };
    await User.findOne.mockResolvedValue(req.body);
    await userController.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.status).toHaveBeenCalledTimes(1);
  });
  test('createUser throws 500, because user could not be created', async () => {
    const { req, res } = setup();
    const {
      firstName, lastName, email, password,
    } = User;
    const mockUser = {
      firstName, lastName, email, password,
    };
    req.body = {
      ...mockUser,
    };
    const mockErr = new Error('ERROR');
    await User.findOne.mockResolvedValue(null);
    await User.create.mockRejectedValue(mockErr);
    await userController.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    let createdUser = await User.create.mockResolvedValue({ _id: 123456789, ...mockUser });
    createdUser = await createdUser();
    createdUser.save = jest.fn();
    await createdUser.save.mockRejectedValue(mockErr);
    await userController.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.status).toHaveBeenCalledTimes(2);
  });
  test('createUser throws 400, because input is invalid', async () => {
    const { req, res } = setup();
    const {
      firstName, lastName, email, password,
    } = User;
    const mockUser = {
      firstName, lastName, email, password,
    };
    const userWithoutFirstname = mockUser;
    userWithoutFirstname.firstName = '';
    req.body = {
      ...userWithoutFirstname,
    };
    await User.findOne.mockResolvedValue(undefined);
    await userController.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    const userWithoutLastname = mockUser;
    userWithoutLastname.lastName = '';
    req.body = {
      ...userWithoutLastname,
    };
    await User.findOne.mockResolvedValue(undefined);
    await userController.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    const userWithoutEmail = mockUser;
    userWithoutEmail.email = '';
    req.body = {
      ...userWithoutEmail,
    };
    await User.findOne.mockResolvedValue(undefined);
    await userController.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    const userWithoutPassword = mockUser;
    userWithoutPassword.password = '';
    req.body = {
      ...userWithoutPassword,
    };
    await User.findOne.mockResolvedValue(undefined);
    await userController.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.status).toHaveBeenCalledTimes(4);
  });
  test('createUser returns 201, user without password and jwt token', async () => {
    const { req, res } = setup();
    const {
      firstName, lastName, email, password,
    } = User;
    const mockUser = {
      firstName, lastName, email, password,
    };
    req.body = {
      ...mockUser,
    };
    await User.findOne.mockResolvedValue(undefined);
    const hash = await bcryptjs.hash(password);
    expect(password).not.toBe(hash);
    const newUser = { _id: 123456789, _doc: { mockUser } };
    let createdUser = await User.create.mockResolvedValue(newUser);
    createdUser = await createdUser();
    createdUser.save = jest.fn();
    const userId = newUser._id;
    const accessToken = jwt.sign({ id: userId }, SECRET_KEY);
    expect(userId).not.toBe(accessToken);
    await createdUser.save.mockResolvedValue(newUser);
    const userWithoutPassword = _.omit(newUser._doc, ['password']);
    await userController.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ user: userWithoutPassword, accessToken });
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});

describe('loginUser method', () => {
  test('loginUser throws 400, because user email or password is not provided', async () => {
    const { req, res } = setup();
    let mockUser = {
      email: '', password: '123456789',
    };
    req.body = {
      ...mockUser,
    };
    await userController.loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    mockUser = {
      email: 'testing@test.com', password: '',
    };
    req.body = {
      ...mockUser,
    };
    await userController.loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledTimes(2);
    expect(res.send).toHaveBeenCalledTimes(2);
  });
  test('loginUser throws 500, because of internal server error', async () => {
    const { req, res } = setup();
    const mockUser = {
      email: 'testing@test.com', password: '123456789',
    };
    req.body = {
      ...mockUser,
    };
    const mockErr = new Error('ERROR');
    await User.findOne.mockRejectedValue(mockErr);
    await userController.loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.status).toHaveBeenCalledTimes(1);
  });
  test('loginUser throws 401, because user email or password is incorrect', async () => {
    const { req, res } = setup();
    const {
      email, hashedPassword,
    } = User;
    const mockUser = {
      email, password: hashedPassword,
    };
    req.body = {
      ...mockUser,
    };
    await User.findOne.mockResolvedValue(null); // user not found
    await userController.loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(401);

    req.body = {
      ...mockUser, wrongPassword: '123456789',
    };
    let user = await User.findOne.mockResolvedValue(req.body);
    user = await user();
    await bcryptjs.compare(user.wrongPassword, user.password);
    await userController.loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.status).toHaveBeenCalledTimes(2);
    expect(res.send).toHaveBeenCalledTimes(2);
  });

  test('loginUser returns 201, user without password and jwt token', async () => {
    const { req, res } = setup();
    const {
      _id, email, password, hashedPassword,
    } = User;
    const mockUser = {
      _id, email, password: hashedPassword,
    };
    req.body = {
      email, password,
    };
    let user = await User.findOne.mockResolvedValue(mockUser);
    user = await user();
    await bcryptjs.compare(password, user.password);
    const userId = _id;
    const accessToken = jwt.sign({ id: userId }, SECRET_KEY);
    expect(userId).not.toBe(accessToken);
    const userWithoutPassword = _.omit(mockUser, ['password']);
    await userController.loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ user: userWithoutPassword, accessToken });
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});

describe('logoutUser method', () => {
  test('logoutUser returns 400', async () => {
    const { req, res } = setup();
    const {
      _id, email, password, hashedPassword,
    } = User;
    const mockUser = {
      _id, email, password: hashedPassword,
    };
    req.user = null;
    await userController.logoutUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
  test('logoutUser returns 200 and an empty object', async () => {
    const { req, res } = setup();
    const {
      _id, email, password, hashedPassword,
    } = User;
    const mockUser = {
      _id, email, password: hashedPassword,
    };
    req.user = mockUser;
    await userController.logoutUser(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({});
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});

describe('showProfile method', () => {
  test('showProfile returns 400', async () => {
    const { req, res } = setup();
    const {
      _id, email, password, hashedPassword,
    } = User;
    const mockUser = {
      _id, email, password: hashedPassword,
    };
    req.user = null;
    await userController.showProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
  test('showProfile returns 200', async () => {
    const { req, res } = setup();
    const {
      _id, email, password, hashedPassword,
    } = User;
    const mockUser = {
      _doc: {
        _id, email, password: hashedPassword,
      },
    };
    req.user = mockUser;
    const userInfo = ({ ...req.user })._doc;
    await userController.showProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(userInfo);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});

describe('setCity method', () => {
  test('setCity returns 500, because of internal server error', async () => {
    const { req, res } = setup();
    const {
      _id, email, password, hashedPassword,
    } = User;
    const mockUser = {
      _doc: {
        _id, email, password: hashedPassword,
      },
    };
    req.params = { id: mockUser._doc.id };
    req.body = { city: 'Berlin' };

    await User.findOne.mockRejectedValue(null);
    await userController.setCity(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
  test('setCity returns 400, because user could not be found in database', async () => {
    const { req, res } = setup();
    const {
      _id, email, password, hashedPassword,
    } = User;
    const mockUser = {
      _doc: {
        _id, email, password: hashedPassword,
      },
    };
    req.params = { id: mockUser._doc.id };
    req.body = { city: 'Berlin' };

    await User.findOne.mockResolvedValue(null);
    await userController.setCity(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  test('setCity returns 200 and the user without password ', async () => { // to skip tests, use test.only
    const { req, res } = setup();
    const {
      _id, email, password, hashedPassword,
    } = User;
    const mockUser = {
      _doc: {
        _id, email, password: hashedPassword,
      },
    };
    req.params = { id: mockUser._doc.id };
    req.body = { city: 'Berlin' };

    let user = await User.findOne.mockResolvedValue(mockUser);
    user = await user();
    user.city = req.body.city;
    user.save = jest.fn();
    await user.save.mockResolvedValue(user);
    const userWithoutPassword = _.omit(user._doc, ['password']);
    await userController.setCity(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(userWithoutPassword);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});
