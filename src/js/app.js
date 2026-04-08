/**
 * Forge & Glow - Application Logic
 * Handles Authentication, Date-aware Routine, and Supabase Synchronization.
 */

// Constants & State
const DEFAULT_USER = { username: 'MAHINDRA CHINTALA', password: 'fq7Jjs43' };
let currentUser = JSON.parse(localStorage.getItem('forge_user')) || null;
let supabase = null;
let currentWeekDates = [];
let selectedDate = new Date().toISOString().split('T')[0];
let currentView = 'push'; // push, pull, legs, routine

// === CORE UTILS ===
const normalizeUserKey = (name) => name.toLowerCase().replace(/\s+/g, '_');

const getDatesOfWeek = (startDate) => {
  const dates = [];
  const curr = new Date(startDate);
  // Monday is 1, Sunday is 0. Adjust to start Monday.
  const day = curr.getDay();
  const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(curr.setDate(diff));
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

// === SUPABASE INIT ===
async function initSupabase() {
  try {
    const res = await fetch('/api/public-config');
    const { supabaseUrl, supabaseAnonKey } = await res.json();
    if (supabaseUrl && supabaseAnonKey) {
      supabase = supabasejs.createClient(supabaseUrl, supabaseAnonKey);
      console.log('Supabase initialized');
      return true;
    }
  } catch (err) {
    console.error('Supabase init failed:', err);
  }
  return false;
}

// === AUTH LOGIC ===
function checkAuth() {
  const overlay = document.getElementById('auth-overlay');
  if (!currentUser) {
    overlay.style.display = 'flex';
  } else {
    overlay.style.display = 'none';
    initializeApp();
  }
}

function handleLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value.trim();
  
  if (u === DEFAULT_USER.username && p === DEFAULT_USER.password) {
    currentUser = { username: u, key: normalizeUserKey(u) };
    localStorage.setItem('forge_user', JSON.stringify(currentUser));
    checkAuth();
  } else {
    alert('Invalid credentials. Check required fields.');
  }
}

function handleLogout() {
  localStorage.removeItem('forge_user');
  currentUser = null;
  location.reload();
}

// === ROUTINE LOGIC ===
const ROUTINE_RULES = {
  2: 'legs', // Tuesday
  6: 'none', // Saturday (No legs)
  0: 'rest'  // Sunday
};

const GYM_DATA = {
  push: { name: 'Push Day', meta: 'Chest, Shoulders, Triceps', exercises: [
    { num: 'P-01', name: 'Barbell Bench Press', equipment: 'Barbell', sets: '4', reps: '6-10' },
    { num: 'P-02', name: 'Incline Dumbbell Press', equipment: 'Dumbbell', sets: '3', reps: '8-12' },
    { num: 'P-03', name: 'Overhead Press', equipment: 'Barbell', sets: '3', reps: '8-10' },
    { num: 'P-04', name: 'Lateral Raise', equipment: 'Dumbbell', sets: '4', reps: '15-20' },
    { num: 'P-05', name: 'Dips', equipment: 'Bodyweight', sets: '3', reps: 'Fail' }
  ]},
  pull: { name: 'Pull Day', meta: 'Back, Biceps, Rear Delts', exercises: [
    { num: 'L-01', name: 'Deadlift', equipment: 'Barbell', sets: '3', reps: '5' },
    { num: 'L-02', name: 'Pull Ups', equipment: 'Bodyweight', sets: '3', reps: 'Fail' },
    { num: 'L-03', name: 'Barbell Row', equipment: 'Barbell', sets: '3', reps: '8-10' },
    { num: 'L-04', name: 'Face Pull', equipment: 'Cable', sets: '3', reps: '15-20' },
    { num: 'L-05', name: 'Bicep Curls', equipment: 'EZ-Bar', sets: '3', reps: '12-15' }
  ]},
  legs: { name: 'Legs Day', meta: 'Quads, Hamstrings, Glutes', exercises: [
    { num: 'G-01', name: 'Barbell Squat', equipment: 'Barbell', sets: '4', reps: '6-8' },
    { num: 'G-02', name: 'Leg Press', equipment: 'Machine', sets: '3', reps: '10-12' },
    { num: 'G-03', name: 'Leg Curl', equipment: 'Machine', sets: '3', reps: '12-15' },
    { num: 'G-04', name: 'Calf Raise', equipment: 'Machine', sets: '4', reps: '15-20' }
  ]}
};

const DAILY_ITEMS = [
  { id: 'm1', label: 'Morning Brisk Walk (30m)' },
  { id: 'm2', label: 'Face Wash + SPF 50' },
  { id: 'm3', label: '4.0L Water Intake' },
  { id: 'm4', label: 'Evening Brisk Walk (30m)' },
  { id: 'm5', label: 'Night Recovery (Ponds Gel)' }
];

