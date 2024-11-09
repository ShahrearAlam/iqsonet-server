const httpStatus = require("http-status");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/auth');
const sendEmail = require('../../utils/sendMail');
const { generateUniqueUsername } = require('../../utils/utilities');

const { UserModel, UserStatus } = require("../../models/user.model")

const register = catchAsync(async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    const emailLower = email.toLowerCase();

    const isSuperAdmin = await UserModel.countDocuments() === 0;

    var existingUser = await UserModel.findOne({ username });
    if (existingUser && existingUser.otp.verified) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Username already exists" });

    var existingUser = await UserModel.findOne({ email: emailLower });
    if (existingUser && existingUser.otp.verified) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Email already exists" });

    if (password != confirmPassword) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Password does not match" });

    if (existingUser && !existingUser.otp.verified) {
        existingUser.username = username;
        existingUser.password = password;
        existingUser.superAdmin = isSuperAdmin;
        existingUser.otp.code = Math.floor(1000 + Math.random() * 9000);
        existingUser.otp.expiration = new Date(new Date().getTime() + 10 * 60 * 1000);

        const updatedUser = await existingUser.save();

        let to = email;
        let subject = "OTP for Sign Up";
        let text = `Your OTP is ${existingUser.otp.code}`;
        sendEmail(to, subject, text);

        console.log("OTP: ", existingUser.otp.code)

        return apiResponse(res, httpStatus.CREATED, {
            data: {
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                superAdmin: updatedUser.superAdmin,
            },
            message: "Account updated successfully. An OTP has been sent to your email for verification."
        });
    }

    const code = Math.floor(1000 + Math.random() * 9000);
    const expiration = new Date(new Date().getTime() + 10 * 60 * 1000)

    const newUser = new UserModel({
        username,
        email: emailLower,
        password,
        superAdmin: isSuperAdmin,
        otp: {
            code,
            expiration,
        }
    });

    const user = await newUser.save();

    let to = email;
    let subject = "OTP for Sign Up";
    let text = `Your OTP is ${code}`;
    sendEmail(to, subject, text);

    console.log("OTP: ", code)

    return apiResponse(res, httpStatus.CREATED, {
        data: {
            _id: user._id,
            username: user.username,
            email: user.email,
            superAdmin: user.superAdmin,
        },
        message: "Account created successfully. An OTP has been sent to your email for verification."
    })
})

const login = catchAsync(async (req, res) => {
    const { identifier, password } = req.body;

    const user = await UserModel.findOne({
        $or: [{ email: identifier }, { username: identifier }],
        status: UserStatus.active,
    });
    if (!user) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Account does not exist or inactive" });
    if (!user.otp.verified) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Account is not verified" });

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Password does not match." });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return apiResponse(res, httpStatus.CREATED, { data: { user, accessToken, refreshToken }, message: `Login successful` })
})

const renew = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;

    const data = verifyRefreshToken(refreshToken);

    const user = await UserModel.findOne({ _id: data.userId, status: UserStatus.active });
    if (!user) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Invalid refresh token" });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return apiResponse(res, httpStatus.CREATED, { data: { user, accessToken: newAccessToken, refreshToken: newRefreshToken }, message: `Generated new access and refresh tokens` })
})

const socialAuth = catchAsync(async (req, res) => {
    const { result } = req.body;
    const { _tokenResponse, user: userData } = result;
    const { email, photoURL } = userData;
    const { firstName, lastName } = _tokenResponse;

    var user = await UserModel.findOne({ email });

    if (!user) {
        let username = await generateUniqueUsername(firstName, lastName);

        const isSuperAdmin = await UserModel.countDocuments() === 0;

        user = new UserModel({
            username,
            email,
            superAdmin: isSuperAdmin,
            personal: {
                firstName,
                lastName,
                profilePicture: photoURL.toString(),
            },
            otp: { verified: true }
        });

        await user.save();
    }

    if (user.status != UserStatus.active) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User is inactive or deleted" });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return apiResponse(res, httpStatus.CREATED, { data: { user, accessToken: newAccessToken, refreshToken: newRefreshToken }, message: `Social login successful. Tokens generated.` });
});

