const Router = require('express').Router;
const userController = require('../controllers/user-controller');
const router = new Router();
const {body} = require('express-validator');
const authMiddleware = require('../middlewares/auth-middleware');

router.post('/registration',
    body('email').isEmail(),
    body('password').isLength({min: 6, max: 24}),
    userController.registration
);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.get('/activate/:link', userController.activate);
router.get('/refresh', userController.refresh);
router.get('/subscriptions', authMiddleware, userController.getSubscriptions);
router.get('/followers', authMiddleware, userController.getFollowers);
router.post('/subscribe/:id', authMiddleware, userController.subscribe);
router.post('/unsubscribe/:id', authMiddleware, userController.unsubscribe);

module.exports = router
