const _ = require('lodash');
const { StatusCodes } = require('http-status-codes');
const model = require("../models/token");
const jwt  = require('jsonwebtoken');
const md5 = require('md5');
// exports.authLogin = async (req, res, next) => {
    exports.authLogin = async (req, res) => {
    try {
        const jwtExpirySeconds = "10h";
        const encryptedPassword= md5(req.body.password);
        const data = await model.authLogin(req.body.username,encryptedPassword);
        if (!_.isEmpty(data)) {
            const userData = data[0];
            delete userData.password;
            
            const token = jwt.sign({userData}, process.env.TOKEN_SECRET, {
                algorithm: 'HS256',
                expiresIn: jwtExpirySeconds
              })
             res.status(StatusCodes.OK).send({"expiresIn":jwtExpirySeconds,"accessToken":token,"token_type": "bearer","user":userData});
        } else {
            res.status(StatusCodes.NOT_FOUND).send({ message: "Not found." });
        }
    } catch (e) {
        console.log(`Error in create`, e);
        next(e);
    }
};
