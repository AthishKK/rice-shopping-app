import neiKichadi1 from '../images/nei kichadi 1.jpeg';
import neiKichadi2 from '../images/nei kichadi 2.jpeg';
import seeragaSamba1 from '../images/seeraga samba rice 1.jpeg';
import seeragaSamba2 from '../images/seeraga samba rice 2.jpeg';
import karuppuKavuni1 from '../images/karuppu kavuni rice 1.jpeg';
import karuppuKavuni2 from '../images/karuppu kavuni rice 2.jpeg';
import mappillaiSamba1 from '../images/mappillai samba rice 1.jpeg';
import mappillaiSamba2 from '../images/mappillai samba rice 2.jpeg';
import karunguruvai1 from '../images/karunguruvai rice 1.jpeg';
import karunguruvai2 from '../images/karunguruvai rice 2.jpeg';
import basmati1 from '../images/basmati rice 1.jpeg';
import basmati2 from '../images/basmati rice 2.jpeg';
import kattuyanam1 from '../images/kattuyanam rice 1.jpeg';
import kattuyanam2 from '../images/kattuyanam rice 2.jpeg';
import poongar1 from '../images/poongar rice 1.jpeg';
import poongar2 from '../images/poongar rice 2.jpeg';
import thooyamalli1 from '../images/thooyamalli rice 1.jpeg';
import thooyamalli2 from '../images/thooyamalli rice 2.jpeg';
import redRice1 from '../images/red rice 1.jpeg';
import redRice2 from '../images/red rice 2.jpeg';

const products = [
  {
    id: 1,
    name: "Nei Kichadi Rice",
    prices: {
      "6 months": 100,
      "1 year": 120,
      "2 years": 140
    },
    originalPrices: {
      "6 months": 120,
      "1 year": 140,
      "2 years": 160
    },
    discount: 14,
    stock: 25,
    rating: 4.5,
    reviews: 89,
    type: "Traditional",
    color: "White",
    healthBenefits: ["Easy to digest", "Good for daily meals", "Provides long lasting energy", "Low fat"],
    images: [neiKichadi1, neiKichadi2]
  },
  {
    id: 2,
    name: "Seeraga Samba Rice",
    prices: {
      "6 months": 120,
      "1 year": 140,
      "2 years": 165
    },
    originalPrices: {
      "6 months": 140,
      "1 year": 165,
      "2 years": 190
    },
    discount: 15,
    stock: 8,
    rating: 4.8,
    reviews: 125,
    flashSale: true,
    flashSaleEnd: new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000),
    type: "Aromatic",
    color: "White",
    healthBenefits: ["Helps control blood sugar", "Rich in fiber", "Good for heart health", "Helps digestion"],
    images: [seeragaSamba1, seeragaSamba2]
  },
  {
    id: 3,
    name: "Karuppu Kavuni Rice",
    prices: {
      "6 months": 150,
      "1 year": 180,
      "2 years": 210
    },
    originalPrices: {
      "6 months": 180,
      "1 year": 220,
      "2 years": 250
    },
    discount: 18,
    stock: 5,
    rating: 4.9,
    reviews: 156,
    flashSale: true,
    flashSaleEnd: new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000),
    type: "Premium",
    color: "Black",
    healthBenefits: ["Very high antioxidants", "Improves immunity", "Good for heart health", "Rich in iron"],
    images: [karuppuKavuni1, karuppuKavuni2]
  },
  {
    id: 4,
    name: "Mappillai Samba Rice",
    prices: {
      "6 months": 110,
      "1 year": 135,
      "2 years": 160
    },
    originalPrices: {
      "6 months": 130,
      "1 year": 155,
      "2 years": 180
    },
    discount: 12,
    stock: 15,
    rating: 4.6,
    reviews: 98,
    type: "Traditional",
    color: "Red",
    healthBenefits: ["Increases body strength", "Rich in fiber", "Good for bones", "Improves stamina"],
    images: [mappillaiSamba1, mappillaiSamba2]
  },
  {
    id: 5,
    name: "Karunguruvai Rice",
    prices: {
      "6 months": 140,
      "1 year": 165,
      "2 years": 190
    },
    originalPrices: {
      "6 months": 165,
      "1 year": 190,
      "2 years": 220
    },
    discount: 13,
    stock: 30,
    rating: 4.7,
    reviews: 112,
    type: "Premium",
    color: "Black",
    healthBenefits: ["Detoxifies body", "Boosts immunity", "Helps digestion", "Improves metabolism"],
    images: [karunguruvai1, karunguruvai2]
  },
  {
    id: 6,
    name: "Basmati Rice",
    prices: {
      "6 months": 200,
      "1 year": 230,
      "2 years": 260
    },
    originalPrices: {
      "6 months": 240,
      "1 year": 270,
      "2 years": 300
    },
    discount: 15,
    stock: 20,
    rating: 4.8,
    reviews: 203,
    type: "Aromatic",
    color: "White",
    healthBenefits: ["Low fat", "Gluten free", "Easy digestion", "Good energy source"],
    images: [basmati1, basmati2]
  },
  {
    id: 7,
    name: "Kattuyanam Rice",
    prices: {
      "6 months": 170,
      "1 year": 190,
      "2 years": 210
    },
    originalPrices: {
      "6 months": 200,
      "1 year": 220,
      "2 years": 240
    },
    discount: 14,
    stock: 12,
    rating: 4.5,
    reviews: 87,
    type: "Traditional",
    color: "White",
    healthBenefits: ["High fiber", "Helps weight control", "Supports gut health", "Rich in minerals"],
    images: [kattuyanam1, kattuyanam2]
  },
  {
    id: 8,
    name: "Poongar Rice",
    prices: {
      "6 months": 150,
      "1 year": 170,
      "2 years": 190
    },
    originalPrices: {
      "6 months": 175,
      "1 year": 195,
      "2 years": 215
    },
    discount: 12,
    stock: 18,
    rating: 4.6,
    reviews: 94,
    type: "Traditional",
    color: "Brown",
    healthBenefits: ["Good for women's health", "Strengthens immunity", "Helps digestion", "Natural antioxidants"],
    images: [poongar1, poongar2]
  },
  {
    id: 9,
    name: "Thooyamalli Rice",
    prices: {
      "6 months": 175,
      "1 year": 195,
      "2 years": 215
    },
    originalPrices: {
      "6 months": 205,
      "1 year": 225,
      "2 years": 245
    },
    discount: 13,
    stock: 22,
    rating: 4.7,
    reviews: 108,
    type: "Aromatic",
    color: "White",
    healthBenefits: ["Aromatic traditional rice", "Improves digestion", "Low glycemic index", "Rich in nutrients"],
    images: [thooyamalli1, thooyamalli2]
  },
  {
    id: 10,
    name: "Red Rice",
    prices: {
      "6 months": 120,
      "1 year": 140,
      "2 years": 160
    },
    originalPrices: {
      "6 months": 140,
      "1 year": 160,
      "2 years": 180
    },
    discount: 12,
    stock: 35,
    rating: 4.4,
    reviews: 76,
    type: "Traditional",
    color: "Red",
    healthBenefits: ["High iron content", "Good for heart health", "Rich in antioxidants", "Supports weight loss"],
    images: [redRice1, redRice2]
  }
];

export default products;
