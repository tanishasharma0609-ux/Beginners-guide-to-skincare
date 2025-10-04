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
    alert("❌ Error saving profile. Check console for details.");
  }
}

function showProfile(profileData) {
  document.getElementById('dispName')?.textContent = profileData.name || '';
  document.getElementById('dispAge')?.textContent = profileData.age || '';
  document.getElementById('dispGender')?.textContent = profileData.gender || '';
  document.getElementById('dispCity')?.textContent = profileData.city || '';
  document.getElementById('profileForm')?.style.display = 'none';
  document.getElementById('profileDisplay')?.style.display = 'block';
}

function loadProfile() {
  const profileData = JSON.parse(localStorage.getItem("profile") || "null");
  if (profileData) showProfile(profileData);
}

/* ---------------- SURVEY LOGIC ---------------- */
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
  return Object.entries(score).sort((a,b)=>b[1]-a[1])[0][0];
}

/* ---------------- FETCH SUGGESTIONS FROM FIRESTORE ---------------- */
async function getSuggestionsFromFirestore(skinType) {
  try {
    const doc = await db.collection('suggestions').doc(skinType).get();
    const common = [
      "Patch-test new products.",
      "Use sunscreen (SPF 30+) every morning.",
      "Gentle, non-stripping cleanser."
    ];
    if (doc.exists) {
      const list = doc.data().list || [];
      return [...common, ...list];
    } else {
      console.warn(`No suggestions found for ${skinType}`);
      return common;
    }
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
    alert('Please answer all questions.');
    return;
  }

  const skinType = computeSkinType(answers);
  const suggestions = await getSuggestionsFromFirestore(skinType);

  const survey = { at: Date.now(), answers, skinType, suggestions };

  try {
    const docRef = await db.collection('surveys').add(survey);
    console.log('Survey saved with ID:', docRef.id);
    localStorage.setItem('survey', JSON.stringify(survey));
    location.href = 'results.html';
  } catch (err) {
    console.error('Error saving survey:', err);
    alert('Error saving survey. Check console.');
  }
}

/* ---------------- RESULTS PAGE ---------------- */
function renderResults() {
  const raw = localStorage.getItem('survey');
  if (!raw) return;
  const survey = JSON.parse(raw);
  const profile = JSON.parse(localStorage.getItem('profile') || '{}');

  document.getElementById('who')?.textContent = profile?.name || 'Guest';

  const typeMap = { dry: 'Dry', oily: 'Oily', normal: 'Normal', sensitive: 'Sensitive', acne: 'Acne-prone', combo: 'Combination' };
  document.getElementById('skinType')?.textContent = typeMap[survey.skinType] || survey.skinType;

  document.getElementById('suggestions')?.innerHTML = survey.suggestions.map(s => `<li>${s}</li>`).join('');
}

/* ---------------- INIT ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  renderResults();

  document.getElementById('savebutton')?.addEventListener('click', () => {
    const profileData = {
      name: document.getElementById('p_name').value,
      age: Number(document.getElementById('p_age').value),
      gender: document.getElementById('p_gender').value,
      city: document.getElementById('p_city').value
    };
    saveProfile(profileData);
  });

  document.getElementById('surveyForm')?.addEventListener('submit', submitSurvey);
});

