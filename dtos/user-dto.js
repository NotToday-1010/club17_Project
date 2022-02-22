module.exports = class UserDto {
    userName;
    email;
    id;
    isActivated;

    constructor(model) {
        this.userName = model.userName;
        this.email = model.email;
        this.id = model._id;
        this.isActivated = model.isActivated;
    }
}
