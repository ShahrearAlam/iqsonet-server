const Joi = require('joi');
const { validate } = require("../../utils/validate");

const register = {
    body: Joi.object({
        username: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).message("Password must be at least 8 characters long").required(),
        confirmPassword: Joi.string().required(),
    })
};

const login = {
    body: Joi.object({
        identifier: Joi.string().required(),
        password: Joi.string().required(),
    })
};

module.exports = {
    registerValidation: validate(register),
    loginValidation: validate(login),
}