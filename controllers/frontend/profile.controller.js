const httpStatus = require("http-status");

const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");

const { UserModel, UserStatus } = require("../../models/user.model");
const { PointModel } = require("../../models/point.model");
const { ConnectionModel, ConnectionStatus } = require("../../models/connection.model");

// Profile

const getProfile = catchAsync(async (req, res) => {
  const { _id } = req.params;
  const data = await UserModel.findOne({ _id, status: { $ne: UserStatus.deleted } });

  if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "No profile found." });

  const isFollowing = await ConnectionModel.findOne({
    follower: req.user.userId,
    followee: _id,
    status: ConnectionStatus.accepted,
  });

  return apiResponse(res, httpStatus.OK, { data: { data, isFollowing: isFollowing ? true : false }, message: "Profile successfully retrieved." });
});

const editProfile = catchAsync(async (req, res) => {
  const { email, phone, personal, education, work, showcase, socialLinks } = req.body;

  const data = await UserModel.updateOne(
    { _id: req.params._id, status: { $ne: UserStatus.deleted } },
    { email, phone, personal, education, work, showcase, socialLinks }
  );

  if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Profile not found, edit failed." });

  return apiResponse(res, httpStatus.OK, { data, message: "Profile successfully edited." });
});

const uploadProfilePicture = catchAsync(async (req, res) => {

  const data = await UserModel.updateOne(
    { _id: req.user.userId, status: { $ne: UserStatus.deleted } },
    { "personal.profilePicture": req.file.location }
  );

  return apiResponse(res, httpStatus.OK, { data: { profilePicture: req.file.location }, message: "Profile picture uploaded successfully." });
});

// Education

const addEducation = catchAsync(async (req, res) => {
  const { institute, department, concentration, startDate, endDate, isGraduated, details } = req.body;

  if (!isGraduated && endDate) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Education end date should only be specified for graduates." });

  const data = await UserModel.updateOne(
    { _id: req.user.userId, status: { $ne: UserStatus.deleted } },
    { $push: { education: { institute, department, concentration, startDate, endDate, isGraduated, details } } }
  );

  if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User not found, could not add education." });

  return apiResponse(res, httpStatus.OK, { message: "Education data added successfully." });
});

const updateEducation = catchAsync(async (req, res) => {
  const { _id } = req.params;
  const updateFields = req.body;

  if (!updateFields.isGraduated && updateFields.endDate) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Education end date should only be specified for graduates." });

  const data = await UserModel.findOneAndUpdate(
    { _id: req.user.userId, status: { $ne: UserStatus.deleted }, "education._id": _id },
    { $set: { "education.$": updateFields } },
    { new: true }
  );

  if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User or education not found, cannot update." });

  return apiResponse(res, httpStatus.OK, { message: "Education updated successfully." });
});

const deleteEducation = catchAsync(async (req, res) => {
  const { _id } = req.params;

  const data = await UserModel.findOneAndUpdate(
    { _id: req.user.userId, status: { $ne: UserStatus.deleted } },
    { $pull: { education: { _id } } },
    { new: true }
  );

  if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User or education not found, cannot delete." });

  return apiResponse(res, httpStatus.OK, { message: "Education deleted successfully." });
});

// Work

const addWork = catchAsync(async (req, res) => {
  const { organization, designation, jobType, startDate, endDate, isWorking, details } = req.body;

  if (isWorking && endDate) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Ongoing job should not have an end date" });

  const data = await UserModel.updateOne(
    { _id: req.user.userId, status: { $ne: UserStatus.deleted } },
    { $push: { work: { organization, designation, jobType, startDate, endDate, isWorking, details } } }
  );

  if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User not found, could not add work experience." });

  return apiResponse(res, httpStatus.OK, { message: "Work experience added successfully." });
});

const updateWork = catchAsync(async (req, res) => {
  const { _id } = req.params;
  const updateFields = req.body;

  if (updateFields.isWorking && updateFields.endDate) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Ongoing job should not have an end date" });

  const data = await UserModel.findOneAndUpdate(
    { _id: req.user.userId, status: { $ne: UserStatus.deleted }, "work._id": _id },
    { $set: { "work.$": updateFields } },
    { new: true }
  );

  if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User or work experience not found, cannot update." });

  return apiResponse(res, httpStatus.OK, { message: "Work experience updated successfully." });
});

const deleteWork = catchAsync(async (req, res) => {
  const { _id } = req.params;

  const data = await UserModel.findOneAndUpdate(
    { _id: req.user.userId, status: { $ne: UserStatus.deleted } },
    { $pull: { work: { _id } } },
    { new: true }
  );

  if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User or work experience not found, cannot delete." });

  return apiResponse(res, httpStatus.OK, { message: "Work experience deleted successfully." });
});

// points

const getPoints = catchAsync(async (req, res) => {
  const { _id } = req.params;
  let data = await PointModel.findOne({ user: _id });

  if (!data) await PointModel.create({ user: _id, context: "initialized", points: 0, cumulativePoints: 0, interactorId: req.user.userId });
  data = await PointModel.findOne({ user: _id }).sort({ createdAt: -1 }); // for testing
  totalPoints = data.cumulativePoints;

  return apiResponse(res, httpStatus.OK, { data: { user: _id, totalPoints, data }, message: "Points successfully retrieved." });
});

module.exports = {
  getProfile, editProfile,
  uploadProfilePicture,
  addEducation, updateEducation, deleteEducation,
  addWork, updateWork, deleteWork,
  getPoints
};
