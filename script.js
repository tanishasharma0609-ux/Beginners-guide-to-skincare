/* ---------------- FIREBASE INIT ---------------- */
const firebaseConfig = {
  apiKey: "AIzaSyAKIz9s410M8-Ycu0fibPm0S1iJXEG-5ko",
  authDomain: "studio-4130330890-84f62.firebaseapp.com",
  projectId: "studio-4130330890-84f62",
  storageBucket: "studio-4130330890-84f62.firebasestorage.app",
  messagingSenderId: "96173266847",
  appId: "1:96173266847:web:26cfea51521f6865c50faa"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Fallback image mapping based on product category (uses local images folder)
function getFallbackImage(category) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('cleanser')) return 'images/cleanser.jpg';
  if (cat.includes('moistur')) return 'images/moisturizer.jpg';
  if (cat.includes('sunscreen')) return 'images/sunscreen.jpg';
  if (cat.includes('serum') || cat.includes('treatment') || cat.includes('toner') || cat.includes('exfol') || cat.includes('eye') || cat.includes('mask') || cat.includes('oil')) return 'images/serum.jpg';
  return 'images/skincare.jpeg';
}

/* ---------------- PROFILE ---------------- */
function showProfile(profileData) {
  const dispName = document.getElementById('dispName');
  const dispAge = document.getElementById('dispAge');
  const dispGender = document.getElementById('dispGender');
  const dispCity = document.getElementById('dispCity');
  const profileForm = document.getElementById('profileForm');
  const profileDisplay = document.getElementById('profileDisplay');

  if (!dispName || !dispAge || !dispGender || !dispCity || !profileDisplay || !profileForm) return;

  dispName.textContent = profileData.name || '';
  dispAge.textContent = profileData.age || '';
  dispGender.textContent = profileData.gender || '';
  dispCity.textContent = profileData.city || '';

  profileForm.style.display = 'none';
  profileDisplay.style.display = 'block';
}

function loadProfile() {
  const profileData = JSON.parse(localStorage.getItem("profile") || "null");
  if (profileData) showProfile(profileData);
}

async function saveProfile(profileData) {
  try {
    profileData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    await db.collection("profiles").add(profileData);
    localStorage.setItem("profile", JSON.stringify(profileData));
    showProfile(profileData);
    alert("✅ Profile saved successfully!");
  } catch (err) {
    console.error("Error saving profile:", err);
    alert("❌ Error saving profile. Check console.");
  }
}

/* ---------------- SURVEY ---------------- */
function computeSkinType(answers) {
  let score = { dry:0, oily:0, normal:0, sensitive:0, acne:0, combo:0 };

  if (answers.dryness === 'often') score.dry += 2;
  if (answers.dryness === 'sometimes') score.dry += 1;
  if (answers.oiliness === 'yes') score.oily += 2;
  if (answers.oiliness === 'sometimes') score.oily += 1;
  if (answers.acne === 'frequent') score.acne += 2;
  if (answers.acne === 'sometimes') score.acne += 1;
  if (answers.sun === 'often') score.sensitive += 1;
  if (answers.tzone === 'yes') score.combo += 2;
  if (answers.redness === 'yes') score.sensitive += 2;
  if (answers.fragrance === 'yes') score.sensitive += 1;
  if (answers.pores === 'large') score.oily += 1;
  if (answers.flaking === 'yes') score.dry += 1;
  if (answers.routine === 'basic') score.normal += 1;
  if (answers.routine === 'advanced') score.normal += 2;

  let skinType = Object.entries(score).sort((a,b)=>b[1]-a[1])[0][0];
  if (skinType === "combo") return "combination";
  if (skinType === "acne") return "acne-prone";
  return skinType;
}

async function getSuggestions(skinType) {
  try {
    const doc = await db.collection("Surveys").doc(skinType).get();
    const common = [
      "Patch-test new products.",
      "Use sunscreen (SPF 30+) every morning.",
      "Gentle, non-stripping cleanser."
    ];
    if (doc.exists) {
      const specific = doc.data().suggestions || [];
      return [...common, ...specific];
    }
    return common;
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    return [
      "Patch-test new products.",
      "Use sunscreen (SPF 30+) every morning.",
      "Gentle, non-stripping cleanser."
    ];
  }
}

