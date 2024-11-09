const express = require("express");
const router = express.Router();

const {
    register, login, renew, 
    socialAuth,
    otpVerify, otpResend, 
    changePassword, requestPasswordReset, resetPassword, getUserInfo,
} = require("./../../controllers/frontend/auth.controller");

const {
    registerValidation, loginValidation,
} = require("./../../validations/frontend/auth.validation");

const { isAuthenticated } = require("../../middlewares/auth.middleware");

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/renew", renew);

router.post("/social-auth", socialAuth);

router.post("/otp-verify", otpVerify);
router.post("/otp-resend", otpResend);

router.post("/change-password", changePassword);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

router.get("/userInfo", isAuthenticated, getUserInfo);

module.exports = router;