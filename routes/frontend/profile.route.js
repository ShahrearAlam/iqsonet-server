const express = require("express");

const imageUpload = require("../../utils/imageUpload");

const router = express.Router();

const {
    getProfile, editProfile,
    uploadProfilePicture,
    addEducation, updateEducation, deleteEducation,
    addWork, updateWork, deleteWork,
    getPoints
} = require("../../controllers/frontend/profile.controller");

const { isAuthenticated } = require("../../middlewares/auth.middleware");

router.get("/get-profile/:_id", isAuthenticated, getProfile);
router.put("/edit-profile/:_id", isAuthenticated, editProfile);

router.post("/upload-profile-picture", isAuthenticated, imageUpload.single('profilePicture'), uploadProfilePicture);

router.post("/add-education", isAuthenticated, addEducation);
router.post("/update-education/:_id", isAuthenticated, updateEducation);
router.post("/delete-education/:_id", isAuthenticated, deleteEducation);

router.post("/add-work", isAuthenticated, addWork);
router.post("/update-work/:_id", isAuthenticated, updateWork);
router.post("/delete-work/:_id", isAuthenticated, deleteWork);

// points
router.get("/points/:_id", isAuthenticated, getPoints);

module.exports = router;