async function submitSurvey(e) {
  e.preventDefault();
  const get = id => document.querySelector(`[name="${id}"]:checked`)?.value || '';
  const answers = {
    dryness: get('dryness'),
    oiliness: get('oiliness'),
    acne: get('acne'),
    sun: get('sun'),
    tzone: get('tzone'),
    redness: get('redness'),
    fragrance: get('fragrance'),
    pores: get('pores'),
    flaking: get('flaking'),
    routine: get('routine')
  };

  if (Object.values(answers).some(v => !v)) {
    alert("Please answer all questions.");
    return;
  }

  const skinType = computeSkinType(answers);
  const suggestions = await getSuggestions(skinType);

  const surveyData = { answers, skinType, suggestions, createdAt: firebase.firestore.FieldValue.serverTimestamp() };

  try {
    await db.collection("SurveyResponses").add(surveyData);
    localStorage.setItem("survey", JSON.stringify(surveyData));
    alert("✅ Survey submitted!");
    location.href = "results.html";
  } catch(err) {
    console.error("Error saving survey:", err);
    alert("❌ Error saving survey. Check console.");
  }
}

/* ---------------- RESULTS PAGE ---------------- */
const skinTypeData = {
  dry: {
    icon: 'sun',
    name: 'Dry Skin',
    description: 'Your skin needs extra hydration and gentle care to maintain its moisture barrier.',
    morning: [
      'Gentle, hydrating cleanser',
      'Hyaluronic acid serum',
      'Rich moisturizer with ceramides',
      'Broad spectrum SPF 30+ sunscreen'
    ],
    evening: [
      'Gentle, hydrating cleanser',
      'Hydrating toner (alcohol-free)',
      'Night cream with retinol (start slowly)',
      'Face oil for extra hydration'
    ],
    tips: [
      'Avoid hot water when cleansing',
      'Use lukewarm water instead',
      'Apply moisturizer while skin is still damp',
      'Consider a humidifier in dry climates',
      'Look for products with hyaluronic acid and ceramides'
    ],
    products: ['Gentle Cleanser', 'Hydrating Moisturizer', 'Broad Spectrum Sunscreen SPF 50', 'Soothing Serum']
  },
  oily: {
    icon: 'droplet',
    name: 'Oily Skin',
    description: 'Your skin produces excess oil, so focus on gentle cleansing and oil control.',
    morning: [
      'Salicylic acid cleanser',
      'Oil-free moisturizer',
      'Mattifying primer (optional)',
      'Broad spectrum SPF 30+ sunscreen'
    ],
    evening: [
      'Salicylic acid cleanser',
      'BHA toner for pore care',
      'Lightweight, oil-free moisturizer',
      'Spot treatment for breakouts (if needed)'
    ],
    tips: [
      'Don\'t skip moisturizer - it helps balance oil production',
      'Use oil-free and non-comedogenic products',
      'Blot excess oil with blotting papers',
      'Avoid over-cleansing which can increase oil production',
      'Consider clay masks 1-2 times per week'
    ],
    products: ['BHA Toner (Salicylic)', 'Broad Spectrum Sunscreen SPF 50']
  },
  normal: {
    icon: 'smile',
    name: 'Normal Skin',
    description: 'You have well-balanced skin! Maintain it with a consistent routine.',
    morning: [
      'Gentle cleanser',
      'Lightweight moisturizer',
      'Broad spectrum SPF 30+ sunscreen'
    ],
    evening: [
      'Gentle cleanser',
      'Moisturizer or night cream',
      'Optional: gentle exfoliant 2-3 times per week'
    ],
    tips: [
      'Maintain your current routine',
      'Don\'t over-complicate your skincare',
      'Focus on prevention with sunscreen',
      'Listen to your skin and adjust as needed',
      'Consider adding antioxidants like vitamin C'
    ],
    products: ['Gentle Cleanser', 'Hydrating Moisturizer', 'Broad Spectrum Sunscreen SPF 50', 'Soothing Serum']
  },
  sensitive: {
    icon: 'heart',
    name: 'Sensitive Skin',
    description: 'Your skin reacts easily, so gentle, fragrance-free products are essential.',
    morning: [
      'Fragrance-free, gentle cleanser',
      'Soothing, fragrance-free moisturizer',
      'Mineral sunscreen (zinc oxide/titanium dioxide)'
    ],
    evening: [
      'Fragrance-free, gentle cleanser',
      'Soothing, fragrance-free moisturizer',
      'Gentle, hydrating serum'
    ],
    tips: [
      'Always patch test new products',
      'Avoid fragrances and harsh ingredients',
      'Use lukewarm water, never hot',
      'Introduce new products one at a time',
      'Keep your routine simple and consistent'
    ],
    products: ['Gentle Cleanser', 'Soothing Serum', 'Broad Spectrum Sunscreen SPF 50']
  },
  'acne-prone': {
    icon: 'alert-circle',
    name: 'Acne-Prone Skin',
    description: 'Focus on gentle acne treatment and maintaining a healthy skin barrier.',
    morning: [
      'Salicylic acid or benzoyl peroxide cleanser',
      'Oil-free, non-comedogenic moisturizer',
      'Broad spectrum SPF 30+ sunscreen'
    ],
    evening: [
      'Gentle cleanser',
      'BHA toner or treatment',
      'Lightweight, oil-free moisturizer',
      'Spot treatment for active breakouts'
    ],
    tips: [
      'Don\'t pick or pop pimples',
      'Be patient - acne treatments take 6-8 weeks to show results',
      'Use non-comedogenic products',
      'Don\'t over-treat - this can irritate skin',
      'Consider seeing a dermatologist for persistent acne'
    ],
    products: ['BHA Toner (Salicylic)', 'Broad Spectrum Sunscreen SPF 50']
  },
  combination: {
    icon: 'columns',
    name: 'Combination Skin',
    description: 'You have both oily and dry areas, so target each zone appropriately.',
    morning: [
      'Gentle cleanser',
      'Light moisturizer on dry areas',
      'Oil-free moisturizer on T-zone',
      'Broad spectrum SPF 30+ sunscreen'
    ],
    evening: [
      'Gentle cleanser',
      'BHA toner on T-zone only',
      'Rich moisturizer on dry areas',
      'Light moisturizer on T-zone'
    ],
    tips: [
      'Treat different areas of your face differently',
      'Use oil-free products on T-zone',
      'Use richer products on dry areas',
      'Consider using different products for different zones',
      'Balance is key - don\'t over-treat either area'
    ],
    products: ['Gentle Cleanser', 'Hydrating Moisturizer', 'BHA Toner (Salicylic)', 'Broad Spectrum Sunscreen SPF 50']
  }
};

