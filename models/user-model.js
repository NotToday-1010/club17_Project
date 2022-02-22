const {Schema, model} = require('mongoose');

const UserSchema = new Schema({
    userName: {type: String, unique: true, required: true},
    email: {type: String, unique: true, required: true},
    password: {type: String, required: true},
    isActivated: {type: Boolean, default: false},
    activationLink: {type: String},
    followers: [{type: Schema.Types.ObjectId, ref: "User"}],
    subscriptions: [{type: Schema.Types.ObjectId, ref: "User"}],
    roles: [{type: String, ref: 'Role'}]
})

module.exports = model('User', UserSchema);
