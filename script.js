/* ---------------- FIREBASE INIT ---------------- */
const firebaseConfig = {
  apiKey: "AIzaSyAKIz9s410M8-Ycu0fibPm0S1iJXEG-5ko",
  authDomain: "studio-4130330890-84f62.firebaseapp.com",
  projectId: "studio-4130330890-84f62",
  storageBucket: "studio-4130330890-84f62.firebasestorage.app",
  messagingSenderId: "96173266847",
  appId: "1:96173266847:web:26cfea51521f6865c50faa"
};

// Defensive check: does firebase exist?
if (typeof firebase === 'undefined') {
  console.error("FATAL: firebase is not defined. Make sure Firebase scripts are loaded BEFORE script.js");
  // Stop further execution to avoid confusing runtime errors.
} else {
  firebase.initializeApp(firebaseConfig);
}
const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;

/* ---------------- PROFILE SAVE/LOAD ---------------- */
async function saveProfile(profileData) {
  try {
    if (!db) throw new Error("Firestore not initialized");

    profileData.createdAt = firebase.firestore.FieldValue.serverTimestamp();

    const docRef = await db.collection("profiles").add(profileData);
    console.log("Profile saved with ID:", docRef.id);

    localStorage.setItem("profile", JSON.stringify(profileData));
    showProfile(profileData);
    alert("✅ Profile saved successfully!");
  } catch (err) {
    console.error("Error saving profile:", err);
    alert("❌ Error saving profile. Check console.");
  }
}

function showProfile(profileData) {
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '';
  };
  setText('dispName', profileData.name);
  setText('dispAge', profileData.age);
  setText('dispGender', profileData.gender);
  setText('dispCity', profileData.city);

  const pf = document.getElementById('profileForm');
  const pd = document.getElementById('profileDisplay');
  if (pf) pf.style.display = 'none';
  if (pd) pd.style.display = 'block';
}

function loadProfile() {
  try {
    const raw = localStorage.getItem('profile');
    if (!raw) return null;
    const profile = JSON.parse(raw);
    if (profile && Object.keys(profile).length) showProfile(profile);
    return profile;
  } catch (err) {
    console.error("Error loading profile:", err);
    return null;
  }
}

/* ---------------- SURVEY LOGIC ---------------- */
function computeSkinType(answers) {
  const score = { dry:0, oily:0, normal:0, sensitive:0, acne:0, combo:0 };

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

  // pick highest score; if tie, arbitrary by object order
  const sorted = Object.entries(score).sort((a,b) => b[1] - a[1]);
  return sorted.length ? sorted[0][0] : 'normal';
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
      "Use a humidifier in dry weather."
    ],
    oily: [
      "Oil-free moisturizer; gel sunscreen recommended.",
      "Use BHA (salicylic acid) 2–3x/week for congestion.",
      "Blot excess oil during the day."
    ],
    normal: [
      "Balanced routine: cleanser → moisturizer → sunscreen.",
      "Weekly gentle exfoliation keeps skin radiant."
    ],
    sensitive: [
      "Choose fragrance-free products and perform patch tests.",
      "Use soothing ingredients like centella (madecassoside) or panthenol."
    ],
    acne: [
      "Consider BHA (salicylic) or topical retinoid (adapalene).",
      "Avoid heavy oils; wash pillowcases often."
    ],
    combo: [
      "Moisturize dry areas; use lightweight products on T-zone.",
      "Try gel moisturizer AM and richer cream on dry spots PM."
    ]
  };
  return common.concat(map[type] || []);
}