async function getTipsForSkinType(skinType) {
  let documentId = skinType.toUpperCase();
  if (skinType === 'acne-prone') {
    documentId = 'ACNE-PRONE';
  } else if (skinType === 'combination') {
    documentId = 'COMBINATION';
  } else if (skinType === 'oily') {
    documentId = 'oily';
  }

  try {
    const doc = await db.collection("skin_tips").doc(documentId).get();
    if (doc.exists) {
      const data = doc.data();
      return data.tips || [];
    } else {
      console.error("No tips document found for skin type:", documentId);
      return [];
    }
  } catch (err) {
    console.error("Error fetching tips:", err);
    return [];
  }
}

async function seedTips() {
  const skinTypes = Object.keys(skinTypeData);
  for (const skinType of skinTypes) {
    const documentId = skinType === 'oily' ? 'oily' : skinType.toUpperCase();
    const tips = skinTypeData[skinType].tips;

    const docRef = db.collection('skin_tips').doc(documentId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      if (tips && tips.length > 0) {
        try {
          await docRef.set({ tips: tips });
          console.log(`Successfully seeded tips for ${documentId}`);
        } catch (error) {
          console.error(`Error seeding tips for ${documentId}:`, error);
        }
      }
    }
  }
}

async function renderResults() {
  const raw = localStorage.getItem('survey');
  if (!raw) return;

  const survey = JSON.parse(raw);
  const profile = JSON.parse(localStorage.getItem('profile') || "{}");
  const skinType = survey.skinType;
  const skinData = skinTypeData[skinType] || skinTypeData.normal;

  // Update basic info
  const whoEl = document.getElementById('who');
  const skinEl = document.getElementById('skinType');
  const skinIconEl = document.getElementById('skinTypeIcon');
  const skinDescEl = document.getElementById('skinTypeDescription');

  if (whoEl) whoEl.textContent = profile.name || 'Guest';
  if (skinEl) skinEl.textContent = skinData.name;
  if (skinIconEl) skinIconEl.innerHTML = `<i data-feather="${skinData.icon}"></i>`;
  if (skinDescEl) skinDescEl.textContent = skinData.description;

  // Update morning routine
  const morningEl = document.getElementById('morningRoutine');
  if (morningEl) {
    morningEl.innerHTML = skinData.morning.map(step => `<li>${step}</li>`).join('');
  }

  // Update evening routine
  const eveningEl = document.getElementById('eveningRoutine');
  if (eveningEl) {
    eveningEl.innerHTML = skinData.evening.map(step => `<li>${step}</li>`).join('');
  }

  // Update tips from Firebase
  const tipsEl = document.getElementById('keyTips');
  if (tipsEl) {
    const tips = await getTipsForSkinType(skinType);
    if (tips.length > 0) {
        tipsEl.innerHTML = tips.map(tip => `
          <div class="tip-card">
            <i data-feather="info" class="tip-icon"></i>
            <p>${tip}</p>
          </div>
        `).join('');
    } else {
        tipsEl.innerHTML = "<p>No tips available for your skin type at the moment.</p>";
    }
    // Add the .visible class to the parent .tips-card element
    const tipsCard = document.querySelector('.tips-card');
    if (tipsCard) {
      tipsCard.classList.add('visible');
    }
  }

  // Update recommended products
  const productsEl = document.getElementById('recommendedProducts');
  if (productsEl) {
    productsEl.innerHTML = `
      <div class="product-recommendations">
        ${skinData.products.map(product => `
          <div class="product-recommendation">
            <i data-feather="star" class="product-icon"></i>
            <span class="product-name">${product}</span>
          </div>
        `).join('')}
      </div>
      <p class="product-note">These products are specifically recommended for ${skinData.name.toLowerCase()} skin.</p>
    `;
  }

  // Activate feather icons for injected HTML
  if (window.feather) feather.replace();
}