const otpVerify = catchAsync(async (req, res) => {
    const { email, otp } = req.body;

    const user = await UserModel.findOne({ email, status: UserStatus.active });
    if (!user) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User not found" });

    if (user.otp.code !== otp) return apiResponse(res, httpStatus.UNAUTHORIZED, { message: "Invalid OTP" });
    if (user.otp.expiration < new Date()) return apiResponse(res, httpStatus.UNAUTHORIZED, { message: "OTP has expired. Please request a new OTP." });

    user.otp.code = null;
    user.otp.expiration = null;
    user.otp.verified = true;
    await user.save();

    if (user) {
        let to = user.email;
        let subject = "Account Verified";
        let text = "Your account has been verified";
        sendEmail(to, subject, text);
    }

    return apiResponse(res, httpStatus.OK, { data: user, message: "OTP verified and user updated successfully" });
})

const otpResend = catchAsync(async (req, res) => {
    const { email } = req.body;

    const user = await UserModel.findOne({ email, status: UserStatus.active });
    if (!user) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User not found" });

    const code = Math.floor(1000 + Math.random() * 9000);
    const expiration = new Date(new Date().getTime() + 10 * 60 * 1000);

    user.otp.code = code;
    user.otp.expiration = expiration;
    user.otp.verified = false;
    await user.save();

    const to = user.email;
    const subject = "OTP from IqNet";
    const text = `Your OTP is ${code}`;

    sendEmail(to, subject, text);

    return apiResponse(res, httpStatus.OK, { data: user, message: "OTP resent successfully" });
})

const changePassword = catchAsync(async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    const user = await UserModel.findOne({ email, status: UserStatus.active });
    if (!user) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User not found" });

    const isCurrentPasswordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordMatch) return apiResponse(res, httpStatus.UNAUTHORIZED, { message: "Current password does not match" });

    user.password = newPassword;
    await user.save();

    return apiResponse(res, httpStatus.OK, { message: "Password changed successfully" });
});

const requestPasswordReset = catchAsync(async (req, res) => {
    const { email } = req.body;

    const user = await UserModel.findOne({ email, status: UserStatus.active });
    if (!user) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User not found" });

    const code = Math.floor(1000 + Math.random() * 9000);
    const expiration = Date.now() + 10 * 60 * 1000;

    user.otp.code = code;
    user.otp.expiration = expiration;
    await user.save();

    const subject = "Password Reset OTP";
    const text = `Your OTP for password reset is: ${code}`;
    sendEmail(email, subject, text);

    return apiResponse(res, httpStatus.OK, { message: "OTP has been sent to your email" });
});

const resetPassword = catchAsync(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    const user = await UserModel.findOne({ email, status: UserStatus.active });
    if (!user) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User not found" });

    if (user.otp.code !== otp) return apiResponse(res, httpStatus.UNAUTHORIZED, { message: "Invalid OTP" });
    if (user.otp.expiration < Date.now()) return apiResponse(res, httpStatus.UNAUTHORIZED, { message: "OTP has expired. Please request a new one." });

    user.password = newPassword;
    user.otp.code = null;
    user.otp.expiration = null;
    user.otp.verified = true;
    await user.save();

    return apiResponse(res, httpStatus.OK, { message: "Password reset successfully" });
});

const getUserInfo = catchAsync(async (req, res) => {
    const data = await UserModel.findOne({ _id: req.user.userId, status: UserStatus.active });

    if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "No user found." });

    return apiResponse(res, httpStatus.OK, { data, message: "User successfully retrieved." });
});

module.exports = {
    register, login, renew,
    socialAuth,
    otpVerify, otpResend,
    changePassword, requestPasswordReset, resetPassword,
    getUserInfo
}