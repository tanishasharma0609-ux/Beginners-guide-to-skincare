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

/* ---------------- SAVE PROFILE ---------------- */
async function saveProfile(profileData) {
  try {
    // Add timestamp for ordering later
    profileData.createdAt = firebase.firestore.FieldValue.serverTimestamp();

    // Save to Firestore
    const docRef = await db.collection("profiles").add(profileData);
    console.log("Profile saved with ID:", docRef.id);

    // Save locally
    localStorage.setItem("profile", JSON.stringify(profileData));

    alert("✅ Profile saved successfully!");
  } catch (error) {
    console.error("Error saving profile:", error);
    alert("❌ Error saving profile. Check console for details.");
  }
}
/* ---------------- SAVE + LOAD PROFILE ---------------- */
async function saveProfile(profileData) {
  try {
    profileData.createdAt = firebase.firestore.FieldValue.serverTimestamp();

    // Save to Firestore
    const docRef = await db.collection("profiles").add(profileData);
    console.log("Profile saved with ID:", docRef.id);

    // Save locally
    localStorage.setItem("profile", JSON.stringify(profileData));

    // Show profile
    showProfile(profileData);

    alert("✅ Profile saved successfully!");
  } catch (error) {
    console.error("Error saving profile:", error);
    alert("❌ Error saving profile. Check console for details.");
  }
}

function showProfile(profileData) {
  // Populate display
  document.getElementById('dispName').textContent = profileData.name || '';
  document.getElementById('dispAge').textContent = profileData.age || '';
  document.getElementById('dispGender').textContent = profileData.gender || '';
  document.getElementById('dispCity').textContent = profileData.city || '';

  // Show display, hide form
  document.getElementById('profileForm').style.display = 'none';
  document.getElementById('profileDisplay').style.display = 'block';
}

async function loadProfile() {
  try {
    let profileData = null;

    const local = localStorage.getItem("profile");
    if (local) profileData = JSON.parse(local);

    if (profileData) {
      showProfile(profileData);
    }
  } catch (error) {
    console.error("Error loading profile:", error);
  }
}