/* ---------------- DEFAULT PRODUCTS ---------------- */
const defaultProducts = [
  // CLEANSERS
  { name: "CeraVe Foaming Facial Cleanser", description: "Gentle foaming cleanser with ceramides and hyaluronic acid", price: 1299, types: ["all","normal","oily","combination"], image: "cerave-foaming-cleanser.jpg", brand: "CeraVe", category: "cleanser" },
  { name: "CeraVe Hydrating Facial Cleanser", description: "Non-foaming cleanser for normal to dry skin", price: 1199, types: ["all","normal","dry","sensitive"], image: "cerave-hydrating-cleanser.jpg", brand: "CeraVe", category: "cleanser" },
  { name: "La Roche-Posay Toleriane Hydrating Gentle Cleanser", description: "Fragrance-free cleanser for sensitive skin", price: 1899, types: ["sensitive","dry","normal"], image: "lrp-toleriane-cleanser.jpg", brand: "La Roche-Posay", category: "cleanser" },
  { name: "Neutrogena Ultra Gentle Daily Cleanser", description: "Soap-free, hypoallergenic cleanser", price: 899, types: ["sensitive","dry","normal"], image: "neutrogena-gentle-cleanser.jpg", brand: "Neutrogena", category: "cleanser" },
  { name: "Paula's Choice Skin Perfecting 2% BHA Liquid Exfoliant", description: "Salicylic acid exfoliant for acne-prone skin", price: 2899, types: ["oily","acne-prone","combination"], image: "paula-choice-bha.jpg", brand: "Paula's Choice", category: "exfoliant" },

  // MOISTURIZERS
  { name: "CeraVe Daily Moisturizing Lotion", description: "Lightweight lotion with ceramides and hyaluronic acid", price: 1399, types: ["all","normal","dry","sensitive"], image: "cerave-daily-lotion.jpg", brand: "CeraVe", category: "moisturizer" },
  { name: "CeraVe PM Facial Moisturizing Lotion", description: "Night moisturizer with niacinamide and ceramides", price: 1599, types: ["all","normal","dry","sensitive"], image: "cerave-pm-lotion.jpg", brand: "CeraVe", category: "moisturizer" },
  { name: "Neutrogena Hydro Boost Water Gel", description: "Hyaluronic acid gel moisturizer", price: 1799, types: ["all","normal","oily","combination"], image: "neutrogena-hydro-boost.jpg", brand: "Neutrogena", category: "moisturizer" },
  { name: "La Roche-Posay Toleriane Double Repair Face Moisturizer", description: "Prebiotic moisturizer for sensitive skin", price: 2199, types: ["sensitive","dry","normal"], image: "lrp-toleriane-moisturizer.jpg", brand: "La Roche-Posay", category: "moisturizer" },
  { name: "The Ordinary Natural Moisturizing Factors + HA", description: "Lightweight moisturizer with natural moisturizing factors", price: 899, types: ["all","normal","dry"], image: "ordinary-nmf.jpg", brand: "The Ordinary", category: "moisturizer" },

  // SUNSCREENS
  { name: "EltaMD UV Clear Broad-Spectrum SPF 46", description: "Mineral sunscreen with niacinamide", price: 3299, types: ["all","sensitive","acne-prone","normal"], image: "elta-md-uv-clear.jpg", brand: "EltaMD", category: "sunscreen" },
  { name: "La Roche-Posay Anthelios Ultra Light Fluid SPF 60", description: "Lightweight, fast-absorbing sunscreen", price: 2499, types: ["all","oily","combination","normal"], image: "lrp-anthelios.jpg", brand: "La Roche-Posay", category: "sunscreen" },
  { name: "Neutrogena Ultra Sheer Dry-Touch Sunscreen SPF 55", description: "Non-greasy, fast-absorbing sunscreen", price: 1299, types: ["all","oily","combination","normal"], image: "neutrogena-ultra-sheer.jpg", brand: "Neutrogena", category: "sunscreen" },
  { name: "CeraVe Hydrating Mineral Sunscreen SPF 30", description: "Mineral sunscreen for sensitive skin", price: 1899, types: ["sensitive","dry","normal"], image: "cerave-mineral-sunscreen.jpg", brand: "CeraVe", category: "sunscreen" },
  { name: "Supergoop! Unseen Sunscreen SPF 40", description: "Invisible, weightless sunscreen", price: 3499, types: ["all","oily","combination","normal"], image: "supergoop-unseen.jpg", brand: "Supergoop!", category: "sunscreen" },

  // SERUMS & TREATMENTS
  { name: "The Ordinary Hyaluronic Acid 2% + B5", description: "Hydrating serum with hyaluronic acid", price: 699, types: ["all","dry","normal","sensitive"], image: "ordinary-ha-serum.jpg", brand: "The Ordinary", category: "serum" },
  { name: "The Ordinary Niacinamide 10% + Zinc 1%", description: "Oil control and pore-minimizing serum", price: 699, types: ["oily","acne-prone","combination"], image: "ordinary-niacinamide.jpg", brand: "The Ordinary", category: "serum" },
  { name: "The Ordinary Vitamin C Suspension 23% + HA Spheres 2%", description: "High-potency vitamin C serum", price: 899, types: ["all","normal","dry","combination"], image: "ordinary-vitamin-c.jpg", brand: "The Ordinary", category: "serum" },
  { name: "Paula's Choice 10% Azelaic Acid Booster", description: "Anti-inflammatory treatment for acne and rosacea", price: 3299, types: ["acne-prone","sensitive","combination"], image: "paula-choice-azelaic.jpg", brand: "Paula's Choice", category: "treatment" },
  { name: "The Ordinary Retinol 0.5% in Squalane", description: "Anti-aging retinol treatment", price: 999, types: ["all","normal","dry","combination"], image: "ordinary-retinol.jpg", brand: "The Ordinary", category: "treatment" },

  // TONERS & EXFOLIANTS
  { name: "The Ordinary Glycolic Acid 7% Toning Solution", description: "Gentle exfoliating toner", price: 899, types: ["all","normal","oily","combination"], image: "ordinary-glycolic-toner.jpg", brand: "The Ordinary", category: "toner" },
  { name: "Paula's Choice Skin Perfecting 2% BHA Liquid Exfoliant", description: "Salicylic acid exfoliant for pores", price: 2899, types: ["oily","acne-prone","combination"], image: "paula-choice-bha-liquid.jpg", brand: "Paula's Choice", category: "exfoliant" },
  { name: "The Ordinary AHA 30% + BHA 2% Peeling Solution", description: "Weekly exfoliating treatment", price: 999, types: ["all","normal","oily","combination"], image: "ordinary-peeling-solution.jpg", brand: "The Ordinary", category: "exfoliant" },
  { name: "Thayers Witch Hazel Toner", description: "Alcohol-free toner with witch hazel", price: 1299, types: ["all","normal","oily","combination"], image: "thayers-witch-hazel.jpg", brand: "Thayers", category: "toner" },

  // EYE CARE
  { name: "CeraVe Eye Repair Cream", description: "Hydrating eye cream with ceramides", price: 1899, types: ["all","dry","normal","sensitive"], image: "cerave-eye-cream.jpg", brand: "CeraVe", category: "eye-care" },
  { name: "The Ordinary Caffeine Solution 5% + EGCG", description: "Eye serum for puffiness and dark circles", price: 699, types: ["all","normal","dry","sensitive"], image: "ordinary-caffeine-serum.jpg", brand: "The Ordinary", category: "eye-care" },

  // MASKS & TREATMENTS
  { name: "The Ordinary AHA 30% + BHA 2% Peeling Solution", description: "Weekly exfoliating mask", price: 999, types: ["all","normal","oily","combination"], image: "ordinary-peeling-mask.jpg", brand: "The Ordinary", category: "mask" },
  { name: "The Ordinary Salicylic Acid 2% Masque", description: "Clay mask for acne-prone skin", price: 899, types: ["oily","acne-prone","combination"], image: "ordinary-salicylic-mask.jpg", brand: "The Ordinary", category: "mask" },
  { name: "CeraVe Hydrating Facial Cleanser", description: "Gentle cleanser for dry skin", price: 1199, types: ["dry","sensitive","normal"], image: "cerave-hydrating-facial.jpg", brand: "CeraVe", category: "cleanser" },

  // SPECIALTY PRODUCTS
  { name: "The Ordinary Squalane Cleanser", description: "Oil-based cleanser for makeup removal", price: 899, types: ["all","dry","sensitive","normal"], image: "ordinary-squalane-cleanser.jpg", brand: "The Ordinary", category: "cleanser" },
  { name: "The Ordinary Rose Hip Seed Oil", description: "Natural oil for dry and aging skin", price: 999, types: ["dry","normal","sensitive"], image: "ordinary-rosehip-oil.jpg", brand: "The Ordinary", category: "oil" },
  { name: "The Ordinary 100% Plant-Derived Squalane", description: "Lightweight moisturizing oil", price: 899, types: ["all","dry","normal","sensitive"], image: "ordinary-squalane-oil.jpg", brand: "The Ordinary", category: "oil" },
  { name: "Paula's Choice Resist Advanced Replenishing Toner", description: "Anti-aging toner with antioxidants", price: 2499, types: ["all","normal","dry","combination"], image: "paula-choice-replenishing-toner.jpg", brand: "Paula's Choice", category: "toner" }
];

