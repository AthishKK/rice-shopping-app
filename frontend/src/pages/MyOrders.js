import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../components/CartContext";
import { useAuth } from "../components/AuthContext";
import { useLanguage } from "../components/LanguageContext";
import "../styles/MyOrders.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const STATUS_STEPS = ["Placed", "Processing", "Shipped", "Delivered"];

const RETURN_REASONS = [
  "Damaged product",
  "Wrong item delivered",
  "Quality not as expected",
  "Size/fit issue",
  "Other"
];

const RETURN_STATUS_STAGES = [
  "Requested",
  "Approved",
  "Pickup Scheduled",
  "Picked Up",
  "Refund Processed"
];

function getStatusStep(status) {
  const map = { "Placed": 0, "Processing": 1, "Shipped": 2, "Delivered": 3, "Cancelled": 3 };
  return map[status] ?? 0;
}

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-rating-input">
      {[1,2,3,4,5].map((star) => (
        <span
          key={star}
          className={star <= (hovered || value) ? "star filled" : "star"}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange && onChange(star)}
        >★</span>
      ))}
    </div>
  );
}

function StarDisplay({ value }) {
  return (
    <div className="star-rating-input" style={{ pointerEvents: 'none' }}>
      {[1,2,3,4,5].map((star) => (
        <span key={star} className={star <= value ? "star filled" : "star"} style={{ fontSize: '18px' }}>★</span>
      ))}
    </div>
  );
}

