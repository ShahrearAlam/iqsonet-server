const express = require("express");
const router = express.Router();

const {
  getJobPosts, searchOrganizations,
  addJobPost, getSingleJobPost,
  updateJobPost, deleteJobPost
} = require("../../controllers/frontend/jobPosts.controller");


const { isAuthenticated } = require("../../middlewares/auth.middleware");
const imageUpload = require("../../utils/imageUpload");


router.get("/job-posts", isAuthenticated, getJobPosts);

router.get("/job-post/:jobPostId", isAuthenticated, getSingleJobPost);

router.get("/search-organization", isAuthenticated, searchOrganizations);

router.post("/create-job", isAuthenticated, imageUpload.single("organizationLogo"), addJobPost);

router.patch("/update-jobPost/:jobPostId", isAuthenticated, imageUpload.single("organizationLogo"), updateJobPost);

router.delete("/delete-jobPost/:jobPostId", isAuthenticated, deleteJobPost);

module.exports = router;
