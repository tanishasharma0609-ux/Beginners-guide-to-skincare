/* Highlight active nav link */
// Import the functions you need from the SDKs you need
// NEW, CORRECTED IMPORTS (Use these full URLs in script.js)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
  apiKey: "AIzaSyAKIz9s410M8-Ycu0fibPm0S1iJXEG-5ko",
  authDomain: "studio-4130330890-84f62.firebaseapp.com",
  projectId: "studio-4130330890-84f62",
  storageBucket: "studio-4130330890-84f62.firebasestorage.app",
  messagingSenderId: "96173266847",
  appId: "1:96173266847:web:26cfea51521f6865c50faa"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

(function highlightActive() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href');
    if ((path === '' && href === 'index.html') || href === path) a.classList.add('active');
  });
})();

/* ---------- PROFILE ---------- */
// Your original Firebase function remains correct for saving data:
async function saveProfile(dataToSave) {
  try {
    // Assuming 'db' and 'collection' are correctly defined elsewhere in your scripts
    const docRef = await addDoc(collection(db, "profiles"), dataToSave);
    console.log("Profile saved with ID:", docRef.id);
    alert("Profile saved successfully!"); // Provide feedback to the user
  } catch (error) {
    console.error("Error saving profile:", error);
    alert("Error saving profile. Check console for details.");
  }
}

// FIX: Attach logic to the button click event
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const saveButton = document.getElementById('savebutton');

  if (!form || !saveButton) return;

  // This function runs ONLY when the button is clicked.
  saveButton.addEventListener('click', () => {
    // 1. Gather the data from the form
    const formData = new FormData(form);

    const profileData = {
      name: formData.get("name") || "",
      age: Number(formData.get("age")) || 0,
      gender: formData.get("gender") || "",
      city: formData.get("city") || ""
    };
    
    // 2. Pass the gathered data to your Firebase function
    saveProfile(profileData);
  });
});
     // NEW Firestore-based Load Function
async function loadProfile() {
    try {
        // You need a way to determine the current user's document ID.
        // For simplicity, we'll assume a fixed ID for now, but in a real app,
        // this should come from Firebase Authentication (e.g., auth.currentUser.uid).
        const userId = "user_static_id"; // CHANGE THIS IN A REAL APP

        // Get the document from Firestore
        const docRef = doc(db, "profiles", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const p = docSnap.data();
            // Update the form fields with loaded data
            document.getElementById('p_name').value = p.name || '';
            document.getElementById('p_age').value = p.age || '';
            document.getElementById('p_gender').value = p.gender || 'prefer-not';
            document.getElementById('p_city').value = p.city || '';
        } else {
            console.log("No profile document found for this user!");
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}
/* ---------- SURVEY ---------- */
/* simple rules to detect type */
function computeSkinType(answers) {
  let score = { dry:0, oily:0, normal:0, sensitive:0, acne:0, combo:0 };

  // Q1 dryness
  if (answers.dryness === 'often') score.dry += 2;
  if (answers.dryness === 'sometimes') score.dry += 1;
  // Q2 oiliness
  if (answers.oiliness === 'yes') score.oily += 2;
  if (answers.oiliness === 'sometimes') score.oily += 1;
  // Q3 acne
  if (answers.acne === 'frequent') score.acne += 2;
  if (answers.acne === 'sometimes') score.acne += 1;
  // Q4 sun
  if (answers.sun === 'often') score.sensitive += 1;
  // Q5 tight + shiny zones (t-zone)
  if (answers.tzone === 'yes') score.combo += 2;
  // Q6 redness/itch
  if (answers.redness === 'yes') score.sensitive += 2;
  // Q7 reaction to fragrances
  if (answers.fragrance === 'yes') score.sensitive += 1;
  // Q8 large pores
  if (answers.pores === 'large') score.oily += 1;
  // Q9 flaking
  if (answers.flaking === 'yes') score.dry += 1;
  // Q10 current routine
  if (answers.routine === 'none') score.sensitive += 0; // neutral
  if (answers.routine === 'basic') score.normal += 1;
  if (answers.routine === 'advanced') score.normal += 2;

  // choose max
  const type = Object.entries(score).sort((a,b)=>b[1]-a[1])[0][0];
  return type; // 'dry' | 'oily' | 'normal' | 'sensitive' | 'acne' | 'combo'
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

function submitSurvey(e) {
  if (e) e.preventDefault();
  const get = id => document.querySelector([name="${id}"])?.value || '';
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

  // simple validation
  if (Object.values(answers).some(v => !v)) {
    alert('Please answer all questions.'); return;
  }

  const skinType = computeSkinType(answers);
  const sugg = suggestionsFor(skinType);

  const survey = { at: Date.now(), answers, skinType, suggestions: sugg };
  localStorage.setItem('survey', JSON.stringify(survey));
  location.href = 'results.html';
}

/* ---------- RESULTS RENDER ---------- */
function renderResults() {
  const raw = localStorage.getItem('survey');
  const target = id => document.getElementById(id);
  if (!raw) { if (target('resultsBox')) target('resultsBox').textContent = 'No survey found. Please complete the survey first.'; return; }
  const survey = JSON.parse(raw);
  const profile = JSON.parse(localStorage.getItem('profile') || '{}');

  // Heading
  if (target('who')) target('who').textContent = profile?.name ? profile.name : 'Guest';

  // Skin type
  const typeMap = {
    dry: 'Dry', oily: 'Oily', normal: 'Normal',
    sensitive: 'Sensitive', acne: 'Acne-prone', combo: 'Combination'
  };
  if (target('skinType')) target('skinType').textContent = typeMap[survey.skinType] || survey.skinType;

  // Suggestions
  if (target('suggestions')) {
    target('suggestions').innerHTML = survey.suggestions.map(s => <li>${s}</li>).join('');
  }

  // Simple routine blocks
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
  if (target('amRoutine')) target('amRoutine').innerHTML = routines.AM.map(i=><li>${i}</li>).join('');
  if (target('pmRoutine')) target('pmRoutine').innerHTML = routines.PM.map(i=><li>${i}</li>).join('');

  // Recommended product tags by type (to help pick on Products page)
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

/* ---------- PRODUCTS FILTER (optional) ---------- */
function initProductFilter() {
    const select = document.getElementById('filterType');
    const cards = Array.from(document.querySelectorAll('.product-card')); // Select product cards

    select.addEventListener('change', (event) => {
        const val = event.target.value; // Get selected filter value
        const proudctType = document.getElementById("skinType").value;
        cards.forEach((card) => {
            const types = card.dataset.types.split(','); // Get product types from data attribute

            if (val === 'all' || types.includes(val)) {
                card.style.display = ''; // Show card if it matches filter
            } else {
                card.style.display = 'none'; // Hide card if it doesn't match
            }
        });
    });
}

/* Auto-run on page load where needed */
document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  renderResults();
  initProductFilter();
  // Bind forms if present
  const pf = document.getElementById('profileForm');
  if (pf) pf.addEventListener('submit', saveProfile);
  const sf = document.getElementById('surveyForm');
  if (sf) sf.addEventListener('submit', submitSurvey);

});

















