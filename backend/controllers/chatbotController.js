const Product = require("../models/Product");
const MarketPrice = require("../models/MarketPrice");
const Offer = require("../models/Offer");

// =============================
// 🧠 MEMORY (SESSION)
// =============================
const sessions = {};

// =============================
// 🧹 HELPERS
// =============================
const normalize = (text) => (text || "").toLowerCase().trim();

const contains = (msg, words) =>
words.some((w) => msg.includes(w));

const containsAll = (msg, words) =>
words.every((w) => msg.includes(w));

const safeResponse = () =>
"❌ Sorry, I cannot help with that request.";

const randomPick = (arr) =>
arr[Math.floor(Math.random() * arr.length)];

// =============================
// 🧠 INTENT DETECTION
// =============================
const detectIntent = (msg) => {
if (contains(msg, ["hack", "admin"])) return "security";

// Greeting
if (/^(hi|hello|hey|vanakkam|hai)$/.test(msg) || contains(msg, ["vanakkam", "hello ", " hi ", "hey ", "hai "])) return "greeting";

// Specific health conditions first (before generic health/best)
if (contains(msg, ["diabetes", "sugar", "diabetic"])) return "diabetes";
if (contains(msg, ["gym", "muscle", "strong", "strength", "stamina"])) return "fitness";
if (contains(msg, ["weight loss", "weight", "diet", "slim", "fat"])) return "weight";

// Cooking before price (biryani, recipe etc)
if (contains(msg, ["cook", "recipe", "water ratio", "how to make", "how to cook", "biryani", "idli", "dosa", "pongal"])) return "cooking";

// Payment methods (specific phrases first)
if (contains(msg, ["payment method", "pay with", "accept payment", "how to pay", "payment option", "upi", "cod", "cash on delivery", "credit card", "debit card"])) return "payment";

// Order tracking
if (contains(msg, ["track", "order status", "where is my order", "my order"])) return "order";

if (contains(msg, ["flash sale", "flash"])) return "flash";

// Best rice questions
if (contains(msg, ["best", "which rice", "recommend", "suggest", "good for"])) return "best";

if (contains(msg, ["confused", "don't know", "not sure"])) return "confusion";

if (contains(msg, ["vs", "better", "compare", "difference"])) return "comparison";

if (contains(msg, ["healthy", "nutrition", "health benefit", "antioxidant", "iron", "fiber"])) return "health";

// Price — after all specific intents
if (contains(msg, ["price", "cost", "rate", "how much", "prices", "show me all", "list all", "cheap", "expensive"])) return "price";

if (contains(msg, ["offer", "discount", "deal", "sale"])) return "offer";

if (contains(msg, ["delivery", "shipping", "deliver", "days"])) return "delivery";

if (contains(msg, ["order", "purchase", "buy"])) return "order";

if (contains(msg, ["return", "refund", "cancel"])) return "return";

if (contains(msg, ["payment", "pay", "cash"])) return "payment";

if (contains(msg, ["joke", "pizza", "fun"])) return "fun";

if (contains(msg, ["robot", "who are you", "what are you"])) return "bot";

if (contains(msg, ["budget", "under", "affordable"])) return "budget";

if (contains(msg, ["family", "kids", "children", "old", "elderly"])) return "family";

if (contains(msg, ["tamil", "traditional", "ancient"])) return "traditional";

if (contains(msg, ["storage", "store", "expiry", "shelf life"])) return "storage";

return "fallback";
};

