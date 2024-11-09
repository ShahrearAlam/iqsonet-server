const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");
const apiResponse = require("../utils/apiResponse");
const { UserModel, UserStatus } = require("../models/user.model");

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization || '';
    let tokenValue = token.replace('Bearer ', '');
    const decoded = await jwt.verify(tokenValue, process.env.JWT_ACCESS_SECRET);

    req.user = decoded;

    const user = await UserModel.findOne({
      _id: decoded.userId,
      status: UserStatus.active
    });

    if (!user) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Invalid token" });
    if (!user.otp.verified) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "User not verified" });
    next();
  } catch (error) {
    return res.status(401).send(error);
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await UserModel.findOne({
      _id: req.user.userId,
      status: UserStatus.active
    });

    if (!user) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Invalid user" });

    if (user.superAdmin) {
      next();
    } else {
      return apiResponse(res, httpStatus.FORBIDDEN, { message: "Permission denied" });
    }
  } catch (error) {
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = { isAuthenticated, isAdmin }