/* ---------------- PRODUCTS ---------------- */
async function initProducts() {
  const snapshot = await db.collection("Products").get();
  if (snapshot.empty) {
    for (const p of defaultProducts) {
      await db.collection("Products").add(p);
    }
  } else {
    // Check if we have all default products, add missing ones
    const existingNames = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      existingNames.add(data.name);
    });
    
    for (const p of defaultProducts) {
      if (!existingNames.has(p.name)) {
        await db.collection("Products").add(p);
      }
    }
  }
}

async function loadProducts() {
  const container = document.querySelector(".product-list");
  if (!container) return;

  container.innerHTML = "<p>Loading products...</p>";

  try {
    const snapshot = await db.collection("Products").get();
    container.innerHTML = "";

    // Remove duplicates by keeping only the first occurrence of each product name
    const seenNames = new Set();
    const uniqueProducts = [];
    
    snapshot.forEach(doc => {
      const p = doc.data();
      if (!seenNames.has(p.name)) {
        seenNames.add(p.name);
        uniqueProducts.push(p);
      }
    });

    // Business rule: keep only 15 products under ₹1000, sorted by price (no brand restriction)
    const selectedForRender = uniqueProducts
      .filter(p => Number(p.price || 0) < 1000)
      .sort((a,b) => Number(a.price||0) - Number(b.price||0))
      .slice(0,15);

    // Render only the selected products
    selectedForRender.forEach(p => {
      const card = document.createElement("div");
      card.classList.add("product-card", "visible");
      card.dataset.types = (p.types || []).join(",");
      card.dataset.category = p.category || "general";
      card.dataset.brand = p.brand || "Unknown";
      card.dataset.price = String(p.price || 0);
      
      const categoryBadge = p.category ? `<span class="category-badge">${p.category}</span>` : '';
      const brandInfo = p.brand ? `<p class="brand">${p.brand}</p>` : '';
      const fallbackSrc = getFallbackImage(p.category);
      
      card.innerHTML = `
        <div class="product-image-container">
          <img src="images/${p.image}" alt="${p.name}" onerror="this.onerror=null;this.src='${fallbackSrc}';">
          ${categoryBadge}
        </div>
        <div class="product-info">
        <h3>${p.name}</h3>
          ${brandInfo}
          <p class="description">${p.description}</p>
        <p class="price">₹${p.price}</p>
        </div>
      `;
      container.appendChild(card);
    });

    document.querySelectorAll(".card").forEach(c => c.classList.add("visible"));
    applyFilter();

  } catch(err) {
    console.error("Error loading products:", err);
    container.innerHTML = `<p style="color:red;">Error loading products.</p>`;
  }
}

