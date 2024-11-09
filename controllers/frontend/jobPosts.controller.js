const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");
const { JobPostModel } = require("../../models/job/jobPost.model");
const OrganizationModel = require("../../models/job/organization.model");
const mongoose = require("mongoose");


const getJobPosts = catchAsync(async (req, res) => {

  const jobPosts = await JobPostModel.find({
    publish: true,
    deadline: { $gt: new Date() }
  }).populate({
    path: "organization",
    select: "name logo description"
  }).populate({
    path: "user",
    select: "username personal.fullname personal.profilePicture"
  });

  return apiResponse(res, httpStatus.OK, { data: jobPosts, message: "Job Posts successfully retrieved." });
});

const getSingleJobPost = catchAsync(async (req, res) => {

  const jobPostId = req.params.jobPostId

  const jobPost = await JobPostModel.findOne({ _id: jobPostId })
    .populate({
      path: "organization",
      select: "name logo description"
    }).populate({
      path: "user",
      select: "username personal.fullname personal.profilePicture"
    });

  if (!jobPost) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Job post was not found." });

  return apiResponse(res, httpStatus.OK, { data: jobPost, message: "Job Post successfully retrieved." });
});

const searchOrganizations = catchAsync(async (req, res) => {

  const userIdObj = new mongoose.Types.ObjectId(req.user.userId);
  const { query } = req.query;

  let organizations;

  if (query || query.trim().length > 0) {
    organizations = await OrganizationModel.aggregate([
      {
        $match: {
          'user': userIdObj,
          'name': { $regex: new RegExp(query, 'i') }
        }
      },
      { $sample: { size: 15 } },
      {
        $project: {
          name: 1,
          logo: 1,
          description: 1
        }
      }
    ]);
  } else {
    organizations = await OrganizationModel.find({ user: req.user.userId })
      .limit(15)
      .select({ name: 1, logo: 1, description: 1 });
  }

  return apiResponse(res, httpStatus.OK, { data: organizations, message: "organization suggestions successfully retrive." });
});

const addJobPost = catchAsync(async (req, res) => {

  const parsedData = JSON.parse(req.body.data);
  const { title, company, content, employmentType, experience, role, skills, location, jobType, maxSalary, minSalary, salaryNegotiable, benefits, publish, deadline, questions } = parsedData;

  const logoUrl = req.file ? req.file.location : company?.logo;

  let organization = await OrganizationModel.findOneAndUpdate(
    {
      $or: [
        { _id: company?._id },
        { name: company?.name }
      ]
    },
    { $set: { ...company, logo: logoUrl } },
    { new: true }
  )

  if (!organization) {
    console.log("get");
    const newOrganization = new OrganizationModel({ ...company, logo: logoUrl, user: req.user.userId })
    organization = await newOrganization.save();
  }

  const newJobPost = new JobPostModel({ title, content, user: req.user.userId, organization: organization._id, employmentType, experience, role, skills, location, jobType, maxSalary, minSalary, salaryNegotiable, benefits, publish, deadline, questions });
  await newJobPost.save();

  const data = await JobPostModel
    .findById(newJobPost?._id)
    .populate({
      path: "organization",
      select: "name logo description",
    })
    .populate({
      path: "user",
      select: "username personal.fullname personal.profilePicture",
    })

  return apiResponse(res, httpStatus.OK, { data, message: "Job Post successfully added." });
});

const updateJobPost = catchAsync(async (req, res) => {

  const { jobPostId } = req.params;
  const parsedData = JSON.parse(req.body.data);
  const { company, ...jobPostDetails } = parsedData;

  if (company) {
    const { _id, name, description, logo } = company;
    await OrganizationModel.updateOne({ _id }, { name, description, logo: req.file ? req.file.location : logo });
  }

  const data = await JobPostModel
    .findOneAndUpdate(
      { _id: jobPostId },
      { $set: { ...jobPostDetails } },
      { new: true }
    )
    .populate({
      path: "organization",
      select: "name logo description",
    })
    .populate({
      path: "user",
      select: "username personal.fullname personal.profilePicture",
    });

  if (!data) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Job post not found, update failed." });
  }

  return apiResponse(res, httpStatus.OK, { data, message: "Job Post successfully updated." });
});

const deleteJobPost = catchAsync(async (req, res) => {

  const { jobPostId } = req.params;

  const data = await JobPostModel.findOneAndDelete({ _id: jobPostId });

  if (!data) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Job post not found." });
  }

  return apiResponse(res, httpStatus.OK, { data, message: "Job Post successfully deleted." });
});

module.exports = {
  getJobPosts, getSingleJobPost, searchOrganizations, addJobPost, updateJobPost, deleteJobPost
}