// === UI RENDERING ===
function renderDateTabs() {
  const container = document.getElementById('date-tabs');
  if (!container) return;
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  container.innerHTML = currentWeekDates.map((date, i) => `
    <div class="date-tab ${date === selectedDate ? 'active' : ''}" onclick="selectDate('${date}')">
      <div class="dt-day">${days[i]}</div>
      <div class="dt-date">${date.split('-')[2]}</div>
    </div>
  `).join('');
}

async function selectDate(date) {
  selectedDate = date;
  const d = new Date(date);
  const dayIndex = (d.getDay() + 6) % 7; // Mon=0, Sun=6
  const actualDay = d.getDay(); // Sun=0, Tue=2, Sat=6

  // Enforce Schedule Rules
  if (actualDay === 0) {
    currentView = 'routine';
  } else if (actualDay === 2) {
    currentView = 'legs';
  } else if (actualDay === 6 && currentView === 'legs') {
    currentView = 'push'; // Default back if legs selected on Saturday
  }

  renderApp();
}

async function renderApp() {
  checkAuth();
  renderDateTabs();
  
  const main = document.getElementById('main-content');
  const routineView = document.getElementById('routine-view');
  
  if (currentView === 'routine') {
    main.style.display = 'none';
    routineView.style.display = 'block';
    renderRoutine();
  } else {
    main.style.display = 'block';
    routineView.style.display = 'none';
    renderWorkout();
  }
}

async function renderWorkout() {
  const data = GYM_DATA[currentView];
  const main = document.getElementById('main-content');
  
  const completions = await fetchCompletions('exercise', selectedDate);
  
  main.innerHTML = `
    <div class="day-header">
      <div class="day-title">${data.name}</div>
      <div class="day-info">
        <div class="day-date">${selectedDate}</div>
        <div class="day-type">${data.meta}</div>
      </div>
    </div>
    <div class="exercise-list">
      ${data.exercises.map(ex => `
        <div class="card">
          <div class="card-top">
            <div class="card-main">
              <h3>${ex.num} · ${ex.name}</h3>
              <div class="card-tags">
                <span class="tag gold">${ex.equipment}</span>
                <span class="tag">${ex.sets} × ${ex.reps}</span>
              </div>
              <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' exercise guide')}" target="_blank" class="yt-link">
                Watch on YouTube
              </a>
            </div>
            <div class="check-container">
              <div class="custom-cb ${completions[ex.num] ? 'checked' : ''}" onclick="toggleCompletion(this, 'exercise', '${ex.num}')"></div>
              <span class="tag">DONE</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function renderRoutine() {
  const container = document.getElementById('routine-items');
  const completions = await fetchCompletions('item', selectedDate);
  
  container.innerHTML = DAILY_ITEMS.map(item => `
    <div class="card" style="margin-bottom:16px">
      <div class="card-top" style="padding:20px 32px">
        <div class="card-main">
          <h3>${item.label}</h3>
        </div>
        <div class="custom-cb ${completions[item.id] ? 'checked' : ''}" onclick="toggleCompletion(this, 'item', '${item.id}')"></div>
      </div>
    </div>
  `).join('');

  updateReports();
}

// === DATA SYNC ===
async function fetchCompletions(type, date) {
  if (!supabase) return {};
  const table = type === 'item' ? 'item_completions' : 'exercise_completions';
  const keyField = type === 'item' ? 'item_id' : 'exercise_num';
  
  const { data, error } = await supabase
    .from(table)
    .select(`${keyField}, completed`)
    .eq('username', currentUser.key)
    .eq('entry_date', date);
    
  if (error) return {};
  return data.reduce((acc, curr) => {
    acc[curr[keyField]] = curr.completed;
    return acc;
  }, {});
}

async function toggleCompletion(el, type, id) {
  const isChecked = el.classList.contains('checked');
  const table = type === 'item' ? 'item_completions' : 'exercise_completions';
  const keyField = type === 'item' ? 'item_id' : 'exercise_num';
  
  el.classList.toggle('checked');
  
  if (supabase) {
    const { error } = await supabase.from(table).upsert({
      username: currentUser.key,
      entry_date: selectedDate,
      [keyField]: id,
      completed: !isChecked
    }, { onConflict: 'username, entry_date, ' + keyField });
    
    if (error) console.error('Sync failed:', error);
  }
}

async function updateReports() {
  // Simple mock or logic based on completions
  const dailyComp = document.getElementById('daily-report-val');
  if (dailyComp) dailyComp.innerText = '75%'; // Would calculate from DB
}

// === INIT ===
async function initializeApp() {
  await initSupabase();
  currentWeekDates = getDatesOfWeek(new Date());
  renderApp();
}

window.showView = (view) => {
  currentView = view;
  renderApp();
};

document.addEventListener('DOMContentLoaded', checkAuth);