// =============================
// 🧠 MAIN CHAT FUNCTION
// =============================
exports.chat = async (req, res) => {
try {
const { message, sessionId } = req.body;
if (!message) return res.json({ reply: "Message required" });

const msg = normalize(message);
const intent = detectIntent(msg);

let products = [], mp = 60, flashInfo = 'No active flash sales right now.', priceList = '';
try {
  products = await Product.find({}).lean();
  const market = await MarketPrice.findOne({ commodity: "Rice" }).lean();
  mp = market?.pricePerKg || 60;
  const flashProducts = products.filter(p => p.isFlashSale);
  flashInfo = flashProducts.length > 0
    ? flashProducts.map(p => `• ${p.name} – ${p.flashSaleDiscount}% OFF`).join('\n')
    : 'No active flash sales right now.';
  priceList = products.map(p => `• ${p.name} → ₹${(p.basePremium || 0) + mp} (base)`).join('\n');
} catch (dbErr) {
  console.error('Chatbot DB fetch error:', dbErr.message);
  priceList = '• Prices currently unavailable — please check the product page.';
}

let reply = "";

// =============================
// 🔐 SECURITY BLOCK
// =============================
if (intent === "security") {
  return res.json({ reply: safeResponse() });
}

// =============================
// 💳 PAYMENT METHODS
// =============================
if (intent === "payment") {
  reply = "💳 Payment methods we accept:\n• Cash on Delivery (COD)\n• UPI (GPay, PhonePe, Paytm)\n• Credit Card / Debit Card\n• Net Banking\n\n✅ All payments are 100% secure!";
}

// =============================
// 🔥 FLASH SALE
// =============================
else if (intent === "flash") {
  reply = `🔥 Flash Sale Products:\n${flashInfo}\n\nVisit our Flash Sale page for live deals! ⚡`;
}

// =============================
// 👋 GREETING
// =============================
else if (intent === "greeting") {
  reply =
    "👋 Welcome to Vetri Vinayagar Rice Mart! 🌾\nAsk me anything about rice, prices, health, or offers!";
}

// =============================
// 🤯 CONFUSION
// =============================
else if (intent === "confusion") {
  reply =
    "😄 No worries!\n👉 Best choice: Seeraga Samba (tasty + premium)\n👉 Healthy choice: Karuppu Kavuni\n👉 Budget choice: Basmati";
}

// =============================
// 🧠 FINAL DECISION
// =============================
else if (intent === "final") {
  reply =
    "🏆 Final answer → Go with **Seeraga Samba**. Perfect taste, aroma & popular choice!";
}

// =============================
// 😂 FUN / RANDOM
// =============================
else if (intent === "fun") {
  reply = randomPick([
    "😂 Rice never fights… it stays calm and grainy!",
    "🍚 Eat rice, stay nice 😄",
    "No pizza here… only premium rice! 🌾",
  ]);
}

// =============================
// 🤖 BOT QUESTIONS
// =============================
else if (intent === "bot") {
  reply =
    "🤖 I’m your smart rice assistant! I help you choose the best rice easily.";
}

// =============================
// 💀 RANDOM INPUT
// =============================
else if (intent === "random") {
  reply = "🤖 Please ask something about rice, price, or delivery 😊";
}

// =============================
// 🍚 BEST RICE QUESTIONS (q1)
// =============================
else if (intent === "best") {
if (contains(msg, ["biryani"])) {
reply = "🍚 Best for biryani → Seeraga Samba (₹120-165, 8 in stock) or Basmati (₹200-260, 20 in stock)";
} else if (contains(msg, ["healthy", "health"])) {
reply = "🌿 Healthiest rice → Karuppu Kavuni (₹150-210, 5 in stock - very high antioxidants & iron)";
} else if (contains(msg, ["diabetic", "diabetes", "sugar"])) {
reply = "🩺 Best for diabetes → Seeraga Samba (low GI) & Thooyamalli (₹175-215 - low glycemic index)";
} else if (contains(msg, ["weight", "slim", "loss"])) {
reply = "⚖️ For weight loss → Red Rice (₹120-160, 35 in stock) or Kattuyanam (₹170-210, 12 in stock - high fiber)";
} else if (contains(msg, ["daily"])) {
reply = "🍽️ Best for daily use → Nei Kichadi (₹100-140, 25 in stock - easy digestion)";
} else if (contains(msg, ["fiber"])) {
reply = "🌾 High fiber rice → Red Rice (₹120-160) & Karuppu Kavuni (₹150-210)";
} else if (contains(msg, ["smell", "aroma"])) {
reply = "🌸 Best aroma → Basmati (₹200-260) & Seeraga Samba (₹120-165) & Thooyamalli (₹175-215)";
} else if (contains(msg, ["soft"])) {
reply = "🍚 Soft after cooking → Nei Kichadi Rice (₹100-140)";
} else if (contains(msg, ["expensive"])) {
reply =
"💰 Most expensive → Basmati (₹200-260) & Karuppu Kavuni (₹150-210 - rare, high nutrients)";
} else {
reply = "🏆 Best overall → Seeraga Samba (₹120-165, flash sale active - taste + aroma + premium quality)";
}
}

// =============================
// 💪 FITNESS / GYM (q2, q22)
// =============================
else if (intent === "fitness") {
  reply =
    "💪 For strength & gym → Mappillai Samba (₹110-160, 15 in stock - increases body strength & stamina)\n🥗 Also try Karuppu Kavuni (₹150-210) for nutrients";
}

// =============================
// 🩺 DIABETES (q5)
// =============================
else if (intent === "diabetes") {
  reply =
    "🩺 Best for diabetes:\n• Seeraga Samba (₹120-165, 8 in stock - helps control blood sugar)\n• Thooyamalli (₹175-215, 22 in stock - low glycemic index)\nThese help control blood sugar.";
}

// =============================
// ⚖️ WEIGHT LOSS (q22)
// =============================
else if (intent === "weight") {
  reply =
    "⚖️ Best for weight loss:\n• Red Rice (₹120-160, 35 in stock - supports weight loss)\n• Kattuyanam (₹170-210, 12 in stock - helps weight control)\nHigh fiber keeps you full longer.";
}

// =============================
// 🌿 HEALTH GENERAL (q5, q26)
// =============================
else if (intent === "health") {
  reply =
    "🌿 Healthy rice options:\n• Karuppu Kavuni (₹150-210) → very high antioxidants\n• Red Rice (₹120-160) → high iron content\n• Mappillai Samba (₹110-160) → increases body strength\n• Karunguruvai (₹140-190) → detoxifies body\nAll better than polished white rice!";
}

// =============================
// 🍳 COOKING (q4)
// =============================
else if (intent === "cooking") {
  if (contains(msg, ["seeraga"])) {
    reply =
      "🍚 Seeraga Samba cooking (₹120-165, flash sale active!):\n1. Wash 2–3 times\n2. Soak 30 min\n3. Water ratio 1:1.5\n4. Cook 15 min simmer\nPerfect for biryani!";
  } else if (contains(msg, ["basmati"])) {
    reply =
      "🌾 Basmati cooking (₹200-260):\n1. Rinse well\n2. Soak 30 min\n3. Ratio 1:1.5\n4. Cook 12–15 min\nFluffy rice ready!";
  } else if (contains(msg, ["karuppu", "black"])) {
    reply =
      "🖤 Karuppu Kavuni (₹150-210, only 5 left!):\n1. Soak 2 hours\n2. Ratio 1:3\n3. Cook 40–45 min\nRich & chewy texture.";
  } else if (contains(msg, ["water"])) {
    reply =
      "💧 Water ratio:\n• Normal rice → 1:2\n• Basmati → 1:1.5\n• Traditional rice → 1:2.5";
  } else if (contains(msg, ["idli", "dosa"])) {
    reply =
      "🥞 Best for idli/dosa → Nei Kichadi (₹100-140, 25 in stock - soft & ferment well)";
  } else if (contains(msg, ["pongal"])) {
    reply =
      "🍲 Best for pongal → Nei Kichadi (₹100-140 - soft texture)";
  } else {
    reply =
      "🍚 Basic cooking:\nWash → Soak 20–30 min → Cook 1:2 ratio → Medium flame.";
  }
}

// =============================
// 💰 PRICE (q6)
// =============================
else if (intent === "price") {
  if (contains(msg, ["why", "costly"])) {
    reply =
      "💰 Price is high due to:\n• Aging process\n• Quality & aroma\n• Low production\nPremium rice = better taste!";
  } else if (contains(msg, ["cheap"])) {
    reply =
      "💸 Cheapest rice → Nei Kichadi (₹100-140, 25 in stock)\nGood for daily use.";
  } else if (contains(msg, ["worth"])) {
    reply =
      "✅ Yes, it’s worth it!\nBetter taste, health benefits & quality compared to normal rice.";
  } else if (contains(msg, ["all", "show", "list", "every"])) {
    reply = `💰 All Rice Prices (market rate: ₹${mp}/kg):\n${priceList}\n\n🔥 Flash Sales:\n${flashInfo}`;
  } else {
    reply = `💰 Market price today: ₹${mp}/kg\nOur range: ₹${mp + 40}–₹${mp + 200} depending on variety & aging.\n🔥 Flash Sales:\n${flashInfo}`;
  }
}

// =============================
// 🎁 OFFERS (q9)
// =============================
else if (intent === "offer") {
  reply = `🎉 Current offers:\n${flashInfo}\n• Free delivery above ₹500\n• Premium membership → 10% OFF always!`;
}

// =============================
// 🚚 DELIVERY (q7)
// =============================
else if (intent === "delivery") {
  reply =
    "🚚 Delivery:\n• 1–2 days (Chennai)\n• 2–3 days (TN)\n• 3–5 days (India)\n✅ Free above ₹500";
}

// =============================
// 📦 ORDER (q8)
// =============================
else if (intent === "order") {
  reply =
    "📦 Order help:\n• Track in 'My Orders'\n• Status: Placed → Shipped → Delivered\n• You can reorder anytime!";
}

// =============================
// 🔄 RETURN (q8)
// =============================
else if (intent === "return") {
  reply =
    "🔄 Return policy:\n• 7 days return\n• Damaged product → full refund\n• Easy process!";
}

// =============================
// 🤯 WEIRD / FUN QUESTIONS (q2, q29, q39)
// =============================
else if (contains(msg, ["lucky"])) {
reply = "🍀 Lucky rice? Any rice cooked with love is lucky 😄";
}

else if (contains(msg, ["royal", "king"])) {
  reply = "👑 Royal rice → Basmati & Seeraga Samba (used in royal dishes like biryani)";
}

else if (contains(msg, ["ancient", "oldest"])) {
  reply = "🏺 Ancient rice → Karuppu Kavuni & Mappillai Samba (traditional Tamil varieties)";
}

else if (contains(msg, ["muscle", "strong"])) {
  reply = "💪 Mappillai Samba – known as 'Bridegroom Rice' for strength!";
}

else if (contains(msg, ["eat daily"])) {
  reply = "🍽️ Yes! You can eat rice daily. Choose healthy types like Red Rice or Brown Rice.";
}

else if (contains(msg, ["explode"])) {
  reply = "😂 No, rice won’t explode… unless you forget it on the stove 😄";
}

else if (contains(msg, ["alive"])) {
  reply = "🌾 Rice is a grain, not alive after processing.";
}

else if (contains(msg, ["plant"])) {
  reply = "🌱 Yes, raw rice (unprocessed) can grow, but polished rice cannot.";
}

else if (contains(msg, ["go bad"])) {
  reply = "⏳ Rice lasts long! Store in dry airtight container to avoid spoilage.";
}

// =============================
// 🧠 SMART RECOMMENDATIONS (q15, q23, q21)
// =============================
else if (intent === "family") {
  if (contains(msg, ["kids"])) {
    reply = "👶 For kids → Ponni Rice (soft & easy to digest)";
  } else if (contains(msg, ["old"])) {
    reply = "👴 For elderly → Red Rice or Brown Rice (easy digestion + fiber)";
  } else {
    reply = "👨‍👩‍👧 Best for family → Ponni (daily) + Seeraga Samba (special meals)";
  }
}

else if (contains(msg, ["guest", "function"])) {
  reply = "🎉 For guests → Seeraga Samba or Basmati (premium & tasty)";
}

else if (contains(msg, ["daily cooking"])) {
  reply = "🍽️ Daily cooking → Ponni or Basmati (affordable & versatile)";
}

// =============================
// 🆚 COMPARISON (VERY IMPORTANT q18)
// =============================
else if (intent === "comparison") {
  if (containsAll(msg, ["seeraga", "basmati"])) {
    reply =
      "🆚 Seeraga Samba vs Basmati:\n👉 Biryani → Seeraga Samba\n👉 Aroma → Basmati\n👉 Taste → Seeraga Samba";
  } else if (containsAll(msg, ["karuppu", "brown"])) {
    reply =
      "🆚 Karuppu Kavuni vs Brown Rice:\n👉 Nutrition → Karuppu Kavuni\n👉 Budget → Brown Rice";
  } else {
    reply =
      "🆚 Comparison:\n👉 Biryani → Seeraga Samba\n👉 Health → Karuppu Kavuni\n👉 Budget → Ponni";
  }
}

// =============================
// 💸 BUDGET QUESTIONS (q20)
// =============================
else if (intent === "budget") {
  if (contains(msg, ["100"])) {
    reply = "💸 Under ₹100 → Ponni or basic white rice";
  } else if (contains(msg, ["150"])) {
    reply = "💰 Under ₹150 → Basmati or Ponni";
  } else if (contains(msg, ["cheap"])) {
    reply = "💸 Cheapest good rice → Ponni (best value)";
  } else {
    reply = "💰 Budget options → Ponni, Brown Rice";
  }
}

// =============================
// 😈 TRICK / EDGE QUESTIONS (q12, q27)
// =============================
else if (contains(msg, ["free rice", "free"])) {
  reply = safeResponse();
}

else if (contains(msg, ["discount code"])) {
  reply = safeResponse();
}

else if (contains(msg, ["hack"])) {
  reply = safeResponse();
}

// =============================
// 😂 SARCASM / ATTITUDE USERS (q52)
// =============================
else if (contains(msg, ["too costly", "expensive"])) {
  reply =
    "😄 It’s premium quality! But we also have budget-friendly options like Ponni.";
}

else if (contains(msg, ["not worth"])) {
  reply =
    "👍 It may seem costly, but quality, taste & health benefits make it worth it!";
}

// =============================
// 🧠 HESITATION / DOUBT (q36)
// =============================
else if (contains(msg, ["not sure", "really good", "regret"])) {
  reply =
    "✅ Don’t worry! It’s a popular choice with great taste and quality.";
}

// =============================
// 🔁 CHANGE OF MIND (q37)
// =============================
else if (contains(msg, ["change", "something else", "another"])) {
  reply =
    "🔄 Sure! Try Basmati for aroma or Red Rice for health.";
}

// =============================
// 🧩 HALF QUESTIONS (q38)
// =============================
else if (contains(msg, ["black one"])) {
  reply = "🖤 Do you mean Karuppu Kavuni rice?";
}

else if (contains(msg, ["costly one"])) {
  reply = "💰 That would be Karuppu Kavuni (premium rice)";
}

else if (contains(msg, ["famous"])) {
  reply = "🌟 Famous rice → Seeraga Samba (very popular)";
}

// =============================
// 🧠 MULTI INTENT (q34)
// =============================
else if (contains(msg, ["healthy", "cheap"])) {
  reply = "✅ Try Brown Rice – healthy and affordable.";
}

else if (contains(msg, ["biryani", "cheap"])) {
  reply = "🍚 Try Basmati – good for biryani and budget friendly.";
}

// =============================
// 😵 OVERTHINKING USERS (q59)
// =============================
else if (contains(msg, ["too many", "decide"])) {
  reply = "😄 Keep it simple → Go with Seeraga Samba!";
}

// =============================
// ❤️ EMOTIONAL USERS (q47)
// =============================
else if (contains(msg, ["family best", "special"])) {
  reply = "❤️ For your family → Seeraga Samba (premium & safe choice)";
}

// =============================
// 🎯 FINAL BUY DECISION (q41)
// =============================
else if (contains(msg, ["final choice", "last suggestion"])) {
  reply = "🏆 Final choice → Seeraga Samba. You won’t regret it!";
}

// =============================
// 🔐 TRUST / SECURITY QUESTIONS (q42)
// =============================
else if (contains(msg, ["safe", "secure", "data", "card"])) {
reply =
"🔐 Yes, our platform is 100% secure.\nYour payments and personal data are fully protected.";
}

// =============================
// 💳 PAYMENT ISSUES (q41)
// =============================
else if (contains(msg, ["payment failed"])) {
  reply =
    "💳 Payment failed?\n• Check balance\n• Try another method\n• If money deducted, it will auto-refund in 3–5 days.";
}

else if (contains(msg, ["money deducted"])) {
  reply =
    "💰 If amount deducted but no order placed, don’t worry.\nRefund will be processed automatically within 3–5 days.";
}

else if (contains(msg, ["pay later"])) {
  reply = "💵 Yes! You can use Cash on Delivery (COD).";
}

// =============================
// 🧾 BILL / INVOICE (q43)
// =============================
else if (contains(msg, ["invoice", "bill", "gst"])) {
  reply =
    "🧾 Yes, GST invoice is available.\nYou can download it from 'My Orders' section.";
}

// =============================
// 🎁 OFFER CONFUSION (q44)
// =============================
else if (contains(msg, ["offer not applied"])) {
  reply =
    "⚠️ Offer not applied?\n• Check minimum order value\n• Ensure offer is active\n• Try refreshing cart";
}

else if (contains(msg, ["price changed"])) {
  reply =
    "📊 Prices may change due to live market updates.\nWe always show latest pricing.";
}

// =============================
// 📦 DELIVERY EDGE CASES (q40)
// =============================
else if (contains(msg, ["not home"])) {
  reply =
    "📦 Not at home?\nDelivery partner will contact you or attempt re-delivery.";
}

else if (contains(msg, ["reschedule"])) {
  reply =
    "📅 Yes, you can reschedule delivery from 'My Orders' section.";
}

else if (contains(msg, ["damaged"])) {
  reply =
    "⚠️ If product is damaged, you can request replacement or refund within 7 days.";
}

else if (contains(msg, ["late delivery"])) {
  reply =
    "⏳ Delivery delay?\nWe apologize! Contact support for help and compensation if applicable.";
}

// =============================
// 🔄 REFUND EDGE CASES (q45)
// =============================
else if (contains(msg, ["refund"])) {
  reply =
    "💰 Refunds are processed within 3–5 working days after approval.";
}

else if (contains(msg, ["opened"])) {
  reply =
    "⚠️ Opened products may not be eligible for return unless damaged.";
}

// =============================
// ⏳ STORAGE / AGING (q25)
// =============================
else if (intent === "storage") {
  reply =
    "⏳ Storage tips:\n• Keep in airtight container\n• Store in dry place\n• Can last 6–12 months\n\n✔ Aged rice tastes better!";
}

else if (contains(msg, ["aged rice"])) {
  reply =
    "🏺 Aged rice (1–2 years) has better taste, aroma & texture.\nThat’s why it costs more.";
}

// =============================
// 🔬 TECHNICAL QUESTIONS (q26)
// =============================
else if (contains(msg, ["glycemic"])) {
  reply =
    "📊 Glycemic Index (GI):\n• Low GI → Karuppu Kavuni, Red Rice\n• High GI → White Rice\nLow GI helps control sugar.";
}

else if (contains(msg, ["white rice bad"])) {
  reply =
    "⚠️ White rice is not bad, but less nutritious than traditional rice.";
}

else if (contains(msg, ["polished"])) {
  reply =
    "🔬 Polished rice = nutrients removed.\nUnpolished rice = healthier.";
}

else if (contains(msg, ["boiled", "raw"])) {
  reply =
    "🍚 Boiled rice → softer & healthier\n🍚 Raw rice → tastier but less fiber";
}

// =============================
// 🌍 LOCATION BASED (q24)
// =============================
else if (contains(msg, ["tamil nadu"])) {
  reply =
    "🌾 Tamil Nadu traditional rice:\n• Mappillai Samba\n• Karuppu Kavuni\n• Kattuyanam";
}

else if (contains(msg, ["india"])) {
  reply =
    "🇮🇳 Popular in India:\n• Basmati\n• Ponni\n• Seeraga Samba";
}

// =============================
// 🎯 BUYING INTENT (q40)
// =============================
else if (contains(msg, ["should i buy"])) {
  reply =
    "👍 Yes! It’s a great choice with excellent taste and quality.";
}

else if (contains(msg, ["better option"])) {
  reply =
    "🔄 Better option?\n👉 Premium → Seeraga Samba\n👉 Healthy → Karuppu Kavuni";
}

// =============================
// 🧠 DECISION FATIGUE (q46)
// =============================
else if (contains(msg, ["make it simple"])) {
  reply = "👉 Go with Seeraga Samba – best overall choice.";
}

// =============================
// 🚨 URGENCY (q48)
// =============================
else if (contains(msg, ["urgent"])) {
  reply =
    "⚡ Urgent delivery?\nWe process orders fast. Expect delivery in 1–2 days in Chennai.";
}

// =============================
// 🧠 CUSTOM NEED (q58)
// =============================
else if (contains(msg, ["how much"])) {
  reply =
    "📦 Quantity guide:\n• 1 person → 5kg/month\n• Family (4) → 20kg/month approx.";
}

// =============================
// 🤖 HUMAN-LIKE GREETING (q60)
// =============================
else if (msg === "hi" || msg === "hello") {
  reply =
    "👋 Hi! Ask me about rice, prices, offers, or delivery 😊";
}

// =============================
// 🧠 FINAL FALLBACK (logic2)
// =============================
else {
  reply =
    "🤖 I didn’t understand. Try asking about rice, price, delivery or offers 😊";
}

// =============================
// ✅ RESPONSE
// =============================
return res.json({ reply });

} catch (err) {
  console.error('Chatbot error:', err);
  return res.json({
    reply: "🤖 I didn't understand that. Try asking about rice, price, delivery or offers 😊",
  });
}
};

exports.getQuickReplies = (req, res) => {
  const quickReplies = [
    'Which rice is best for health?',
    'How to cook Seeraga Samba?',
    'What are your delivery charges?',
    'Do you have any offers?',
    'Which rice is good for diabetics?',
    'How to track my order?',
    'Show me flash sale products',
    'What\'s the cheapest rice?'
  ];
  
  res.json({ quickReplies });
};