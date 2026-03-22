const router = require("express").Router();
const { 
  getCurrentOffer, 
  getFlashSaleProducts, 
  getFestivalOffers, 
  createOffer, 
  getAllOffers, 
  applyOffer, 
  deactivateOffer 
} = require("../controllers/offerController");
const authMiddleware = require("../middleware/authMiddleware");

// Public routes
router.get("/current", getCurrentOffer);
router.get("/flash-sale", getFlashSaleProducts);
router.get("/festival", getFestivalOffers);
router.get("/all", getAllOffers);

// Protected routes
router.post("/apply", authMiddleware, applyOffer);

// Admin routes (should have admin middleware in production)
router.post("/create", createOffer);
router.put("/:offerId/deactivate", deactivateOffer);

module.exports = router;