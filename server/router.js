const router = require('express').Router();
const userController = require('./controllers/User.controller');

router.post('/register', userController.createUser);
router.post('/login', userController.loginUser);
router.get('/profile/:id', userController.showProfile);
router.post('/profile/:id/upload', userController.saveImage);
router.get('/profile/:id/download', userController.retrieveImage);

module.exports = router;