/* ---------------- SURVEY SUBMISSION ---------------- */
async function submitSurvey(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  // build answers object
  const get = (name) => {
    const el = document.querySelector(`[name="${name}"]`);
    return el ? el.value.trim() : '';
  };

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

  // validation
  const missing = Object.entries(answers).filter(([k,v]) => !v).map(a => a[0]);
  if (missing.length) {
    alert('Please answer all questions.');
    return;
  }

  const skinType = computeSkinType(answers);
  const suggestions = suggestionsFor(skinType);

  const survey = {
    answers: answers,
    skinType: skinType,
    suggestions: suggestions,
    createdAt: (db ? firebase.firestore.FieldValue.serverTimestamp() : Date.now())
  };

  try {
    if (!db) throw new Error('Firestore not initialized (firebase undefined).');

    const docRef = await db.collection('surveys').add(survey);
    console.log('Survey saved with ID:', docRef.id);

    // store locally for results page fallback
    localStorage.setItem('survey', JSON.stringify({
      answers, skinType, suggestions, createdAt: Date.now()
    }));

    // redirect to results
    window.location.href = 'results.html';
  } catch (err) {
    console.error('Error saving survey:', err);
    alert('❌ Could not save survey. Check console for details.');
  }
}

/* ---------------- RESULTS RENDER (localStorage fallback) ---------------- */
function renderResults() {
  try {
    const raw = localStorage.getItem('survey');
    if (!raw) {
      const container = document.getElementById('resultsBox');
      if (container) container.textContent = 'No survey found. Please complete the survey first.';
      return;
    }
    const survey = JSON.parse(raw);
    const profileRaw = localStorage.getItem('profile') || '{}';
    const profile = JSON.parse(profileRaw);

    const whoEl = document.getElementById('who');
    if (whoEl) whoEl.textContent = profile.name || 'Guest';

    const typeMap = { dry:'Dry', oily:'Oily', normal:'Normal', sensitive:'Sensitive', acne:'Acne-prone', combo:'Combination' };
    const skinTypeEl = document.getElementById('skinType');
    if (skinTypeEl) skinTypeEl.textContent = typeMap[survey.skinType] || survey.skinType;

    const suggestionsEl = document.getElementById('suggestions');
    if (suggestionsEl && Array.isArray(survey.suggestions)) {
      suggestionsEl.innerHTML = survey.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('');
    }

    const amList = document.getElementById('amRoutine');
    const pmList = document.getElementById('pmRoutine');
    if (amList && pmList) {
      const AM = [
        "Cleanser",
        (survey.skinType === 'oily' || survey.skinType === 'acne') ? "Oil-free moisturizer" : "Moisturizer",
        "Sunscreen SPF 30+"
      ];
      const PM = [
        "Cleanser",
        (survey.skinType === 'dry') ? "Hydrating serum" : (survey.skinType === 'acne' ? "BHA or adapalene (start slow)" : "Gentle serum (optional)"),
        "Moisturizer"
      ];
      amList.innerHTML = AM.map(i => `<li>${escapeHtml(i)}</li>`).join('');
      pmList.innerHTML = PM.map(i => `<li>${escapeHtml(i)}</li>`).join('');
    }
  } catch (err) {
    console.error('Error rendering results:', err);
  }
}

/* small helper to avoid XSS when injecting strings */
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/[&<>"'`=\/]/g, function (s) {
    return ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      '`': '&#96;', '=': '&#61;', '/': '&#47;'
    })[s];
  });
}

/* ---------------- INIT ---------------- */
document.addEventListener('DOMContentLoaded', function () {
  // Profile init (if other pages include these elements)
  loadProfile();

  // Hook profile save button if present
  const saveBtn = document.getElementById('savebutton');
  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      const profileData = {
        name: (document.getElementById('p_name') || {}).value || '',
        age: Number((document.getElementById('p_age') || {}).value || 0),
        gender: (document.getElementById('p_gender') || {}).value || '',
        city: (document.getElementById('p_city') || {}).value || ''
      };
      saveProfile(profileData);
    });
  }

  // Hook survey form
  const sf = document.getElementById('surveyForm');
  if (sf) {
    sf.addEventListener('submit', submitSurvey);
  }

  // If this is results page, render results
  if (document.location.pathname.endsWith('results.html')) {
    renderResults();
  }
});


