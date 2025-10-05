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

/* ---------------- PROFILE SAVE/LOAD ---------------- */
async function saveProfile(profileData) {
  try {
    profileData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    const docRef = await db.collection("profiles").add(profileData);
    console.log("Profile saved with ID:", docRef.id);
    localStorage.setItem("profile", JSON.stringify(profileData));
    showProfile(profileData);
    alert("✅ Profile saved successfully!");
  } catch (error) {
    console.error("Error saving profile:", error);
    alert("❌ Error saving profile. Check console.");
  }
}

function showProfile(profileData) {
  const dispName = document.getElementById('dispName');
  const dispAge = document.getElementById('dispAge');
  const dispGender = document.getElementById('dispGender');
  const dispCity = document.getElementById('dispCity');
  const profileForm = document.getElementById('profileForm');
  const profileDisplay = document.getElementById('profileDisplay');

  if (dispName) dispName.textContent = profileData.name || '';
  if (dispAge) dispAge.textContent = profileData.age || '';
  if (dispGender) dispGender.textContent = profileData.gender || '';
  if (dispCity) dispCity.textContent = profileData.city || '';

  if (profileForm) profileForm.style.display = 'none';
  if (profileDisplay) profileDisplay.style.display = 'block';
}

function loadProfile() {
  const profileData = JSON.parse(localStorage.getItem("profile") || "null");
  if (profileData) showProfile(profileData);
}

/* ---------------- SKIN TYPE COMPUTATION ---------------- */
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

  // Map to Firestore document IDs
  if (skinType === "combo") return "combination";
  if (skinType === "acne") return "acne-prone";
  return skinType;
}

/* ---------------- FETCH SUGGESTIONS ---------------- */
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

/* ---------------- SURVEY SUBMISSION ---------------- */
async function submitSurvey(e) {
  e.preventDefault();
  const get = id => document.querySelector(`[name="${id}"]`)?.value || '';
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
async function renderResults() {
  const raw = localStorage.getItem('survey');
  if (!raw) return;
  const survey = JSON.parse(raw);
  const profile = JSON.parse(localStorage.getItem('profile') || "{}");

  document.getElementById('who').textContent = profile.name || 'Guest';

  const typeMap = { dry: 'Dry', oily: 'Oily', normal: 'Normal', sensitive: 'Sensitive', 'acne-prone': 'Acne-prone', combination: 'Combination' };
  document.getElementById('skinType').textContent = typeMap[survey.skinType] || survey.skinType;

  document.getElementById('suggestions').innerHTML = survey.suggestions.map(s => `<li>${s}</li>`).join('');
}

/* ---------------- DEFAULT PRODUCTS ---------------- */
const defaultProducts = [
  {
    name: "Gentle Cleanser",
    description: "Non-stripping daily cleanser",
    price: 299,
    types: ["all","normal","dry"],
    image: "cleanser.jpg"
  },
  {
    name: "Hydrating Moisturizer",
    description: "Ceramides + HA for dry skin",
    price: 399,
    types: ["dry","normal","sensitive"],
    image: "moisturizer.jpg"
  },
  {
    name: "Broad Spectrum Sunscreen SPF 50",
    description: "Lightweight, no white cast",
    price: 549,
    types: ["all","dry","oily","normal","combo","sensitive","acne"],
    image: "sunscreen.jpg"
  },
  {
    name: "BHA Toner (Salicylic)",
    description: "Helps with pores & blackheads",
    price: 499,
    types: ["oily","acne","combo"],
    image: "toner.jpg"
  },
  {
    name: "Soothing Serum",
    description: "Centella + Panthenol",
    price: 699,
    types: ["sensitive","normal","dry"],
    image: "serum.jpg"
  }
];
//init products collection
async function initProducts() {
  const snapshot = await db.collection("Products").get();
  if (snapshot.empty) {
    console.log("Creating default Products collection...");

    for (const p of defaultProducts) {
      try {
        await db.collection("Products").add(p);
        console.log("Added product:", p.name);
      } catch(err) {
        console.error("Error adding product:", p.name, err);
      }
    }
  }
}

/* ---------------- LOAD PRODUCTS ---------------- */
async function loadProducts() {
  const container = document.querySelector(".product-list");
  if (!container) return;

  container.innerHTML = "";
  const snapshot = await db.collection("Products").get();
  snapshot.forEach(doc => {
    const p = doc.data();
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.dataset.types = p.types.join(",");
    card.innerHTML = `
      <img src="images/${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <p class="price">₹${p.price}</p>
    `;
    container.appendChild(card);
  });

  applyFilter(); // initial filter
}

/* ---------------- FILTER PRODUCTS ---------------- */
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

  // Save Profile button
  const saveButton = document.getElementById('savebutton');
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      const profileData = {
        name: document.getElementById('p_name').value,
        age: Number(document.getElementById('p_age').value),
        gender: document.getElementById('p_gender').value,
        city: document.getElementById('p_city').value
      };
      saveProfile(profileData);
    });
  }

  // Survey form submission
  const surveyForm = document.getElementById('surveyForm');
  if (surveyForm) {
    surveyForm.addEventListener('submit', submitSurvey);
  }

  // Browse Products button
  const browseBtn = document.getElementById('browseProductsBtn');
  if (browseBtn) {
    browseBtn.addEventListener('click', () => {
      window.location.href = 'product.html';
    });
  }

  // Products page: init and load
  await initProducts();
  await loadProducts();

  const filterSelect = document.getElementById("filterType");
  if (filterSelect) filterSelect.addEventListener("change", applyFilter);
});

