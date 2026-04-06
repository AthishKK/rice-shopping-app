import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../components/LanguageContext";
import "../styles/Support.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const SESSION_ID = "session_" + Math.random().toString(36).slice(2);

function Support() {
  const { t } = useLanguage();
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "வணக்கம்! Hello! 🌾 I'm your Vetri Rice AI Assistant!\n\nI can help you with:\n• Rice varieties & health benefits\n• Cooking tips & recipes\n• Pricing & live market rates\n• Delivery & order tracking\n• Offers & premium membership\n\nWhat would you like to know?",
      time: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/chat/quick-replies`)
      .then(r => r.json())
      .then(data => setQuickReplies(data.quickReplies || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (chatOpen) inputRef.current?.focus();
  }, [chatOpen]);

  const sendMessage = async (text) => {
    const userText = (text || message).trim();
    if (!userText || loading) return;
    setMessage("");

    const userMsg = { sender: "user", text: userText, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, sessionId: SESSION_ID }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const data = await res.json();
      setMessages(prev => [...prev, { sender: "bot", text: data.reply, time: new Date(), recommendations: data.recommendations }]);
    } catch {
      // Backend unreachable — answer locally
      const reply = getLocalReply(userText.toLowerCase());
      setMessages(prev => [...prev, { sender: "bot", text: reply, time: new Date() }]);
    }
    setLoading(false);
  };

  const getLocalReply = (msg) => {
    if (/\b(hi|hello|hey|vanakkam|hai)\b/.test(msg))
      return "👋 Hello! Welcome to Vetri Vinayagar Rice Mart! 🌾\nAsk me about rice, prices, health benefits, or delivery!";
    if (msg.includes('biryani'))
      return "🍚 Best for biryani → Seeraga Samba (great aroma & taste) or Basmati (long grain, fluffy)!";
    if (msg.includes('diabet') || msg.includes('sugar'))
      return "🩺 Best for diabetes → Seeraga Samba & Thooyamalli (low glycemic index). These help control blood sugar.";
    if (msg.includes('weight') || msg.includes('slim') || msg.includes('diet'))
      return "⚖️ Best for weight loss → Red Rice & Kattuyanam (high fiber, keeps you full longer).";
    if (msg.includes('gym') || msg.includes('muscle') || msg.includes('strong') || msg.includes('strength'))
      return "💪 For strength & gym → Mappillai Samba (known as Bridegroom Rice, increases stamina & strength)!";
    if (msg.includes('health') || msg.includes('benefit') || msg.includes('nutrition'))
      return "🌿 Healthy choices:\n• Karuppu Kavuni — very high antioxidants\n• Red Rice — high iron & fiber\n• Mappillai Samba — increases body strength\n• Seeraga Samba — good for heart health";
    if (msg.includes('price') || msg.includes('cost') || msg.includes('rate') || msg.includes('how much'))
      return "💰 Our rice prices:\n• Budget: Nei Kichadi (₹100–140)\n• Mid-range: Seeraga Samba (₹120–165)\n• Premium: Basmati (₹200–260), Karuppu Kavuni (₹150–210)";
    if (msg.includes('deliver') || msg.includes('shipping'))
      return "🚚 Delivery:\n• Chennai: 1–2 days\n• Tamil Nadu: 2–3 days\n• India: 3–5 days\n✅ Free delivery above ₹500";
    if (msg.includes('offer') || msg.includes('discount') || msg.includes('deal') || msg.includes('sale'))
      return "🎉 Current offers:\n• Free delivery above ₹500\n• Premium membership → 10% OFF always!\n• Check Flash Sale section for live deals!";
    if (msg.includes('cook') || msg.includes('recipe') || msg.includes('water'))
      return "🍳 Basic cooking:\n• Wash rice 2–3 times\n• Soak 20–30 min\n• Water ratio 1:2 (normal), 1:1.5 (Basmati)\n• Cook on medium flame";
    if (msg.includes('order') || msg.includes('track'))
      return "📦 To track your order:\n• Go to My Orders page\n• Or use Track Order with your Order ID\n• Status: Placed → Shipped → Delivered";
    if (msg.includes('return') || msg.includes('refund'))
      return "🔄 Return policy:\n• 7 days return window\n• Damaged product → full refund\n• Refund processed in 3–5 working days";
    if (msg.includes('pay') || msg.includes('upi') || msg.includes('cod'))
      return "💳 Payment methods:\n• Cash on Delivery (COD)\n• UPI (GPay, PhonePe, Paytm)\n• Credit / Debit Card\n• Net Banking";
    if (msg.includes('best') || msg.includes('recommend') || msg.includes('suggest') || msg.includes('which'))
      return "🏆 Best overall → Seeraga Samba (taste + aroma + premium quality)\n🌿 Healthiest → Karuppu Kavuni\n💸 Budget → Nei Kichadi";
    return "🤖 I can help with rice varieties, prices, health benefits, cooking tips, delivery, and orders. What would you like to know? 😊";
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const formatText = (text) => {
    // Convert **bold** and newlines to JSX
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div className="support-page">
      <h1>{t('customerSupport')}</h1>

      <div className="support-container">
        <div className="contact-cards">
          <div className="contact-card">
            <div className="card-icon">📞</div>
            <h3>{t('phoneSupport')}</h3>
            <p className="contact-detail">0123456789</p>
            <p className="timing">{t('available')} 9 AM – 8 PM</p>
          </div>
          <div className="contact-card">
            <div className="card-icon">📧</div>
            <h3>{t('emailSupport')}</h3>
            <p className="contact-detail">support@vetri-rice.com</p>
            <p className="timing">{t('responseWithin24Hours')}</p>
          </div>
          <div className="contact-card">
            <div className="card-icon">📍</div>
            <h3>{t('visitUs')}</h3>
            <p className="contact-detail">123 Rice Market Street</p>
            <p className="timing">{t('chennaiTamilNadu')}</p>
          </div>
        </div>

        <div className="faq-section">
          <h2>{t('frequentlyAskedQuestions')}</h2>
          <div className="faq-item"><h4>{t('whatIsDeliveryTime')}</h4><p>{t('standardDeliveryTakes')}</p></div>
          <div className="faq-item"><h4>{t('doYouAcceptReturns')}</h4><p>{t('yesWeOffer7DayReturn')}</p></div>
          <div className="faq-item"><h4>{t('whatPaymentMethods')}</h4><p>{t('weAcceptCashOnDelivery')}</p></div>
          <div className="faq-item"><h4>{t('howCanITrackOrder')}</h4><p>{t('youCanTrackOrder')}</p></div>
        </div>
      </div>

      {/* Chat Toggle Button */}
      <button className="chat-button" onClick={() => setChatOpen(!chatOpen)}>
        {chatOpen ? "✕ Close Chat" : "🤖 AI Rice Assistant"}
      </button>

      {/* Full-size Chat Window */}
      {chatOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">🌾</div>
              <div>
                <h3>Vetri Rice AI Assistant</h3>
                <span className="chat-status">🟢 Online — Powered by AI</span>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setChatOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble-row ${msg.sender}`}>
                {msg.sender === "bot" && <div className="bot-avatar">🌾</div>}
                <div className={`chat-bubble ${msg.sender}`}>
                  <div className="bubble-text">{formatText(msg.text)}</div>
                  {msg.recommendations?.length > 0 && (
                    <div className="rec-chips">
                      <small>Recommended:</small>
                      {msg.recommendations.map((r, ri) => (
                        <span key={ri} className="rec-chip">🌾 {r.name}</span>
                      ))}
                    </div>
                  )}
                  <div className="bubble-time">{formatTime(msg.time)}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-bubble-row bot">
                <div className="bot-avatar">🌾</div>
                <div className="chat-bubble bot typing-bubble">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {quickReplies.length > 0 && (
            <div className="quick-replies">
              {quickReplies.map((qr, i) => (
                <button key={i} className="quick-reply-btn" onClick={() => sendMessage(qr)} disabled={loading}>
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask me anything about rice..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              disabled={loading}
            />
            <button onClick={() => sendMessage()} disabled={loading || !message.trim()}>
              {loading ? "..." : "➤"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Support;
