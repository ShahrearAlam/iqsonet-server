const express = require("express");
const router = express.Router();

const {
    searchSuggestions, 
    detailedSearchAll, detailedSearchUsers, detailedSearchPosts,
    searchHistoryAll, clearSearchHistory,
} = require("../../controllers/frontend/search.controller");

const { isAuthenticated } = require("../../middlewares/auth.middleware");

router.get("/suggestions", isAuthenticated, searchSuggestions);

router.get("/detailed/all", isAuthenticated, detailedSearchAll);
router.get("/detailed/users", isAuthenticated, detailedSearchUsers);
router.get("/detailed/posts", isAuthenticated, detailedSearchPosts);

router.get("/history/all", isAuthenticated, searchHistoryAll);
router.delete("/history/clear", isAuthenticated, clearSearchHistory);

module.exports = router;