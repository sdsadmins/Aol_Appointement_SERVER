const jwt = require("jsonwebtoken");
const {StatusCodes} = require('http-status-codes');
const {extractToken} = require('../utils/helper');
module.exports = function (req, res, next) {
    try {
        // console.log("hhh",req);
        
        const token = extractToken(req);
        console.log("Token extracted:", token, process.env.TOKEN_SECRET);

        if (token == null) {
            return res.status(StatusCodes.UNAUTHORIZED).send("Unauthorized");
        }

        jwt.verify(token, process.env.TOKEN_SECRET, {}, (err, user) => {
            if (err) {
                console.log("JWT verification error:", err);
                return res.status(StatusCodes.FORBIDDEN).send("Invalid user");
            }
            req.user = user["userData"];
            next();
        });
    } catch (e) {
        console.log("Error in JWT middleware:", e);
        next(e);
    }
};

