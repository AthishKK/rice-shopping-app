const router = require("express").Router();
const { chat, getQuickReplies } = require("../controllers/chatbotController");

// Chat endpoint
router.post("/", chat);

// Get quick reply suggestions
router.get("/quick-replies", getQuickReplies);

module.exports = router;