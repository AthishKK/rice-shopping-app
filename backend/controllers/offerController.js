const { getCurrentFestival, getActiveOffers, getFlashSaleProducts, createSeasonalOffer } = require("../services/festivalService");
const Product = require("../models/Product");
const Offer = require("../models/Offer");

exports.getCurrentOffer = async (req, res) => {
  try {
    // Get current festival offer
    const festivalOffer = getCurrentFestival();
    
    // Get active database offers
    const activeOffers = await getActiveOffers();
    
    // Get flash sale products
    const flashSaleProducts = await getFlashSaleProducts();

    res.json({
      festival: festivalOffer,
      activeOffers,
      flashSale: {
        active: flashSaleProducts.length > 0,
        products: flashSaleProducts.map(p => ({
          id: p._id,
          name: p.name,
          discount: p.flashSaleDiscount,
          category: p.category
        }))
      }
    });
  } catch (error) {
    console.error("Error getting current offers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getFlashSaleProducts = async (req, res) => {
  try {
    const flashSaleProducts = await getFlashSaleProducts();
    
    // Add pricing information
    const productsWithPricing = await Promise.all(
      flashSaleProducts.map(async (product) => {
        try {
          const { getFinalPrice } = require("../services/pricingService");
          const priceData = await getFinalPrice(product, "6months", "1kg");
          return {
            ...product.toObject(),
            pricing: priceData
          };
        } catch (error) {
          return {
            ...product.toObject(),
            pricing: { finalPrice: 0, error: "Price unavailable" }
          };
        }
      })
    );

    res.json({
      flashSale: {
        active: productsWithPricing.length > 0,
        products: productsWithPricing,
        message: productsWithPricing.length > 0 ? 
          "⚡ Flash Sale Active! Limited time offers on selected products!" : 
          "No flash sale active right now. Check back soon!"
      }
    });
  } catch (error) {
    console.error("Error getting flash sale products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getFestivalOffers = async (req, res) => {
  try {
    const festivalOffer = getCurrentFestival();
    
    if (!festivalOffer) {
      return res.json({
        active: false,
        message: "No festival offers active right now"
      });
    }

    // Get products that would benefit from festival offer
    const products = await Product.find({
      category: { $in: ['Traditional', 'Premium'] }
    }).limit(6);

    res.json({
      active: true,
      festival: festivalOffer,
      applicableProducts: products.map(p => ({
        id: p._id,
        name: p.name,
        category: p.category
      })),
      message: `🎉 ${festivalOffer.name} Special Offer Active!`
    });
  } catch (error) {
    console.error("Error getting festival offers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createOffer = async (req, res) => {
  try {
    const { name, type, discount, days, applicableProducts } = req.body;
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (days || 7));

    const offer = await Offer.create({
      name,
      type: type || 'seasonal',
      discount,
      startDate,
      endDate,
      bannerText: `🎊 ${name} - ${discount}% Off!`,
      applicableProducts: applicableProducts || [],
      isActive: true
    });

    res.status(201).json({
      message: "Offer created successfully",
      offer
    });
  } catch (error) {
    console.error("Error creating offer:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ isActive: true })
      .populate('applicableProducts', 'name category')
      .sort({ createdAt: -1 });

    res.json(offers);
  } catch (error) {
    console.error("Error getting all offers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.applyOffer = async (req, res) => {
  try {
    const { offerId, productId, orderAmount } = req.body;
    
    const offer = await Offer.findById(offerId);
    
    if (!offer || !offer.isActive) {
      return res.status(400).json({ message: "Offer not valid" });
    }

    const now = new Date();
    if (now < offer.startDate || now > offer.endDate) {
      return res.status(400).json({ message: "Offer expired" });
    }

    // Check if product is applicable (if specific products are mentioned)
    if (offer.applicableProducts.length > 0 && 
        !offer.applicableProducts.includes(productId)) {
      return res.status(400).json({ message: "Offer not applicable to this product" });
    }

    const discountAmount = (orderAmount * offer.discount) / 100;
    const finalAmount = orderAmount - discountAmount;

    res.json({
      valid: true,
      offer: {
        name: offer.name,
        discount: offer.discount,
        discountAmount,
        finalAmount
      }
    });
  } catch (error) {
    console.error("Error applying offer:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deactivateOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    
    const offer = await Offer.findByIdAndUpdate(
      offerId,
      { isActive: false },
      { new: true }
    );

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    res.json({
      message: "Offer deactivated successfully",
      offer
    });
  } catch (error) {
    console.error("Error deactivating offer:", error);
    res.status(500).json({ message: "Server error" });
  }
};