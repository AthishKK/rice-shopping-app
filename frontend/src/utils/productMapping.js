// Utility to map static product IDs to database product IDs
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

let productIdMapping = {};
let reverseMapping = {};
let mappingLoaded = false;

export const loadProductMapping = async () => {
  if (mappingLoaded) return productIdMapping;
  
  try {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    const dbProducts = await response.json();
    const mapping = {};
    const reverse = {};
    
    // Map by product name since that's consistent
    dbProducts.forEach(dbProduct => {
      // Find matching static product by name
      const staticId = getStaticIdByName(dbProduct.name);
      if (staticId) {
        mapping[staticId] = dbProduct._id;
        reverse[dbProduct._id] = staticId;
      }
    });
    
    productIdMapping = mapping;
    reverseMapping = reverse;
    mappingLoaded = true;
    console.log('Product mapping loaded:', mapping);
    return mapping;
  } catch (error) {
    console.error('Failed to load product mapping:', error);
    return {};
  }
};

const getStaticIdByName = (name) => {
  const nameMapping = {
    'Nei Kichadi Rice': 1,
    'Seeraga Samba Rice': 2,
    'Karuppu Kavuni Rice': 3,
    'Mappillai Samba Rice': 4,
    'Karunguruvai Rice': 5,
    'Basmati Rice': 6,
    'Kattuyanam Rice': 7,
    'Poongar Rice': 8,
    'Thooyamalli Rice': 9,
    'Red Rice': 10
  };
  
  return nameMapping[name] || null;
};

export const getDbIdFromStaticId = (staticId) => {
  return productIdMapping[staticId] || null;
};

export const getStaticIdFromDbId = (dbId) => {
  return reverseMapping[dbId] || null;
};

export { productIdMapping };