function applyFilter() {
  const filterType = document.getElementById("filterType");
  const filterCategory = document.getElementById("filterCategory");
  const filterBrand = document.getElementById("filterBrand");
  const productCount = document.getElementById("productCount");
  
  if (!filterType || !filterCategory || !filterBrand) return;

  const selectedType = filterType.value;
  const selectedCategory = filterCategory.value;
  const selectedBrand = filterBrand.value;
  
  let visibleCount = 0;
  
  document.querySelectorAll(".product-card").forEach(card => {
    const types = card.dataset.types.split(",");
    const category = card.dataset.category;
    const brand = card.dataset.brand;
    
    const typeMatch = selectedType === "all" || types.includes(selectedType);
    const categoryMatch = selectedCategory === "all" || category === selectedCategory;
    const brandMatch = selectedBrand === "all" || brand === selectedBrand;
    
    const shouldShow = typeMatch && categoryMatch && brandMatch;
    
    card.style.display = shouldShow ? "block" : "none";
    if (shouldShow) visibleCount++;
  });
  
  // Update product count
  if (productCount) {
    productCount.textContent = `${visibleCount} products found`;
  }
}

/* ---------------- INIT ---------------- */
document.addEventListener('DOMContentLoaded', async () => {
  loadProfile();
  await seedTips();
  renderResults();

  const saveButton = document.getElementById('savebutton');
  if (saveButton) saveButton.addEventListener('click', () => {
    const profileData = {
      name: document.getElementById('p_name').value,
      age: Number(document.getElementById('p_age').value),
      gender: document.getElementById('p_gender').value,
      city: document.getElementById('p_city').value
    };
    saveProfile(profileData);
  });

  const surveyForm = document.getElementById('surveyForm');
  if (surveyForm) surveyForm.addEventListener('submit', submitSurvey);

  const browseBtn = document.getElementById('browseProductsBtn');
  if (browseBtn) browseBtn.addEventListener('click', () => {
    window.location.href = 'product.html';
  });

  await initProducts();
  await loadProducts();
  
  // Add event listeners for all filters
  const filterType = document.getElementById("filterType");
  const filterCategory = document.getElementById("filterCategory");
  const filterBrand = document.getElementById("filterBrand");
  
  if (filterType) filterType.addEventListener("change", applyFilter);
  if (filterCategory) filterCategory.addEventListener("change", applyFilter);
  if (filterBrand) filterBrand.addEventListener("change", applyFilter);
});