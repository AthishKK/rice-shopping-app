const router = require("express").Router();
const { createReturn, getUserReturns } = require("../controllers/returnController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);
router.post("/", createReturn);
router.get("/", getUserReturns);

module.exports = router;
