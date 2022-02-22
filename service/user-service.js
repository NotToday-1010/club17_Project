const UserModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('./mail-service');
const tokenService = require('./token-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');

class UserService {
    async registration(userName, email, password) {
        const emailCandidate = await UserModel.findOne({email})
        const userNameCandidate = await UserModel.findOne({userName})

        if (emailCandidate) {
            throw ApiError.BadRequest(`User with Email: ${email} already exist`)
        }
        if (userNameCandidate) {
            throw ApiError.BadRequest(`User with name ${userName} already exist`)
        }

        const hashPassword = await bcrypt.hash(password, 3);
        const activationLink = uuid.v4(); // v34fa-asfasf-142saf-sa-asf

        const user = await UserModel.create({userName, email, password: hashPassword, activationLink})
        await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);

        const userDto = new UserDto(user); // id, email, isActivated
        const tokens = tokenService.generateTokens({...userDto});
        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {...tokens, user: userDto}
    }

    async activate(activationLink) {
        const user = await UserModel.findOne({activationLink})
        if (!user) {
            throw ApiError.BadRequest('Activation link  is not correct')
        }
        user.isActivated = true;
        await user.save();
    }

    async login(email, password) {
        const user = await UserModel.findOne({email})
        if (!user) {
            throw ApiError.BadRequest('User with this Email not found')
        }
        const isPassEquals = await bcrypt.compare(password, user.password);
        if (!isPassEquals) {
            throw ApiError.BadRequest('Incorrect password');
        }
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});

        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return {...tokens, user: userDto}
    }

    async logout(refreshToken) {
        const token = await tokenService.removeToken(refreshToken);
        return token;
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw ApiError.UnauthorizedError();
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await tokenService.findToken(refreshToken);
        if (!userData || !tokenFromDb) {
            throw ApiError.UnauthorizedError();
        }
        const user = await UserModel.findById(userData.id);
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});

        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return {...tokens, user: userDto}
    }

    async getAllFollowers(email) {
        const user = await UserModel.findOne({email});
        return user.followers;
    }

    async getAllSubscriptions(email) {
        const user = await UserModel.find({email});
        return user.subscriptions;
    }

    async subscribe(from, to) {
        const userFrom = await UserModel.findOne({userName: from});
        const userTo = await UserModel.findOne({_id: to});
        if(!userTo.followers.includes(userFrom._id)) {
            userFrom.subscriptions = [...userFrom.subscriptions, userTo._id]
            userTo.followers = [...userTo.followers, userFrom._id]
        }else throw ApiError.BadRequest(`User already follows ${userTo.userName}`)
        await userTo.save()
        await userFrom.save()
    }

    async unsubscribe(from, to) {
        const userFrom = await UserModel.findOne({userName: from});
        const userTo = await UserModel.findOne({_id: to});
        if(userTo.followers.includes(userFrom._id)) {
            userFrom.subscriptions = [...userFrom.subscriptions.filter(subscribtion => subscribtion!== userTo._id)]
            userTo.followers = [...userTo.followers.filter(follower => follower!== userFrom._id)]
        }else throw ApiError.BadRequest(`User does not follows ${userTo.userName}`)
        await userTo.save()
        await userFrom.save()
    }

}

module.exports = new UserService();