/* ---------------- INIT ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadProfile();

  const saveButton = document.getElementById("savebutton");
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const profileData = {
        name: document.getElementById("p_name").value,
        age: Number(document.getElementById("p_age").value),
        gender: document.getElementById("p_gender").value,
        city: document.getElementById("p_city").value,
      };
      saveProfile(profileData);
    });
  }
});


/* ---------------- INIT ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadProfile();

  const saveButton = document.getElementById("savebutton");
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const profileData = {
        name: document.getElementById("p_name").value,
        age: Number(document.getElementById("p_age").value),
        gender: document.getElementById("p_gender").value,
        city: document.getElementById("p_city").value,
      };
      saveProfile(profileData);
    });
  }
});


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

  const type = Object.entries(score).sort((a,b)=>b[1]-a[1])[0][0];
  return type;
}

function suggestionsFor(type) {
  const common = [
    "Patch-test new products.",
    "Use sunscreen (SPF 30+) every morning.",
    "Gentle, non-stripping cleanser."
  ];
  const map = {
    dry: [
      "Use hydrating cleanser and thick moisturizer (ceramides).",
      "Add hyaluronic acid serum; avoid hot water.",
    ],
    oily: [
      "Oil-free moisturizer, gel sunscreen.",
      "Use BHA (salicylic acid) 2–3x/week.",
    ],
    normal: [
      "Balanced routine: cleanser → moisturizer → sunscreen.",
      "Weekly gentle exfoliation.",
    ],
    sensitive: [
      "Fragrance-free products; avoid alcohol-heavy toners.",
      "Use soothing ingredients (centella, panthenol).",
    ],
    acne: [
      "Use BHA or adapalene (OTC) as tolerated.",
      "Avoid heavy oils; wash pillowcases often.",
    ],
    combo: [
      "Moisturize dry areas; use oil-control on T-zone.",
      "Light gel moisturizer AM; richer cream on dry spots PM.",
    ]
  };
  return [...common, ...(map[type] || [])];
}

async function submitSurvey(e) {
  if (e) e.preventDefault();

  // Helper to get value by name
  const get = id => document.querySelector(`[name="${id}"]`)?.value || '';

  // Collect all answers
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
    routine: get('routine'),
  };

  // Validate all answers are filled
  if (Object.values(answers).some(v => !v)) {
    alert('Please answer all questions.');
    return;
  }

  // Compute skin type and suggestions
  const skinType = computeSkinType(answers);
  const sugg = suggestionsFor(skinType);

  // Build survey object
  const survey = {
    answers,
    skinType,
    suggestions: sugg,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    // Save to Firestore (collection: "survey")
    const docRef = await db.collection("survey").add(survey);
    console.log("Survey saved with ID:", docRef.id);

    // Optionally save locally
    localStorage.setItem('survey', JSON.stringify(survey));

    // Redirect to results page
    location.href = 'results.html';
  } catch (error) {
    console.error("Error saving survey:", error);
    alert("❌ Error saving survey. Check console for details.");
  }
}


/* ---------------- RESULTS RENDER ---------------- */
function renderResults() {
  const raw = localStorage.getItem('survey');
  const target = id => document.getElementById(id);
  if (!raw) {
    if (target('resultsBox')) target('resultsBox').textContent = 'No survey found. Please complete the survey first.';
    return;
  }
  const survey = JSON.parse(raw);
  const profile = JSON.parse(localStorage.getItem('profile') || '{}');

  if (target('who')) target('who').textContent = profile?.name ? profile.name : 'Guest';

  const typeMap = {
    dry: 'Dry', oily: 'Oily', normal: 'Normal',
    sensitive: 'Sensitive', acne: 'Acne-prone', combo: 'Combination'
  };
  if (target('skinType')) target('skinType').textContent = typeMap[survey.skinType] || survey.skinType;

  if (target('suggestions')) {
    target('suggestions').innerHTML = survey.suggestions.map(s => `<li>${s}</li>`).join('');
  }

  const routines = {
    AM: [
      "Cleanser",
      survey.skinType === 'oily' || survey.skinType === 'acne' ? "Oil-free moisturizer" : "Moisturizer",
      "Sunscreen SPF 30+"
    ],
    PM: [
      "Cleanser",
      survey.skinType === 'dry' ? "Hydrating serum" :
      (survey.skinType === 'acne' ? "BHA or Adapalene (start slow)" :
      (survey.skinType === 'oily' ? "Niacinamide serum" : "Gentle serum (optional)")),
      "Moisturizer"
    ]
  };
  if (target('amRoutine')) target('amRoutine').innerHTML = routines.AM.map(i => `<li>${i}</li>`).join('');
  if (target('pmRoutine')) target('pmRoutine').innerHTML = routines.PM.map(i => `<li>${i}</li>`).join('');

  const tags = {
    dry: ["ceramide", "shea", "hyaluronic"],
    oily: ["oil-free", "gel", "salicylic"],
    normal: ["balanced", "gentle"],
    sensitive: ["fragrance-free", "soothing", "centella"],
    acne: ["salicylic", "adapalene", "non-comedogenic"],
    combo: ["light gel", "t-zone control"]
  };
  if (target('shopTags')) target('shopTags').textContent = (tags[survey.skinType] || []).join(', ');
}

/* ---------------- PRODUCT FILTER ---------------- */
function initProductFilter() {
  const select = document.getElementById('filterType');
  if (!select) return;
  const cards = Array.from(document.querySelectorAll('.product-card'));

  select.addEventListener('change', (event) => {
    const val = event.target.value;
    cards.forEach((card) => {
      const types = card.dataset.types.split(',');
      card.style.display = (val === 'all' || types.includes(val)) ? '' : 'none';
    });
  });
}

/* ---------------- INIT ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  renderResults();
  initProductFilter();

  const saveButton = document.getElementById("savebutton");
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const profileData = {
        name: document.getElementById("p_name").value,
        age: Number(document.getElementById("p_age").value),
        gender: document.getElementById("p_gender").value,
        city: document.getElementById("p_city").value,
      };
      saveProfile(profileData);
    });
  }

  const sf = document.getElementById('surveyForm');
  if (sf) sf.addEventListener('submit', submitSurvey);
});





