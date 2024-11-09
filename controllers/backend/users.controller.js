const httpStatus = require("http-status");

const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");

const { UserModel, UserStatus } = require("../../models/user.model");

const getUsers = catchAsync(async (req, res) => {
  const data = await UserModel.aggregate([
    { $match: { status: { $ne: UserStatus.deleted } } },
    {
      $lookup: {
        from: 'points',
        localField: '_id',
        foreignField: 'user',
        as: 'points'
      }
    },
    { $sort: { createdAt: -1 } },
    {
      $project: {
        _id: 1,
        username: 1,
        email: 1,
        phone: 1,
        superAdmin: 1,
        "personal.fullname": 1,
        "personal.profilePicture": 1,
        createdAt: 1,
        points: {
          $arrayElemAt: ["$points.cumulativePoints", -1]
        }
      }
    }
  ]);

  return apiResponse(res, httpStatus.OK, { data, message: "Successfully retrieved all users." });
});

const getUser = catchAsync(async (req, res) => {
  const { _id } = req.params;
  const data = await UserModel.findOne({ _id, status: { $ne: UserStatus.deleted } });

  if (!data) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "No user found." });
  }

  return apiResponse(res, httpStatus.OK, { data, message: "User successfully retrieved." });
});

const addUser = catchAsync(async (req, res) => {
  const { username, email, password, phone, superAdmin, personal, education, work, showcase, socialLinks } = req.body;

  const newUser = new UserModel({ username, email, password, phone, superAdmin, personal, education, work, showcase, socialLinks });
  const data = await newUser.save();

  return apiResponse(res, httpStatus.OK, { data, message: "User successfully added." });
});

const updateUser = catchAsync(async (req, res) => {
  const { username, email, password, phone, superAdmin, personal, education, work, showcase, socialLinks } = req.body;

  const data = await UserModel.updateOne(
    { _id: req.params._id, status: { $ne: UserStatus.deleted } },
    { username, email, password, phone, superAdmin, personal, education, work, showcase, socialLinks }
  );

  if (!data) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "User not found, update failed." });
  }

  return apiResponse(res, httpStatus.OK, { data, message: "User successfully updated." });
});

const deleteUser = catchAsync(async (req, res) => {
  const data = await UserModel.updateOne({ _id: req.params._id, status: { $ne: UserStatus.deleted } }, { status: UserStatus.deleted });

  if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User not found, deletion failed." });

  return apiResponse(res, httpStatus.OK, { message: "User successfully deleted." });
});

module.exports = {
  getUsers, getUser, addUser, updateUser, deleteUser,
};
