const express = require("express");
const router = express.Router();

const {
    getUsers, 
    getUser, 
    addUser, 
    updateUser, 
    deleteUser,
} = require("./../../controllers/backend/users.controller");

const { isAuthenticated } = require("./../../middlewares/auth.middleware");

router.get("", isAuthenticated, getUsers);
router.get("/:_id", isAuthenticated, getUser);
router.post("", isAuthenticated, addUser);
router.put("/:_id", isAuthenticated, updateUser);
router.delete("/:_id", isAuthenticated, deleteUser);

module.exports = router;