const _ = require("lodash");
const { StatusCodes } = require("http-status-codes");
function convertToDataType (type, value) {
    try {
        switch (type.toLowerCase()) {
            case "number": return Number(value);
            case "date":
            case "datetime":
                        return new Date(value);
            case "boolean": return Boolean(value);
            default: return value;
        }
    } catch (e) {
        return null;
    }
}
function updateValidator(model) {
  return (req, res, next) => {
    try {
      const bodyParams = req.body;
      if (_.isEmpty(model) || _.isEmpty(bodyParams)) {
        return res.status(StatusCodes.BAD_REQUEST).send("Bad Request");
      }

      const newBody = {};
      for (const key in bodyParams) {
        const field = model[key];
        if (field && typeof bodyParams[key] === field.type) {
          if (field.type == "boolean") {
            newBody[key] = bodyParams[key] ? 1 : 0;
          } else {
            newBody[key] = bodyParams[key];
          }
        } else if (field && typeof bodyParams[key] !== field.type) {
            const newValue = convertToDataType(field.type, bodyParams[key]);
            if (!newValue) {
                return res.status(StatusCodes.BAD_REQUEST).send(`Bad Request : Invalid data type for - ${key}`);
            } else {
                newBody[key] =bodyParams[key];
            }
        }
      }
      req.body = newBody;
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = updateValidator;

