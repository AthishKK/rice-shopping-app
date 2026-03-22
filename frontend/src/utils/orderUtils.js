// Utility functions for managing user orders

export const addOrderToHistory = (userId, orderData) => {
  const existingOrders = getUserOrders(userId);
  const newOrder = {
    id: orderData.orderId,
    product: orderData.items[0].name, // For now, use first item
    image: orderData.items[0].image,
    weight: `${orderData.items.reduce((sum, item) => sum + (item.weight * (item.quantity || 1)), 0)} kg`,
    age: orderData.items[0].age || "1 Year",
    price: orderData.total,
    pricePerKg: Math.round(orderData.total / orderData.items.reduce((sum, item) => sum + (item.weight * (item.quantity || 1)), 0)),
    date: new Date().toLocaleDateString('en-IN', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    deliveredDate: null,
    status: "Order Placed",
    paymentMethod: orderData.paymentMethod === "cod" ? "Cash on Delivery" : "Credit Card",
    deliveryAddress: `${orderData.address.address}, ${orderData.address.city} - ${orderData.address.pincode}`,
    rating: null,
    review: "",
    returnStatus: null,
    items: orderData.items // Store all items for multi-item orders
  };
  
  const updatedOrders = [newOrder, ...existingOrders];
  localStorage.setItem(`userOrders_${userId}`, JSON.stringify(updatedOrders));
  return newOrder;
};

export const getUserOrders = (userId) => {
  if (!userId) return [];
  const savedOrders = localStorage.getItem(`userOrders_${userId}`);
  return savedOrders ? JSON.parse(savedOrders) : [];
};

export const updateOrderStatus = (userId, orderId, newStatus) => {
  const orders = getUserOrders(userId);
  const updatedOrders = orders.map(order => 
    order.id === orderId ? { ...order, status: newStatus } : order
  );
  localStorage.setItem(`userOrders_${userId}`, JSON.stringify(updatedOrders));
};