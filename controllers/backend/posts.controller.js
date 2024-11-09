const httpStatus = require("http-status");

const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");

const { ReportedPostModel } = require("../../models/post/report.model");
const { PostModel, PostStatus } = require("../../models/post/post.model");

const getPostReports = catchAsync(async (req, res) => {
  const postsCount = 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const skipCount = (page - 1) * postsCount;

  const reports = await ReportedPostModel
    .find()
    .sort({ createdAt: -1 })
    .skip(skipCount)
    .limit(postsCount)
    .populate({
      path: "reporter",
      select: "username email personal.fullname personal.profilePicture",
    })

  return apiResponse(res, httpStatus.OK, { data: { reports, page }, message: "All reported posts retrieved successfully." });
});

const getPostReportById = catchAsync(async (req, res) => {
  const reportId = req.params.reportId;

  const report = await ReportedPostModel.findById(reportId)
    .populate({
      path: "reportedPost",
      select: "user body pictures comments reactions createdAt",
      populate: {
        path: 'user comments.user comments.replies.user',
        select: "username personal.fullname personal.profilePicture",
      }
    })
    .populate({
      path: "reporter",
      select: "username personal.fullname personal.profilePicture",
    })

  if (!report) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Report not found." });
  }

  return apiResponse(res, httpStatus.OK, { data: report, message: "Individual reported post retrieved successfully." });
});

const removePostReport = catchAsync(async (req, res) => {
  const reportId = req.params.reportId;

  const report = await ReportedPostModel.findById(reportId);
  if (!report) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Report not found." });
  }

  await ReportedPostModel.findByIdAndDelete(reportId);

  return apiResponse(res, httpStatus.OK, { message: "Report removed." });
});

const banReportedPost = catchAsync(async (req, res) => {
  const reportId = req.params.reportId;

  const report = await ReportedPostModel.findById(reportId);
  if (!report) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Report not found." });
  }

  const postId = report.reportedPost;
  await PostModel.updateOne({ _id: postId }, { status: PostStatus.banned });

  await ReportedPostModel.deleteMany({ reportedPost: postId });

  return apiResponse(res, httpStatus.OK, { message: "Reported post banned successfully." });
});

const deleteReportedPost = catchAsync(async (req, res) => {
  const reportId = req.params.reportId;

  const report = await ReportedPostModel.findById(reportId);
  if (!report) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Report not found." });
  }

  const postId = report.reportedPost;
  await PostModel.findByIdAndDelete(postId);

  await ReportedPostModel.deleteMany({ reportedPost: postId });

  return apiResponse(res, httpStatus.OK, { message: "Reported post deleted successfully." });
});

module.exports = {
  getPostReports, getPostReportById, removePostReport,
  banReportedPost, deleteReportedPost,
};