function MyOrders() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Rating modal state
  const [ratingModal, setRatingModal] = useState(null); // { order, item }
  const [tempRating, setTempRating] = useState(0);
  const [tempReview, setTempReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  // Return modal state
  const [returnModal, setReturnModal] = useState(null); // { order, item }
  const [returnReason, setReturnReason] = useState("");
  const [returnDesc, setReturnDesc] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState(false);

  // User's existing returns (to show status)
  const [userReturns, setUserReturns] = useState([]);
  // Track which order+product combos already have a review
  const [submittedReviews, setSubmittedReviews] = useState({}); // key: `${orderId}-${productId}`

  // Details modal
  const [detailsModal, setDetailsModal] = useState(null);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchOrders();
    fetchUserReturns();
    fetchUserReviews();
  }, [user]);

  const fetchOrders = () => {
    fetch(`${API_URL}/orders`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError("Failed to load orders. Make sure the backend is running."); setLoading(false); });
  };

  const fetchUserReturns = () => {
    fetch(`${API_URL}/returns`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setUserReturns(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  // Load all reviews the user has already submitted
  const fetchUserReviews = () => {
    fetch(`${API_URL}/reviews/user/mine`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          const map = {};
          data.forEach(r => { map[`${r.orderId}-${r.productId}`] = true; });
          setSubmittedReviews(map);
        }
      })
      .catch(() => {});
  };

  if (!user) return null;

  const getStatusColor = (status) => {
    if (status === "Delivered") return "green";
    if (status === "Shipped" || status === "Processing") return "blue";
    if (status === "Cancelled") return "orange";
    return "gray";
  };

  const getStatusEmoji = (status) => {
    if (status === "Delivered") return "✅";
    if (status === "Shipped") return "🚚";
    if (status === "Processing") return "📦";
    if (status === "Cancelled") return "❌";
    return "🕐";
  };

  const handleBuyAgain = (order) => {
    const firstItem = order.items?.find(i => !i.isFreeItem);
    if (!firstItem) return;
    addToCart({
      id: `${firstItem.productId}-${Date.now()}`,
      productId: firstItem.productId,
      name: firstItem.name,
      age: firstItem.age || '1 year',
      weight: parseInt(firstItem.weight) || 1,
      price: firstItem.price,
      quantity: firstItem.quantity || 1,
      image: ''
    });
    navigate("/cart");
  };

  const openRatingModal = (order, item) => {
    setRatingModal({ order, item });
    setTempRating(0);
    setTempReview("");
    setRatingSuccess(false);
  };

  const handleSubmitRating = async () => {
    if (!tempRating) return;
    setSubmittingRating(true);
    try {
      console.log('Submitting review:', {
        productId: ratingModal.item.productId,
        orderId: ratingModal.order._id,
        rating: tempRating,
        comment: tempReview
      });
      
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          productId: ratingModal.item.productId,
          orderId: ratingModal.order._id,
          rating: tempRating,
          comment: tempReview
        })
      });
      
      console.log('Review submission response status:', res.status);
      
      if (res.ok) {
        const responseData = await res.json();
        console.log('Review submitted successfully:', responseData);
        setRatingSuccess(true);
        // Mark this order+product as reviewed so the button disappears
        const key = `${ratingModal.order._id}-${ratingModal.item.productId}`;
        setSubmittedReviews(prev => ({ ...prev, [key]: true }));
        setTimeout(() => setRatingModal(null), 1800);
      } else {
        const d = await res.json();
        console.error('Review submission failed:', d);
        alert(d.message || "Failed to submit review");
      }
    } catch (err) {
      console.error('Review submission error:', err);
      alert("Network error. Please try again.");
    }
    setSubmittingRating(false);
  };

  const openReturnModal = (order, item) => {
    setReturnModal({ order, item });
    setReturnReason("");
    setReturnDesc("");
    setReturnSuccess(false);
  };

  const handleSubmitReturn = async () => {
    if (!returnReason) return;
    setSubmittingReturn(true);
    try {
      const res = await fetch(`${API_URL}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          orderId: returnModal.order._id,
          productName: returnModal.item.name,
          reason: returnReason,
          description: returnDesc
        })
      });
      if (res.ok) {
        setReturnSuccess(true);
        fetchUserReturns();
        setTimeout(() => setReturnModal(null), 1800);
      } else {
        const d = await res.json();
        alert(d.message || "Failed to submit return");
      }
    } catch {
      alert("Network error. Please try again.");
    }
    setSubmittingReturn(false);
  };

  const getReturnForItem = (orderId, productName) =>
    userReturns.find(r => String(r.orderId?._id || r.orderId) === String(orderId) && r.productName === productName);

  const getReturnStageIndex = (status) => {
    const map = {
      "Requested": 0, "Approved": 1, "Pickup Scheduled": 2,
      "Picked Up": 3, "Refund Processed": 4, "Replacement Shipped": 4, "Rejected": -1
    };
    return map[status] ?? 0;
  };

  const handleClearHistory = async () => {
    setClearingHistory(true);
    try {
      const res = await fetch(`${API_URL}/orders/clear-history`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders([]);
        setShowClearHistoryModal(false);
        alert(`Order history cleared! ${data.clearedCount} orders hidden from your view.`);
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to clear history');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
    setClearingHistory(false);
  };

  return (
    <div className="my-orders-page">
      <div className="orders-header">
        <h1>📦 My Orders</h1>
        {orders.length > 0 && (
          <button 
            onClick={() => setShowClearHistoryModal(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #f44336, #e57373)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(244, 67, 54, 0.3)'
            }}
          >
            🗑️ Clear History
          </button>
        )}
      </div>

      {loading && <div className="empty-orders"><p>Loading orders...</p></div>}
      {error && <div className="empty-orders"><p>{error}</p></div>}

      {!loading && !error && orders.length === 0 && (
        <div className="empty-orders">
          <div className="empty-icon">📭</div>
          <h2>No Orders Yet</h2>
          <p>Start Shopping!</p>
          <button onClick={() => navigate("/")}>Go to Home</button>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="orders-container">
          {orders.map((order) => {
            const step = getStatusStep(order.status);
            const mainItems = order.items?.filter(i => !i.isFreeItem) || [];
            const freeItems = order.items?.filter(i => i.isFreeItem) || [];
            return (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-meta">
                    <span className="order-id">{t('orderId')}: #{order._id?.slice(-8).toUpperCase()}</span>
                    <span className="order-date">🛒 {new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className={`order-status-badge ${getStatusColor(order.status)}`}>
                    {getStatusEmoji(order.status)} {t(order.status.toLowerCase())}
                  </div>
                </div>

                <div className="order-body">
                  <div className="order-info">
                    {mainItems.map((item, i) => (
                      <div key={i} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: i < mainItems.length - 1 ? '1px dashed #eee' : 'none' }}>
                        <h3>{item.name}</h3>
                        <p>{item.weight} · {item.age || item.ageCategory} · {t('qty')}: {item.quantity}</p>
                        <p className="order-price">₹{item.subtotal}</p>

                        {/* Return status display */}
                        {(() => {
                          const ret = getReturnForItem(order._id, item.name);
                          if (!ret) return null;
                          const stageIdx = getReturnStageIndex(ret.status);
                          return (
                            <div className="return-status-section">
                              <p style={{ fontSize: '13px', fontWeight: '700', color: ret.status === 'Rejected' ? '#e53935' : '#ff6b35', marginBottom: '8px' }}>
                                🔄 Return: {ret.status}
                              </p>
                              {ret.status !== 'Rejected' && (
                                <div className="return-timeline">
                                  {RETURN_STATUS_STAGES.map((stage, si) => (
                                    <div key={si} className={`return-stage ${si <= stageIdx ? 'done' : ''} ${si === stageIdx ? 'current' : ''}`}>
                                      <div className="return-stage-dot">{si <= stageIdx ? '✓' : ''}</div>
                                      <div className="return-stage-label">{stage}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ))}

                    {/* Free items */}
                    {freeItems.length > 0 && (
                      <div className="free-items-section">
                        <p style={{ fontSize: '12px', fontWeight: '800', color: '#28a745', marginBottom: '6px' }}>🎁 {t('freeBonus')} ITEMS INCLUDED:</p>
                        {freeItems.map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: '#f0fff4', borderRadius: '8px', border: '1px dashed #28a745', marginBottom: '6px' }}>
                            <span style={{ fontSize: '20px' }}>🎁</span>
                            <div>
                              <p style={{ margin: 0, fontWeight: '700', color: '#155724', fontSize: '14px' }}>{item.name}</p>
                              <p style={{ margin: 0, fontSize: '12px', color: '#28a745' }}>{item.weight} · {t('free')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <p><strong>{t('total')}: ₹{order.totalAmount}</strong></p>
                    <p>{t('payment')}: {order.paymentMethod}</p>
                  </div>
                </div>

                <div className="order-timeline">
                  {STATUS_STEPS.map((s, i) => (
                    <div key={i} className={`timeline-step ${i <= step ? "done" : ""} ${i === step ? "current" : ""}${order.status === 'Cancelled' ? ' cancelled' : ''}`}>
                      <div className="step-dot">{i <= step ? "✓" : ""}</div>
                      <div className="step-label">{s}</div>
                    </div>
                  ))}
                </div>

                <div className="order-actions">
                  <button className="btn-primary" onClick={() => setDetailsModal(order)}>{t('viewDetails')}</button>
                  <button className="btn-secondary" onClick={() => handleBuyAgain(order)}>🔁 {t('buyAgain')}</button>
                  {order.status === "Delivered" && mainItems.map((item, i) => {
                    const reviewKey = `${order._id}-${item.productId}`;
                    const alreadyReviewed = submittedReviews[reviewKey];
                    return (
                      <React.Fragment key={i}>
                        {!alreadyReviewed && (
                          <button className="btn-secondary" onClick={() => openRatingModal(order, item)}>
                            ⭐ {t('rateProduct')} {item.name}
                          </button>
                        )}
                        {alreadyReviewed && (
                          <span style={{ fontSize: '13px', color: '#4caf50', fontWeight: '700', padding: '10px 0' }}>✅ Reviewed</span>
                        )}
                        {!getReturnForItem(order._id, item.name) && (
                          <button className="btn-return" onClick={() => openReturnModal(order, item)}>
                            🔄 {t('returnProduct')} {item.name}
                          </button>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <div className="modal-overlay" onClick={() => setRatingModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {ratingSuccess ? (
              <div className="rating-success">
                <div>🎉</div>
                <h3>Review Submitted!</h3>
                <p style={{ color: '#666', marginTop: '8px' }}>Thank you for your feedback</p>
              </div>
            ) : (
              <>
                <h2>⭐ Rate & Review</h2>
                <h3>{ratingModal.item?.name}</h3>
                <p className="modal-sub">How was your experience?</p>
                <StarRating value={tempRating} onChange={setTempRating} />
                <textarea
                  placeholder="Write your review (optional) — other users will see this"
                  value={tempReview}
                  onChange={(e) => setTempReview(e.target.value)}
                  rows={4}
                />
                <div className="modal-actions">
                  <button className="btn-primary" disabled={!tempRating || submittingRating} onClick={handleSubmitRating}>
                    {submittingRating ? "Submitting..." : "Submit Review"}
                  </button>
                  <button className="btn-secondary" onClick={() => setRatingModal(null)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Return Modal */}
      {returnModal && (
        <div className="modal-overlay" onClick={() => setReturnModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {returnSuccess ? (
              <div className="rating-success">
                <div>✅</div>
                <h3>Return Requested!</h3>
                <p style={{ color: '#666', marginTop: '8px' }}>We'll process your return shortly</p>
              </div>
            ) : (
              <>
                <h2>🔄 {t('returnProduct')}</h2>
                <h3>{returnModal.item?.name}</h3>
                <p className="modal-sub">{t('pleaseSelectReasonForReturn')}</p>

                <div style={{ marginBottom: '15px' }}>
                  {RETURN_REASONS.map((reason) => (
                    <label key={reason} className="return-reason">
                      <input
                        type="radio"
                        name="returnReason"
                        value={reason}
                        checked={returnReason === reason}
                        onChange={() => setReturnReason(reason)}
                      />
                      {reason}
                    </label>
                  ))}
                </div>

                <textarea
                  placeholder={t('additionalDetailsOptional')}
                  value={returnDesc}
                  onChange={(e) => setReturnDesc(e.target.value)}
                  rows={3}
                />

                {returnReason && (
                  <div className="return-stages-preview">
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#555', marginBottom: '10px' }}>Return Process:</p>
                    <div className="return-timeline">
                      {RETURN_STATUS_STAGES.map((stage, i) => (
                        <div key={i} className={`return-stage ${i === 0 ? 'current' : ''}`}>
                          <div className="return-stage-dot">{i === 0 ? '●' : ''}</div>
                          <div className="return-stage-label">{stage}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button className="btn-danger" disabled={!returnReason || submittingReturn} onClick={handleSubmitReturn}>
                    {submittingReturn ? "Submitting..." : t('submitReturn')}
                  </button>
                  <button className="btn-secondary" onClick={() => setReturnModal(null)}>{t('cancel')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsModal && (
        <div className="modal-overlay" onClick={() => setDetailsModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Order Details</h2>
            <div className="details-grid">
              <div className="detail-row"><span>{t('orderId')}</span><strong>#{detailsModal._id?.slice(-8).toUpperCase()}</strong></div>
              <div className="detail-row"><span>{t('status')}</span><strong>{detailsModal.status}</strong></div>
              <div className="detail-row"><span>{t('total')}</span><strong>₹{detailsModal.totalAmount}</strong></div>
              <div className="detail-row"><span>{t('payment')}</span><strong>{detailsModal.paymentMethod}</strong></div>
              <div className="detail-row"><span>{t('date')}</span><strong>{new Date(detailsModal.createdAt).toLocaleDateString('en-IN')}</strong></div>
              <div className="detail-row"><span>Address</span><strong>{detailsModal.deliveryAddress?.street}, {detailsModal.deliveryAddress?.city} - {detailsModal.deliveryAddress?.pincode}</strong></div>
            </div>
            <h4 style={{ marginTop: '12px', marginBottom: '8px' }}>{t('items')}:</h4>
            {detailsModal.items?.map((item, i) => (
              <div key={i} className="detail-row">
                <span>
                  {item.isFreeItem && <span style={{ color: '#28a745', fontWeight: '800', marginRight: '4px' }}>🎁 {t('free')}</span>}
                  {item.name} ({item.weight}, {item.age || item.ageCategory})
                </span>
                <strong>{item.isFreeItem ? '₹0 (Free)' : `₹${item.subtotal}`}</strong>
              </div>
            ))}
            <button className="btn-primary" style={{ marginTop: "20px", width: "100%" }} onClick={() => setDetailsModal(null)}>{t('close')}</button>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {showClearHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowClearHistoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>🗑️ Clear Order History</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              This will hide all your orders from this page. Your orders will still be saved in our system for admin purposes, 
              but you won't see them here anymore.
            </p>
            <p style={{ color: '#f44336', fontWeight: 'bold', marginBottom: '20px' }}>
              ⚠️ This action cannot be undone!
            </p>
            <div className="modal-actions">
              <button 
                className="btn-danger" 
                disabled={clearingHistory} 
                onClick={handleClearHistory}
                style={{ opacity: clearingHistory ? 0.6 : 1 }}
              >
                {clearingHistory ? 'Clearing...' : '🗑️ Clear History'}
              </button>
              <button className="btn-secondary" onClick={() => setShowClearHistoryModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyOrders;
