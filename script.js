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
    icon: '🏜️',
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
    icon: '✨',
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
    icon: '🌟',
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
    icon: '🌹',
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
    icon: '🌋',
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
    icon: '🎭',
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

function renderResults() {
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
  if (skinIconEl) skinIconEl.textContent = skinData.icon;
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

  // Update tips
  const tipsEl = document.getElementById('keyTips');
  if (tipsEl) {
    tipsEl.innerHTML = skinData.tips.map(tip => `
      <div class="tip-card">
        <span class="tip-icon">💡</span>
        <p>${tip}</p>
      </div>
    `).join('');
  }

  // Update recommended products
  const productsEl = document.getElementById('recommendedProducts');
  if (productsEl) {
    productsEl.innerHTML = `
      <div class="product-recommendations">
        ${skinData.products.map(product => `
          <div class="product-recommendation">
            <span class="product-icon">✨</span>
            <span class="product-name">${product}</span>
          </div>
        `).join('')}
      </div>
      <p class="product-note">These products are specifically recommended for ${skinData.name.toLowerCase()} skin.</p>
    `;
  }
}

/* ---------------- DEFAULT PRODUCTS ---------------- */
const defaultProducts = [
  { name: "Gentle Cleanser", description: "Non-stripping daily cleanser", price: 299, types: ["all","normal","dry"], image: "cleanser.jpg" },
  { name: "Hydrating Moisturizer", description: "Ceramides + HA for dry skin", price: 399, types: ["dry","normal","sensitive"], image: "moisturizer.jpg" },
  { name: "Broad Spectrum Sunscreen SPF 50", description: "Lightweight, no white cast", price: 549, types: ["all","dry","oily","normal","combination","sensitive","acne-prone"], image: "sunscreen.jpg" },
  { name: "BHA Toner (Salicylic)", description: "Helps with pores & blackheads", price: 499, types: ["oily","acne-prone","combination"], image: "toner.jpg" },
  { name: "Soothing Serum", description: "Centella + Panthenol", price: 699, types: ["sensitive","normal","dry"], image: "serum.jpg" }
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

    uniqueProducts.forEach(p => {
      const card = document.createElement("div");
      card.classList.add("product-card", "visible");
      card.dataset.types = p.types.join(",");
      card.innerHTML = `
        <img src="images/${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <p class="price">₹${p.price}</p>
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
  const filterSelect = document.getElementById("filterType");
  if (!filterSelect) return;

  const selected = filterSelect.value;
  document.querySelectorAll(".product-card").forEach(card => {
    const types = card.dataset.types.split(",");
    card.style.display = selected === "all" || types.includes(selected) ? "block" : "none";
  });
}

/* ---------------- INIT ---------------- */
document.addEventListener('DOMContentLoaded', async () => {
  loadProfile();
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
  const filterSelect = document.getElementById("filterType");
  if (filterSelect) filterSelect.addEventListener("change", applyFilter);
});
