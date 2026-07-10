// CapitalFlow Application Logic & State Engine

// 1. Initial State Definition
let state = {
  lent: [],
  borrowed: [],
  rentals: [],
  interestPayments: [],
  rentPayments: [],
  expenses: [],
  renewals: [],
  files: []
};

// 2. Local Storage Keys
const STORAGE_KEY = 'capitalflow_data';

// Expanded cards state
let _expandedCards = new Set();

// Dashboard active reporting month (YYYY-MM)
let selectedMonthStr = new Date().toISOString().slice(0, 7);
let currentReminderFilter = 'all'; // 'all', 'rent', 'interest'
let currentActivityFilter = 'today'; // 'today', 'week', 'month'

// View mode: 'month' shows full month data, 'day' shows single day data, 'year' shows full year data
let viewMode = 'month';
// Selected date string in YYYY-MM-DD format
let selectedDateStr = new Date().toISOString().slice(0, 10);

// Month names for selector
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_UPPER_NAMES = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

function toggleMonthlyMode() {
  // If already in monthly mode, toggle off and reset to today
  if (viewMode === 'month') {
    viewMode = 'day';
    selectedDateStr = new Date().toISOString().slice(0, 10);
    selectedMonthStr = selectedDateStr.slice(0, 7);
    document.getElementById('btn-mode-monthly').classList.remove('active');
    document.getElementById('month-selector-bar').style.display = 'none';
    updateHeaderDateDisplay();
    refreshActiveTab();
    return;
  }
  
  viewMode = 'month';
  document.getElementById('btn-mode-monthly').classList.add('active');
  document.getElementById('btn-mode-yearly').classList.remove('active');
  
  // Show month selector, hide year selector
  document.getElementById('month-selector-bar').style.display = 'block';
  document.getElementById('year-selector-bar').style.display = 'none';
  
  renderMonthSelector();
  updateHeaderDateDisplay();
  refreshActiveTab();
}

function toggleYearlyMode() {
  // If already in yearly mode, toggle off and reset to today
  if (viewMode === 'year') {
    viewMode = 'day';
    selectedDateStr = new Date().toISOString().slice(0, 10);
    selectedMonthStr = selectedDateStr.slice(0, 7);
    document.getElementById('btn-mode-yearly').classList.remove('active');
    document.getElementById('year-selector-bar').style.display = 'none';
    updateHeaderDateDisplay();
    refreshActiveTab();
    return;
  }
  
  viewMode = 'year';
  document.getElementById('btn-mode-yearly').classList.add('active');
  document.getElementById('btn-mode-monthly').classList.remove('active');
  
  // Show year selector, hide month selector
  document.getElementById('month-selector-bar').style.display = 'none';
  document.getElementById('year-selector-bar').style.display = 'block';
  
  renderYearSelector();
  updateHeaderDateDisplay();
  refreshActiveTab();
}

function renderMonthSelector() {
  const year = parseInt(selectedMonthStr.slice(0, 4));
  const month = parseInt(selectedMonthStr.slice(5, 7)) - 1;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  document.getElementById('month-selector-label').textContent = `${MONTH_FULL_NAMES[month]} ${year}`;
  
  const grid = document.getElementById('month-grid');
  grid.innerHTML = '';
  
  MONTH_NAMES.forEach((name, idx) => {
    const btn = document.createElement('button');
    btn.className = 'month-grid-btn';
    btn.textContent = name;
    
    if (idx === month && year === parseInt(selectedMonthStr.slice(0, 4))) {
      btn.classList.add('active');
    }
    if (idx === currentMonth && year === currentYear) {
      btn.classList.add('current');
    }
    
    btn.onclick = () => selectMonth(idx);
    grid.appendChild(btn);
  });
}

function renderYearSelector() {
  const year = parseInt(selectedMonthStr.slice(0, 4));
  const currentYear = new Date().getFullYear();
  
  document.getElementById('year-selector-label').textContent = year;
  
  const grid = document.getElementById('year-grid');
  grid.innerHTML = '';
  
  // Show 5 years: current year - 2 to current year + 2
  for (let y = currentYear - 2; y <= currentYear + 2; y++) {
    const btn = document.createElement('button');
    btn.className = 'month-grid-btn';
    btn.textContent = y;
    
    if (y === year) {
      btn.classList.add('active');
    }
    if (y === currentYear) {
      btn.classList.add('current');
    }
    
    btn.onclick = () => selectYear(y);
    grid.appendChild(btn);
  }
}

function selectMonth(monthIdx) {
  const year = parseInt(selectedMonthStr.slice(0, 4));
  selectedMonthStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
  selectedDateStr = `${selectedMonthStr}-15`;
  
  renderMonthSelector();
  updateHeaderDateDisplay();
  refreshActiveTab();
}

function selectYear(year) {
  const month = parseInt(selectedMonthStr.slice(5, 7));
  selectedMonthStr = `${year}-${String(month).padStart(2, '0')}`;
  selectedDateStr = `${selectedMonthStr}-15`;
  
  renderYearSelector();
  updateHeaderDateDisplay();
  refreshActiveTab();
}

function navigateMonth(direction) {
  let [year, month] = selectedMonthStr.split('-').map(Number);
  month += direction;
  if (month < 1) { month = 12; year--; }
  if (month > 12) { month = 1; year++; }
  selectedMonthStr = `${year}-${String(month).padStart(2, '0')}`;
  selectedDateStr = `${selectedMonthStr}-15`;
  
  renderMonthSelector();
  updateHeaderDateDisplay();
  refreshActiveTab();
}

function navigateYear(direction) {
  let year = parseInt(selectedMonthStr.slice(0, 4));
  year += direction;
  selectedMonthStr = `${year}-${selectedMonthStr.slice(5, 7)}`;
  selectedDateStr = `${selectedMonthStr}-15`;
  
  renderYearSelector();
  updateHeaderDateDisplay();
  refreshActiveTab();
}

// ============ RENEWALS FUNCTIONS ============

function openRenewalModal(renewalId = null) {
  document.getElementById('form-renewal').reset();
  document.getElementById('renewal-id').value = '';
  
  if (renewalId) {
    // Edit mode
    const renewal = state.renewals.find(r => r.id === renewalId);
    if (renewal) {
      document.getElementById('renewal-modal-title').textContent = 'Edit Renewal';
      document.getElementById('renewal-id').value = renewal.id;
      document.getElementById('renewal-title').value = renewal.title;
      document.getElementById('renewal-category').value = renewal.category;
      document.getElementById('renewal-amount').value = renewal.amount || '';
      document.getElementById('renewal-date').value = renewal.dueDate;
      document.getElementById('renewal-frequency').value = renewal.frequency;
      document.getElementById('renewal-note').value = renewal.note || '';
    }
  } else {
    document.getElementById('renewal-modal-title').textContent = 'Add Renewal';
    // Default due date: 1 year from today
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    document.getElementById('renewal-date').value = nextYear.toISOString().split('T')[0];
  }
  
  openModal('modal-renewal');
}

function setRenewalPreset(title, category) {
  document.getElementById('renewal-title').value = title;
  document.getElementById('renewal-category').value = category;
}

function saveRenewal(e) {
  e.preventDefault();
  
  const id = document.getElementById('renewal-id').value;
  const renewal = {
    id: id || 'renewal_' + Date.now(),
    title: document.getElementById('renewal-title').value.trim(),
    category: document.getElementById('renewal-category').value,
    amount: parseFloat(document.getElementById('renewal-amount').value) || 0,
    dueDate: document.getElementById('renewal-date').value,
    frequency: document.getElementById('renewal-frequency').value,
    note: document.getElementById('renewal-note').value.trim(),
    lastRenewed: null,
    createdAt: new Date().toISOString()
  };
  
  if (id) {
    // Update existing
    const idx = state.renewals.findIndex(r => r.id === id);
    if (idx !== -1) {
      renewal.lastRenewed = state.renewals[idx].lastRenewed;
      renewal.createdAt = state.renewals[idx].createdAt;
      state.renewals[idx] = renewal;
    }
  } else {
    // Add new
    state.renewals.push(renewal);
  }
  
  saveState();
  closeModal('modal-renewal');
  showToast('Renewal saved successfully!', 'success');
  // Always refresh dashboard to show renewal in reminders
  renderDashboard();
  refreshActiveTab();
}

function markRenewalDone(renewalId) {
  const renewal = state.renewals.find(r => r.id === renewalId);
  if (!renewal) return;
  
  renewal.lastRenewed = new Date().toISOString();
  
  // Calculate next due date based on frequency
  const dueDate = new Date(renewal.dueDate);
  if (renewal.frequency === 'yearly') {
    dueDate.setFullYear(dueDate.getFullYear() + 1);
  } else if (renewal.frequency === 'monthly') {
    dueDate.setMonth(dueDate.getMonth() + 1);
  }
  renewal.dueDate = dueDate.toISOString().split('T')[0];
  
  saveState();
  showToast('Renewal marked as done!', 'success');
  refreshActiveTab();
}

function deleteRenewal(renewalId) {
  if (!confirm('Are you sure you want to delete this renewal?')) return;
  
  state.renewals = state.renewals.filter(r => r.id !== renewalId);
  saveState();
  showToast('Renewal deleted.', 'info');
  refreshActiveTab();
}

function getUpcomingRenewals() {
  const today = new Date();
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  
  return state.renewals.filter(renewal => {
    const dueDate = new Date(renewal.dueDate);
    return dueDate >= today && dueDate <= thirtyDaysLater;
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

function getOverdueRenewals() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return state.renewals.filter(renewal => {
    const dueDate = new Date(renewal.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });
}

window.openRenewalModal = openRenewalModal;
window.setRenewalPreset = setRenewalPreset;
window.saveRenewal = saveRenewal;
window.markRenewalDone = markRenewalDone;
window.deleteRenewal = deleteRenewal;

function updateHeaderDateDisplay() {
  const headerDate = document.getElementById('header-date');
  if (!headerDate) return;
  
  const [yearStr, monthStr, dayStr] = selectedDateStr.split('-');
  const selected = new Date(yearStr, monthStr - 1, dayStr);
  const dayName = selected.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const monthName = selected.toLocaleDateString('en-US', { month: 'long' });
  const dayNum = selected.getDate();
  const year = selected.getFullYear();
  headerDate.textContent = `${dayName}, ${dayNum} ${monthName} ${year}`;
  
  const monthDisplay = document.getElementById('header-month-display');
  if (monthDisplay) {
    monthDisplay.style.display = 'none';
  }
  
  // Update title
  const titleNode = document.getElementById('current-view-title');
  if (titleNode) {
    let baseTitle = VIEWS[currentTab]?.title || 'Status';
    
    if (currentTab === 'dashboard' && currentReminderFilter !== 'all') {
      const filterTitles = {
        rent: 'Rent',
        interest: 'Interest',
        expenses: 'Expenses',
        reports: 'Total Balance To Receive'
      };
      if (filterTitles[currentReminderFilter]) {
        baseTitle = filterTitles[currentReminderFilter];
      }
    }
    
    titleNode.textContent = baseTitle;
  }
}

function toggleReminderFilter(filterType) {
  currentReminderFilter = (currentReminderFilter === filterType) ? 'all' : filterType;
  if (currentReminderFilter === 'all') _expandedCards.clear();
  refreshActiveTab(); // Refresh active tab handles title update too
  renderDashboard();
  if (currentReminderFilter !== 'all') {
    setTimeout(() => {
      let scrollTargetId = 'notifications-wrapper-card';
      if (currentReminderFilter === 'expenses') scrollTargetId = 'notifications-expenses-view';
      if (currentReminderFilter === 'reports') scrollTargetId = 'notifications-reports-view';
      
      const el = document.getElementById(scrollTargetId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }
}

function updateCardHighlights() {
  const cards = { rent: 'card-rent', interest: 'card-interest', expenses: 'card-expenses', reports: 'card-reports' };
  Object.entries(cards).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', currentReminderFilter === key);
  });
}
window.toggleReminderFilter = toggleReminderFilter;

// IndexedDB for file data (supports much larger storage than localStorage)
var _fileDataCache = {};

function initFileDB(callback) {
  try {
    var request = indexedDB.open('CapitalFlowFiles', 1);
    request.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
    };
    request.onsuccess = function(e) {
      var db = e.target.result;
      var tx = db.transaction('files', 'readonly');
      var store = tx.objectStore('files');
      var all = store.getAll();
      all.onsuccess = function() {
        (all.result || []).forEach(function(rec) {
          _fileDataCache[rec.id] = rec.data;
        });
        if (callback) callback();
      };
      all.onerror = function() { if (callback) callback(); };
    };
    request.onerror = function() { if (callback) callback(); };
  } catch(e) {
    console.error('IndexedDB init error:', e);
    if (callback) callback();
  }
}

function syncFilesToDB(files) {
  try {
    var request = indexedDB.open('CapitalFlowFiles', 1);
    request.onsuccess = function(e) {
      var db = e.target.result;
      var tx = db.transaction('files', 'readwrite');
      var store = tx.objectStore('files');
      (files || []).forEach(function(f) {
        if (f.data) {
          store.put({ id: f.id, data: f.data });
          _fileDataCache[f.id] = f.data;
        }
      });
    };
  } catch(e) { console.error('IndexedDB sync error:', e); }
}

function removeFileFromDB(id) {
  try {
    var request = indexedDB.open('CapitalFlowFiles', 1);
    request.onsuccess = function(e) {
      var db = e.target.result;
      var tx = db.transaction('files', 'readwrite');
      var store = tx.objectStore('files');
      store.delete(id);
    };
  } catch(e) { console.error('IndexedDB delete error:', e); }
  delete _fileDataCache[id];
}

function clearFileDB() {
  try {
    var request = indexedDB.open('CapitalFlowFiles', 1);
    request.onsuccess = function(e) {
      var db = e.target.result;
      var tx = db.transaction('files', 'readwrite');
      var store = tx.objectStore('files');
      store.clear();
    };
  } catch(e) { console.error('IndexedDB clear error:', e); }
  _fileDataCache = {};
}

// Load Data from LocalStorage
const SEED_VERSION = 2;
function loadState() {
  const data = localStorage.getItem(STORAGE_KEY);
  const storedVersion = parseInt(localStorage.getItem(STORAGE_KEY + '_v') || '0');
  
  if (data && storedVersion >= SEED_VERSION) {
    try {
      state = JSON.parse(data);
      // Ensure all arrays are initialized
      // Migrate removed themes to valid ones
      const removedThemes = ['dark-blue', 'midnight-purple', 'black-and-white', 'newspaper', 'neon-pulse'];
      if (removedThemes.includes(state.theme)) {
        const themeMap = { 'dark-blue': 'black-and-colored', 'midnight-purple': 'light-elegant', 'black-and-white': 'black-and-colored-plain', 'newspaper': 'light-elegant', 'neon-pulse': 'ocean-deep' };
        state.theme = themeMap[state.theme];
      }
      state.theme = state.theme || 'black-and-colored-plain';
      state.lent = state.lent || [];
      state.borrowed = state.borrowed || [];
      state.rentals = state.rentals || [];
      state.interestPayments = state.interestPayments || [];
      state.rentPayments = state.rentPayments || [];
      state.expenses = state.expenses || [];
      state.renewals = state.renewals || [];
      state.files = state.files || [];
      state.showPendingNames = state.showPendingNames !== false;
      state.showPayMethod = state.showPayMethod !== false;
      state.showExpenseDetails = state.showExpenseDetails !== false;
      state.properties = state.properties || [];
      var defaults = ['23/48 ground floor', '23/48 3rd floor', '1/104'];
      defaults.forEach(function(d) { if (state.properties.indexOf(d) === -1) state.properties.push(d); });
      
      const t = document.getElementById('toggle-pending-names');
      if(t) t.checked = state.showPendingNames;
      const pm = document.getElementById('toggle-pay-method');
      if(pm) pm.checked = state.showPayMethod;
      const ed = document.getElementById('toggle-expense-details');
      if(ed) ed.checked = state.showExpenseDetails;
    } catch (e) {
      console.error('Failed to parse local storage data, resetting to default.', e);
      saveState();
    }
    // Merge file data from IndexedDB cache
    if (state.files) {
      var hasFileData = false;
      state.files.forEach(function(f) { if (f.data) hasFileData = true; });
      // One-time migration: move file data from localStorage to IndexedDB
      if (hasFileData) {
        syncFilesToDB(state.files);
        state.files.forEach(function(f) { if (f.data) _fileDataCache[f.id] = f.data; });
        var filesMeta = state.files.map(function(f) {
          return { id: f.id, type: f.type, title: f.title, fileNumber: f.fileNumber, data: '', date: f.date };
        });
        var strippedState = JSON.parse(JSON.stringify(state));
        strippedState.files = filesMeta;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(strippedState)); } catch(e) {}
      }
      state.files.forEach(function(f) {
        if (_fileDataCache[f.id]) f.data = _fileDataCache[f.id];
      });
    }
  } else {
    // Fresh start with empty data
    localStorage.removeItem(STORAGE_KEY);
    state = { lent: [], borrowed: [], rentals: [], interestPayments: [], rentPayments: [], expenses: [], renewals: [], files: [], theme: 'black-and-colored-plain', properties: ['23/48 ground floor', '23/48 3rd floor', '1/104'] };
    saveState();
    localStorage.setItem(STORAGE_KEY + '_v', SEED_VERSION);
  }
}

// Save Data to LocalStorage
function saveState() {
  try {
    var files = state.files || [];
    // Store file data in IndexedDB
    syncFilesToDB(files);
    
    // Save metadata (without bulky base64 data) to localStorage
    var filesMeta = files.map(function(f) {
      return { id: f.id, type: f.type, title: f.title, fileNumber: f.fileNumber, data: '', date: f.date };
    });
    var cleanState = JSON.parse(JSON.stringify(state));
    cleanState.files = filesMeta;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanState));
  } catch(e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      alert('Storage full! Try deleting old files or photos to free up space.');
    } else {
      throw e;
    }
  }
}

function seedInitialData() {
  state = { lent: [], borrowed: [], rentals: [], interestPayments: [], rentPayments: [], expenses: [], renewals: [], files: [], theme: 'black-and-colored-plain' };
  state.properties = ['23/48 ground floor', '23/48 3rd floor', '1/104'];
  clearFileDB();
  saveState();
}

// 3. UI Helpers & Formatting
const formatCurrency = (val) => {
  return '₹ ' + Number(val).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });
};

const escHtml = (str) => {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
};

function numberToIndianWords(num) {
  num = Math.floor(Number(num));
  if (isNaN(num) || num === 0) return 'Zero Rupees Only';
  
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];
  
  function g(n) {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + a[n % 10];
  }
  
  function convert(n) {
    if (n === 0) return '';
    let res = '';
    
    if (n >= 10000000) {
      res += convert(Math.floor(n / 10000000)) + 'Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      res += convert(Math.floor(n / 100000)) + 'Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      res += convert(Math.floor(n / 1000)) + 'Thousand ';
      n %= 1000;
    }
    if (n >= 100) {
      res += g(Math.floor(n / 100)) + 'Hundred ';
      n %= 100;
    }
    if (n > 0) {
      res += g(n);
    }
    return res;
  }
  
  return (convert(num) + 'Rupees Only').trim();
}

function getOutstandingPrincipal(loanId, originalPrincipal) {
  const repayments = state.interestPayments.filter(p => p.loanId === loanId && p.category === 'principal');
  const totalRepaid = repayments.reduce((sum, p) => sum + Number(p.amount), 0);
  return Math.max(0, Number(originalPrincipal) - totalRepaid);
}

function getOutstandingPrincipalAtMonth(loanId, originalPrincipal, monthStr) {
  const endOfMonthDate = `${monthStr}-31`;
  const payments = state.interestPayments.filter(p => p.loanId === loanId && p.date <= endOfMonthDate);
  
  const topups = payments
    .filter(p => p.category === 'increase')
    .reduce((sum, p) => sum + Number(p.amount), 0);
    
  const repayments = payments
    .filter(p => p.category === 'principal')
    .reduce((sum, p) => sum + Number(p.amount), 0);
    
  return Math.max(0, Number(originalPrincipal) + topups - repayments);
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-US', options);
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    const d = new Date(dateStr + '-01');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  }
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Calculate Days Remaining/Passed
function getDaysDifference(targetDateStr) {
  const target = new Date(targetDateStr);
  const today = new Date();
  // Clear times to compare dates only
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// 4. Modal Engine
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// ─── QUICK COLLECT MODAL ────────────────────────────────────────────────────
let _quickCollectMode = 'rent'; // 'rent' | 'interest'
let _quickCollectSelections = new Set(); // set of IDs (rentalId or loanId)

function openQuickCollect(mode) {
  loadState();
  _quickCollectMode = mode;
  _quickCollectSelections = new Set();

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('quick-collect-date').value = today;
  document.getElementById('quick-collect-amount').value = '';

  const title = mode === 'rent' ? 'Collect Rent' : 'Collect Interest';
  document.getElementById('quick-collect-title').textContent = title;
  document.getElementById('quick-amount-label').textContent = mode === 'rent' ? 'Override Amount (Rs.) — optional' : 'Override Amount (Rs.) — optional';
  document.getElementById('quick-people-label').textContent = mode === 'rent' ? 'Select Tenants' : 'Select Borrowers';

  const peopleContainer = document.getElementById('quick-collect-people');
  peopleContainer.innerHTML = '';

  if (mode === 'rent') {
    const currentMonth = today.slice(0, 7);
    const activeRentals = state.rentals.filter(r => r.status === 'active');

    if (activeRentals.length === 0) {
      peopleContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 1rem 0;">No active tenants found.</p>`;
    } else {
      activeRentals.forEach(rental => {
        const isPaid = state.rentPayments.some(rp => rp.rentalId === rental.id && rp.monthYear === currentMonth);
        const card = document.createElement('label');
        card.className = 'quick-person-card';
        card.style.cssText = `display:flex; align-items:center; gap:1rem; padding:0.75rem 1rem; border-radius:10px; cursor:pointer; border:1.5px solid var(--border-color); background:var(--bg-secondary); transition:all 0.15s ease; ${isPaid ? 'opacity:0.5;' : ''}`;
        card.innerHTML = `
          <input type="checkbox" data-id="${rental.id}" data-default="${rental.monthlyRent}" ${isPaid ? 'disabled' : ''} style="width:18px; height:18px; accent-color: var(--color-accent); flex-shrink:0;">
          <div style="flex:1; min-width:0;">
            <div style="font-weight:700; font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${rental.tenantName}</div>
            <div style="font-size:0.75rem; color:var(--text-secondary);">${rental.propertyName} · ${formatCurrency(rental.monthlyRent)}/mo</div>
          </div>
          <span style="font-size:0.75rem; font-weight:700; color:${isPaid ? 'var(--color-success)' : 'var(--color-warning)'}; white-space:nowrap;">${isPaid ? '✓ Paid' : 'Pending'}</span>
        `;
        const checkbox = card.querySelector('input');
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            _quickCollectSelections.add(rental.id);
            card.style.borderColor = 'var(--color-accent)';
            card.style.background = 'rgba(14,165,233,0.07)';
          } else {
            _quickCollectSelections.delete(rental.id);
            card.style.borderColor = 'var(--border-color)';
            card.style.background = 'var(--bg-secondary)';
          }
        });
        peopleContainer.appendChild(card);
      });
    }
  } else {
    // interest mode — show active lent loans
    const activeLent = state.lent.filter(l => l.status === 'active');

    if (activeLent.length === 0) {
      peopleContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 1rem 0;">No active lending records found.</p>`;
    } else {
      activeLent.forEach(loan => {
        const outstanding = getOutstandingPrincipal(loan.id, loan.principal);
        const monthlyInterest = outstanding * (Number(loan.interestRate) / 100);
        const card = document.createElement('label');
        card.className = 'quick-person-card';
        card.style.cssText = `display:flex; align-items:center; gap:1rem; padding:0.75rem 1rem; border-radius:10px; cursor:pointer; border:1.5px solid var(--border-color); background:var(--bg-secondary); transition:all 0.15s ease;`;
        card.innerHTML = `
          <input type="checkbox" data-id="${loan.id}" data-default="${monthlyInterest.toFixed(2)}" style="width:18px; height:18px; accent-color: var(--color-success); flex-shrink:0;">
          <div style="flex:1; min-width:0;">
            <div style="font-weight:700; font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${loan.borrowerName}</div>
            <div style="font-size:0.75rem; color:var(--text-secondary);">Principal: ${formatCurrency(outstanding)} · Rate: ${loan.interestRate}%/mo</div>
          </div>
          <span style="font-size:0.85rem; font-weight:800; color:var(--color-success); white-space:nowrap;">${formatCurrency(monthlyInterest)}/mo</span>
        `;
        const checkbox = card.querySelector('input');
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            _quickCollectSelections.add(loan.id);
            card.style.borderColor = 'var(--color-success)';
            card.style.background = 'rgba(16,185,129,0.07)';
          } else {
            _quickCollectSelections.delete(loan.id);
            card.style.borderColor = 'var(--border-color)';
            card.style.background = 'var(--bg-secondary)';
          }
        });
        peopleContainer.appendChild(card);
      });
    }
  }

  openModal('modal-quick-collect');
}

function submitQuickCollect() {
  if (_quickCollectSelections.size === 0) {
    alert('Please select at least one person.');
    return;
  }

  loadState();
  const overrideAmount = document.getElementById('quick-collect-amount').value;
  const date = document.getElementById('quick-collect-date').value;
  if (!date) { alert('Please enter a date.'); return; }

  const peopleContainer = document.getElementById('quick-collect-people');
  const checkboxes = peopleContainer.querySelectorAll('input[type=checkbox]:checked');

  checkboxes.forEach(cb => {
    const id = cb.getAttribute('data-id');
    const defaultAmount = Number(cb.getAttribute('data-default'));
    const amount = overrideAmount ? Number(overrideAmount) : defaultAmount;

    if (_quickCollectMode === 'rent') {
      const rental = state.rentals.find(r => r.id === id);
      if (!rental) return;
      const monthYear = date.slice(0, 7);
      const payId = 'rp' + Math.random().toString(36).substr(2, 9);
      state.rentPayments.push({ id: payId, rentalId: id, amount, monthYear, datePaid: date, note: 'Quick Collect' });
    } else {
      const loan = state.lent.find(l => l.id === id);
      if (!loan) return;
      const payId = 'p' + Math.random().toString(36).substr(2, 9);
      state.interestPayments.push({ id: payId, loanId: id, type: 'received', category: 'interest', amount, date, note: 'Quick Collect' });
    }
  });

  saveState();
  closeModal('modal-quick-collect');
  renderDashboard();
  if (_quickCollectMode === 'rent') {
    renderRentals();
  } else {
    renderLending();
  }

  // Show brief success feedback
  const mode = _quickCollectMode === 'rent' ? 'Rent' : 'Interest';
  const count = checkboxes.length;
  alert(`✓ ${mode} recorded for ${count} person${count > 1 ? 's' : ''}!`);
}

// ─── QUICK LEND MODAL ───────────────────────────────────────────────────────
function openQuickLend() {
  loadState();
  const select = document.getElementById('quick-lend-borrower-select');
  select.innerHTML = '';

  // Get unique list of existing borrowers
  const borrowers = [...new Set(state.lent.map(l => l.borrowerName))].filter(Boolean).sort();

  // Add default option
  const optDefault = document.createElement('option');
  optDefault.value = '';
  optDefault.textContent = '-- Select Borrower --';
  select.appendChild(optDefault);

  borrowers.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });

  const optNew = document.createElement('option');
  optNew.value = '__new__';
  optNew.textContent = '-- Add New Borrower --';
  select.appendChild(optNew);

  // Set defaults
  document.getElementById('quick-lend-principal').value = '';
  updateQuickLendWords();
  document.getElementById('quick-lend-rate').value = '4.00';
  document.getElementById('quick-lend-start-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('quick-lend-new-name').value = '';
  document.getElementById('quick-lend-phone').value = '';
  document.getElementById('quick-lend-new-name-group').style.display = 'none';

  // Open modal
  openModal('modal-quick-lend');
}

function toggleQuickLendNewName() {
  const select = document.getElementById('quick-lend-borrower-select');
  const newNameGroup = document.getElementById('quick-lend-new-name-group');
  const newNameInput = document.getElementById('quick-lend-new-name');
  const phoneInput = document.getElementById('quick-lend-phone');
  
  if (select.value === '__new__') {
    newNameGroup.style.display = 'block';
    newNameInput.setAttribute('required', 'true');
    phoneInput.value = '';
  } else {
    newNameGroup.style.display = 'none';
    newNameInput.removeAttribute('required');
    if (select.value) {
      const existing = state.lent.find(l => l.borrowerName === select.value && l.phone);
      phoneInput.value = existing ? existing.phone : '';
    } else {
      phoneInput.value = '';
    }
  }
}

function setQuickLendPrincipal(val) {
  var input = document.getElementById('quick-lend-principal');
  var current = Number(input.value) || 0;
  input.value = current + val;
  input.focus();
  updateQuickLendWords();
  document.querySelectorAll('.quick-lend-preset-btn').forEach(function(b) {
    b.style.borderColor = '';
    b.style.background = '';
  });
  if (event && event.target) {
    event.target.style.borderColor = 'var(--color-accent)';
    event.target.style.background = 'rgba(var(--color-accent-rgb), 0.1)';
  }
}

function updateQuickLendWords() {
  var input = document.getElementById('quick-lend-principal');
  var wordsEl = document.getElementById('quick-lend-principal-words');
  if (!input || !wordsEl) return;
  var val = Number(input.value) || 0;
  wordsEl.textContent = val > 0 ? numberToIndianWords(val) : '';
}

function setPrincipalPreset(val) {
  var input = document.getElementById('loan-principal');
  var current = Number(input.value) || 0;
  input.value = current + val;
  input.focus();
  updatePrincipalWords();
  // highlight active button
  document.querySelectorAll('#principal-presets-lending .btn, #principal-presets-borrowing .btn').forEach(function(b) {
    b.style.borderColor = '';
    b.style.background = '';
  });
  if (event && event.target) {
    event.target.style.borderColor = 'var(--color-accent)';
    event.target.style.background = 'rgba(var(--color-accent-rgb), 0.1)';
  }
}

function updatePrincipalWords() {
  var input = document.getElementById('loan-principal');
  var wordsEl = document.getElementById('principal-words');
  if (!input || !wordsEl) return;
  var val = Number(input.value) || 0;
  wordsEl.textContent = val > 0 ? numberToIndianWords(val) : '';
}

function setPaymentAmountPreset(val) {
  document.getElementById('payment-amount').value = val;
}

function updatePrincipalPresets(direction) {
  const lendingPresets = document.getElementById('principal-presets-lending');
  const borrowingPresets = document.getElementById('principal-presets-borrowing');
  if (!lendingPresets || !borrowingPresets) return;
  if (direction === 'lent') {
    lendingPresets.style.display = 'flex';
    borrowingPresets.style.display = 'none';
  } else {
    lendingPresets.style.display = 'none';
    borrowingPresets.style.display = 'flex';
  }
  var input = document.getElementById('loan-principal');
  if (input) input.value = '';
  updatePrincipalWords();
}

let _isSubmittingQuickLend = false;

function submitQuickLend(event) {
  if (event) event.preventDefault();
  if (_isSubmittingQuickLend) return;
  _isSubmittingQuickLend = true;

  loadState();

  const select = document.getElementById('quick-lend-borrower-select');
  const isNew = select.value === '__new__';
  let borrowerName = isNew
    ? document.getElementById('quick-lend-new-name').value.trim()
    : select.value;

  if (!borrowerName) {
    alert('Please select or enter a borrower name.');
    _isSubmittingQuickLend = false;
    return;
  }

  const principal = Number(document.getElementById('quick-lend-principal').value);
  const rate = Number(document.getElementById('quick-lend-rate').value);
  const startDate = document.getElementById('quick-lend-start-date').value;
  const phone = document.getElementById('quick-lend-phone').value.trim();

  if (!principal || principal <= 0) {
    alert('Please enter a valid amount.');
    _isSubmittingQuickLend = false;
    return;
  }

  if (!isNew) {
    // EXISTING BORROWER — add to their most recent active loan
    const existingLoan = state.lent
      .filter(l => l.borrowerName === borrowerName && l.status === 'active')
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];

    if (existingLoan) {
      const idx = state.lent.findIndex(l => l.id === existingLoan.id);
      state.lent[idx] = {
        ...existingLoan,
        principal: Number(existingLoan.principal) + principal,
        phone: phone || existingLoan.phone
      };
      
      // LOG THE TOP-UP IN HISTORY
      const payId = 'inc_' + Math.random().toString(36).substr(2, 9);
      state.interestPayments.push({
        id: payId,
        loanId: existingLoan.id,
        type: 'received',
        category: 'increase',
        amount: principal,
        date: startDate || new Date().toISOString().split('T')[0],
        note: 'Lend More (Top-up)'
      });

      saveState();
      closeModal('modal-quick-lend');
      renderDashboard();
      setTimeout(function() {
        switchTab('dashboard');
        if (currentReminderFilter === 'interest') currentReminderFilter = 'all';
        toggleReminderFilter('interest');
        var card = document.getElementById('card-interest');
        if (card) card.classList.add('highlight-card');
        setTimeout(function() {
          var newCard = document.querySelector('[data-loan-id="' + existingLoan.id + '"]');
          if (newCard) newCard.classList.add('new-entry-highlight');
        }, 100);
      }, 150);
      _isSubmittingQuickLend = false;
      alert(`✓ Added ${formatCurrency(principal)} to ${borrowerName}'s existing loan.\nNew principal: ${formatCurrency(Number(existingLoan.principal) + principal)}`);
      return;
    }
    // No active loan found for this borrower — fall through and create new
  }

  // NEW BORROWER (or existing with no active loan) — create fresh entry
  const newId = 'l' + Math.random().toString(36).substr(2, 9);
  const newLoan = {
    id: newId,
    borrowerName,
    phone,
    principal,
    interestRate: rate,
    startDate,
    dueDate: null,
    status: 'active',
    notes: 'Quick Lent'
  };

  state.lent.push(newLoan);
  
  // LOG INITIAL ISSUANCE
  state.interestPayments.push({
    id: 'iss_' + newId,
    loanId: newId,
    type: 'received',
    category: 'interest',
    amount: principal,
    date: startDate,
    note: 'Principal Disbursed (Quick Lent)'
  });

  saveState();
  closeModal('modal-quick-lend');
  renderDashboard();
  setTimeout(function() {
    switchTab('dashboard');
    if (currentReminderFilter === 'interest') currentReminderFilter = 'all';
    toggleReminderFilter('interest');
    var card = document.getElementById('card-interest');
    if (card) card.classList.add('highlight-card');
    setTimeout(function() {
      var newCard = document.querySelector('[data-loan-id="' + newId + '"]');
      if (newCard) newCard.classList.add('new-entry-highlight');
    }, 100);
  }, 150);
  _isSubmittingQuickLend = false;
  alert(`✓ Successfully lent ${formatCurrency(principal)} to ${borrowerName}!`);
}

function getContactActionsHTML(phoneStr) {
  if (!phoneStr) return '';
  const digitsOnly = phoneStr.replace(/\D/g, '');
  const cleanPhone = phoneStr.replace(/[^\d+]/g, '');
  
  if (!digitsOnly || digitsOnly.length < 5) {
    return `<span>${phoneStr}</span>`;
  }
  
  const waUrl = `https://wa.me/${digitsOnly}`;
  
  return `
    <span class="contact-actions-wrapper">
      <span>${phoneStr}</span>
      <a href="tel:${cleanPhone}" class="contact-action-btn call-btn" title="Call">
        <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      </a>
      <a href="${waUrl}" target="_blank" class="contact-action-btn wa-btn" title="WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.73.44 3.42 1.28 4.92l-1.36 4.96c-.1.35.2.68.55.58l4.96-1.36c1.5.84 3.19 1.28 4.92 1.28 5.52 0 10-4.48 10-10C22.004 6.48 17.52 2 12.004 2zm5.79 13.91c-.24.67-1.22 1.24-1.78 1.3-1.63.16-3.71-.62-5.74-2.65-2.03-2.03-2.81-4.11-2.65-5.74.06-.56.63-1.54 1.3-1.78.36-.13.72-.11.89.24.22.46.77 1.88.84 2.03.07.15.03.34-.08.48l-.51.62c-.14.17-.18.4-.07.59.39.69.97 1.37 1.63 2.03.66.66 1.34 1.24 2.03 1.63.19.11.42.07.59-.07l.62-.51c.14-.11.33-.15.48-.08.15.07 1.57.62 2.03.84.35.17.37.53.24.89z"/></svg>
      </a>
    </span>
  `;
}

function getNextRenewal(startDateStr, overrideDateStr) {
  if (!startDateStr) return null;
  const dateStr = overrideDateStr || startDateStr;
  const parts = dateStr.split('-');
  const start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const now = new Date();
  now.setHours(0,0,0,0);
  
  let renewal = new Date(start);
  while (renewal <= now) {
    renewal.setMonth(renewal.getMonth() + 11);
  }
  
  const diffTime = renewal.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    date: renewal,
    daysLeft: diffDays,
    dateStr: renewal.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
}

function quickMarkRentalPaid(rentalId, amount, monthYear) {
  loadState();
  const rental = state.rentals.find(r => r.id === rentalId);
  if (!rental) return;
  
  const today = new Date().toISOString().split('T')[0];
  const paymentId = 'rp' + Math.random().toString(36).substr(2, 9);
  
  state.rentPayments.push({
    id: paymentId,
    rentalId,
    amount: Number(amount),
    monthYear,
    datePaid: today,
    note: 'Marked Paid from Reminders'
  });
  
  saveState();
  renderDashboard();
  renderRentals();
  alert(`✓ Rent of ${formatCurrency(amount)} marked as paid for ${rental.tenantName}!`);
}

function quickMarkInterestPaid(loanId, type, amount, monthStr) {
  loadState();
  const loan = state[type === 'received' ? 'lent' : 'borrowed'].find(l => l.id === loanId);
  if (!loan) return;
  
  const today = new Date();
  const selectedYearMonthStr = monthStr;
  const isCurrentMonth = today.toISOString().slice(0, 7) === selectedYearMonthStr;
  
  let paymentDate = today.toISOString().split('T')[0];
  if (!isCurrentMonth) {
    const [y, m] = selectedYearMonthStr.split('-').map(Number);
    paymentDate = `${selectedYearMonthStr}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
  }

  const paymentId = 'p' + Math.random().toString(36).substr(2, 9);
  
  state.interestPayments.push({
    id: paymentId,
    loanId,
    type,
    category: 'interest',
    amount: Number(amount),
    date: paymentDate,
    note: `Recorded from Reminders (${monthStr.toUpperCase()})`
  });
  
  saveState();
  refreshActiveTab();
  alert(`✓ Interest of ${formatCurrency(amount)} recorded as ${type === 'received' ? 'collected' : 'paid'} for ${type === 'received' ? loan.borrowerName : loan.financierName}!`);
}

window.quickMarkInterestPaid = quickMarkInterestPaid;

function quickReceiveInterest(loanId, direction) {
  loadState();
  var list = direction === 'lent' ? state.lent : state.borrowed;
  var loan = list.find(function(l) { return l.id === loanId; });
  if (!loan) return;

  var outstandingPrincipal = getOutstandingPrincipal(loan.id, loan.principal);
  if (outstandingPrincipal <= 0) return;

  var monthlyYield = outstandingPrincipal * (Number(loan.interestRate) / 100);
  var payments = state.interestPayments.filter(function(p) { return p.loanId === loanId && p.category === 'interest'; });
  var currentMonthPayments = payments.filter(function(p) { return p.date && p.date.startsWith(selectedMonthStr); });
  var currentMonthSum = currentMonthPayments.reduce(function(sum, p) { return sum + Number(p.amount); }, 0);
  var isPaidThisMonth = monthlyYield > 0 && currentMonthSum >= (monthlyYield - 0.01);

  var isAdvance = false;
  if (isPaidThisMonth) {
    if (!confirm('This month interest already collected.\nDo you wish to receive advance interest?')) return;
    isAdvance = true;
  }

  var today = new Date();
  var isCurrentMonth = today.toISOString().slice(0, 7) === selectedMonthStr;
  var paymentDate = today.toISOString().split('T')[0];
  if (!isCurrentMonth) {
    var parts = selectedMonthStr.split('-').map(Number);
    paymentDate = selectedMonthStr + '-' + String(new Date(parts[0], parts[1], 0).getDate()).padStart(2, '0');
  }

  var amount = monthlyYield;
  var advanceTag = isAdvance ? ' [Advance]' : '';
  state.interestPayments.push({
    id: 'p' + Math.random().toString(36).substr(2, 9),
    loanId: loanId,
    type: direction === 'lent' ? 'received' : 'paid',
    category: 'interest',
    amount: Number(amount),
    date: paymentDate,
    note: 'Received from Quick Collect (' + selectedMonthStr.toUpperCase() + ')' + advanceTag
  });
  saveState();
  refreshActiveTab();
  renderDashboard();
}
window.quickReceiveInterest = quickReceiveInterest;

function quickLoanPayment(loanId, direction) {
  loadState();
  var input = document.getElementById('quick-pay-' + loanId);
  if (!input) return;
  var amount = Number(input.value);
  if (!amount || amount <= 0) { alert('Enter an amount'); return; }
  input.value = '';
  var loan = state[direction === 'lent' ? 'lent' : 'borrowed'].find(function(l) { return l.id === loanId; });
  if (!loan) return;
  var outstanding = getOutstandingPrincipal(loan.id, loan.principal);
  if (outstanding <= 0) { alert('Loan is already settled.'); return; }
  var monthlyYield = outstanding * (Number(loan.interestRate) / 100);
  var payms = state.interestPayments.filter(function(p) { return p.loanId === loanId && p.category === 'interest'; });
  var monthPayms = payms.filter(function(p) { return p.date && p.date.startsWith(selectedMonthStr); });
  var sumPayms = monthPayms.reduce(function(s, p) { return s + Number(p.amount); }, 0);
  var totalIfPaid = sumPayms + amount;
  var isAdvance = monthlyYield > 0 && totalIfPaid > (monthlyYield + 0.01);
  if (isAdvance && !confirm('₹' + amount + ' exceeds the remaining interest of ₹' + (monthlyYield - sumPayms).toFixed(0) + '. Record excess as advance?')) return;
  var today = new Date().toISOString().split('T')[0];
  state.interestPayments.push({
    id: 'p' + Math.random().toString(36).substr(2, 9),
    loanId: loanId,
    type: direction === 'lent' ? 'received' : 'paid',
    category: 'interest',
    amount: Number(amount),
    date: today,
    note: (isAdvance ? '[Advance] ' : '') + 'Quick Pay'
  });
  saveState();
  refreshActiveTab();
  renderDashboard();
}
window.quickLoanPayment = quickLoanPayment;

function el(id) {
  return document.getElementById(id);
}

function navigateAndHighlightCard(tabId, itemId) {
  _expandedCards.add(itemId);
  if (tabId === 'rental') {
    switchTab('dashboard');
    currentReminderFilter = 'rent';
    renderDashboard();
  } else if (tabId === 'interest') {
    switchTab('dashboard');
    currentReminderFilter = 'interest';
    renderDashboard();
  } else {
    switchTab(tabId);
  }
  
  setTimeout(() => {
    const card = document.querySelector(`[data-id="${itemId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('card-highlight-active');
      setTimeout(() => {
        card.classList.remove('card-highlight-active');
      }, 2000);
    }
  }, 300);
}

function handleRentalFileSelect(input, targetHiddenId, statusSpanId) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById(targetHiddenId).value = e.target.result;
    const status = document.getElementById(statusSpanId);
    if (status) status.style.display = 'inline';
  };
  reader.readAsDataURL(file);
}

function viewDocumentImage(rentalId, type) {
  loadState();
  const rental = state.rentals.find(r => r.id === rentalId);
  if (!rental) return;
  
  const base64 = type === 'aadhaar' ? rental.aadhaarImg : rental.agreementImg;
  if (!base64) {
    alert('No document uploaded yet.');
    return;
  }
  
  const title = type === 'aadhaar' ? `${rental.tenantName} - Aadhaar Card` : `${rental.propertyName} - Rent Agreement`;
  document.getElementById('image-viewer-title').textContent = title;
  
  const imgNode = document.getElementById('image-viewer-img');
  imgNode.src = base64;
  
  const dlLink = document.getElementById('image-viewer-download');
  dlLink.href = base64;
  dlLink.download = type === 'aadhaar' ? `aadhaar_${rental.tenantName.replace(/\s+/g, '_')}.jpg` : `agreement_${rental.propertyName.replace(/\s+/g, '_')}.jpg`;
  
  openModal('modal-image-viewer');
}

function renewRentalAgreement(rentalId) {
  if (!confirm('Renew rent agreement for next 11 months?')) return;
  loadState();
  const rental = state.rentals.find(r => r.id === rentalId);
  if (!rental) return;
  const currentRenewal = getNextRenewal(rental.startDate, rental.nextRenewalDate);
  if (currentRenewal) {
    const nextDate = new Date(currentRenewal.date);
    nextDate.setMonth(nextDate.getMonth() + 11);
    rental.nextRenewalDate = nextDate.toISOString().split('T')[0];
    rental.lastRenewed = new Date().toISOString().split('T')[0];
    saveState();
  }
  setTimeout(function() { openTenantDetails(rentalId); }, 100);
}

// Export modals to global scope for inline onclicks
// Lend More: Opens Quick Lend modal pre-filled with the borrower's name
function lendMore(loanId) {
  loadState();
  let loan = state.lent.find(l => l.id === loanId);
  if (loan) {
    openQuickLend();
    setTimeout(() => {
      const select = document.getElementById('quick-lend-borrower-select');
      if (select) {
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].value === loan.borrowerName) {
            select.value = loan.borrowerName;
            break;
          }
        }
        toggleQuickLendNewName();
      }
    }, 100);
    return;
  }

  loan = state.borrowed.find(l => l.id === loanId);
  if (!loan) return;

  closeModal('modal-group-details');
  var outstanding = getOutstandingPrincipal(loan.id, loan.principal);
  document.getElementById('add-principal-loan-id').value = loan.id;
  document.getElementById('add-principal-direction').value = 'borrowed';
  document.getElementById('add-principal-title').textContent = 'Borrow More from ' + loan.financierName;
  document.getElementById('add-principal-party-name').textContent = loan.financierName;
  document.getElementById('add-principal-party-phone').textContent = loan.phone ? '📞 ' + loan.phone : '';
  document.getElementById('add-principal-current-amount').textContent = 'Rs. ' + Number(outstanding).toLocaleString('en-IN');
  document.getElementById('add-principal-amount').value = outstanding;
  openModal('modal-add-principal');
}

window.closeModal = closeModal;
window.openModal = openModal;
window.openQuickCollect = openQuickCollect;
window.submitQuickCollect = submitQuickCollect;
window.openQuickLend = openQuickLend;
window.toggleQuickLendNewName = toggleQuickLendNewName;
window.setQuickLendPrincipal = setQuickLendPrincipal;
window.setPrincipalPreset = setPrincipalPreset;
window.setPaymentAmountPreset = setPaymentAmountPreset;
window.updatePrincipalPresets = updatePrincipalPresets;
window.submitQuickLend = submitQuickLend;
window.getContactActionsHTML = getContactActionsHTML;

function setRentalPropertyPreset(val) {
  const propInput = document.getElementById('rental-property');
  if (propInput) {
    propInput.value = val;
    // Auto-focus to tenant name if property is selected
    const tenantInput = document.getElementById('rental-tenant');
    if (tenantInput) tenantInput.focus();
  }
}
window.setRentalPropertyPreset = setRentalPropertyPreset;
window.handleRentalFileSelect = handleRentalFileSelect;
window.viewDocumentImage = viewDocumentImage;
window.getNextRenewal = getNextRenewal;
window.lendMore = lendMore;
window.quickMarkRentalPaid = quickMarkRentalPaid;
window.navigateAndHighlightCard = navigateAndHighlightCard;
window.renewRentalAgreement = renewRentalAgreement;

window.populateReportingMonthSelect = function() {};
window.adjustSelectedMonth = function() {};
window.refreshActiveTab = refreshActiveTab;

function refreshActiveTab() {
  // Ensure header date is updated
  updateHeaderDateDisplay();

  const activeLink = document.querySelector('.nav-link.active, .mobile-nav-link.active');
  const activeTabId = activeLink ? activeLink.getAttribute('data-tab') : 'dashboard';
  
  if (activeTabId && activeTabId !== 'settings' && VIEWS[activeTabId]) {
    VIEWS[activeTabId].render();
  }
}

window.populateReportingMonthSelect = function() {};
window.adjustSelectedMonth = function() {};
window.refreshActiveTab = refreshActiveTab;
window.toggleMonthlyMode = toggleMonthlyMode;
window.toggleYearlyMode = toggleYearlyMode;
window.navigateMonth = navigateMonth;
window.navigateYear = navigateYear;
window.selectMonth = selectMonth;
window.selectYear = selectYear;

function setTheme(themeId) {
  document.documentElement.setAttribute('data-theme', themeId);
  
  if (state) {
    state.theme = themeId;
    saveState();
  }

  // Update button UI
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.style.borderColor = 'var(--border-color)';
    btn.style.boxShadow = 'none';
  });
  
  const activeBtn = document.getElementById(`theme-btn-${themeId}`);
  if (activeBtn) {
    activeBtn.style.borderColor = 'var(--color-accent)';
    activeBtn.style.boxShadow = '0 0 0 2px var(--color-accent)';
  }
  
  // Rerender charts with new theme colors if on dashboard
  if (currentTab === 'dashboard') {
    renderDashboard();
  }
}
window.setTheme = setTheme;

// 5. Navigation & Routing Handler
var _recordsFilter = null;

function applyRecordsFilter() {
  var types = ['bills', 'documents', 'policies', 'construction'];
  types.forEach(function(t) {
    var el = document.getElementById('section-' + t);
    if (el) {
      el.style.display = (_recordsFilter === null || _recordsFilter === t) ? '' : 'none';
    }
  });
  // Highlight the active file-type button (bills / documents / policies)
  ['bills', 'documents', 'policies'].forEach(function(t) {
    var btn = document.getElementById('btn-' + t);
    if (!btn) return;
    var isActive = _recordsFilter === t;
    var colorMap = {bills: 'var(--color-warning)', documents: 'var(--color-success)', policies: 'var(--color-purple)'};
    var color = colorMap[t] || 'var(--text-secondary)';
    btn.style.background = isActive ? color : 'var(--bg-card)';
    btn.style.color = isActive ? '#fff' : color;
  });
}

function renderRecords() {
  _recordsFilter = 'construction';
  renderConstruction();
  if (typeof renderFiles === 'function') renderFiles();
}

const VIEWS = {
  dashboard: { title: 'Status', subtitle: 'Your aggregated financial overview at a glance.', render: renderDashboard },
  records: { title: 'Records', subtitle: 'Bills, documents, construction, and settings.', render: renderRecords }
};

function selectRecordsTab(event, tab, projectName) {
  if (typeof event === 'string' || event == null) {
    projectName = tab;
    tab = event;
    event = null;
  }
  if (!tab) return;
  if (tab === 'construction') {
    if (projectName) {
      window._selectedConstProject = projectName;
    }
    _recordsFilter = 'construction';
    renderConstruction();
    setTimeout(function() {
      var el = document.getElementById('section-construction');
      if (el) el.scrollIntoView({behavior:'smooth',block:'start'});
    }, 100);
  } else {
    _recordsFilter = tab;
    renderFiles();
    var sectionId = tab === 'bills' ? 'section-bills' : tab === 'documents' ? 'section-documents' : tab === 'policies' ? 'section-policies' : null;
    if (sectionId) {
      setTimeout(function() {
        var el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({behavior:'smooth',block:'start'});
      }, 100);
    }
  }
}
window.selectRecordsTab = selectRecordsTab;
window.selectRecordsTab = selectRecordsTab;

let currentTab = 'dashboard';

function switchTab(tabId) {
  currentTab = tabId;
  window.scrollTo(0, 0);
  // Update Navigation Active States
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    if (link.getAttribute('data-tab') === tabId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Switch Tab View Content visibility
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  const viewContent = document.getElementById(`view-${tabId}`);
  if (viewContent) {
    viewContent.classList.add('active');
  }

  // Show/hide inline calendar based on tab
  var inlineCal = document.getElementById('inline-calendar');
  if (inlineCal) {
    inlineCal.style.display = tabId === 'dashboard' ? 'block' : 'none';
  }

  // Toggle header elements per tab
  var headerActions = document.querySelector('.header-actions');
  var dateBadge = document.getElementById('current-date-badge');
  if (headerActions) {
    if (tabId === 'records') {
      headerActions.style.display = '';
      document.getElementById('dashboard-search').style.display = 'none';
      document.getElementById('records-search-header').style.display = '';
      if (dateBadge) dateBadge.style.display = 'flex';
    } else if (tabId === 'settings') {
      headerActions.style.display = 'none';
      if (dateBadge) dateBadge.style.display = 'none';
    } else {
      headerActions.style.display = '';
      document.getElementById('dashboard-search').style.display = '';
      document.getElementById('records-search-header').style.display = 'none';
      if (dateBadge) dateBadge.style.display = 'flex';
    }
  }

  // Update Header text
  const subtitleNode = document.getElementById('current-view-subtitle');
  if (VIEWS[tabId]) {
    if (subtitleNode) {
      subtitleNode.textContent = VIEWS[tabId].subtitle;
    }
    updateHeaderDateDisplay();
    VIEWS[tabId].render();
  }
}
window.switchTab = switchTab;

// Init Tabs click listeners
function initNavigation() {
  document.querySelectorAll('[data-tab]').forEach(el => {
    el.addEventListener('click', (e) => {
      const tabId = el.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Display Date in Header
  updateHeaderDateDisplay();
}

// 6. INTEREST TAB LOGIC (combined lending + borrowing)
function renderInterest() {
  renderLending();
  renderBorrowing();
}

// 7. DASHBOARD TAB LOGIC
function renderDashboard() {
  updateCardHighlights();

  // A. Determine reporting date boundaries
  const today = new Date();
  const isCurrentMonthSelected = today.toISOString().slice(0, 7) === selectedMonthStr;
  
  let reportingToday = today;
  const [selYear, selMonth] = selectedMonthStr.split('-').map(Number);
  const endDateOfSelectedMonth = `${selectedMonthStr}-${String(new Date(selYear, selMonth, 0).getDate()).padStart(2, '0')}`;
  
  if (!isCurrentMonthSelected) {
    reportingToday = new Date(selYear, selMonth - 1, new Date(selYear, selMonth, 0).getDate()); // last day of selected month
    reportingToday.setHours(23, 59, 59, 999);
  }

  // Determine if we're in day mode, monthly mode, or yearly mode
  const isDayMode = viewMode === 'day';
  const isYearMode = viewMode === 'year';
  const selectedYear = selectedDateStr.slice(0, 4);

  // B. Calculate active lending principal outstanding at the end of the selected month
  const activeLendingLoans = state.lent.filter(l => l.startDate <= endDateOfSelectedMonth);
  const activeLent = activeLendingLoans.reduce((sum, l) => sum + getOutstandingPrincipalAtMonth(l.id, l.principal, selectedMonthStr), 0);

  // C. Calculate active borrowing principal outstanding at the end of the selected month
  const activeBorrowingLoans = state.borrowed.filter(b => b.startDate <= endDateOfSelectedMonth);
  const activeBorrowed = activeBorrowingLoans.reduce((sum, b) => sum + getOutstandingPrincipalAtMonth(b.id, b.principal, selectedMonthStr), 0);

  // D. Calculate monthly rent income from active leases during that month
  const monthlyRent = state.rentals
    .filter(r => r.startDate <= endDateOfSelectedMonth && r.status === 'active')
    .reduce((sum, r) => sum + Number(r.monthlyRent), 0);

  // E. Calculate actual rent collected in the selected period
  let totalRentCollected;
  if (isDayMode) {
    totalRentCollected = state.rentPayments
      .filter(p => p.datePaid === selectedDateStr)
      .reduce((sum, p) => sum + Number(p.amount), 0);
  } else if (isYearMode) {
    totalRentCollected = state.rentPayments
      .filter(p => p.monthYear && p.monthYear.startsWith(selectedYear))
      .reduce((sum, p) => sum + Number(p.amount), 0);
  } else {
    totalRentCollected = state.rentPayments
      .filter(p => p.monthYear === selectedMonthStr)
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }

  // F. Calculate interest received in the selected period
  let totalInterestReceived;
  if (isDayMode) {
    totalInterestReceived = state.interestPayments
      .filter(p => p.type === 'received' && p.category === 'interest' && p.date === selectedDateStr)
      .reduce((sum, p) => sum + Number(p.amount), 0);
  } else if (isYearMode) {
    totalInterestReceived = state.interestPayments
      .filter(p => p.type === 'received' && p.category === 'interest' && p.date && p.date.startsWith(selectedYear))
      .reduce((sum, p) => sum + Number(p.amount), 0);
  } else {
    totalInterestReceived = state.interestPayments
      .filter(p => p.type === 'received' && p.category === 'interest' && p.date.startsWith(selectedMonthStr))
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }

  // G. Calculate interest paid in the selected period
  let totalInterestPaid;
  if (isDayMode) {
    totalInterestPaid = state.interestPayments
      .filter(p => p.type === 'paid' && p.category === 'interest' && p.date === selectedDateStr)
      .reduce((sum, p) => sum + Number(p.amount), 0);
  } else if (isYearMode) {
    totalInterestPaid = state.interestPayments
      .filter(p => p.type === 'paid' && p.category === 'interest' && p.date && p.date.startsWith(selectedYear))
      .reduce((sum, p) => sum + Number(p.amount), 0);
  } else {
    totalInterestPaid = state.interestPayments
      .filter(p => p.type === 'paid' && p.category === 'interest' && p.date.startsWith(selectedMonthStr))
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }

  // H. Calculate expenses in the selected period
  const selectedDayExpenses = state.expenses
    .filter(p => p.date === selectedDateStr)
    .reduce((sum, exp) => sum + Number(exp.amount), 0);
    
  const selD = new Date(selectedDateStr);
  const selDay = selD.getDay();
  const diff = selD.getDate() - selDay + (selDay === 0 ? -6 : 1);
  const weekStart = new Date(selD);
  weekStart.setDate(diff);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const pad = n => String(n).padStart(2, '0');
  const weekStartStr = `${weekStart.getFullYear()}-${pad(weekStart.getMonth()+1)}-${pad(weekStart.getDate())}`;
  const weekEndStr = `${weekEnd.getFullYear()}-${pad(weekEnd.getMonth()+1)}-${pad(weekEnd.getDate())}`;

  const selectedWeekExpenses = state.expenses
    .filter(p => p.date >= weekStartStr && p.date <= weekEndStr)
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

  const selectedMonthExpenses = state.expenses
    .filter(p => p.date.startsWith(selectedMonthStr))
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

  // I. Calculate Balance To Receive
  const expectedInterestReceived = activeLendingLoans.reduce((sum, loan) => {
    const outstanding = getOutstandingPrincipalAtMonth(loan.id, loan.principal, selectedMonthStr);
    if (outstanding > 0) {
      return sum + (outstanding * (Number(loan.interestRate) / 100));
    }
    return sum;
  }, 0);

  const totalPendingRent = Math.max(0, monthlyRent - totalRentCollected);
  const totalPendingInterest = Math.max(0, expectedInterestReceived - totalInterestReceived);
  const netBalance = totalPendingRent + totalPendingInterest;

  // Update Summary DOM elements
  document.getElementById('dash-total-lent').textContent = formatCurrency(activeLent);
  document.getElementById('dash-total-borrowed').textContent = formatCurrency(activeBorrowed);
  
  const netNode = document.getElementById('dash-net-balance');
  netNode.textContent = formatCurrency(netBalance);
  if (netBalance >= 0) {
    netNode.style.color = 'var(--color-success)';
  } else {
    netNode.style.color = 'var(--color-danger)';
  }
  
  const netCollectedNode = document.getElementById('dash-net-collected');
  if (netCollectedNode) {
    const totalCollected = totalRentCollected + totalInterestReceived;
    netCollectedNode.innerHTML = `Total Collected: <span style="color: var(--color-warning); font-weight: 800;">${formatCurrency(totalCollected)}</span>`;
  }
  
  const netIncomeNode = document.getElementById('dash-net-income');
  if (netIncomeNode) {
    const totalIncome = monthlyRent + expectedInterestReceived;
    netIncomeNode.innerHTML = `Total Monthly Income: <span style="color: var(--text-primary); font-weight: 800;">${formatCurrency(totalIncome)}</span>`;
  }
  
  // Dynamic header for the Rental Income card
  const rentLabelNode = document.querySelector('[data-tab="rental"] .summary-card-header span');
  if (rentLabelNode) {
    rentLabelNode.textContent = isDayMode ? 'Rent Collected (Day)' : isYearMode ? 'Rent Collected (Year)' : 'Rental Income (Collected)';
  }
  const rentPending = Math.max(0, monthlyRent - totalRentCollected);
  document.getElementById('dash-monthly-rent').textContent = formatCurrency(rentPending);
  
  const rentalBalanceNode = document.getElementById('dash-rental-balance');
  if (rentalBalanceNode) {
    if (isDayMode || isYearMode) {
      rentalBalanceNode.innerHTML = `<div style="color: var(--text-primary);">Collected: <span style="color: var(--color-warning); font-weight: 800; margin-left: 2px;">${formatCurrency(totalRentCollected)}</span></div><div style="color: var(--text-primary); font-weight: 600; margin-top: 2px;">${isYearMode ? '(Year view)' : '(Day view)'}</div>`;
    } else {
      rentalBalanceNode.innerHTML = `<div style="color: var(--text-primary);">Collected: <span style="color: var(--color-warning); font-weight: 800; margin-left: 2px;">${formatCurrency(totalRentCollected)}</span></div><div style="color: var(--text-primary); margin-top: 2px;">Monthly Total: <span style="color: var(--text-primary); font-weight: 800; margin-left: 2px;">${formatCurrency(monthlyRent)}</span></div>`;
    }
  }
  
  const expensesNode = document.getElementById('dash-total-expenses');
  if (expensesNode) {
    expensesNode.textContent = formatCurrency(selectedDayExpenses);
  }
  
  const weeklyExpensesNode = document.getElementById('dash-weekly-expenses');
  if (weeklyExpensesNode) {
    weeklyExpensesNode.innerHTML = `This Week: <span style="color: var(--color-danger); font-weight: 800;">${formatCurrency(selectedWeekExpenses)}</span>`;
  }
  
  const monthlyExpensesNode = document.getElementById('dash-monthly-expenses');
  if (monthlyExpensesNode) {
    monthlyExpensesNode.innerHTML = `This Month: <span style="color: var(--color-danger); font-weight: 800;">${formatCurrency(selectedMonthExpenses)}</span>`;
  }
  
  // Individual expense items in Today's Expenses card
  const expenseCardDetails = document.getElementById('expense-card-details');
  if (expenseCardDetails) {
    if (state.showExpenseDetails !== false) {
      const todayExps = state.expenses.filter(function(e) { return e.date === selectedDateStr; }).slice(0, 5);
      if (todayExps.length > 0) {
        var expHtml = '';
        todayExps.forEach(function(exp) {
          var leftText = exp.note || exp.category;
          if (exp.category === 'construction') {
            leftText = 'Construction - ' + (exp.laborType || 'General') + ' - ' + (exp.project || '');
          }
          expHtml += '<div style="display: flex; align-items: center; padding: 0.2rem 0.4rem; background: var(--input-bg); border-radius: 4px; font-size: 0.7rem;">' +
            '<span style="flex: 1; font-weight: 600; color: var(--text-primary);">' + leftText + '</span>' +
            (exp.paymentMethod ? '<span style="flex: 1; text-align: center; font-size:0.65rem; color:var(--text-secondary); font-weight:600;">' + (exp.paymentMethod === 'upi' ? 'UPI' : 'Cash') + '</span>' : '<span style="flex: 1;"></span>') +
            '<span style="flex: 1; text-align: right; font-weight: 700; color: var(--color-danger);">' + formatCurrency(exp.amount) + '</span>' +
          '</div>';
        });
        expenseCardDetails.innerHTML = expHtml;
        expenseCardDetails.style.display = 'flex';
      } else {
        expenseCardDetails.style.display = 'none';
      }
    } else {
      expenseCardDetails.style.display = 'none';
    }
    
    // Active construction projects (always shown)
    var constProjectsDiv = document.getElementById('dash-construction-projects');
    if (!constProjectsDiv) {
      constProjectsDiv = document.createElement('div');
      constProjectsDiv.id = 'dash-construction-projects';
      constProjectsDiv.style.marginTop = '0.5rem';
      expenseCardDetails.parentNode.insertBefore(constProjectsDiv, expenseCardDetails.nextSibling);
    }
    var constExps = state.expenses.filter(function(e) { return e && e.category === 'construction'; });
    var projectTotals = {};
    constExps.forEach(function(e) {
      if (e.project) {
        projectTotals[e.project] = (projectTotals[e.project] || 0) + Number(e.amount);
      }
    });
    var activeProjects = Object.keys(projectTotals).filter(function(p) { return p; });
    if (activeProjects.length > 0) {
      var projHtml = '<div style="padding: 0.3rem 0.4rem; background: rgba(var(--color-accent-rgb), 0.08); border-radius: 4px; border-left: 3px solid var(--color-accent);">';
      projHtml += '<div style="font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); margin-bottom: 0.2rem;">Ongoing Projects</div>';
      activeProjects.forEach(function(p) {
        var total = projectTotals[p];
        projHtml += '<div style="cursor: pointer; font-size: 0.78rem; font-weight: 600; color: var(--color-accent); padding: 0.15rem 0; display: flex; justify-content: space-between; align-items: center;" onclick="event.stopPropagation(); switchTab(\'records\'); setTimeout(function(){ selectRecordsTab(\'construction\', \'' + p.replace(/'/g, "\\'") + '\'); }, 100);"><span>🏗 ' + p + '</span><span style="color: var(--color-danger); font-weight: 700;">' + formatCurrency(total) + '</span></div>';
      });
      projHtml += '</div>';
      constProjectsDiv.innerHTML = projHtml;
      constProjectsDiv.style.display = 'block';
    } else {
      constProjectsDiv.style.display = 'none';
    }
  }
  document.getElementById('dash-interest-received').textContent = formatCurrency(totalInterestReceived);
  document.getElementById('dash-interest-paid').textContent = formatCurrency(totalInterestPaid);

  // expectedInterestReceived is calculated above

  const interestPending = Math.max(0, expectedInterestReceived - totalInterestReceived);
  const totalInterestReceivedNode = document.getElementById('dash-total-interest-received');
  if (totalInterestReceivedNode) {
    totalInterestReceivedNode.textContent = formatCurrency(interestPending);
  }

  const interestReceivedBalanceNode = document.getElementById('dash-interest-received-balance');
  if (interestReceivedBalanceNode) {
    if (isDayMode || isYearMode) {
      interestReceivedBalanceNode.innerHTML = `<div style="color: var(--text-primary);">Collected: <span style="color: var(--color-warning); font-weight: 800; margin-left: 2px;">${formatCurrency(totalInterestReceived)}</span></div><div style="color: var(--text-primary); font-weight: 600; margin-top: 2px;">${isYearMode ? '(Year view)' : '(Day view)'}</div>`;
    } else {
      interestReceivedBalanceNode.innerHTML = `<div style="color: var(--text-primary);">Collected: <span style="color: var(--color-warning); font-weight: 800; margin-left: 2px;">${formatCurrency(totalInterestReceived)}</span></div><div style="color: var(--text-primary); margin-top: 2px;">Monthly Total: <span style="color: var(--text-primary); font-weight: 800; margin-left: 2px;">${formatCurrency(expectedInterestReceived)}</span></div>`;
    }
  }

  // Clear existing pending names lists
  ['card-rent', 'card-interest', 'card-reports'].forEach(id => {
    const card = document.getElementById(id);
    if(card) {
      const oldList = card.querySelector('.pending-names-list');
      if(oldList) oldList.remove();
      card.classList.remove('has-pending-names');
    }
  });

  // Inject Pending Names if enabled
  if (state.showPendingNames !== false && !isDayMode && !isYearMode) {
      var pTenants = [];
      state.rentals.forEach(function(r) {
        if (r.startDate <= endDateOfSelectedMonth && r.status === 'active') {
          var pPaid = state.rentPayments.filter(function(p) { return p.rentalId === r.id && p.monthYear === selectedMonthStr; }).reduce(function(sum, p) { return sum + Number(p.amount); }, 0);
          var pOwe = Number(r.monthlyRent) - pPaid;
          if (pOwe > 0) {
            var renewData = getNextRenewal(r.startDate);
            pTenants.push({name: r.tenantName, owe: pOwe, renewalDue: renewData && renewData.daysLeft <= 7});
          }
        }
      });
      if (pTenants.length > 0) {
        var pendingTenantsHTML = '<div class="pending-names-list">';
        pTenants.forEach(function(t) {
          var nameColor = t.renewalDue ? 'var(--color-danger)' : 'var(--text-primary)';
          pendingTenantsHTML += '<div class="pending-name-item"><span style="color:' + nameColor + ';font-weight:' + (t.renewalDue ? '800' : '600') + '">' + t.name + '</span> (' + formatCurrency(t.owe) + ')</div>';
        });
        pendingTenantsHTML += '</div>';
        document.getElementById('card-rent').insertAdjacentHTML('afterbegin', pendingTenantsHTML);
        document.getElementById('card-rent').classList.add('has-pending-names');
      }

    const pBorrowers = [];
    activeLendingLoans.forEach(l => {
      const outstanding = getOutstandingPrincipalAtMonth(l.id, l.principal, selectedMonthStr);
      if (outstanding > 0) {
        const expected = outstanding * (Number(l.interestRate) / 100);
        const pPaid = state.interestPayments.filter(p => p.type === 'received' && p.category !== 'issuance' && p.loanId === l.id && p.date.startsWith(selectedMonthStr)).reduce((sum, p) => sum + Number(p.amount), 0);
        const pOwe = expected - pPaid;
        if (pOwe > 0) pBorrowers.push({name: l.borrowerName, owe: pOwe});
      }
    });

    if (pBorrowers.length > 0) {
      const pendingBorrowersHTML = '<div class="pending-names-list">' + activeLendingLoans.map(l => {
        const outstanding = getOutstandingPrincipalAtMonth(l.id, l.principal, selectedMonthStr);
        if (outstanding <= 0) return '';
        const expected = outstanding * (Number(l.interestRate) / 100);
        const pPaid = state.interestPayments.filter(p => p.type === 'received' && p.category !== 'issuance' && p.loanId === l.id && p.date.startsWith(selectedMonthStr)).reduce((sum, p) => sum + Number(p.amount), 0);
        const pOwe = expected - pPaid;
        if (pOwe <= 0) return '';
        return `<div class="pending-name-item"><span>${l.borrowerName}</span> (${formatCurrency(pOwe)})</div>`;
      }).filter(Boolean).join('') + '</div>';
      document.getElementById('card-interest').insertAdjacentHTML('afterbegin', pendingBorrowersHTML);
      document.getElementById('card-interest').classList.add('has-pending-names');
    }
    
    // Attach click-selection to all pending-name-items
    document.querySelectorAll('.pending-name-item').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.pending-name-item.selected').forEach(function(x) {
          if (x !== el) x.classList.remove('selected');
        });
        el.classList.toggle('selected');
        var card = el.closest('.summary-card');
        if (card && card.onclick) card.onclick.call(card, e);
      });
    });
    
    // Removed pending names from balance to receive card per user request
  }

  // Glance Widget
  renderGlanceWidget();

  // F. Recent Activity (rendered below via renderRecentActivity)
  
  const notifReminders = document.getElementById('notifications-reminders-view');
  const notifRent = document.getElementById('notifications-rent-view');
  const notifInterest = document.getElementById('notifications-interest-view');
  const notifExpenses = document.getElementById('notifications-expenses-view');
  const notifReports = document.getElementById('notifications-reports-view');
  const notifTitle = document.getElementById('notifications-title');
  const notifMainHeader = document.getElementById('notifications-main-header');
  const notifWrapper = document.getElementById('notifications-wrapper-card');

  if (notifReminders && notifRent && notifInterest && notifExpenses && notifReports) {
    if (currentReminderFilter === 'rent') {
      if (notifWrapper) notifWrapper.style.display = 'block';
      notifReminders.style.display = 'none';
      notifRent.style.display = 'block';
      notifInterest.style.display = 'none';
      notifExpenses.style.display = 'none';
      notifReports.style.display = 'none';
      if (notifMainHeader) notifMainHeader.style.display = 'none';
      renderRentals();
    } else if (currentReminderFilter === 'interest') {
      if (notifWrapper) notifWrapper.style.display = 'block';
      notifReminders.style.display = 'none';
      notifRent.style.display = 'none';
      notifInterest.style.display = 'block';
      notifExpenses.style.display = 'none';
      notifReports.style.display = 'none';
      if (notifMainHeader) notifMainHeader.style.display = 'none';
      renderInterest();
    } else if (currentReminderFilter === 'expenses') {
      if (notifWrapper) notifWrapper.style.display = 'block';
      notifReminders.style.display = 'none';
      notifRent.style.display = 'none';
      notifInterest.style.display = 'none';
      notifExpenses.style.display = 'block';
      notifReports.style.display = 'none';
      if (notifMainHeader) notifMainHeader.style.display = 'none';
      renderExpenses();
    } else if (currentReminderFilter === 'reports') {
      if (notifWrapper) notifWrapper.style.display = 'block';
      notifReminders.style.display = 'none';
      notifRent.style.display = 'none';
      notifInterest.style.display = 'none';
      notifExpenses.style.display = 'none';
      notifReports.style.display = 'block';
      if (notifMainHeader) notifMainHeader.style.display = 'none';
      renderReports();
    } else {
      if (notifWrapper) notifWrapper.style.display = 'block';
      notifReminders.style.display = 'block';
      notifRent.style.display = 'none';
      notifInterest.style.display = 'none';
      notifExpenses.style.display = 'none';
      notifReports.style.display = 'none';
      if (notifMainHeader) notifMainHeader.style.display = 'flex';
      if (notifTitle) notifTitle.textContent = 'Recent Activity';
      renderRecentActivity();
    }
  }
  
  if (currentReminderFilter === 'all') {
  const rentRemindersNode = document.getElementById('dashboard-rent-reminders');
  if (!rentRemindersNode) { /* reminders replaced by activity feed */ } else {
  const dashboardRemindersList = [];

  // 1. Rent payment reminders & Agreement renewals
  // Only rentals that started before or during the selected month
  const activeRentals = state.rentals.filter(r => r.startDate <= endDateOfSelectedMonth && r.status === 'active');

  activeRentals.forEach(rental => {
    // Rent payment reminder
    const isPaidThisMonth = state.rentPayments.some(
      rp => rp.rentalId === rental.id && rp.monthYear === selectedMonthStr
    );

    const year = reportingToday.getFullYear();
    const month = reportingToday.getMonth(); // 0-indexed
    const rentDueDay = Math.min(rental.rentDueDay, new Date(year, month + 1, 0).getDate());
    const dueDate = new Date(year, month, rentDueDay);
    
    dueDate.setHours(0,0,0,0);
    const todayCompare = new Date(reportingToday);
    todayCompare.setHours(0,0,0,0);
    
    const diffTime = dueDate.getTime() - todayCompare.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status = 'upcoming'; // 'paid', 'due-soon', 'overdue'
    
    if (isPaidThisMonth) {
      status = 'paid';
    } else if (diffDays < 0) {
      status = 'overdue';
    } else if (diffDays <= 7) {
      status = 'due-soon';
    }

    dashboardRemindersList.push({
      id: rental.id,
      partyName: rental.tenantName,
      propertyName: rental.propertyName,
      amount: rental.monthlyRent,
      type: 'rent-payment',
      status,
      diffDays,
      dueStr: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });

    // Agreement Renewal reminder
    const renewalInfo = getNextRenewal(rental.startDate);
    if (renewalInfo) {
      let renewalStatus = 'upcoming';
      if (renewalInfo.daysLeft <= 15) {
        renewalStatus = 'overdue';
      } else if (renewalInfo.daysLeft <= 45) {
        renewalStatus = 'due-soon';
      }
      
      dashboardRemindersList.push({
        id: rental.id,
        partyName: rental.tenantName,
        propertyName: rental.propertyName,
        amount: 0,
        type: 'agreement-renewal',
        status: renewalStatus,
        diffDays: renewalInfo.daysLeft,
        dueStr: renewalInfo.dateStr
      });
    }
  });

  // 2. Interest Collection Reminders (Lending Tracker)
  const activeLentListForReminders = state.lent.filter(l => l.startDate <= endDateOfSelectedMonth);
  activeLentListForReminders.forEach(loan => {
    const outstanding = getOutstandingPrincipalAtMonth(loan.id, loan.principal, selectedMonthStr);
    if (outstanding <= 0) return; // loan is paid off/settled in selected month

    const monthlyYield = outstanding * (Number(loan.interestRate) / 100);
    if (monthlyYield <= 0) return;

    // Check if interest for the selected month is fully received
    const loanPayments = state.interestPayments.filter(p => p.loanId === loan.id && p.type === 'received' && p.date.startsWith(selectedMonthStr));
    const interestReceived = loanPayments.filter(p => p.category === 'interest').reduce((sum, p) => sum + Number(p.amount), 0);
    const isPaid = interestReceived >= (monthlyYield - 0.01);

    // Compute due date based on startDate anniversary day
    var startMonth = loan.startDate.slice(0, 7);
    var isFirstMonth = startMonth === selectedMonthStr;
    const anniversaryDay = new Date(loan.startDate).getDate();
    const year = reportingToday.getFullYear();
    var month = reportingToday.getMonth();
    if (isFirstMonth) month += 1; // first interest due next month
    const lastDay = new Date(year, month + 1, 0).getDate();
    const dueDate = new Date(year, month, Math.min(anniversaryDay, lastDay));
    dueDate.setHours(0,0,0,0);

    const todayCompare = new Date(reportingToday);
    todayCompare.setHours(0,0,0,0);

    const diffTime = dueDate.getTime() - todayCompare.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status = 'upcoming';
    if (isPaid) {
      status = 'paid';
    } else if (diffDays < 0) {
      status = 'overdue';
    } else if (diffDays <= 7) {
      status = 'due-soon';
    }

    dashboardRemindersList.push({
      id: loan.id,
      partyName: loan.borrowerName,
      propertyName: `Interest Collection`,
      amount: monthlyYield,
      type: 'interest-collection',
      status,
      diffDays,
      dueStr: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
  });

  // 3. Interest Payment Reminders (Borrowing Tracker)
  const activeBorrowedListForReminders = state.borrowed.filter(b => b.startDate <= endDateOfSelectedMonth);
  activeBorrowedListForReminders.forEach(loan => {
    const outstanding = getOutstandingPrincipalAtMonth(loan.id, loan.principal, selectedMonthStr);
    if (outstanding <= 0) return; // loan is paid off/settled in selected month

    const monthlyCost = outstanding * (Number(loan.interestRate) / 100);
    if (monthlyCost <= 0) return;

    // Check if interest for the selected month is fully paid
    const loanPayments = state.interestPayments.filter(p => p.loanId === loan.id && p.type === 'paid' && p.date.startsWith(selectedMonthStr));
    const interestPaid = loanPayments.filter(p => p.category === 'interest').reduce((sum, p) => sum + Number(p.amount), 0);
    const isPaid = interestPaid >= (monthlyCost - 0.01);

    // Compute due date based on startDate anniversary day
    var startMonth = loan.startDate.slice(0, 7);
    var isFirstMonth = startMonth === selectedMonthStr;
    const anniversaryDay = new Date(loan.startDate).getDate();
    const year = reportingToday.getFullYear();
    var month = reportingToday.getMonth();
    if (isFirstMonth) month += 1; // first interest due next month
    const lastDay = new Date(year, month + 1, 0).getDate();
    const dueDate = new Date(year, month, Math.min(anniversaryDay, lastDay));
    dueDate.setHours(0,0,0,0);

    const todayCompare = new Date(reportingToday);
    todayCompare.setHours(0,0,0,0);

    const diffTime = dueDate.getTime() - todayCompare.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status = 'upcoming';
    if (isPaid) {
      status = 'paid';
    } else if (diffDays < 0) {
      status = 'overdue';
    } else if (diffDays <= 7) {
      status = 'due-soon';
    }

    dashboardRemindersList.push({
      id: loan.id,
      partyName: loan.financierName,
      propertyName: `Interest Payout`,
      amount: monthlyCost,
      type: 'interest-payment',
      status,
      diffDays,
      dueStr: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
  });

  // 4. Renewals Reminders
  const todayForRenewals = new Date();
  todayForRenewals.setHours(0, 0, 0, 0);
  
  state.renewals.forEach(renewal => {
    const dueDate = new Date(renewal.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - todayForRenewals.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let status = 'upcoming';
    if (diffDays < 0) {
      status = 'overdue';
    } else if (diffDays <= 30) {
      status = 'due-soon';
    }
    
    // Only show if due within 30 days or overdue
    if (diffDays <= 30) {
      dashboardRemindersList.push({
        id: renewal.id,
        partyName: renewal.title,
        propertyName: renewal.category,
        amount: renewal.amount,
        type: 'renewal',
        status,
        diffDays,
        dueStr: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        frequency: renewal.frequency,
        note: renewal.note
      });
    }
  });

  // Sort reminders: overdue first, then due soon, then upcoming, then paid
  const statusOrder = { overdue: 0, 'due-soon': 1, upcoming: 2, paid: 3 };
  dashboardRemindersList.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  // Update Quick Filter Buttons Visual States
  const btnRent = document.getElementById('btn-quick-rent');
  const btnInterest = document.getElementById('btn-quick-interest');
  const btnRenewals = document.getElementById('btn-quick-renewals');
  if (btnRent && btnInterest && btnRenewals) {
    if (currentReminderFilter === 'rent') {
      btnRent.style.opacity = '1';
      btnRent.style.boxShadow = '0 0 10px var(--color-primary)';
      btnInterest.style.opacity = '0.35';
      btnInterest.style.boxShadow = 'none';
      btnRenewals.style.opacity = '0.35';
      btnRenewals.style.boxShadow = 'none';
    } else if (currentReminderFilter === 'interest') {
      btnRent.style.opacity = '0.35';
      btnRent.style.boxShadow = 'none';
      btnInterest.style.opacity = '1';
      btnInterest.style.boxShadow = '0 0 10px var(--color-success)';
      btnRenewals.style.opacity = '0.35';
      btnRenewals.style.boxShadow = 'none';
    } else if (currentReminderFilter === 'renewals') {
      btnRent.style.opacity = '0.35';
      btnRent.style.boxShadow = 'none';
      btnInterest.style.opacity = '0.35';
      btnInterest.style.boxShadow = 'none';
      btnRenewals.style.opacity = '1';
      btnRenewals.style.boxShadow = '0 0 10px #f59e0b';
    } else {
      btnRent.style.opacity = '1';
      btnRent.style.boxShadow = '';
      btnInterest.style.opacity = '1';
      btnInterest.style.boxShadow = '';
      btnRenewals.style.opacity = '1';
      btnRenewals.style.boxShadow = '';
    }
  }

  // Filter reminders list
  let filteredReminders = dashboardRemindersList;
  if (currentReminderFilter === 'rent') {
    filteredReminders = dashboardRemindersList.filter(r => r.type === 'rent-payment' || r.type === 'agreement-renewal');
  } else if (currentReminderFilter === 'interest') {
    filteredReminders = dashboardRemindersList.filter(r => r.type === 'interest-collection' || r.type === 'interest-payment');
  } else if (currentReminderFilter === 'renewals') {
    filteredReminders = dashboardRemindersList.filter(r => r.type === 'renewal');
  } else if (currentReminderFilter === 'expenses') {
    filteredReminders = dashboardRemindersList.filter(r => r.type === 'expense');
  }

  if (filteredReminders.length === 0) {
    rentRemindersNode.innerHTML = `
      <div class="empty-state">
        <p>No active reminders for this period.</p>
      </div>
    `;
  } else {
    filteredReminders.forEach(item => {
      let badgeHTML = '';
      let itemClass = 'info';

      if (item.status === 'paid') {
        badgeHTML = `<span class="reminder-badge badge-success">Paid</span>`;
        itemClass = 'paid';
      } else if (item.status === 'overdue') {
        const daysOverdue = Math.abs(item.diffDays);
        let label;
        if (item.type === 'agreement-renewal') {
          label = `${daysOverdue} DAYS AGO`;
        } else if (item.type === 'renewal') {
          label = `Overdue: ${daysOverdue}d`;
        } else {
          label = `${daysOverdue}d Overdue`;
        }
        badgeHTML = `<span class="reminder-badge badge-danger">${label}</span>`;
        itemClass = 'overdue';
      } else if (item.status === 'due-soon') {
        let label;
        if (item.type === 'agreement-renewal') {
          label = `${item.diffDays} DAYS LEFT`;
        } else if (item.type === 'renewal') {
          label = `Due in ${item.diffDays}d`;
        } else {
          label = `Due in ${item.diffDays}d`;
        }
        badgeHTML = `<span class="reminder-badge badge-warning">${label}</span>`;
        itemClass = 'due-soon';
      } else {
        let label;
        if (item.type === 'agreement-renewal') {
          label = `${item.diffDays} DAYS LEFT`;
        } else if (item.type === 'renewal') {
          label = `Due in ${item.diffDays}d`;
        } else {
          label = `Due in ${item.diffDays}d`;
        }
        badgeHTML = `<span class="reminder-badge badge-info">${label}</span>`;
        itemClass = 'info';
      }

      const div = document.createElement('div');
      div.className = `reminder-item ${itemClass}`;
      div.style.cursor = 'pointer';
      
      // Determine tab target for navigation click
      let tabTarget = 'rental';
      if (item.type === 'interest-collection' || item.type === 'interest-payment') tabTarget = 'interest';

      div.addEventListener('click', () => {
        navigateAndHighlightCard(tabTarget, item.id);
      });

      // Quick Mark Paid button
      let markPaidBtn = '';
      if (item.status !== 'paid') {
        if (item.type === 'rent-payment') {
          markPaidBtn = `
            <label style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.72rem; font-weight: 700; color: var(--color-success); margin-right: 0.5rem; cursor: pointer; user-select: none;" onclick="event.stopPropagation();">
              Mark Paid
              <input type="checkbox" style="width: 14px; height: 14px; accent-color: var(--color-success); cursor: pointer; margin: 0;" onchange="if(this.checked) quickMarkRentalPaid('${item.id}', ${item.amount}, '${selectedMonthStr}')">
            </label>
          `;
        } else if (item.type === 'interest-collection' || item.type === 'interest-payment') {
          const typeStr = item.type === 'interest-collection' ? 'received' : 'paid';
          markPaidBtn = `
            <label style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.72rem; font-weight: 700; color: var(--color-success); margin-right: 0.5rem; cursor: pointer; user-select: none;" onclick="event.stopPropagation();">
              Mark Paid
              <input type="checkbox" style="width: 14px; height: 14px; accent-color: var(--color-success); cursor: pointer; margin: 0;" onchange="if(this.checked) quickMarkInterestPaid('${item.id}', '${typeStr}', ${item.amount}, '${selectedMonthStr}')">
            </label>
          `;
        }
      }

      if (item.type === 'agreement-renewal') {
        div.innerHTML = `
          <div class="reminder-icon-wrapper" style="background: rgba(245,158,11,0.15); color: #f59e0b;">
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="reminder-details">
            <div class="reminder-title">Agreement Renewal: ${item.propertyName}</div>
            <div class="reminder-subtitle">Tenant: ${item.partyName} | Renewal: ${item.dueStr}</div>
          </div>
          <div style="display: flex; align-items: center;">${badgeHTML}</div>
        `;
      } else if (item.type === 'renewal') {
        const renewalActions = item.status !== 'paid' ? `
          <label style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.72rem; font-weight: 700; color: var(--color-success); margin-right: 0.5rem; cursor: pointer; user-select: none;" onclick="event.stopPropagation();">
            <input type="checkbox" style="width: 14px; height: 14px; accent-color: var(--color-success); cursor: pointer; margin: 0;" onchange="if(this.checked) markRenewalDone('${item.id}')">
            Mark Done
          </label>
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openRenewalModal('${item.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.72rem; min-height: auto; margin-right: 0.5rem; display: inline-flex; align-items: center; gap: 2px;">
            Edit
          </button>
        ` : '';
        
        div.innerHTML = `
          <div class="reminder-icon-wrapper" style="background: rgba(245,158,11,0.15); color: #f59e0b;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/><polyline points="22 2 22 8 16 8"/></svg>
          </div>
          <div class="reminder-details">
            <div class="reminder-title">Renewal: ${item.partyName}</div>
            <div class="reminder-subtitle">${item.category}${item.amount ? ' | ' + formatCurrency(item.amount) : ''}${item.frequency !== 'once' ? ' | ' + item.frequency : ''}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.25rem;">
            ${badgeHTML}
            ${markPaidBtn}
          </div>
        `;
        div.style.cursor = 'default';
      } else if (item.type === 'rent-payment') {
        div.innerHTML = `
          <div class="reminder-icon-wrapper" style="background: rgba(16, 185, 129, 0.15); color: var(--color-success);">
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div class="reminder-details">
            <div class="reminder-title">Rent Collection: ${item.propertyName}</div>
            <div class="reminder-subtitle">Tenant: ${item.partyName} | Rent: ${formatCurrency(item.amount)}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.25rem;">
            ${markPaidBtn}
            ${badgeHTML}
          </div>
        `;
      } else {
        // Interest reminder
        const isCollect = item.type === 'interest-collection';
        const bgIconColor = isCollect ? 'rgba(14, 165, 233, 0.15)' : 'rgba(168, 85, 247, 0.15)';
        const iconColor = isCollect ? 'var(--color-accent)' : 'var(--color-purple)';
        div.innerHTML = `
          <div class="reminder-icon-wrapper" style="background: ${bgIconColor}; color: ${iconColor};">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div class="reminder-details">
            <div class="reminder-title">${isCollect ? 'Collect Interest' : 'Pay Interest'}: ${item.partyName} <span style="margin-left: 0.5rem;">${badgeHTML}</span></div>
            <div class="reminder-subtitle">${isCollect ? 'Lending Yield' : 'Funding Cost'} | Interest: ${formatCurrency(item.amount)}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.25rem;">
            ${markPaidBtn}
          </div>
        `;
      }
      rentRemindersNode.appendChild(div);
    });
  }
  }
  }

  // G. General Alerts Dashboard Panel (Loans Overdue, High interest borrow notifications)
  const alertsNode = document.getElementById('dashboard-alerts');
  if (alertsNode) {
    alertsNode.innerHTML = '';
    const alertsList = [];

    // Check Overdue Lending Loans
    state.lent.filter(l => l.status === 'active' && l.dueDate).forEach(loan => {
      const diff = getDaysDifference(loan.dueDate);
      if (diff < 0) {
        alertsList.push({
          id: loan.id,
          tab: 'interest',
          title: `Overdue Loan Receivable`,
          desc: `${loan.borrowerName} was due to pay back ${formatCurrency(loan.principal)} on ${formatDate(loan.dueDate)}.`,
          type: 'overdue'
        });
      } else if (diff <= 14) {
        alertsList.push({
          id: loan.id,
          tab: 'interest',
          title: `Lent Loan Coming Due`,
          desc: `${loan.borrowerName}'s loan of ${formatCurrency(loan.principal)} is due in ${diff} days.`,
          type: 'due-soon'
        });
      }
    });

    // Check Overdue Borrowed Loans
    state.borrowed.filter(b => b.status === 'active' && b.dueDate).forEach(loan => {
      const diff = getDaysDifference(loan.dueDate);
      if (diff < 0) {
        alertsList.push({
          id: loan.id,
          tab: 'interest',
          title: `Overdue Payment Payable`,
          desc: `You were scheduled to repay ${formatCurrency(loan.principal)} to ${loan.financierName} by ${formatDate(loan.dueDate)}.`,
          type: 'overdue'
        });
      } else if (diff <= 14) {
        alertsList.push({
          id: loan.id,
          tab: 'interest',
          title: `Borrowed Repayment Due`,
          desc: `Repayment of ${formatCurrency(loan.principal)} to ${loan.financierName} is due in ${diff} days.`,
          type: 'due-soon'
        });
      }
    });

    if (alertsList.length === 0) {
      alertsNode.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon" style="color: var(--color-success);">
            <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <p>No active transaction alerts. All payments are on schedule!</p>
        </div>
      `;
    } else {
      alertsList.forEach(alert => {
        const itemClass = alert.type === 'overdue' ? 'overdue' : 'due-soon';
        const badgeText = alert.type === 'overdue' ? 'Critical' : 'Alert';
        const badgeClass = alert.type === 'overdue' ? 'badge-danger' : 'badge-warning';

        const div = document.createElement('div');
        div.className = `reminder-item ${itemClass}`;
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
          navigateAndHighlightCard(alert.tab, alert.id);
        });
        
        div.innerHTML = `
          <div class="reminder-icon-wrapper">
            <svg viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <div class="reminder-details">
            <div class="reminder-title">${alert.title}</div>
            <div class="reminder-subtitle" style="font-size: 0.75rem;">${alert.desc}</div>
          </div>
          <div>
            <span class="badge ${badgeClass}">${badgeText}</span>
          </div>
        `;
        alertsNode.appendChild(div);
      });
    }
  }
}

function getActivityPeriod(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((today - d) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'today';
  if (diffDays === 0) return 'today';
  if (diffDays <= 6) return 'week';
  return 'month';
}

function renderRecentActivity() {
  const container = document.getElementById('dashboard-activity-feed');
  if (!container) return;
  
  document.querySelectorAll('[data-activity]').forEach(btn => {
    btn.style.background = btn.getAttribute('data-activity') === currentActivityFilter ? 'var(--color-accent)' : 'var(--bg-secondary)';
    btn.style.color = btn.getAttribute('data-activity') === currentActivityFilter ? '#fff' : 'var(--text-primary)';
  });
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const activities = [];
  var actOrder = 0;
  
  state.rentPayments.forEach(p => {
    const date = p.datePaid || p.date;
    if (!date) return;
    const d = new Date(date);
    if (currentActivityFilter === 'today' && d < todayStart) return;
    if (currentActivityFilter === 'week' && d < weekStart) return;
    if (currentActivityFilter === 'month' && d < monthStart) return;
    const rental = state.rentals.find(r => r.id === p.rentalId);
    activities.push({
      _order: actOrder++,
      date: date,
      type: 'rent-paid',
      label: 'Rent Paid',
      detail: `${rental ? rental.tenantName : 'Unknown'} — ${formatCurrency(p.amount)}`,
      icon: '🏠'
    });
  });
  
  state.interestPayments.forEach(p => {
    if (p.category === 'issuance') return;
    const date = p.date;
    if (!date) return;
    const d = new Date(date);
    if (currentActivityFilter === 'today' && d < todayStart) return;
    if (currentActivityFilter === 'week' && d < weekStart) return;
    if (currentActivityFilter === 'month' && d < monthStart) return;
    const isReceived = p.type === 'received';
    const name = isReceived ? state.lent.find(l => l.id === p.loanId) : state.borrowed.find(l => l.id === p.loanId);
    activities.push({
      _order: actOrder++,
      date: date,
      type: 'interest-paid',
      label: isReceived ? 'Interest Received' : 'Interest Paid',
      detail: `${name ? name.borrowerName || name.financierName : 'Unknown'} — ${formatCurrency(p.amount)}`,
      icon: '💰'
    });
  });
  
  state.expenses.forEach(e => {
    const date = e.date;
    if (!date) return;
    const d = new Date(date);
    if (currentActivityFilter === 'today' && d < todayStart) return;
    if (currentActivityFilter === 'week' && d < weekStart) return;
    if (currentActivityFilter === 'month' && d < monthStart) return;
    var expDetail = (e.category || 'General') + ' — ' + formatCurrency(e.amount);
    if (e.category === 'construction') {
      expDetail = 'Construction — ' + (e.laborType || 'General') + ' — ' + (e.project || '') + ' — ' + formatCurrency(e.amount);
    }
    activities.push({
      _order: actOrder++,
      date: date,
      type: 'expense',
      label: 'Expense Added',
      detail: expDetail,
      icon: '💸'
    });
  });
  
  state.lent.forEach(l => {
    const date = l.startDate;
    if (!date) return;
    const d = new Date(date);
    if (currentActivityFilter === 'today' && d < todayStart) return;
    if (currentActivityFilter === 'week' && d < weekStart) return;
    if (currentActivityFilter === 'month' && d < monthStart) return;
    activities.push({
      _order: actOrder++,
      date: date,
      type: 'lent',
      label: 'Loan Given',
      detail: `${l.borrowerName || 'Unknown'} — ${formatCurrency(l.principal)}`,
      icon: '📤'
    });
  });
  
  state.borrowed.forEach(b => {
    const date = b.startDate;
    if (!date) return;
    const d = new Date(date);
    if (currentActivityFilter === 'today' && d < todayStart) return;
    if (currentActivityFilter === 'week' && d < weekStart) return;
    if (currentActivityFilter === 'month' && d < monthStart) return;
    activities.push({
      _order: actOrder++,
      date: date,
      type: 'borrowed',
      label: 'Loan Taken',
      detail: `${b.financierName || 'Unknown'} — ${formatCurrency(b.principal)}`,
      icon: '📥'
    });
  });
  
  state.rentals.forEach(r => {
    const date = r.startDate;
    if (!date) return;
    const d = new Date(date);
    if (currentActivityFilter === 'today' && d < todayStart) return;
    if (currentActivityFilter === 'week' && d < weekStart) return;
    if (currentActivityFilter === 'month' && d < monthStart) return;
    const sinceDays = Math.floor((todayStart - d) / (1000 * 60 * 60 * 24));
    if (sinceDays > 90) return;
    activities.push({
      _order: actOrder++,
      date: date,
      type: 'tenant-added',
      label: 'Tenant Added',
      detail: `${r.tenantName} — ${r.propertyName || ''}`,
      icon: '👤'
    });
  });

  activities.sort((a, b) => {
    var d = new Date(b.date) - new Date(a.date);
    if (d !== 0) return d;
    return b._order - a._order;
  });
  
  if (activities.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><svg viewBox="0 0 24 24" width="48" height="48"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><p>No recent activity.</p></div>`;
    return;
  }
  
  container.innerHTML = activities.map(a => {
    const dateObj = new Date(a.date);
    const timeStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `<div class="reminder-item" style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0.75rem;border-bottom:1px solid var(--border-color);">
      <span style="font-size:1.1rem;">${a.icon}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:0.85rem;color:var(--text-primary);">${a.label}</div>
        <div style="font-size:0.75rem;color:var(--text-secondary);">${a.detail}</div>
      </div>
      <span style="font-size:0.65rem;color:var(--text-muted);white-space:nowrap;">${timeStr}</span>
    </div>`;
  }).join('');
}

window.setActivityFilter = function(filter) {
  currentActivityFilter = filter;
  document.querySelectorAll('[data-activity]').forEach(btn => {
    btn.style.background = btn.getAttribute('data-activity') === filter ? 'var(--color-accent)' : 'var(--bg-secondary)';
    btn.style.color = btn.getAttribute('data-activity') === filter ? '#fff' : 'var(--text-primary)';
  });
  renderRecentActivity();
};

// 7. LENDING TAB LOGIC
function renderLending() {

  const [selYear, selMonth] = selectedMonthStr.split('-').map(Number);
  const endDateOfSelectedMonth = `${selectedMonthStr}-${String(new Date(selYear, selMonth, 0).getDate()).padStart(2, '0')}`;

  const lentOutstandingNode = el('lending-total-outstanding');
  if (lentOutstandingNode) {
    const totalInterestReceived = state.interestPayments
      .filter(p => p.type === 'received' && p.category === 'interest' && p.date <= endDateOfSelectedMonth)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    lentOutstandingNode.textContent = formatCurrency(totalInterestReceived);
  }

  const listContainer = el('lent-loans-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  const visibleLoans = state.lent.filter(l => l.startDate <= endDateOfSelectedMonth);

  const countEl = document.getElementById('lent-loans-count');
  const principalEl = document.getElementById('lent-loans-principal');
  if (countEl) countEl.textContent = visibleLoans.length;
  if (principalEl) {
    const totalPrincipal = visibleLoans.reduce((s, l) => s + Number(l.principal), 0);
    principalEl.textContent = formatCurrency(totalPrincipal);
  }
  if (visibleLoans.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <p>No active lending records for this period.</p>
      </div>`;
    return;
  }

  // Compute per-loan stats
  visibleLoans.forEach(loan => {
    const loanPayments = state.interestPayments.filter(p => p.loanId === loan.id && p.type === 'received' && p.date <= endDateOfSelectedMonth);
    const interestPayments = loanPayments.filter(p => p.category === 'interest');
    const principalPayments = loanPayments.filter(p => p.category === 'principal');
    const topupPayments = loanPayments.filter(p => p.category === 'increase');

    const totalReceived = interestPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalRepaid = principalPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalTopups = topupPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const outstandingPrincipal = Math.max(0, Number(loan.principal) + totalTopups - totalRepaid);
    
    const lastPaymentDate = loanPayments.length > 0 ? loanPayments.reduce((max, p) => p.date > max ? p.date : max, loanPayments[0].date) : null;
    const monthlyYield = outstandingPrincipal * (Number(loan.interestRate) / 100);
    const currentMonthPayments = interestPayments.filter(p => p.date.startsWith(selectedMonthStr));
    const currentMonthSum = currentMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const isInterestFullyPaidThisMonth = monthlyYield > 0 && currentMonthSum >= (monthlyYield - 0.01);
    const hasAdvance = interestPayments.some(function(p) { return p.note && p.note.indexOf('[Advance]') !== -1; });
    const advTotal = hasAdvance ? interestPayments.filter(function(p) { return p.note && p.note.indexOf('[Advance]') !== -1; }).reduce(function(s, p) { return s + Number(p.amount); }, 0) : 0;
    const statusInMonth = outstandingPrincipal > 0 ? 'active' : 'paid';

    loan._stats = {
      outstandingPrincipal, totalReceived, totalRepaid, monthlyYield, currentMonthSum,
      isInterestFullyPaidThisMonth, statusInMonth, lastPaymentDate, hasAdvance, advTotal
    };
  });

  const sortedLoans = visibleLoans.sort((a, b) => {
    if (a._stats.statusInMonth !== b._stats.statusInMonth) return a._stats.statusInMonth === 'active' ? -1 : 1;
    return b._stats.outstandingPrincipal - a._stats.outstandingPrincipal;
  });

  sortedLoans.forEach(loan => {
    const stats = loan._stats;
    const card = document.createElement('div');
    card.className = 'card loan-card';
    card.style.padding = '0.75rem';
    card.setAttribute('data-loan-id', loan.id);

    const settledBadge = stats.statusInMonth !== 'active' ? ' <span class="badge badge-muted">Settled</span>' : '';
    const advBadge = stats.hasAdvance ? ' <span style="font-size:0.55rem;color:var(--color-purple);font-weight:600;margin-left:0.2rem;">Adv</span>' : '';
    const formattedYield = formatCurrency(stats.monthlyYield);
    const formattedPrincipal = formatCurrency(stats.outstandingPrincipal);
    const currentRecv = formatCurrency(stats.currentMonthSum);
    const currentBal = formatCurrency(Math.max(0, stats.monthlyYield - stats.currentMonthSum));
    const recvDisplay = stats.isInterestFullyPaidThisMonth
      ? 'Rcvd ' + currentRecv + ' <span style="font-style:normal;">✅</span>'
      : 'Rcvd ' + currentRecv + ' · Bal ' + currentBal;

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:700; font-size:1rem;">${loan.borrowerName}${settledBadge}${advBadge}</div>
          ${loan.phone ? '<div style="font-size:0.82rem;color:#fff;margin-top:0.05rem;">' + loan.phone + '</div>' : ''}
        </div>
        <div style="text-align:right;">
          <div style="font-size:1.15rem; font-weight:800; color:var(--color-warning); line-height:1.2;">${formattedPrincipal}</div>
          <div style="font-size:0.72rem; color:var(--text-secondary); line-height:1.3;">+${formattedYield}/mo</div>
        </div>
      </div>

      <div style="display:flex; gap:0.35rem; align-items:center; margin-bottom:0.25rem;">
        <input type="number" id="quick-pay-${loan.id}" class="form-input" placeholder="₹ Amount" style="flex:1; min-height:40px; font-size:1rem; padding:0.3rem 0.5rem; font-weight:600;">
        <button class="btn btn-primary" style="min-height:40px; font-weight:700; font-size:0.9rem; padding:0.3rem 1rem;" onclick="quickLoanPayment('${loan.id}', 'lent')">Recv</button>
      </div>

      <div style="font-size:0.7rem; color:#fff; font-style:italic; margin-bottom:0.2rem;">${recvDisplay}${stats.advTotal > 0 ? ' · Adv ' + formatCurrency(stats.advTotal) : ''}${stats.lastPaymentDate ? ' · Last ' + formatDate(stats.lastPaymentDate) : ''}</div>

      <div class="icon-strip">
        <div class="icon-strip-left">
          ${loan.phone ? '<span onclick="window.open(\'tel:' + loan.phone.replace(/\D/g, '') + '\',\'_self\')" title="Call">📞</span><span onclick="window.open(\'https://wa.me/91' + loan.phone.replace(/\D/g, '') + '\',\'_blank\')" title="WhatsApp">💬</span>' : ''}
          <span onclick="showLedger('${loan.id}', 'lent')" title="Ledger">📋</span>
          ${stats.statusInMonth === 'active'
            ? (loan.isEMI
              ? '<span onclick="promptRecordEMI(\'' + loan.id + '\', \'received\')" title="Record EMI">📅</span><span onclick="lendMore(\'' + loan.id + '\')" title="Lend More">➕</span>'
              : '<span onclick="quickReceiveInterest(\'' + loan.id + '\', \'lent\')" title="Quick Receive">⚡</span><span onclick="promptPayment(\'' + loan.id + '\', \'received\', \'principal\')" title="Repay">💰</span><span onclick="lendMore(\'' + loan.id + '\')" title="Lend More">➕</span>')
            : '<span onclick="toggleLoanStatus(\'' + loan.id + '\', \'lent\')" title="Reopen">🔄</span>'
          }
          ${stats.statusInMonth === 'active' && !loan.isEMI ? '<span onclick="promptConvertEMI(\'' + loan.id + '\', \'lent\')" title="Convert to EMI">📊</span>' : ''}
        </div>
        <div class="icon-strip-right">
          <span onclick="editLoan('${loan.id}', 'lent')" title="Edit">✏️</span>
          <span onclick="deleteLoan('${loan.id}', 'lent')" title="Delete">🗑️</span>
        </div>
      </div>
    `;

    listContainer.appendChild(card);
  });
}

// 8. BORROWING TAB LOGIC
function renderBorrowing() {

  const [selYear, selMonth] = selectedMonthStr.split('-').map(Number);
  const endDateOfSelectedMonth = `${selectedMonthStr}-${String(new Date(selYear, selMonth, 0).getDate()).padStart(2, '0')}`;

  const borrowedOutstandingNode = el('borrowing-total-outstanding');
  if (borrowedOutstandingNode) {
    const totalInterestPaid = state.interestPayments
      .filter(p => p.type === 'paid' && p.category === 'interest' && p.date <= endDateOfSelectedMonth)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    borrowedOutstandingNode.textContent = formatCurrency(totalInterestPaid);
  }

  const listContainer = el('borrowed-loans-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  const visibleLoans = state.borrowed.filter(b => b.startDate <= endDateOfSelectedMonth);

  const countEl = document.getElementById('borrowed-loans-count');
  const principalEl = document.getElementById('borrowed-loans-principal');
  if (countEl) countEl.textContent = visibleLoans.length;
  if (principalEl) {
    const totalPrincipal = visibleLoans.reduce((s, b) => s + Number(b.principal), 0);
    principalEl.textContent = formatCurrency(totalPrincipal);
  }

  if (visibleLoans.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <p>No active borrowing records for this period.</p>
      </div>`;
    return;
  }

  // Compute per-loan stats
  visibleLoans.forEach(loan => {
    const loanPayments = state.interestPayments.filter(p => p.loanId === loan.id && p.type === 'paid' && p.date <= endDateOfSelectedMonth);
    const interestPayments = loanPayments.filter(p => p.category === 'interest');
    const principalPayments = loanPayments.filter(p => p.category === 'principal');
    const topupPayments = loanPayments.filter(p => p.category === 'increase');

    const totalPaid = interestPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalRepaid = principalPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalTopups = topupPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const outstandingPrincipal = Math.max(0, Number(loan.principal) + totalTopups - totalRepaid);
    
    const lastPaymentDate = loanPayments.length > 0 ? loanPayments.reduce((max, p) => p.date > max ? p.date : max, loanPayments[0].date) : null;
    const monthlyCost = outstandingPrincipal * (Number(loan.interestRate) / 100);
    const currentMonthPayments = interestPayments.filter(p => p.date.startsWith(selectedMonthStr));
    const currentMonthSum = currentMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const isInterestFullyPaidThisMonth = monthlyCost > 0 && currentMonthSum >= (monthlyCost - 0.01);
    const statusInMonth = outstandingPrincipal > 0 ? 'active' : 'paid';

    loan._stats = {
      outstandingPrincipal, totalPaid, totalRepaid, monthlyCost,
      isInterestFullyPaidThisMonth, statusInMonth, lastPaymentDate
    };
  });

  const sortedLoans = visibleLoans.sort((a, b) => {
    if (a._stats.statusInMonth !== b._stats.statusInMonth) return a._stats.statusInMonth === 'active' ? -1 : 1;
    return b._stats.outstandingPrincipal - a._stats.outstandingPrincipal;
  });

  sortedLoans.forEach(loan => {
    const stats = loan._stats;
    const card = document.createElement('div');
    card.className = 'card loan-card';
    card.style.padding = '0.75rem';
    card.setAttribute('data-loan-id', loan.id);

    const settledBadgeB = stats.statusInMonth !== 'active' ? ' <span class="badge badge-muted">Loan Closed</span>' : '';
    const formattedCost = formatCurrency(stats.monthlyCost);
    const formattedOwed = formatCurrency(stats.outstandingPrincipal);
    const formattedPaid = formatCurrency(stats.totalPaid);

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="font-weight:700; font-size:0.9rem;">${loan.financierName}${settledBadgeB}</div>
        <div style="font-size:1.15rem; font-weight:800; color:var(--color-danger); line-height:1.2;">${formattedOwed}</div>
      </div>

      <div style="font-size:0.68rem; color:var(--text-secondary); margin:0.2rem 0 0.35rem; line-height:1.5;">
        ${loan.phone ? '<span style="color:#fff;">' + loan.phone + '</span> · ' : ''}${loan.interestRate}%/mo${loan.isEMI ? '' : ' · Paid ' + formattedPaid} · ${stats.lastPaymentDate ? 'Last ' + formatDate(stats.lastPaymentDate) : 'No payments'}<span style="float:right;">
          ${stats.isInterestFullyPaidThisMonth
            ? '<span style="color:var(--color-success);font-weight:700;">✓</span>'
            : (stats.statusInMonth === 'active'
              ? '<label style="cursor:pointer;"><input type="checkbox" onchange="if(this.checked){quickMarkInterestPaid(\'' + loan.id + '\',\'paid\',' + stats.monthlyCost + ',\'' + selectedMonthStr + '\');}" style="width:13px;height:13px;accent-color:var(--color-success);cursor:pointer;margin:0;vertical-align:middle;"> Paid</label>'
              : '')
          }
        </span>
      </div>

      ${loan.notes ? '<div style="font-size:0.68rem; color:var(--text-secondary); font-style:italic; margin-bottom:0.3rem;">' + loan.notes + '</div>' : ''}

      <div style="display:flex; gap:0.35rem; align-items:center; margin-bottom:0.4rem;">
        <input type="number" id="quick-pay-${loan.id}" class="form-input" placeholder="₹ Amount" style="flex:1; min-height:40px; font-size:1rem; padding:0.3rem 0.5rem; font-weight:600;">
        <button class="btn btn-primary" style="min-height:40px; font-weight:700; font-size:0.9rem; padding:0.3rem 1rem;" onclick="quickLoanPayment('${loan.id}', 'borrowed')">Pay</button>
      </div>

      <div class="icon-strip">
        <div class="icon-strip-left">
          ${loan.phone ? '<span onclick="window.open(\'tel:' + loan.phone.replace(/\D/g, '') + '\',\'_self\')" title="Call">📞</span><span onclick="window.open(\'https://wa.me/91' + loan.phone.replace(/\D/g, '') + '\',\'_blank\')" title="WhatsApp">💬</span>' : ''}
          <span onclick="showLedger('${loan.id}', 'borrowed')" title="Ledger">📋</span>
          ${stats.statusInMonth === 'active'
            ? (loan.isEMI
              ? '<span onclick="promptRecordEMI(\'' + loan.id + '\', \'paid\')" title="Record EMI">📅</span><span onclick="lendMore(\'' + loan.id + '\')" title="Borrow More">➕</span>'
              : '<span onclick="lendMore(\'' + loan.id + '\')" title="Borrow More">➕</span>')
            : '<span onclick="toggleLoanStatus(\'' + loan.id + '\', \'borrowed\')" title="Reopen">🔄</span>'
          }
          ${loan.isEMI ? '' : '<span onclick="promptConvertEMI(\'' + loan.id + '\', \'borrowed\')" title="Convert to EMI">📊</span>'}
        </div>
        <div class="icon-strip-right">
          <span onclick="editLoan('${loan.id}', 'borrowed')" title="Edit">✏️</span>
          <span onclick="deleteLoan('${loan.id}', 'borrowed')" title="Delete">🗑️</span>
        </div>
      </div>
    `;

    listContainer.appendChild(card);
  });
}

// 9. RENTAL TAB LOGIC
function renderRentals() {

  const [selYear, selMonth] = selectedMonthStr.split('-').map(Number);
  const currentMonthName = MONTH_UPPER_NAMES[selMonth - 1];
  const activeMonthStr = `${currentMonthName} ${selYear}`;
  
  const activeMonthBadge = el('rentals-active-month-badge');
  if (activeMonthBadge) {
    activeMonthBadge.textContent = activeMonthStr;
  }

  const endDateOfSelectedMonth = `${selectedMonthStr}-${String(new Date(selYear, selMonth, 0).getDate()).padStart(2, '0')}`;

  // Calculate top summary stats for active rentals based on selected month
  const activeRentals = state.rentals.filter(r => r.startDate <= endDateOfSelectedMonth && r.status === 'active');
  const totalLeases = activeRentals.length;
  const monthlyRentRoll = activeRentals.reduce((sum, r) => sum + Number(r.monthlyRent), 0);
  const totalCollected = state.rentPayments
    .filter(p => p.monthYear <= selectedMonthStr)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const activeLeasesNode = el('rentals-active-leases');
  const monthlyIncomeNode = el('rentals-monthly-income');
  
  if (activeLeasesNode) activeLeasesNode.textContent = totalLeases;
  if (monthlyIncomeNode) monthlyIncomeNode.textContent = formatCurrency(monthlyRentRoll);

  const listContainer = el('rentals-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  // Only show rentals that existed in the selected month
  const visibleRentals = state.rentals.filter(r => r.startDate <= endDateOfSelectedMonth);

  if (visibleRentals.length === 0) {
    listContainer.innerHTML = `
      <div class="card empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <p>No tenant agreements logged yet for this period.</p>
      </div>
    `;
    return;
  }

  // Sort: active first, then inactive
  const sortedRentals = [...visibleRentals].sort((a,b) => {
    if (a.status === b.status) return a.propertyName.localeCompare(b.propertyName);
    return a.status === 'active' ? -1 : 1;
  });

  sortedRentals.forEach(rental => {
    // Find all rent payments logged up to the selected month
    const rentPayments = state.rentPayments.filter(rp => rp.rentalId === rental.id && rp.monthYear <= selectedMonthStr);
    const totalCollected = rentPayments.reduce((sum, rp) => sum + Number(rp.amount), 0);

    const currentMonthName = MONTH_UPPER_NAMES[selMonth - 1];
    
    // Check if there is a rent payment logged where monthYear matches the selected month
    const isRentPaidThisMonth = rentPayments.some(p => p.monthYear === selectedMonthStr);
    const currentMonthPayments = rentPayments.filter(p => p.monthYear === selectedMonthStr);
    const currentMonthRentSum = currentMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const isRentFullyPaid = isRentPaidThisMonth && currentMonthRentSum >= (rental.monthlyRent - 0.01);
    const rentBalance = Math.max(0, rental.monthlyRent - currentMonthRentSum);
    
    const card = document.createElement('div');
    const renewData = getNextRenewal(rental.startDate);
    const isRenewalSoon = renewData && renewData.daysLeft <= 30;
    card.className = 'card loan-card';
    card.style.padding = '0.75rem';
    card.setAttribute('data-id', rental.id);
    if (isRenewalSoon) {
      card.style.borderColor = '#ef4444';
      card.style.borderWidth = '2px';
    } else if (!isRentPaidThisMonth && rental.status === 'active') {
      var now = new Date();
      var todayDate = now.getDate();
      var dueDay = Number(rental.rentDueDay);
      var daysUntilDue = dueDay - todayDate;
      if (daysUntilDue >= 0 && daysUntilDue <= 7) {
        card.style.borderColor = '#eab308';
        card.style.borderWidth = '2px';
      }
    }

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:700; font-size:1rem;">${rental.tenantName}
            <span style="font-size:0.72rem;color:#fff;font-weight:500;margin-left:0.3rem;">${rental.propertyName}</span>
            ${rental.status === 'active' ? '' : '<span class="badge badge-muted">Ended</span>'}
          </div>
          ${rental.contactInfo ? `<div style="font-size:0.82rem;color:#fff;margin-top:0.05rem;">${rental.contactInfo}</div>` : ''}
        </div>
        <div style="text-align:right;">
          <div style="font-size:1.15rem;font-weight:800;color:var(--color-success);line-height:1.2;">${formatCurrency(rental.monthlyRent)}</div>
          <div style="font-size:0.68rem;color:var(--text-secondary);margin-top:0.1rem;">Monthly Rent</div>
          ${isRentFullyPaid ? '<div style="font-size:0.6rem;color:var(--color-success);font-weight:600;margin-top:0.15rem;">Received ✅</div>' : ''}
        </div>
      </div>

      <div style="font-size:0.68rem;color:#fff;margin:0.15rem 0 0.25rem;">
        ${rental.status === 'active'
          ? `Due: ${rental.rentDueDay}<sup>th</sup> · Since ${formatDate(rental.startDate)}${renewData ? ` · Renews: ${renewData.dateStr}` : ''}${!isRentPaidThisMonth ? '<span style="color:var(--color-warning);font-weight:600;float:right;">Due</span>' : ''}`
          : `Since ${formatDate(rental.startDate)} · Ended ${rental.endDate ? formatDate(rental.endDate) : '-'}`
        }
</div>

      <div id="quick-rent-row-${rental.id}" style="display:none; margin-bottom:0.1rem;">
        <div style="display:flex; gap:0.35rem; align-items:center;">
          <input type="number" id="quick-rent-${rental.id}" class="form-input" placeholder="₹ Amount" style="flex:1; min-height:40px; font-size:1rem; padding:0.3rem 0.5rem; font-weight:600;">
          <button class="btn btn-primary" style="min-height:40px; font-weight:700; font-size:0.9rem; padding:0.3rem 1rem;" onclick="quickRentPayment('${rental.id}')">Pay</button>
        </div>
      </div>
      ${isRentPaidThisMonth && isRentFullyPaid ? '' : (isRentPaidThisMonth ? `<div style="font-size:0.7rem;color:#fff;font-style:italic;margin-bottom:0.15rem;">Rcvd ${formatCurrency(currentMonthRentSum)} · Bal ${formatCurrency(rentBalance)}</div>` : '')}

      <div class="icon-strip">
        <div class="icon-strip-left">
          ${rental.contactInfo ? `<span onclick="window.open('tel:${rental.contactInfo.replace(/\D/g, '')}','_self')" title="Call">📞</span><span onclick="window.open('https://wa.me/91${rental.contactInfo.replace(/\D/g, '')}','_blank')" title="WhatsApp">💬</span>` : ''}
          <span onclick="showRentalLedger('${rental.id}')" title="Ledger">📋</span>
          <span onclick="openTenantDetails('${rental.id}')" title="Details">📝</span>
          ${rental.status === 'active'
            ? `<span onclick="var r=document.getElementById('quick-rent-row-${rental.id}');if(r)r.style.display=r.style.display==='none'?'':'none';" title="Pay">💰</span><span onclick="toggleRentalStatus('${rental.id}')" title="End Lease">🔒</span><label style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;cursor:pointer;"><input type="checkbox" onchange="if(this.checked){quickMarkRentPaid('${rental.id}')}else{quickUnmarkRentPaid('${rental.id}')}" ${isRentFullyPaid ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--color-success);cursor:pointer;margin:0;"></label>`
            : `<span onclick="toggleRentalStatus('${rental.id}')" title="Activate">🔓</span>`
          }
          ${rental.aadhaarImg ? `<span onclick="viewDocumentImage('${rental.id}', 'aadhaar')" title="Aadhaar">🪪</span>` : ''}
          ${rental.agreementImg ? `<span onclick="viewDocumentImage('${rental.id}', 'agreement')" title="Agreement">📄</span>` : ''}
        </div>
        <div class="icon-strip-right">
          <span onclick="editRental('${rental.id}')" title="Edit">✏️</span>
          <span onclick="deleteRental('${rental.id}')" title="Delete">🗑️</span>
        </div>
      </div>
    `;

    listContainer.appendChild(card);
  });
}

// 10. TRANSACTION MODALS CONTROLLERS & ACTIONS

try {
// Create/Edit Loan Submit Handler
document.getElementById('form-loan').addEventListener('submit', (e) => {
  e.preventDefault();
  loadState();

  const id = document.getElementById('loan-id').value;
  const direction = document.getElementById('loan-direction').value;
  const party = document.getElementById('loan-party').value;
  const phone = document.getElementById('loan-phone').value.trim();
  const principal = Number(document.getElementById('loan-principal').value);
  const rate = Number(document.getElementById('loan-rate').value);
  const startDate = document.getElementById('loan-start-date').value;
  const dueDateInput = document.getElementById('loan-due-date').value;
  const dueDate = dueDateInput === '' ? null : dueDateInput;
  const notes = document.getElementById('loan-notes').value;

  const targetArrayName = direction === 'lent' ? 'lent' : 'borrowed';
  
  if (id) {
    // Edit Mode
    const index = state[targetArrayName].findIndex(x => x.id === id);
    if (index !== -1) {
      const existing = state[targetArrayName][index];
      state[targetArrayName][index] = {
        ...existing,
        borrowerName: direction === 'lent' ? party : undefined,
        financierName: direction === 'borrowed' ? party : undefined,
        phone,
        principal,
        interestRate: rate,
        startDate,
        dueDate,
        notes
      };
    }
  } else {
    // Add Mode
    const newId = direction[0] + Math.random().toString(36).substr(2, 9);
    const newLoan = {
      id: newId,
      phone,
      principal,
      interestRate: rate,
      startDate,
      dueDate,
      status: 'active',
      notes
    };
    if (direction === 'lent') {
      newLoan.borrowerName = party;
    } else {
      newLoan.financierName = party;
    }
    state[targetArrayName].push(newLoan);

    // LOG INITIAL ISSUANCE
    state.interestPayments.push({
      id: 'iss_' + newId,
      loanId: newId,
      type: direction === 'lent' ? 'received' : 'paid',
      category: 'issuance',
      amount: principal,
      date: startDate,
      note: 'Principal Disbursed'
    });
  }

  saveState();
  closeModal('modal-loan');
  renderDashboard();
  setTimeout(function() {
    switchTab('dashboard');
    if (currentReminderFilter === 'interest') currentReminderFilter = 'all';
    toggleReminderFilter('interest');
    var card = document.getElementById('card-interest');
    if (card) card.classList.add('highlight-card');
    setTimeout(function() {
      var loanId = id || (typeof newId !== 'undefined' ? newId : null);
      if (loanId) {
        var newCard = document.querySelector('[data-loan-id="' + loanId + '"]');
        if (newCard) newCard.classList.add(direction === 'lent' ? 'new-entry-highlight' : 'new-entry-highlight-red');
      }
    }, 100);
  }, 150);
});

// Edit Loan Action Trigger
function editLoan(id, direction) {
  closeModal('modal-group-details');
  loadState();
  const list = direction === 'lent' ? state.lent : state.borrowed;
  const loan = list.find(l => l.id === id);
  if (!loan) return;

  // Fill Modal Form fields
  document.getElementById('loan-id').value = loan.id;
  document.getElementById('loan-direction').value = direction;
  document.getElementById('loan-party').value = direction === 'lent' ? loan.borrowerName : loan.financierName;
  document.getElementById('loan-phone').value = loan.phone || '';
  document.getElementById('loan-principal').value = loan.principal;
  updatePrincipalWords();
  document.getElementById('loan-rate').value = loan.interestRate;
  document.getElementById('loan-start-date').value = loan.startDate;
  document.getElementById('loan-due-date').value = loan.dueDate || '';
  document.getElementById('loan-notes').value = loan.notes || '';

  // Setup Modal labels based on Direction
  document.getElementById('loan-modal-title').textContent = direction === 'lent' ? 'Edit Lent Loan Details' : 'Edit Borrowing Details';
  document.getElementById('loan-party-label').textContent = direction === 'lent' ? 'Borrower Name' : 'Lender Name';
  document.getElementById('loan-party').placeholder = direction === 'lent' ? 'e.g. John Doe' : 'e.g. Acme FinCorp';

  updatePrincipalPresets(direction);
  openModal('modal-loan');
}

// Toggle Loan Status Active <-> Paid/Settled
function toggleLoanStatus(id, direction) {
  loadState();
  const listName = direction === 'lent' ? 'lent' : 'borrowed';
  const item = state[listName].find(x => x.id === id);
  if (!item) return;

  item.status = item.status === 'active' ? (direction === 'lent' ? 'paid' : 'settled') : 'active';
  // Standardize naming
  if (item.status === 'settled') item.status = 'paid';

  saveState();
  if (direction === 'lent') renderLending();
  else renderBorrowing();
}

// Delete Loan
function deleteLoan(id, direction) {
  closeModal('modal-group-details');
  if (!confirm(`Are you sure you want to permanently delete this loan transaction? All associated interest payments logged will also be removed.`)) return;

  loadState();
  const listName = direction === 'lent' ? 'lent' : 'borrowed';
  state[listName] = state[listName].filter(x => x.id !== id);
  
  // Clean up interest payments
  state.interestPayments = state.interestPayments.filter(p => p.loanId !== id);

  saveState();
  if (direction === 'lent') renderLending();
  else renderBorrowing();
}

// EMI Features
function promptConvertEMI(loanId, direction) {
  closeModal('modal-group-details');
  loadState();
  const listName = direction === 'lent' ? 'lent' : 'borrowed';
  const loan = state[listName].find(x => x.id === loanId);
  if (!loan) return;

  const outstandingPrincipal = getOutstandingPrincipal(loan.id, loan.principal);
  
  document.getElementById('form-emi-convert').reset();
  document.getElementById('emi-convert-loan-id').value = loanId;
  document.getElementById('emi-convert-direction').value = direction;
  document.getElementById('emi-convert-name').textContent = loan.borrowerName;
  document.getElementById('emi-convert-principal').textContent = formatCurrency(outstandingPrincipal);
  document.getElementById('emi-convert-rate').value = loan.interestRate;
  document.getElementById('emi-convert-preview').textContent = 'Rs. 0 / mo';
  
  window._currentEMIPrincipal = outstandingPrincipal;
  
  openModal('modal-emi-convert');
}

function selectTenure(btn, months) {
  document.getElementById('emi-convert-tenure').value = months;
  document.querySelectorAll('#tenure-shortcuts .btn').forEach(b => {
    b.style.background = '';
    b.style.color = '';
    b.style.borderColor = '';
  });
  btn.style.background = 'var(--color-accent)';
  btn.style.color = '#fff';
  btn.style.borderColor = 'var(--color-accent)';
  calculateEMIPreview();
}

function calculateEMIPreview() {
  const tenure = Number(document.getElementById('emi-convert-tenure').value);
  const rateInput = Number(document.getElementById('emi-convert-rate').value);
  if (!tenure || tenure <= 0 || !rateInput || rateInput <= 0) {
    document.getElementById('emi-convert-preview').textContent = 'Rs. 0 / mo';
    document.getElementById('emi-convert-total-interest').textContent = formatCurrency(0);
    document.getElementById('emi-convert-total-amount').textContent = formatCurrency(0);
    return;
  }
  const P = window._currentEMIPrincipal;
  const r = rateInput / 100;
  const n = tenure;
  let emi;
  if (r === 0) emi = P / n;
  else emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const totalInterest = emi * n - P;
  
  document.getElementById('emi-convert-preview').textContent = `${formatCurrency(emi)} / mo`;
  document.getElementById('emi-convert-total-interest').textContent = formatCurrency(totalInterest);
  document.getElementById('emi-convert-total-amount').textContent = formatCurrency(P + totalInterest);
}

document.getElementById('form-emi-convert').addEventListener('submit', (e) => {
  e.preventDefault();
  loadState();
  const loanId = document.getElementById('emi-convert-loan-id').value;
  const direction = document.getElementById('emi-convert-direction').value;
  const tenure = Number(document.getElementById('emi-convert-tenure').value);
  const rateInput = Number(document.getElementById('emi-convert-rate').value);
  
  const listName = direction === 'lent' ? 'lent' : 'borrowed';
  const loan = state[listName].find(x => x.id === loanId);
  if (!loan) return;
  
  const P = getOutstandingPrincipal(loan.id, loan.principal);
  const r = rateInput / 100;
  const n = tenure;
  let emi = (r === 0) ? P / n : P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  
  loan.interestRate = rateInput;
  loan.isEMI = true;
  loan.tenureMonths = tenure;
  loan.emiAmount = emi;
  
  saveState();
  closeModal('modal-emi-convert');
  if (direction === 'lent') renderLending();
  else renderBorrowing();
});

function promptRecordEMI(loanId, type) {
  loadState();
  const direction = type === 'received' ? 'lent' : 'borrowed';
  const listName = direction === 'lent' ? 'lent' : 'borrowed';
  const loan = state[listName].find(x => x.id === loanId);
  if (!loan) return;
  
  document.getElementById('form-record-emi').reset();
  document.getElementById('record-emi-loan-id').value = loanId;
  document.getElementById('record-emi-direction').value = direction;
  document.getElementById('record-emi-amount-val').value = loan.emiAmount;
  document.getElementById('record-emi-date').value = new Date().toISOString().split('T')[0];
  
  document.getElementById('record-emi-display-amount').textContent = formatCurrency(loan.emiAmount);
  
  openModal('modal-record-emi');
}

document.getElementById('form-record-emi').addEventListener('submit', (e) => {
  e.preventDefault();
  loadState();
  
  const loanId = document.getElementById('record-emi-loan-id').value;
  const direction = document.getElementById('record-emi-direction').value;
  const date = document.getElementById('record-emi-date').value;
  const notes = document.getElementById('record-emi-notes').value;
  
  const listName = direction === 'lent' ? 'lent' : 'borrowed';
  const loan = state[listName].find(x => x.id === loanId);
  if (!loan) return;
  
  const emiAmount = Number(loan.emiAmount);
  const P = getOutstandingPrincipal(loan.id, loan.principal);
  const r = Number(loan.interestRate) / 100;
  
  const interestPart = P * r;
  const principalPart = emiAmount - interestPart;
  
  const type = direction === 'lent' ? 'received' : 'paid';
  const [y, m] = date.split('-');
  const monthYearStr = `${y}-${m}`;
  
  if (interestPart > 0) {
    state.interestPayments.push({
      id: 'p' + Math.random().toString(36).substr(2, 9),
      loanId: loan.id,
      amount: interestPart,
      date: date,
      monthYear: monthYearStr,
      type: type,
      category: 'interest',
      notes: notes ? notes + ' (EMI Interest)' : '(EMI Interest)'
    });
  }
  if (principalPart > 0) {
    state.interestPayments.push({
      id: 'p' + Math.random().toString(36).substr(2, 9),
      loanId: loan.id,
      amount: principalPart,
      date: date,
      monthYear: monthYearStr,
      type: type,
      category: 'principal',
      notes: notes ? notes + ' (EMI Principal)' : '(EMI Principal)'
    });
  }
  
  saveState();
  closeModal('modal-record-emi');
  if (direction === 'lent') renderLending();
  else renderBorrowing();
  renderDashboard();
});

// Open Interest/Principal Payment Dialog
function promptPayment(loanId, type, category = 'interest') {
  closeModal('modal-group-details');
  loadState();
  document.getElementById('form-payment').reset();
  document.getElementById('payment-loan-id').value = loanId;
  document.getElementById('payment-type').value = type;
  document.getElementById('payment-category').value = category;
  document.getElementById('payment-date').value = new Date().toISOString().split('T')[0];
  
  // Find outstanding principal to compute pre-filled amount
  const list = type === 'received' ? state.lent : state.borrowed;
  const loan = list.find(l => l.id === loanId);
  if (loan) {
    const outstandingPrincipal = getOutstandingPrincipal(loan.id, loan.principal);
    if (category === 'principal') {
      document.getElementById('payment-amount').value = outstandingPrincipal.toFixed(2);
    } else {
      const monthlyInterest = outstandingPrincipal * (Number(loan.interestRate) / 100);
      document.getElementById('payment-amount').value = monthlyInterest.toFixed(2);
    }
  }

  if (category === 'principal') {
    document.getElementById('payment-modal-title').textContent = type === 'received' 
      ? 'Record Principal Repayment Received (Lent)' 
      : 'Record Principal Repayment Payout (Borrowed)';
  } else {
    document.getElementById('payment-modal-title').textContent = type === 'received' 
      ? 'Record Interest Payment Received (Lent)' 
      : 'Record Interest Payment Payout (Borrowed)';
  }

  openModal('modal-payment');
}

// Interest Payment Submit
document.getElementById('form-payment').addEventListener('submit', (e) => {
  e.preventDefault();
  loadState();

  const loanId = document.getElementById('payment-loan-id').value;
  const type = document.getElementById('payment-type').value;
  const category = document.getElementById('payment-category').value;
  const amount = Number(document.getElementById('payment-amount').value);
  const date = document.getElementById('payment-date').value;
  const note = document.getElementById('payment-note').value;

  const paymentId = 'p' + Math.random().toString(36).substr(2, 9);
  state.interestPayments.push({
    id: paymentId,
    loanId,
    type,
    category,
    amount,
    date,
    note
  });

  saveState();

  // Auto mark-paid: if principal repayment brings outstanding to 0, auto-settle the loan
  if (category === 'principal') {
    const list = type === 'received' ? state.lent : state.borrowed;
    const loan = list.find(l => l.id === loanId);
    if (loan) {
      const outstanding = getOutstandingPrincipal(loan.id, loan.principal);
      if (outstanding <= 0 && loan.status === 'active') {
        loan.status = 'paid';
        saveState();
      }
    }
  }

  closeModal('modal-payment');
  
  if (category === 'principal') {
    var direction = type === 'received' ? 'lent' : 'borrowed';
    showLedger(loanId, direction);
  } else {
    if (type === 'received') renderLending();
    else renderBorrowing();
  }

});

document.getElementById('form-add-principal').addEventListener('submit', (e) => {
  e.preventDefault();
  loadState();

  const loanId = document.getElementById('add-principal-loan-id').value;
  const direction = document.getElementById('add-principal-direction').value;
  const additional = Number(document.getElementById('add-principal-amount').value);
  if (!additional || additional <= 0) return;

  const listName = direction === 'lent' ? 'lent' : 'borrowed';
  const loan = state[listName].find(l => l.id === loanId);
  if (!loan) return;

  const idx = state[listName].findIndex(l => l.id === loanId);
  state[listName][idx] = {
    ...loan,
    principal: Number(loan.principal) + additional
  };

  state.interestPayments.push({
    id: 'inc_' + Math.random().toString(36).substr(2, 9),
    loanId: loanId,
    type: direction === 'lent' ? 'received' : 'paid',
    category: 'increase',
    amount: additional,
    date: new Date().toISOString().split('T')[0],
    note: 'Borrow More (Top-up)'
  });

  saveState();
  closeModal('modal-add-principal');
  if (direction === 'lent') renderLending();
  else renderBorrowing();
});

// View Ledger details (Interest & Principal Transactions)
function showLedger(loanId, direction) {
  closeModal('modal-group-details');
  loadState();
  const list = direction === 'lent' ? state.lent : state.borrowed;
  const loan = list.find(l => l.id === loanId);
  if (!loan) return;

  const type = direction === 'lent' ? 'received' : 'paid';
  
  // Construct dynamic transaction history list
  let history = [...state.interestPayments.filter(p => p.loanId === loanId && p.type === type)];

  // Check if we have an 'issuance' record in the history. If not, dynamic fallback for backward compatibility
  const hasIssuance = history.some(p => p.category === 'issuance');
  if (!hasIssuance) {
    const totalIncreases = history
      .filter(p => p.category === 'increase')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const originalPrincipal = Math.max(0, Number(loan.principal) - totalIncreases);
    
    // Add virtual initial issuance
    history.push({
      id: 'virtual_iss_' + loan.id,
      loanId: loan.id,
      type: type,
      category: 'issuance',
      amount: originalPrincipal,
      date: loan.startDate,
      note: 'Original Loan Principal (Initial)'
    });
  }

  // Set Title
  document.getElementById('ledger-title').textContent = `${direction === 'lent' ? 'Lending' : 'Borrowing'} Ledger: ${direction === 'lent' ? loan.borrowerName : loan.financierName}`;

  // Build Statistics
  const interestHistory = history.filter(p => p.category !== 'principal' && p.category !== 'issuance' && p.category !== 'increase');
  const principalHistory = history.filter(p => p.category === 'principal');
  const totalInterest = interestHistory.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPrincipalRepaid = principalHistory.reduce((sum, p) => sum + Number(p.amount), 0);
  const remainingPrincipal = Math.max(0, Number(loan.principal) - totalPrincipalRepaid);

  const statsContainer = document.getElementById('ledger-stats');
  statsContainer.innerHTML = `
    <div class="loan-stat-box">
      <span class="loan-stat-val">${formatCurrency(remainingPrincipal)}</span>
      <span class="loan-stat-lbl">Remaining Principal</span>
    </div>
    <div class="loan-stat-box">
      <span class="loan-stat-val" style="color: var(--color-success);">${formatCurrency(totalPrincipalRepaid)}</span>
      <span class="loan-stat-lbl">Total Repaid</span>
    </div>
    <div class="loan-stat-box">
      <span class="loan-stat-val" style="color: ${direction === 'lent' ? 'var(--color-accent)' : 'var(--color-purple)'};">${formatCurrency(totalInterest)}</span>
      <span class="loan-stat-lbl">Total Interest ${direction === 'lent' ? 'Earned' : 'Paid'}</span>
    </div>
  `;

  // Build List
  const listContainer = document.getElementById('ledger-list-container');
  listContainer.innerHTML = '';

  if (history.length === 0) {
    listContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">No transaction records logged.</p>`;
  } else {
    // Sort reverse chronological
    const sortedHistory = [...history].sort((a,b) => new Date(b.date) - new Date(a.date));
    sortedHistory.forEach(item => {
      const div = document.createElement('div');
      div.className = 'ledger-item';
      
      let categoryBadge = '';
      if (item.category === 'issuance') {
        categoryBadge = `<span class="badge" style="font-size: 0.65rem; padding: 0.15rem 0.4rem; margin-left: 0.5rem; background-color: rgba(168, 85, 247, 0.15); color: var(--color-purple); border: 1px solid rgba(168, 85, 247, 0.25);">Disbursed</span>`;
      } else if (item.category === 'increase') {
        categoryBadge = `<span class="badge" style="font-size: 0.65rem; padding: 0.15rem 0.4rem; margin-left: 0.5rem; background-color: rgba(14, 165, 233, 0.15); color: var(--color-accent); border: 1px solid rgba(14, 165, 233, 0.25);">Lend More (Top-up)</span>`;
      } else if (item.category === 'principal') {
        categoryBadge = `<span class="badge badge-success" style="font-size: 0.65rem; padding: 0.15rem 0.4rem; margin-left: 0.5rem; background-color: rgba(16, 185, 129, 0.15); color: var(--color-success); border: 1px solid rgba(16, 185, 129, 0.25);">Principal Repayment</span>`;
      } else {
        categoryBadge = `<span class="badge badge-accent" style="font-size: 0.65rem; padding: 0.15rem 0.4rem; margin-left: 0.5rem; background-color: rgba(14, 165, 233, 0.15); color: var(--color-accent); border: 1px solid rgba(14, 165, 233, 0.25);">Interest</span>`;
      }
      
      // Hide delete button for original issuance
      const canDelete = item.category !== 'issuance';
      const deleteBtnHtml = canDelete
        ? `<button class="ledger-delete" onclick="deleteLedgerPayment('${item.id}', '${loanId}', '${direction}')">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
           </button>`
        : '';

      div.innerHTML = `
        <div class="ledger-info">
          <div style="display: flex; align-items: center; gap: 0.25rem;">
            <span class="ledger-amount" style="color: ${item.category === 'issuance' || item.category === 'increase' ? 'var(--text-primary)' : 'inherit'}">${formatCurrency(item.amount)}</span>
            ${categoryBadge}
          </div>
          <span class="ledger-date">${formatDate(item.date)}</span>
          ${item.note ? `<span class="ledger-note">${item.note.replace('[Advance]', '<span style="color:var(--color-purple);font-weight:600;">[Advance]</span>')}</span>` : ''}
        </div>
        ${deleteBtnHtml}
      `;
      listContainer.appendChild(div);
    });
  }

  openModal('modal-ledger');
}

// Delete specific ledger transaction
function deleteLedgerPayment(payId, loanId, direction) {
  if (!confirm('Remove this payment log entry?')) return;
  loadState();
  const payment = state.interestPayments.find(p => p.id === payId);
  if (payment) {
    // If it was a Lend More (top-up) entry, subtract it from the loan's principal
    if (payment.category === 'increase') {
      const listName = direction === 'lent' ? 'lent' : 'borrowed';
      const loan = state[listName].find(l => l.id === loanId);
      if (loan) {
        loan.principal = Math.max(0, Number(loan.principal) - Number(payment.amount));
      }
    }
    state.interestPayments = state.interestPayments.filter(p => p.id !== payId);
    saveState();
  }
  
  // Re-render ledger dialog and active layouts
  showLedger(loanId, direction);
  if (direction === 'lent') renderLending();
  else renderBorrowing();
}

// Bind to window for HTML button triggers
window.editLoan = editLoan;
window.toggleLoanStatus = toggleLoanStatus;
window.deleteLoan = deleteLoan;
window.promptPayment = promptPayment;
window.showLedger = showLedger;
window.deleteLedgerPayment = deleteLedgerPayment;

// 11. RENTALS TAB CONTROLLERS & ACTIONS

// Rental Creation form Submit
document.getElementById('form-rental').addEventListener('submit', (e) => {
  e.preventDefault();
  loadState();

  const id = document.getElementById('rental-id').value;
  const propertyName = document.getElementById('rental-property').value;
  const tenantName = document.getElementById('rental-tenant').value;
  const contactInfo = document.getElementById('rental-contact').value;
  const monthlyRent = Number(document.getElementById('rental-rent').value);
  const securityDeposit = Number(document.getElementById('rental-deposit').value);
  const startDate = document.getElementById('rental-start-date').value;
  const rentDueDay = Number(document.getElementById('rental-due-day').value);

  const aadhaarImg = document.getElementById('rental-aadhaar-base64').value;
  const agreementImg = document.getElementById('rental-agreement-base64').value;

  if (id) {
    // Edit
    const index = state.rentals.findIndex(x => x.id === id);
    if (index !== -1) {
      state.rentals[index] = {
        ...state.rentals[index],
        propertyName,
        tenantName,
        contactInfo,
        monthlyRent,
        securityDeposit,
        startDate,
        rentDueDay,
        aadhaarImg: aadhaarImg || state.rentals[index].aadhaarImg,
        agreementImg: agreementImg || state.rentals[index].agreementImg
      };
    }
    saveState();
    closeModal('modal-rental');
    renderRentals();
  } else {
    // Add
    const newId = 'r' + Math.random().toString(36).substr(2, 9);
    state.rentals.push({
      id: newId,
      propertyName,
      tenantName,
      contactInfo,
      monthlyRent,
      securityDeposit,
      startDate,
      rentDueDay,
      aadhaarImg,
      agreementImg,
      status: 'active'
    });
    saveState();
    closeModal('modal-rental');
    renderDashboard();
    setTimeout(function() {
      switchTab('dashboard');
      if (currentReminderFilter === 'rent') currentReminderFilter = 'all';
      toggleReminderFilter('rent');
      var card = document.getElementById('card-rent');
      if (card) card.classList.add('highlight-card');
      setTimeout(function() {
        var newCard = document.querySelector('[data-id="' + newId + '"]');
        if (newCard) newCard.classList.add('new-entry-highlight');
      }, 100);
    }, 150);
  }
});

function updateRentalRenewalDate() {
  const startDateStr = document.getElementById('rental-start-date').value;
  const displayEl = document.getElementById('rental-renewal-date-display');
  if (!displayEl) return;
  if (!startDateStr) {
    displayEl.textContent = '';
    return;
  }
  const startDate = new Date(startDateStr);
  if (isNaN(startDate.getTime())) return;

  // Auto-set rent cycle to start date's day
  const dueSel = document.getElementById('rental-due-day');
  if (dueSel) dueSel.value = startDate.getDate();
  
  const renewalDate = new Date(startDate);
  renewalDate.setMonth(renewalDate.getMonth() + 11);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  displayEl.textContent = `RENEWS ON: ${renewalDate.toLocaleDateString(undefined, options)}`;
}
window.updateRentalRenewalDate = updateRentalRenewalDate;

// Edit Rental Trigger
function editRental(id) {
  loadState();
  const rental = state.rentals.find(r => r.id === id);
  if (!rental) return;

  document.getElementById('rental-id').value = rental.id;
  document.getElementById('rental-property').value = rental.propertyName;
  document.getElementById('rental-tenant').value = rental.tenantName;
  document.getElementById('rental-contact').value = rental.contactInfo || '';
  document.getElementById('rental-rent').value = rental.monthlyRent;
  document.getElementById('rental-deposit').value = rental.securityDeposit;
  document.getElementById('rental-start-date').value = rental.startDate;
  document.getElementById('rental-due-day').value = rental.rentDueDay;
  
  updateRentalRenewalDate();

  // Set existing image values
  document.getElementById('rental-aadhaar-base64').value = rental.aadhaarImg || '';
  document.getElementById('rental-agreement-base64').value = rental.agreementImg || '';
  
  // Clear file inputs
  document.getElementById('rental-aadhaar-file').value = '';
  document.getElementById('rental-agreement-file').value = '';
  
  // Update status label display
  document.getElementById('rental-aadhaar-status').style.display = rental.aadhaarImg ? 'inline' : 'none';
  document.getElementById('rental-agreement-status').style.display = rental.agreementImg ? 'inline' : 'none';

  document.getElementById('rental-modal-title').textContent = 'Modify Tenant Agreement';
  openModal('modal-rental');
}

// Toggle rental agreement active status
function toggleRentalStatus(id) {
  loadState();
  const rental = state.rentals.find(r => r.id === id);
  if (!rental) return;

  if (rental.status === 'active') {
    rental.status = 'inactive';
    rental.endDate = new Date().toISOString().split('T')[0];
  } else {
    rental.status = 'active';
    delete rental.endDate;
  }
  saveState();
  renderRentals();
}

// Delete Rental
function deleteRental(id) {
  if (!confirm('Are you sure you want to permanently delete this lease contract? All logged historical rent receipts will also be deleted.')) return;
  
  loadState();
  state.rentals = state.rentals.filter(r => r.id !== id);
  // Clean rent payments
  state.rentPayments = state.rentPayments.filter(rp => rp.rentalId !== id);
  saveState();
  renderRentals();
}

// Prompt Rent Payment Modal
function promptRentPayment(rentalId) {
  document.getElementById('form-rent-payment').reset();
  document.getElementById('rent-payment-rental-id').value = rentalId;
  
  // Pre-fill amount & date
  const rental = state.rentals.find(r => r.id === rentalId);
  if (rental) {
    document.getElementById('rent-payment-amount').value = rental.monthlyRent;
  }
  
  const today = new Date();
  document.getElementById('rent-payment-date').value = today.toISOString().split('T')[0];
  document.getElementById('rent-payment-month').value = today.toISOString().slice(0, 7); // Pre-fill current month

  openModal('modal-rent-payment');
}

function quickRentPayment(rentalId) {
  loadState();
  var input = document.getElementById('quick-rent-' + rentalId);
  if (!input) return;
  var amount = Number(input.value);
  if (!amount || amount <= 0) { alert('Enter an amount'); return; }
  input.value = '';
  var today = new Date();
  var datePaid = today.toISOString().split('T')[0];
  state.rentPayments.push({
    id: 'rp' + Math.random().toString(36).substr(2, 9),
    rentalId: rentalId,
    amount: amount,
    monthYear: selectedMonthStr,
    datePaid: datePaid,
    note: 'Quick Pay'
  });
  saveState();
  renderRentals();
  renderDashboard();
}
window.quickRentPayment = quickRentPayment;

function quickMarkRentPaid(rentalId) {
  loadState();
  const rental = state.rentals.find(r => r.id === rentalId);
  if (!rental) return;
  const today = new Date();
  const datePaid = today.toISOString().split('T')[0];
  state.rentPayments.push({
    id: 'rp' + Math.random().toString(36).substr(2, 9),
    rentalId: rentalId,
    amount: Number(rental.monthlyRent),
    monthYear: selectedMonthStr,
    datePaid: datePaid,
    note: 'Marked Paid'
  });
  saveState();
  renderRentals();
  renderDashboard();
}
window.quickMarkRentPaid = quickMarkRentPaid;

function quickUnmarkRentPaid(rentalId) {
  loadState();
  var payments = state.rentPayments;
  for (var i = payments.length - 1; i >= 0; i--) {
    if (payments[i].rentalId === rentalId && payments[i].monthYear === selectedMonthStr && payments[i].note === 'Marked Paid') {
      payments.splice(i, 1);
      break;
    }
  }
  saveState();
  renderRentals();
  renderDashboard();
}
window.quickUnmarkRentPaid = quickUnmarkRentPaid;

// Rent payment submit handler
document.getElementById('form-rent-payment').addEventListener('submit', (e) => {
  e.preventDefault();
  loadState();

  const rentalId = document.getElementById('rent-payment-rental-id').value;
  const amount = Number(document.getElementById('rent-payment-amount').value);
  const monthYear = document.getElementById('rent-payment-month').value; // YYYY-MM
  const datePaid = document.getElementById('rent-payment-date').value;
  const note = document.getElementById('rent-payment-note').value;

  const paymentId = 'rp' + Math.random().toString(36).substr(2, 9);
  state.rentPayments.push({
    id: paymentId,
    rentalId,
    amount,
    monthYear,
    datePaid,
    note
  });

  saveState();
  closeModal('modal-rent-payment');
  renderRentals();
});

// View Rent Payment Ledger
function showRentalLedger(rentalId) {
  loadState();
  const rental = state.rentals.find(r => r.id === rentalId);
  if (!rental) return;

  const history = state.rentPayments.filter(rp => rp.rentalId === rentalId);

  // Set Title
  document.getElementById('ledger-title').textContent = `Rent Ledger: ${rental.propertyName}`;

  // Build Stats
  const totalCollected = history.reduce((sum, rp) => sum + rp.amount, 0);
  const statsContainer = document.getElementById('ledger-stats');
  statsContainer.innerHTML = `
    <div class="loan-stat-box">
      <span class="loan-stat-val">${formatCurrency(rental.monthlyRent)}</span>
      <span class="loan-stat-lbl">Monthly Rent</span>
    </div>
    <div class="loan-stat-box">
      <span class="loan-stat-val">${formatCurrency(rental.securityDeposit)}</span>
      <span class="loan-stat-lbl">Deposit Held</span>
    </div>
    <div class="loan-stat-box">
      <span class="loan-stat-val" style="color: var(--color-purple);">${formatCurrency(totalCollected)}</span>
      <span class="loan-stat-lbl">Total Rent Paid</span>
    </div>
  `;

  // Build List
  const listContainer = document.getElementById('ledger-list-container');
  listContainer.innerHTML = '';

  if (history.length === 0) {
    listContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">No rent payments logged yet.</p>`;
  } else {
    // Sort reverse chronological
    const sortedHistory = [...history].sort((a,b) => b.monthYear.localeCompare(a.monthYear));
    sortedHistory.forEach(item => {
      // Format Year string (e.g. 2026-06 -> June 2026)
      const parts = item.monthYear.split('-');
      const dateName = MONTH_UPPER_NAMES[parseInt(parts[1]) - 1] + ' ' + parts[0];

      const div = document.createElement('div');
      div.className = 'ledger-item';
      div.innerHTML = `
        <div class="ledger-info">
          <span class="ledger-amount">${formatCurrency(item.amount)}</span>
          <span class="ledger-date">Period: ${dateName} (Paid ${formatDate(item.datePaid)})</span>
          ${item.note ? `<span class="ledger-note">${item.note}</span>` : ''}
        </div>
        <button class="ledger-delete" onclick="deleteRentPayment('${item.id}', '${rentalId}')">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
        </button>
      `;
      listContainer.appendChild(div);
    });
  }

  openModal('modal-ledger');
}

// Delete specific rent payment log entry
function deleteRentPayment(payId, rentalId) {
  if (!confirm('Remove this rent log entry?')) return;
  loadState();
  state.rentPayments = state.rentPayments.filter(rp => rp.id !== payId);
  saveState();
  
  showRentalLedger(rentalId);
  renderRentals();
}

// Bind to window for HTML button triggers
window.editRental = editRental;
window.toggleRentalStatus = toggleRentalStatus;
window.deleteRental = deleteRental;
window.promptRentPayment = promptRentPayment;
window.showRentalLedger = showRentalLedger;
window.deleteRentPayment = deleteRentPayment;

} catch(e) { console.error('Top-level handler error:', e); }

// 12. SYSTEM SETTINGS HANDLERS

// Load mock demo data
window.loadMockData = function() {
  if (!confirm('Load demo data? This will replace all existing data with sample entries.')) return;
  loadState();
  var today = new Date();
  var y = today.getFullYear();
  var m = String(today.getMonth() + 1).padStart(2, '0');
  var d = String(today.getDate()).padStart(2, '0');
  var todayStr = y + '-' + m + '-' + d;
  var currMonth = y + '-' + m;

  function daysAgo(n) { var dt = new Date(today); dt.setDate(dt.getDate() - n); return dt.toISOString().slice(0,10); }
  function daysFromNow(n) { var dt = new Date(today); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0,10); }

  // Clear existing data
  state.rentals = [];
  state.lent = [];
  state.borrowed = [];
  state.interestPayments = [];
  state.rentPayments = [];
  state.expenses = [];
  state.renewals = [];
  state.files = [];

  // === RENTALS (5) ===
  state.rentals.push(
    { id: 'r_demo_1', propertyName: '23/48 ground floor', tenantName: 'Rahul Sharma', contactInfo: '9876543210', monthlyRent: 18000, securityDeposit: 54000, startDate: '2024-01-01', rentDueDay: 5, aadhaarImg: '', agreementImg: '', status: 'active' },
    { id: 'r_demo_2', propertyName: '23/48 3rd floor', tenantName: 'Amit Verma', contactInfo: '9876543211', monthlyRent: 22000, securityDeposit: 66000, startDate: '2024-06-01', rentDueDay: 7, aadhaarImg: '', agreementImg: '', status: 'active' },
    { id: 'r_demo_3', propertyName: '1/104', tenantName: 'Priya Singh', contactInfo: '9876543212', monthlyRent: 15000, securityDeposit: 30000, startDate: '2025-03-01', rentDueDay: 10, aadhaarImg: '', agreementImg: '', status: 'active' },
    { id: 'r_demo_4', propertyName: '5/202', tenantName: 'Suresh Reddy', contactInfo: '9876543213', monthlyRent: 25000, securityDeposit: 75000, startDate: '2025-09-01', rentDueDay: 3, aadhaarImg: '', agreementImg: '', status: 'active' },
    { id: 'r_demo_5', propertyName: '23/48 ground floor', tenantName: 'Meera Nair', contactInfo: '9876543214', monthlyRent: 12000, securityDeposit: 24000, startDate: '2026-01-15', rentDueDay: 15, aadhaarImg: '', agreementImg: '', status: 'active' }
  );

  // === RENT PAYMENTS (mix of paid months, some current month pending) ===
  var pm1 = getPreviousMonthStr(1); // last month
  var pm2 = getPreviousMonthStr(2); // 2 months ago
  var pm3 = getPreviousMonthStr(3); // 3 months ago

  state.rentPayments.push(
    // Rahul - paid last 3 months
    { id: 'rp_demo_1', rentalId: 'r_demo_1', amount: 18000, monthYear: currMonth, datePaid: daysAgo(3), note: 'Rent collected' },
    { id: 'rp_demo_2', rentalId: 'r_demo_1', amount: 18000, monthYear: pm1, datePaid: daysAgo(33), note: 'Rent collected' },
    { id: 'rp_demo_3', rentalId: 'r_demo_1', amount: 18000, monthYear: pm2, datePaid: daysAgo(63), note: 'Rent collected' },
    // Amit - paid last 2 months (current month unpaid)
    { id: 'rp_demo_4', rentalId: 'r_demo_2', amount: 22000, monthYear: pm1, datePaid: daysAgo(28), note: 'Rent collected' },
    { id: 'rp_demo_5', rentalId: 'r_demo_2', amount: 22000, monthYear: pm2, datePaid: daysAgo(58), note: 'Rent collected' },
    // Priya - paid last month (current month unpaid)
    { id: 'rp_demo_6', rentalId: 'r_demo_3', amount: 15000, monthYear: pm1, datePaid: daysAgo(25), note: 'Rent collected' },
    // Suresh - paid all 3 months
    { id: 'rp_demo_7', rentalId: 'r_demo_4', amount: 25000, monthYear: currMonth, datePaid: daysAgo(2), note: 'Rent collected' },
    { id: 'rp_demo_8', rentalId: 'r_demo_4', amount: 25000, monthYear: pm1, datePaid: daysAgo(30), note: 'Rent collected' },
    { id: 'rp_demo_9', rentalId: 'r_demo_4', amount: 25000, monthYear: pm2, datePaid: daysAgo(60), note: 'Rent collected' },
    // Meera - paid last month only
    { id: 'rp_demo_10', rentalId: 'r_demo_5', amount: 12000, monthYear: pm1, datePaid: daysAgo(20), note: 'Rent collected' }
  );

  // === LENT LOANS (5) ===
  state.lent.push(
    { id: 'l_demo_1', borrowerName: 'Vikram Patel', phone: '9988776655', principal: 100000, interestRate: 3, startDate: '2025-01-15', dueDate: null, status: 'active', notes: 'Business loan' },
    { id: 'l_demo_2', borrowerName: 'Sunil Kumar', phone: '9988776644', principal: 50000, interestRate: 2.5, startDate: '2025-03-01', dueDate: null, status: 'active', notes: 'Personal loan' },
    { id: 'l_demo_3', borrowerName: 'Deepak Joshi', phone: '9988776633', principal: 200000, interestRate: 2, startDate: '2025-06-01', dueDate: null, status: 'active', notes: 'Emergency loan' },
    { id: 'l_demo_4', borrowerName: 'Ravi Deshmukh', phone: '9988776622', principal: 75000, interestRate: 4, startDate: '2025-11-01', dueDate: '2026-09-01', status: 'active', notes: 'Short-term business loan' },
    { id: 'l_demo_5', borrowerName: 'Anita Sharma', phone: '9988776611', principal: 300000, interestRate: 1.5, startDate: '2024-04-01', dueDate: '2026-03-01', status: 'paid', notes: 'Settled - full principal + interest paid' }
  );

  // === BORROWED LOANS (3) ===
  state.borrowed.push(
    { id: 'b_demo_1', financierName: 'HDFC Bank', phone: '18002586161', principal: 500000, interestRate: 1.5, startDate: '2024-08-01', dueDate: null, status: 'active', notes: 'Home loan - 20 year tenure' },
    { id: 'b_demo_2', financierName: 'Anil Gupta', phone: '9876501234', principal: 150000, interestRate: 2, startDate: '2025-05-01', dueDate: '2026-12-01', status: 'active', notes: 'Personal loan' },
    { id: 'b_demo_3', financierName: 'SBI Card', phone: '18001801111', principal: 45000, interestRate: 3.5, startDate: '2026-02-01', dueDate: null, status: 'active', notes: 'Credit card outstanding' }
  );

  // === INTEREST PAYMENTS (mix) ===
  // Lent interest received
  state.interestPayments.push(
    // Vikram - paid current month + last 3 months
    { id: 'ip_demo_01', loanId: 'l_demo_1', type: 'received', category: 'interest', amount: 3000, date: daysAgo(2), note: 'Monthly interest - July' },
    { id: 'ip_demo_02', loanId: 'l_demo_1', type: 'received', category: 'interest', amount: 3000, date: daysAgo(32), note: 'Monthly interest - June' },
    { id: 'ip_demo_03', loanId: 'l_demo_1', type: 'received', category: 'interest', amount: 3000, date: daysAgo(62), note: 'Monthly interest - May' },
    { id: 'ip_demo_04', loanId: 'l_demo_1', type: 'received', category: 'interest', amount: 3000, date: daysAgo(92), note: 'Monthly interest - Apr' },
    // Sunil - paid current month
    { id: 'ip_demo_05', loanId: 'l_demo_2', type: 'received', category: 'interest', amount: 1250, date: daysAgo(5), note: 'Monthly interest - July' },
    { id: 'ip_demo_06', loanId: 'l_demo_2', type: 'received', category: 'interest', amount: 1250, date: daysAgo(35), note: 'Monthly interest - June' },
    // Deepak - paid current month
    { id: 'ip_demo_07', loanId: 'l_demo_3', type: 'received', category: 'interest', amount: 4000, date: daysAgo(4), note: 'Monthly interest - July' },
    { id: 'ip_demo_08', loanId: 'l_demo_3', type: 'received', category: 'interest', amount: 4000, date: daysAgo(34), note: 'Monthly interest - June' },
    // Ravi - paid current month
    { id: 'ip_demo_09', loanId: 'l_demo_4', type: 'received', category: 'interest', amount: 3000, date: daysAgo(1), note: 'Monthly interest - July' },
    { id: 'ip_demo_10', loanId: 'l_demo_4', type: 'received', category: 'interest', amount: 3000, date: daysAgo(31), note: 'Monthly interest - June' },
    // Initial issuances
    { id: 'ip_demo_11', loanId: 'l_demo_1', type: 'received', category: 'issuance', amount: 100000, date: '2025-01-15', note: 'Principal disbursed' },
    { id: 'ip_demo_12', loanId: 'l_demo_2', type: 'received', category: 'issuance', amount: 50000, date: '2025-03-01', note: 'Principal disbursed' },
    { id: 'ip_demo_13', loanId: 'l_demo_3', type: 'received', category: 'issuance', amount: 200000, date: '2025-06-01', note: 'Principal disbursed' },
    { id: 'ip_demo_14', loanId: 'l_demo_4', type: 'received', category: 'issuance', amount: 75000, date: '2025-11-01', note: 'Principal disbursed' },
    { id: 'ip_demo_15', loanId: 'l_demo_5', type: 'received', category: 'issuance', amount: 300000, date: '2024-04-01', note: 'Principal disbursed' },
    // Anita - fully settled (principal returned + final interest)
    { id: 'ip_demo_16', loanId: 'l_demo_5', type: 'received', category: 'interest', amount: 4500, date: '2026-03-01', note: 'Final interest' },
    { id: 'ip_demo_17', loanId: 'l_demo_5', type: 'received', category: 'principal', amount: 300000, date: '2026-03-01', note: 'Principal repaid' },
    // Borrowed interest paid
    { id: 'ip_demo_18', loanId: 'b_demo_1', type: 'paid', category: 'issuance', amount: 500000, date: '2024-08-01', note: 'Loan disbursed' },
    { id: 'ip_demo_19', loanId: 'b_demo_2', type: 'paid', category: 'issuance', amount: 150000, date: '2025-05-01', note: 'Loan disbursed' },
    { id: 'ip_demo_20', loanId: 'b_demo_3', type: 'paid', category: 'issuance', amount: 45000, date: '2026-02-01', note: 'Credit card' },
    { id: 'ip_demo_21', loanId: 'b_demo_1', type: 'paid', category: 'interest', amount: 7500, date: daysAgo(3), note: 'Monthly interest - July' },
    { id: 'ip_demo_22', loanId: 'b_demo_1', type: 'paid', category: 'interest', amount: 7500, date: daysAgo(33), note: 'Monthly interest - June' },
    { id: 'ip_demo_23', loanId: 'b_demo_2', type: 'paid', category: 'interest', amount: 3000, date: daysAgo(10), note: 'Monthly interest - July' },
    { id: 'ip_demo_24', loanId: 'b_demo_2', type: 'paid', category: 'interest', amount: 3000, date: daysAgo(40), note: 'Monthly interest - June' },
    { id: 'ip_demo_25', loanId: 'b_demo_3', type: 'paid', category: 'interest', amount: 1575, date: daysAgo(7), note: 'Monthly interest - July' },
    { id: 'ip_demo_26', loanId: 'b_demo_3', type: 'paid', category: 'interest', amount: 1575, date: daysAgo(37), note: 'Monthly interest - June' }
  );

  // === EXPENSES (15 entries across categories) ===
  state.expenses.push(
    { id: 'exp_demo_01', amount: 3500, date: daysAgo(1), category: 'Utilities', note: 'Electricity bill - July' },
    { id: 'exp_demo_02', amount: 1200, date: daysAgo(3), category: 'Travel / Fuel', note: 'Petrol' },
    { id: 'exp_demo_03', amount: 8500, date: daysAgo(7), category: 'Maintenance', note: 'Plumber - bathroom leak fix' },
    { id: 'exp_demo_04', amount: 2000, date: daysAgo(10), category: 'Others', note: 'Groceries' },
    { id: 'exp_demo_05', amount: 15000, date: daysAgo(14), category: 'Insurance', note: 'Car insurance premium paid' },
    { id: 'exp_demo_06', amount: 2500, date: daysAgo(5), category: 'Utilities', note: 'Water bill' },
    { id: 'exp_demo_07', amount: 600, date: daysAgo(8), category: 'Travel / Fuel', note: 'Auto rickshaw' },
    { id: 'exp_demo_08', amount: 4200, date: daysAgo(12), category: 'Maintenance', note: 'Electrician - wiring repair' },
    { id: 'exp_demo_09', amount: 11000, date: daysAgo(15), category: 'Taxes', note: 'Property tax installment' },
    { id: 'exp_demo_10', amount: 1800, date: daysAgo(6), category: 'Others', note: 'Medicine' },
    { id: 'exp_demo_11', amount: 45000, date: daysAgo(20), category: 'Construction', project: '23/48 3rd floor', laborType: 'Mistri', workerName: 'Rajesh', paymentMethod: 'cash', note: 'Bathroom renovation - labor' },
    { id: 'exp_demo_12', amount: 12000, date: daysAgo(22), category: 'Construction', project: '23/48 3rd floor', laborType: 'Electrician', workerName: 'Suresh', paymentMethod: 'upi', note: 'Electrical work - materials + labor' },
    { id: 'exp_demo_13', amount: 8500, date: daysAgo(18), category: 'Construction', project: '23/48 ground floor', laborType: 'Painter', workerName: 'Mohan', paymentMethod: 'cash', note: 'Living room painting' },
    { id: 'exp_demo_14', amount: 22000, date: daysAgo(25), category: 'Construction', project: '23/48 ground floor', laborType: 'Carpenter', workerName: 'Ramesh', paymentMethod: 'cash', note: 'Modular kitchen - advance' },
    { id: 'exp_demo_15', amount: 3000, date: daysAgo(30), category: 'Maintenance', note: 'AC servicing - 2 units' }
  );

  // === RENEWALS (8) ===
  state.renewals.push(
    { id: 'rn_demo_1', title: 'Car Insurance', category: 'Insurance', amount: 12000, dueDate: daysFromNow(15), frequency: 'yearly', note: 'Maruti Suzuki Baleno', lastRenewed: null, createdAt: new Date().toISOString() },
    { id: 'rn_demo_2', title: 'Health Insurance', category: 'Insurance', amount: 25000, dueDate: daysFromNow(22), frequency: 'yearly', note: 'Family floater - 4 members', lastRenewed: null, createdAt: new Date().toISOString() },
    { id: 'rn_demo_3', title: 'Pollution Certificate', category: 'Certificate', amount: 800, dueDate: daysFromNow(10), frequency: 'yearly', note: 'KA-01-1234', lastRenewed: null, createdAt: new Date().toISOString() },
    { id: 'rn_demo_4', title: 'I.T.R Filing', category: 'Tax', amount: 0, dueDate: daysFromNow(45), frequency: 'yearly', note: 'FY 2025-26', lastRenewed: null, createdAt: new Date().toISOString() },
    { id: 'rn_demo_5', title: 'House Tax', category: 'Tax', amount: 8500, dueDate: daysFromNow(60), frequency: 'yearly', note: 'BBMP property tax', lastRenewed: null, createdAt: new Date().toISOString() },
    { id: 'rn_demo_6', title: 'Netflix Subscription', category: 'Subscription', amount: 650, dueDate: daysFromNow(18), frequency: 'monthly', note: 'Monthly premium plan', lastRenewed: null, createdAt: new Date().toISOString() },
    { id: 'rn_demo_7', title: 'Life Insurance', category: 'Insurance', amount: 18000, dueDate: daysFromNow(35), frequency: 'yearly', note: 'LIC Jeevan Anand', lastRenewed: null, createdAt: new Date().toISOString() },
    { id: 'rn_demo_8', title: 'Vehicle RC Renewal', category: 'Certificate', amount: 600, dueDate: daysFromNow(28), frequency: 'yearly', note: 'KA-01-1234', lastRenewed: null, createdAt: new Date().toISOString() }
  );

  // === FILES (metadata only, no base64) ===
  state.files.push(
    { id: 'file_demo_1', type: 'bills', title: 'July Electricity Bill', date: daysAgo(2) },
    { id: 'file_demo_2', type: 'bills', title: 'Water Bill - Q2', date: daysAgo(10) },
    { id: 'file_demo_3', type: 'documents', title: 'Rahul Sharma - Rent Agreement', date: '2024-01-01', fileNumber: 'RA-2024-001' },
    { id: 'file_demo_4', type: 'documents', title: 'Property Tax Receipt 2025-26', date: daysAgo(15), fileNumber: 'PTR-2025-1234' },
    { id: 'file_demo_5', type: 'policies', title: 'Car Insurance Policy', date: '2025-07-15', fileNumber: 'MOT-2025-7890' },
    { id: 'file_demo_6', type: 'policies', title: 'Health Insurance Policy', date: '2025-06-01', fileNumber: 'HLTH-2025-4567' }
  );

  state.properties = ['23/48 ground floor', '23/48 3rd floor', '1/104', '5/202'];

  // Reset glance renewal dismiss index
  _glanceRenewalDismissIdx = 0;

  saveState();
  switchTab('dashboard');
  renderDashboard();
  showToast('Demo data loaded!', 'success');
};

// Helper
function getPreviousMonthStr(monthsAgo) {
  var dt = new Date();
  dt.setDate(1);
  dt.setMonth(dt.getMonth() - monthsAgo);
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
}

// Hard system reset
document.getElementById('btn-reset-data').addEventListener('click', () => {
  if (confirm('CRITICAL WARNING: This will completely delete all your loans, properties, tenants, and logged history. Are you absolutely sure?')) {
    if (confirm('Confirm one last time. This cannot be undone.')) {
      clearFileDB();
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY + '_v');
      state = {
        lent: [],
        borrowed: [],
        rentals: [],
        interestPayments: [],
        rentPayments: [],
        expenses: [],
        renewals: [],
        files: [],
        theme: 'black-and-colored'
      };
      saveState();
      alert('Local database wiped successfully.');
      switchTab('dashboard');
    }
  }
});

// Search feature in Dashboard
function initSearch() {
  const searchInput = document.getElementById('dashboard-search');
  const resultsSection = document.getElementById('search-results-section');
  const resultsList = document.getElementById('search-results-list');
  const clearBtn = document.getElementById('btn-clear-search');

  if (!searchInput || !resultsSection || !resultsList || !clearBtn) return;

  const performSearch = () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      resultsSection.style.display = 'none';
      resultsList.innerHTML = '';
      return;
    }

    resultsSection.style.display = 'block';
    resultsList.innerHTML = '';

    // Search Lent
    const matchedLent = state.lent.filter(l => 
      (l.borrowerName && l.borrowerName.toLowerCase().includes(query)) || 
      (l.phone && l.phone.includes(query)) ||
      (l.notes && l.notes.toLowerCase().includes(query))
    );

    // Search Borrowed
    const matchedBorrowed = state.borrowed.filter(b => 
      (b.financierName && b.financierName.toLowerCase().includes(query)) || 
      (b.phone && b.phone.includes(query)) ||
      (b.notes && b.notes.toLowerCase().includes(query))
    );

    // Search Rentals
    const matchedRentals = state.rentals.filter(r => 
      (r.tenantName && r.tenantName.toLowerCase().includes(query)) || 
      (r.propertyName && r.propertyName.toLowerCase().includes(query)) ||
      (r.contactInfo && r.contactInfo.toLowerCase().includes(query))
    );

    const totalMatches = matchedLent.length + matchedBorrowed.length + matchedRentals.length;

    if (totalMatches === 0) {
      resultsList.innerHTML = `
        <div class="empty-state" style="padding: 1.5rem 0;">
          <p>No matching borrowers, financiers, tenants, or properties found.</p>
        </div>
      `;
      return;
    }

    // Render Lent Matches
    matchedLent.forEach(loan => {
      const loanInterestPayments = state.interestPayments.filter(p => p.loanId === loan.id && p.type === 'received');
      const totalReceived = loanInterestPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const item = document.createElement('div');
      item.className = 'reminder-item info';
      item.style.cursor = 'pointer';
      item.style.marginBottom = '0.5rem';
      item.innerHTML = `
        <div class="reminder-icon-wrapper" style="background: rgba(16, 185, 129, 0.15); color: var(--color-success);">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
        </div>
        <div class="reminder-details">
          <div class="reminder-title" style="font-weight:700;">${loan.borrowerName} <span class="badge badge-success" style="margin-left: 6px;">Lent</span></div>
          <div class="reminder-subtitle">Principal: ${formatCurrency(loan.principal)} | Rate: ${loan.interestRate}% | Recd: ${formatCurrency(totalReceived)}</div>
        </div>
        <div>
          <span class="badge ${loan.status === 'active' ? 'badge-success' : 'badge-muted'}">${loan.status}</span>
        </div>
      `;
      item.addEventListener('click', () => {
        switchTab('dashboard');
        currentReminderFilter = 'interest';
        renderDashboard();
        searchInput.value = '';
        resultsSection.style.display = 'none';
        resultsList.innerHTML = '';
        setTimeout(() => {
          const el = document.querySelector(`[data-loan-ids*="${loan.id}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('card-highlight-active');
            setTimeout(() => el.classList.remove('card-highlight-active'), 5000);
          }
        }, 300);
      });
      resultsList.appendChild(item);
    });

    // Render Borrowed Matches
    matchedBorrowed.forEach(loan => {
      const loanInterestPayments = state.interestPayments.filter(p => p.loanId === loan.id && p.type === 'paid');
      const totalPaid = loanInterestPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const item = document.createElement('div');
      item.className = 'reminder-item warning';
      item.style.cursor = 'pointer';
      item.style.marginBottom = '0.5rem';
      item.innerHTML = `
        <div class="reminder-icon-wrapper" style="background: rgba(239, 68, 68, 0.15); color: var(--color-danger);">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 17L7 7M7 7H17M7 7V17"/></svg>
        </div>
        <div class="reminder-details">
          <div class="reminder-title" style="font-weight:700;">${loan.financierName} <span class="badge badge-warning" style="margin-left: 6px;">Borrowed</span></div>
          <div class="reminder-subtitle">Owed: ${formatCurrency(loan.principal)} | Rate: ${loan.interestRate}% | Paid: ${formatCurrency(totalPaid)}</div>
        </div>
        <div>
          <span class="badge ${loan.status === 'active' ? 'badge-danger' : 'badge-muted'}">${loan.status === 'active' ? 'Owed' : 'Paid'}</span>
        </div>
      `;
      item.addEventListener('click', () => {
        switchTab('dashboard');
        currentReminderFilter = 'interest';
        renderDashboard();
        searchInput.value = '';
        resultsSection.style.display = 'none';
        resultsList.innerHTML = '';
        setTimeout(() => {
          const el = document.querySelector(`[data-loan-ids*="${loan.id}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('card-highlight-active');
            setTimeout(() => el.classList.remove('card-highlight-active'), 5000);
          }
        }, 300);
      });
      resultsList.appendChild(item);
    });

    // Render Rental Matches
    matchedRentals.forEach(rental => {
      const item = document.createElement('div');
      item.className = 'reminder-item info';
      item.style.cursor = 'pointer';
      item.style.marginBottom = '0.5rem';
      item.innerHTML = `
        <div class="reminder-icon-wrapper" style="background: rgba(168, 85, 247, 0.15); color: var(--color-purple);">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        </div>
        <div class="reminder-details">
          <div class="reminder-title" style="font-weight:700;">${rental.tenantName} <span class="badge badge-info" style="margin-left: 6px;">Rental</span></div>
          <div class="reminder-subtitle">Prop: ${rental.propertyName} | Rent: ${formatCurrency(rental.monthlyRent)}/mo | Due Day: ${rental.rentDueDay}th</div>
        </div>
        <div>
          <span class="badge ${rental.status === 'active' ? 'badge-success' : 'badge-muted'}">${rental.status === 'active' ? 'Active' : 'Ended'}</span>
        </div>
      `;
      item.addEventListener('click', () => {
        switchTab('dashboard');
        currentReminderFilter = 'rent';
        renderDashboard();
        searchInput.value = '';
        resultsSection.style.display = 'none';
        resultsList.innerHTML = '';
        setTimeout(() => {
          const el = document.querySelector(`[data-id="${rental.id}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('card-highlight-active');
            setTimeout(() => el.classList.remove('card-highlight-active'), 2000);
          }
        }, 300);
      });
      resultsList.appendChild(item);
    });
  };

  searchInput.addEventListener('input', performSearch);
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    performSearch();
  });
}

// Records search
function initRecordsSearch() {
  var input = document.getElementById('records-search-header');
  if (!input) return;
  var resultsContainer = document.createElement('div');
  resultsContainer.id = 'records-search-results';
  resultsContainer.style.cssText = 'display: none;';
  var recordsView = document.getElementById('view-records');
  if (recordsView) {
    recordsView.insertBefore(resultsContainer, recordsView.firstChild);
  }
  
  input.addEventListener('input', function() {
    var q = this.value.trim().toLowerCase();
    if (!q) { resultsContainer.style.display = 'none'; resultsContainer.innerHTML = ''; return; }
    
    var matchedFiles = state.files.filter(function(f) { return f.title && f.title.toLowerCase().includes(q); });
    var matchedConst = (state.expenses || []).filter(function(e) {
      if (!e || e.category !== 'construction') return false;
      return (e.laborType && e.laborType.toLowerCase().includes(q)) ||
             (e.project && e.project.toLowerCase().includes(q)) ||
             (e.workerName && e.workerName.toLowerCase().includes(q)) ||
             (e.note && e.note.toLowerCase().includes(q));
    });
    
    if (matchedFiles.length === 0 && matchedConst.length === 0) {
      resultsContainer.innerHTML = '<div class="card" style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No records found.</div>';
      resultsContainer.style.display = 'block';
      return;
    }
    
    var html = '<div class="card" style="padding: 0.75rem;">';
    matchedFiles.forEach(function(f) {
      var typeLabel = f.type.charAt(0).toUpperCase() + f.type.slice(1);
      var colorMap = {bills: 'var(--color-warning)', documents: 'var(--color-success)', policies: 'var(--color-purple)'};
      var color = colorMap[f.type] || 'var(--text-primary)';
      html += '<div onclick="selectRecordsTab(\'' + f.type + '\'); setTimeout(function(){ var el=document.querySelector(\'[data-file-id=&quot;' + f.id + '&quot;]\'); if(el){ el.scrollIntoView({behavior:\'smooth\',block:\'center\'}); el.classList.add(\'card-highlight-active\'); setTimeout(function(){ el.classList.remove(\'card-highlight-active\') },5000); } },200); document.getElementById(\'records-search-header\').value=\'\'; document.getElementById(\'records-search-results\').style.display=\'none\';" style="cursor:pointer; padding:0.5rem; border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:0.5rem;">' +
        '<span style="font-size:0.6rem; font-weight:700; text-transform:uppercase; color:' + color + ';">' + typeLabel + '</span>' +
        '<span style="flex:1; font-weight:600; color:var(--text-primary); font-size:0.85rem;">' + f.title + '</span>' +
        '<span style="font-size:0.7rem; color:var(--text-muted);">' + f.date + '</span>' +
      '</div>';
    });
    matchedConst.forEach(function(e) {
      html += '<div onclick="selectRecordsTab(\'construction\', \'' + (e.project || '').replace(/'/g, "\\'") + '\'); setTimeout(function(){ document.getElementById(\'records-search-header\').value=\'\'; document.getElementById(\'records-search-results\').style.display=\'none\'; },200);" style="cursor:pointer; padding:0.5rem; border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:0.5rem;">' +
        '<span style="font-size:0.6rem; font-weight:700; text-transform:uppercase; color:var(--color-accent);">Const</span>' +
        '<span style="flex:1; font-weight:600; color:var(--text-primary); font-size:0.85rem;">' + (e.laborType || 'General') + ' - ' + (e.project || '') + '</span>' +
        '<span style="font-weight:700; color:var(--color-danger); font-size:0.8rem;">' + formatCurrency(e.amount) + '</span>' +
      '</div>';
    });
    html += '</div>';
    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';
  });
}

// CONSTRUCTION TRACKING LOGIC
window.openConstructionModal = function(id = null) {
  document.getElementById('form-construction').reset();
  document.getElementById('construction-id').value = '';
  document.getElementById('const-date').value = new Date().toISOString().slice(0, 10);
  
  if (id) {
    const expense = state.expenses.find(e => e.id === id);
    if (expense) {
      document.getElementById('construction-id').value = expense.id;
      document.getElementById('const-project').value = expense.project || '';
      document.getElementById('const-labor').value = expense.laborType || '';
      document.getElementById('const-worker').value = expense.workerName || '';
      document.getElementById('const-amount').value = expense.amount || '';
      document.getElementById('const-date').value = expense.date || '';
      document.getElementById('const-notes').value = expense.note || '';
    }
  }
  
  document.getElementById('modal-construction').style.display = 'flex';
};

window.deleteConstruction = function(id) {
  if(confirm('Are you sure you want to delete this construction payment?')) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    saveState();
    refreshActiveTab();
  }
};

window._selectedConstCat = null;
window._selectedConstPayMethod = 'cash';
window._selectedConstProject = window._selectedConstProject || '23/48 Ground Floor';

window.selectConstCategory = function(cat) {
  if (window._selectedConstCat === cat) {
    window._selectedConstCat = null;
  } else {
    window._selectedConstCat = cat;
  }
  renderConstruction();
  if (window._selectedConstCat) {
    setTimeout(function() {
      var amtInput = document.getElementById('const-amount');
      if (amtInput) amtInput.focus();
    }, 50);
  }
};

window.selectConstProject = function(el) {
  window._selectedConstProject = el.getAttribute('data-project');
  renderConstruction();
};

window.selectConstPayMethod = function(method) {
  window._selectedConstPayMethod = method;
  renderConstruction();
};

window.submitQuickConst = function() {
  var project = window._selectedConstProject;
  if (!project) { alert('Please select a property.'); return; }
  var amtInput = document.getElementById('const-amount');
  var notesInput = document.getElementById('const-notes');
  if (!amtInput || !notesInput) return;
  
  var amt = Number(amtInput.value);
  if (!amt || amt <= 0) {
    alert('Please enter a valid amount.');
    return;
  }
  
  var cat = window._selectedConstCat || 'Mistri';
  var method = window._selectedConstPayMethod || 'cash';
  
  var newExp = {
    id: 'exp_' + Date.now(),
    category: 'construction',
    project: project,
    laborType: cat,
    paymentMethod: method,
    amount: amt,
    date: new Date().toISOString().slice(0, 10),
    note: notesInput.value.trim()
  };
  
  state.expenses.push(newExp);
  saveState();
  
  amtInput.value = '';
  notesInput.value = '';
  window._selectedConstCat = null;
  
  switchTab('dashboard');
  renderDashboard();
  setTimeout(function() {
    var card = document.getElementById('card-expenses');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('highlight-card');
    }
  }, 150);
};

function renderConstruction() {
  var container = document.getElementById('construction-list-container');
  if (!container) return;
  
  try {
    var projects = (state.properties || []).slice();
    if (projects.length === 0) projects = ['23/48 Ground Floor', '23/48 3rd Floor', '1/104'];
    var constructionExpenses = (state.expenses || []).filter(function(e) { return e && e.category === 'construction'; });
    var categories = ['Carpenter', 'Painter', 'Welding', 'Mistri', 'Electrician', 'Plumber', 'Malba', 'Hardware', 'Furniture', 'Ghisai', 'Glass Work', 'AC Service', 'Others'];
    
    var selectedProject = window._selectedConstProject;
    if (!selectedProject || projects.indexOf(selectedProject) === -1) {
      selectedProject = projects[0];
      window._selectedConstProject = selectedProject;
    }
    var payMethod = window._selectedConstPayMethod || 'cash';
    
    var exps = constructionExpenses.filter(function(e) { return e && e.project === selectedProject; }).sort(function(a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });
    var total = exps.reduce(function(sum, e) { return sum + (Number(e.amount) || 0); }, 0);
    
    var catButtonsHtml = categories.map(function(cat) {
      var isSelected = window._selectedConstCat === cat;
      var bg = isSelected ? 'var(--color-accent)' : 'var(--bg-primary)';
      var color = isSelected ? '#fff' : 'var(--text-secondary)';
      var border = isSelected ? '1px solid var(--color-accent)' : '1px solid var(--border-color)';
      return '<button type="button" class="const-cat-btn" data-cat="' + cat + '" onclick="selectConstCategory(\'' + cat + '\')" style="padding: 0.4rem 0.65rem; font-size: 0.78rem; border-radius: 5px; background: ' + bg + '; color: ' + color + '; border: ' + border + '; cursor: pointer; transition: all 0.2s;">' + cat + '</button>';
    }).join('');
    
    var expensesHtml = '';
    if (exps.length > 0) {
      exps.slice(0, 10).forEach(function(exp) {
        expensesHtml += '<div style="display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0.5rem; background: var(--input-bg); border-radius: 6px;">' +
          '<div style="display: flex; flex-direction: column; gap: 0.1rem;">' +
            '<span style="font-weight: 600; font-size: 0.8rem; color: var(--text-primary);">' + (exp.laborType || 'General') + '</span>' +
            '<span style="font-weight: 600; font-size: 0.65rem; color: var(--text-primary);">' + formatDate(exp.date) + (exp.note ? ' - ' + exp.note : '') + ' <span style="font-size:0.6rem; color:var(--text-secondary);">[' + (exp.paymentMethod === 'upi' ? '📱UPI' : '💰Cash') + ']</span></span>' +
          '</div>' +
          '<div style="display: flex; align-items: center; gap: 0.5rem;">' +
            '<span style="font-weight: 700; color: var(--color-danger); font-size: 0.8rem;">- ' + formatCurrency(exp.amount) + '</span>' +
            '<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); deleteConstruction(\'' + exp.id + '\')" style="padding: 0.15rem; min-width: auto; border: none; background: transparent; color: var(--text-secondary);">' +
              '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>';
      });
    }
    
    var projectBtnsHtml = '';
    for (var i = 0; i < projects.length; i++) {
      var p = projects[i];
      var isSel = p === selectedProject;
      projectBtnsHtml += '<button class="btn btn-sm" data-project="' + p + '" onclick="selectConstProject(this)" style="flex:1; min-width:80px; padding:0.3rem; font-size:0.7rem; background:' + (isSel ? 'var(--color-accent)' : 'var(--bg-secondary)') + '; color:' + (isSel ? '#fff' : 'var(--text-primary)') + '; border:1px solid ' + (isSel ? 'var(--color-accent)' : 'var(--border-color)') + '; cursor:pointer;">' + p + '</button>';
    }
    
    var html = '<div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap;">' + projectBtnsHtml + '</div>' +
      '<div class="card" style="margin-bottom: 0; padding: 0.75rem; border: 1px solid var(--border-color); background: var(--bg-card);">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">' +
          '<strong style="font-size: 0.9rem; color: var(--color-accent);">' + selectedProject + '</strong>' +
          '<span style="font-weight: 700; color: var(--text-primary); font-size: 0.85rem;">Total: ' + formatCurrency(total) + '</span>' +
        '</div>' +
        '<div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.5rem;">' + catButtonsHtml + '</div>' +
        (state.showPayMethod !== false ? '<div style="display: flex; gap: 0.4rem; align-items: center; margin-bottom: 0.5rem;">' +
          '<span style="font-size: 0.65rem; color: var(--text-secondary); font-weight: 600;">Pay via:</span>' +
          '<button type="button" class="btn btn-sm" onclick="selectConstPayMethod(\'cash\')" style="padding:0.1rem 0.4rem; font-size:0.6rem; background:' + (payMethod === 'cash' ? 'var(--color-success)' : 'var(--bg-secondary)') + '; color:' + (payMethod === 'cash' ? '#fff' : 'var(--text-primary)') + '; border:1px solid ' + (payMethod === 'cash' ? 'var(--color-success)' : 'var(--border-color)') + '; cursor:pointer;">💰 Cash</button>' +
          '<button type="button" class="btn btn-sm" onclick="selectConstPayMethod(\'upi\')" style="padding:0.1rem 0.4rem; font-size:0.6rem; background:' + (payMethod === 'upi' ? 'var(--color-accent)' : 'var(--bg-secondary)') + '; color:' + (payMethod === 'upi' ? '#fff' : 'var(--text-primary)') + '; border:1px solid ' + (payMethod === 'upi' ? 'var(--color-accent)' : 'var(--border-color)') + '; cursor:pointer;">📱 UPI</button>' +
        '</div>' : '') +
        '<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: stretch; margin-bottom: 0.5rem;">' +
          '<input type="number" id="const-amount" class="form-input" placeholder="Amount" style="flex: 1; min-width: 120px; background: var(--input-bg); margin: 0; padding: 0.55rem 0.65rem; font-size: 1rem;">' +
          '<input type="text" id="const-notes" class="form-input" placeholder="Note" style="flex: 1; min-width: 140px; background: var(--input-bg); margin: 0; padding: 0.55rem 0.65rem; font-size: 1rem;">' +
        '</div>' +
        '<div style="display: flex; gap: 0.3rem; flex-wrap: wrap; align-items: center; margin-bottom: 0.5rem;">' +
          '<button type="button" class="btn btn-sm" onclick="var i=document.getElementById(\'const-amount\'); i.value=(Number(i.value)||0)+100" style="padding:0.15rem 0.4rem; font-size:0.65rem; background:var(--bg-secondary); border:1px solid var(--border-color); cursor:pointer;">+100</button>' +
          '<button type="button" class="btn btn-sm" onclick="var i=document.getElementById(\'const-amount\'); i.value=(Number(i.value)||0)+500" style="padding:0.15rem 0.4rem; font-size:0.65rem; background:var(--bg-secondary); border:1px solid var(--border-color); cursor:pointer;">+500</button>' +
          '<button type="button" class="btn btn-sm" onclick="var i=document.getElementById(\'const-amount\'); i.value=(Number(i.value)||0)+1000" style="padding:0.15rem 0.4rem; font-size:0.65rem; background:var(--bg-secondary); border:1px solid var(--border-color); cursor:pointer;">+1000</button>' +
          '<button type="button" class="btn btn-sm" onclick="var i=document.getElementById(\'const-amount\'); i.value=(Number(i.value)||0)+1500" style="padding:0.15rem 0.4rem; font-size:0.65rem; background:var(--bg-secondary); border:1px solid var(--border-color); cursor:pointer;">+1500</button>' +
          '<button type="button" class="btn btn-sm" onclick="var i=document.getElementById(\'const-amount\'); i.value=(Number(i.value)||0)+2000" style="padding:0.15rem 0.4rem; font-size:0.65rem; background:var(--bg-secondary); border:1px solid var(--border-color); cursor:pointer;">+2000</button>' +
          '<button type="button" class="btn btn-sm" onclick="var i=document.getElementById(\'const-amount\'); i.value=(Number(i.value)||0)+2500" style="padding:0.15rem 0.4rem; font-size:0.65rem; background:var(--bg-secondary); border:1px solid var(--border-color); cursor:pointer;">+2500</button>' +
          '<button type="button" class="btn btn-sm" onclick="var i=document.getElementById(\'const-amount\'); i.value=(Number(i.value)||0)+5000" style="padding:0.15rem 0.4rem; font-size:0.65rem; background:var(--bg-secondary); border:1px solid var(--border-color); cursor:pointer;">+5000</button>' +
          '<button type="button" class="btn btn-sm" onclick="var i=document.getElementById(\'const-amount\'); i.value=(Number(i.value)||0)+10000" style="padding:0.15rem 0.4rem; font-size:0.65rem; background:var(--bg-secondary); border:1px solid var(--border-color); cursor:pointer;">+10000</button>' +
          '<span style="margin-left: auto;"></span>' +
          '<button class="btn btn-primary" onclick="submitQuickConst()" style="margin: 0; padding: 0.55rem 0.9rem; font-size: 0.9rem;">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="margin-right: 2px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>' +
            'Save' +
          '</button>' +
        '</div>' +
        '<div style="font-size: 0.7rem; font-weight: 700; margin-bottom: 0.4rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Recent Payments</div>' +
        '<div style="display: flex; flex-direction: column; gap: 0.35rem;">' +
          (expensesHtml || '<div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; padding: 0.75rem; background: var(--input-bg); border-radius: 6px;">No payments.</div>') +
        '</div>' +
      '</div>';
    
    container.innerHTML = html;
    
    var totalConstExps = projects.length;
    var countEl = document.getElementById('count-construction');
    if (countEl) countEl.textContent = totalConstExps;
  } catch (err) {
    container.innerHTML = '<div style="color:var(--color-danger); padding: 1rem; background: var(--bg-card); border-radius: 8px;">Error loading construction data: ' + err.message + '. Please clear your cache or check data integrity.</div>';
    console.error('Construction render error:', err);
  }
  applyRecordsFilter();
}

// FILE UPLOAD LOGIC


window.triggerUpload = function(type, method) {
  document.getElementById('upload-type').value = type;
  if (method === 'camera') {
    const fileInput = document.getElementById('upload-file-input');
    if (!fileInput) return;
    fileInput.setAttribute('accept', 'image/*');
    fileInput.setAttribute('capture', 'environment');
    fileInput.click();
  } else {
    // Use File System Access API on supported browsers (skips Android chooser)
    if ('showOpenFilePicker' in window) {
      window.showOpenFilePicker({ multiple: false }).then(function(handles) {
        return handles[0].getFile();
      }).then(function(file) {
        handleUploadedFile(file);
      }).catch(function(err) {
        if (err.name !== 'AbortError') console.error('File picker error:', err);
      });
    } else {
      const fileInput = document.getElementById('upload-file-pick');
      if (!fileInput) return;
      fileInput.removeAttribute('accept');
      fileInput.removeAttribute('capture');
      fileInput.value = '';
      fileInput.click();
    }
  }
};

function handleUploadedFile(file) {
  if (!file) return;
  if (file.type.startsWith('image/')) {
    compressImage(file, 800, 0.7, function(compressed) {
      window._pendingFileData = compressed;
      window._openUploadModalWithFile(document.getElementById('upload-type').value);
    });
  } else {
    const reader = new FileReader();
    reader.onload = function(ev) {
      window._pendingFileData = ev.target.result;
      window._openUploadModalWithFile(document.getElementById('upload-type').value);
    };
    reader.readAsDataURL(file);
  }
}

window._pendingFileData = null;
window._openUploadModalWithFile = function(type) {
  document.getElementById('upload-modal-title').textContent = 'Upload ' + type.charAt(0).toUpperCase() + type.slice(1);
  document.getElementById('upload-type').value = type;
  document.getElementById('upload-title').value = '';
  document.getElementById('upload-number').value = '';
  const img = document.getElementById('upload-preview-img');
  const txt = document.getElementById('upload-preview-text');
  if (window._pendingFileData) {
    img.src = window._pendingFileData;
    img.style.display = 'block';
    txt.style.display = 'none';
  } else {
    img.style.display = 'none';
    img.src = '';
    txt.style.display = 'block';
    txt.textContent = 'No file selected';
  }
  openModal('modal-upload');
};

window.deleteFile = function(id) {
  if(!confirm('Are you sure you want to delete this file?')) return;
  loadState();
  state.files = state.files.filter(f => f.id !== id);
  removeFileFromDB(id);
  saveState();
  renderFiles();
};

window.viewFile = function(id) {
  const file = state.files.find(f => f.id === id);
  if (!file) return;
  if (file.data) {
    const w = window.open('');
    w.document.write(`<img src="${file.data}" style="max-width:100%; height:auto;">`);
  } else {
    alert(file.title);
  }
};

window.shareFileWhatsApp = function(id) {
  const file = state.files.find(f => f.id === id);
  if (!file) return;
  var text = file.title;
  if (file.fileNumber) text += ' - ' + file.fileNumber;
  text += ' (' + file.date + ')';
  if (file.data && file.data.indexOf('image/') !== -1 && navigator.canShare) {
    fetch(file.data).then(function(r) { return r.blob(); }).then(function(blob) {
      var f = new File([blob], file.title + '.jpg', { type: blob.type });
      if (navigator.canShare({ files: [f] })) {
        navigator.share({ text: text, files: [f] }).catch(function(){});
      } else {
        var url = 'https://wa.me/?text=' + encodeURIComponent(text);
        window.open(url, '_blank');
      }
    }).catch(function() {
      var url = 'https://wa.me/?text=' + encodeURIComponent(text);
      window.open(url, '_blank');
    });
  } else {
    var url = 'https://wa.me/?text=' + encodeURIComponent(text);
    window.open(url, '_blank');
  }
};

function renderFiles() {
  ['bills', 'documents', 'policies'].forEach(function(fileType) {
    var containerId = fileType + '-list-container';
    var container = document.getElementById(containerId);
    if (!container) return;
    var files = state.files.filter(function(f) { return f.type === fileType; }).sort(function(a,b) { return new Date(b.date) - new Date(a.date); });
    
    var html = '';
    
    // Render file uploads
    files.forEach(function(p) {
      var hasNumber = p.fileNumber ? true : false;
      html += '<div class="card" style="margin-bottom: 0.75rem; display: flex; align-items: center; gap: 1rem; padding: 0.75rem;" data-file-id="' + p.id + '">';
      html += '<div onclick="viewFile(\'' + p.id + '\')" style="width: 48px; height: 48px; background: var(--input-bg); border-radius: 8px; overflow: hidden; flex-shrink: 0; display:flex; align-items:center; justify-content:center; cursor:pointer;">';
      html += p.data ? '<img src="' + p.data + '" style="width:100%; height:100%; object-fit:cover;">' : '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
      html += '</div>';
      html += '<div style="flex: 1; min-width: 0;">';
      html += '<div style="font-weight: 600; color: var(--text-primary); font-size: 0.95rem;">' + p.title + '</div>';
      if (hasNumber) {
        html += '<div style="display: flex; align-items: center; gap: 0.35rem; margin-top: 0.3rem;">';
        html += '<span style="font-size: 0.82rem; color: var(--color-accent); font-weight: 600; word-break: break-all;">' + escHtml(p.fileNumber) + '</span>';
        html += '<button onclick="copyFileNumber(\'' + p.id + '\')" style="background: none; border: none; cursor: pointer; padding: 0; color: var(--text-secondary); display: inline-flex; align-items: center;">';
        html += '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        html += '</button></div>';
      }
      html += '</div>';
      html += '<button onclick="shareFileWhatsApp(\'' + p.id + '\')" title="Share on WhatsApp" style="background: none; border: none; cursor: pointer; padding: 0.2rem 0; color: #25D366; display: flex; align-items: center;">';
      html += '<svg viewBox="0 0 24 24" width="22" height="22" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
      html += '</button>';
      html += '<div style="display: flex; gap: 0.5rem; align-items: center;">';
      html += '<button onclick="deleteFile(\'' + p.id + '\')" title="Delete" style="background:none;border:none;cursor:pointer;padding:0.2rem;color:var(--color-danger);display:inline-flex;align-items:center;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>';
      html += '</div>';
      html += '</div>';
    });
    
    // Catch if there are no notes and no files
    if (html === '') {
      html = '\
        <div class="empty-state">\
          <div class="empty-state-icon">\
            <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>\
          </div>\
          <p>No ' + fileType + ' uploaded yet.</p>\
        </div>';
    }
    
    container.innerHTML = html;
  });
  updateFileSummaryCards();
  applyRecordsFilter();
}

function updateFileSummaryCards() {
  ['bills', 'documents', 'policies'].forEach(function(fileType) {
    var files = state.files.filter(function(f) { return f.type === fileType; });
    var countEl = document.getElementById('count-' + fileType);
    if (countEl) countEl.textContent = files.length;
  });
}

window.copyFileNumber = function(id) {
  loadState();
  var file = state.files.find(function(f) { return f.id === id; });
  if (file && file.fileNumber) {
    navigator.clipboard.writeText(file.fileNumber).then(function() {
      alert('Copied!');
    }).catch(function() {
      prompt('Copy:', file.fileNumber);
    });
  }
};

window.copyText = function(text) {
  navigator.clipboard.writeText(text).then(function() {
    alert('Copied to clipboard!');
  }).catch(function() {
    prompt('Copy this text:', text);
  });
};

// 13. BOOTSTRAP INITIALIZATION
function compressImage(file, maxDimension, quality, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement('canvas');
      var w = img.width, h = img.height;
      if (w > maxDimension || h > maxDimension) {
        if (w > h) { h = h * maxDimension / w; w = maxDimension; }
        else { w = w * maxDimension / h; h = maxDimension; }
      }
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function initApp() {
  loadState();
  initNavigation();
  
  // Initialize month selector (default view is monthly)
  renderMonthSelector();

  // File Upload Handlers
  const formUpload = document.getElementById('form-upload');
  const fileInput = document.getElementById('upload-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      handleUploadedFile(e.target.files[0]);
    });
  }
  const filePick = document.getElementById('upload-file-pick');
  if (filePick) {
    filePick.addEventListener('change', (e) => {
      handleUploadedFile(e.target.files[0]);
    });
  }
  if (formUpload) {
    formUpload.addEventListener('submit', (e) => {
      try {
        e.preventDefault();
        var typeEl = document.getElementById('upload-type');
        var titleEl = document.getElementById('upload-title');
        var numberEl = document.getElementById('upload-number');
        const type = typeEl ? typeEl.value : '';
        const title = titleEl ? titleEl.value : '';
        const data = window._pendingFileData;
        if (!data && !title) {
          alert('Please enter a title or select a file.');
          return;
        }
        const number = numberEl ? numberEl.value.trim() : '';
        state.files.push({
          id: 'file_' + Date.now(),
          type: type,
          title: title || '(note)',
          fileNumber: number,
          data: data || '',
          date: new Date().toISOString().slice(0, 10)
        });
        saveState();
        window._pendingFileData = null;
        closeModal('modal-upload');
        renderFiles();
      } catch(err) {
        alert('Save error: ' + err.message + ' (check console)');
        console.error('Upload save error:', err);
      }
    });
  }
  
  // Set default lending rates for new entries (4%)
  document.getElementById('btn-add-loan-lent').addEventListener('click', () => {
    document.getElementById('form-loan').reset();
    document.getElementById('loan-id').value = '';
    document.getElementById('loan-direction').value = 'lent';
    document.getElementById('loan-rate').value = '4.00';
    var today = new Date();
    var dueDate = new Date(today);
    dueDate.setMonth(dueDate.getMonth() + 1);
    var todayStr = today.toISOString().split('T')[0];
    var dueDateStr = dueDate.toISOString().split('T')[0];
    document.getElementById('loan-start-date').value = todayStr;
    document.getElementById('loan-due-date').value = dueDateStr;
    
    document.getElementById('loan-modal-title').textContent = 'Lend Money';
    document.getElementById('loan-party-label').textContent = 'Borrower Name';
    document.getElementById('loan-party').placeholder = 'e.g. John Doe';
    
    updatePrincipalPresets('lent');
    openModal('modal-loan');
  });

  document.getElementById('btn-add-loan-borrowed').addEventListener('click', () => {
    document.getElementById('form-loan').reset();
    document.getElementById('loan-id').value = '';
    document.getElementById('loan-direction').value = 'borrowed';
    document.getElementById('loan-rate').value = '3.00';
    var today = new Date();
    var dueDate = new Date(today);
    dueDate.setMonth(dueDate.getMonth() + 1);
    var todayStr = today.toISOString().split('T')[0];
    var dueDateStr = dueDate.toISOString().split('T')[0];
    document.getElementById('loan-start-date').value = todayStr;
    document.getElementById('loan-due-date').value = dueDateStr;
    
    document.getElementById('loan-modal-title').textContent = 'Record Borrowed Money';
    document.getElementById('loan-party-label').textContent = 'Lender Name';
    document.getElementById('loan-party').placeholder = 'e.g. Apex Bank';
    
    updatePrincipalPresets('borrowed');
    openModal('modal-loan');
  });

  // Principal amount words listener
  document.getElementById('loan-principal').addEventListener('input', updatePrincipalWords);
  document.getElementById('quick-lend-principal').addEventListener('input', updateQuickLendWords);

  // Add rentals trigger
  document.getElementById('btn-add-rental').addEventListener('click', () => {
    document.getElementById('form-rental').reset();
    document.getElementById('rental-id').value = '';
    document.getElementById('rental-start-date').value = new Date().toISOString().split('T')[0];
    
    // Clear images
    document.getElementById('rental-aadhaar-base64').value = '';
    document.getElementById('rental-agreement-base64').value = '';
    document.getElementById('rental-aadhaar-file').value = '';
    document.getElementById('rental-agreement-file').value = '';
    document.getElementById('rental-aadhaar-status').style.display = 'none';
    document.getElementById('rental-agreement-status').style.display = 'none';

    document.getElementById('rental-modal-title').textContent = 'Add Tenant Agreement';
    updateRentalRenewalDate();
    openModal('modal-rental');
  });

  // Auto-fill security deposit from rent
  const rentInput = document.getElementById('rental-rent');
  const depositInput = document.getElementById('rental-deposit');
  if (rentInput && depositInput) {
    rentInput.addEventListener('input', (e) => {
      depositInput.value = e.target.value;
    });
  }

  // Quick lend dropdown change binding
  document.getElementById('quick-lend-borrower-select').addEventListener('change', toggleQuickLendNewName);

  // Expense Form Submit
  document.getElementById('form-expense').addEventListener('submit', (e) => {
    e.preventDefault();
    loadState();
    
    const id = document.getElementById('expense-id').value;
    const amount = Number(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value;
    const category = document.getElementById('expense-category').value;
    const propertyId = document.getElementById('expense-property').value;
    const note = document.getElementById('expense-note').value;

    if (id) {
      // Edit Mode
      const index = state.expenses.findIndex(exp => exp.id === id);
      if (index !== -1) {
        state.expenses[index] = {
          ...state.expenses[index],
          amount,
          date,
          category,
          propertyId,
          note
        };
      }
    } else {
      // Add Mode
      const newId = 'exp_' + Math.random().toString(36).substr(2, 9);
      state.expenses.push({
        id: newId,
        amount,
        date,
        category,
        propertyId,
        note
      });
    }

    saveState();
    
    // Auto-create renewal if renewal date is set
    const renewalDateInput = document.getElementById('expense-renewal-date');
    const renewalDateGroup = document.getElementById('expense-renewal-date-group');
    if (renewalDateInput && renewalDateInput.value && renewalDateGroup && renewalDateGroup.style.display !== 'none') {
      const renewalTitle = document.getElementById('expense-note').value || note;
      const renewalCategory = document.getElementById('expense-category').value;
      state.renewals.push({
        id: 'renewal_' + Date.now(),
        title: renewalTitle,
        category: renewalCategory,
        amount: amount,
        dueDate: renewalDateInput.value,
        frequency: 'yearly',
        note: 'Auto-created from expense',
        lastRenewed: null,
        createdAt: new Date().toISOString()
      });
      saveState();
    }
    
    openExpenseModal();
  });

  // Renewal Form Submit
  document.getElementById('form-renewal').addEventListener('submit', saveRenewal);

  // Initialize search logic
  initSearch();
  initRecordsSearch();

  // Initialize header date display
  updateHeaderDateDisplay();

  // Render property presets and settings list
  renderPropertiesList();
  renderRentalPropertyPresets();
  renderExpensePropertyShortcuts();

  // Render initial dashboard view
  renderDashboard();
}

// 12. EXPENSES TAB CONTROLLERS & ACTIONS

window.handleCategoryChange = function() {
  const cat = document.getElementById('expense-category').value;
  const propGroup = document.getElementById('expense-property-group');
  const propShortcuts = document.getElementById('expense-property-shortcuts');
  
  if (['Car Insurance', 'Health', 'Pollution'].includes(cat)) {
    if(propGroup) propGroup.style.display = 'none';
  } else {
    if(propGroup) propGroup.style.display = 'block';
  }
  
  if (['House Tax', 'ITR'].includes(cat)) {
    if(propShortcuts) propShortcuts.style.display = 'flex';
  } else {
    if(propShortcuts) propShortcuts.style.display = 'none';
  }
};

window.autoSelectProperty = function(searchString) {
  const propertySelect = document.getElementById('expense-property');
  if(!propertySelect) return;
  const lowerSearch = searchString.toLowerCase();
  
  for (let i = 0; i < propertySelect.options.length; i++) {
    if (propertySelect.options[i].text.toLowerCase().includes(lowerSearch)) {
      propertySelect.selectedIndex = i;
      propertySelect.style.borderColor = 'var(--color-success)';
      setTimeout(() => propertySelect.style.borderColor = 'var(--border-color)', 1000);
      break;
    }
  }
};

function openExpenseModal(expenseId = null) {
  loadState();
  const form = document.getElementById('form-expense');
  form.reset();
  document.querySelectorAll('.expense-preset-btn').forEach(b => b.classList.remove('active'));
  
  if(window.handleCategoryChange) window.handleCategoryChange();

  
  const presetsContainer = document.getElementById('expense-amount-presets');
  if (presetsContainer) presetsContainer.innerHTML = '';
  
  // Set default date in local timezone
  const d = new Date();
  const localDateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  document.getElementById('expense-date').value = localDateStr;
  
  // Populate property dropdown with active properties
  const propertySelect = document.getElementById('expense-property');
  propertySelect.innerHTML = '<option value="">General / None</option>';
  
  state.rentals.filter(r => r.status === 'active').forEach(rental => {
    const opt = document.createElement('option');
    opt.value = rental.id;
    opt.textContent = `${rental.propertyName} (${rental.tenantName})`;
    propertySelect.appendChild(opt);
  });

  if (expenseId) {
    // Edit Mode
    const exp = state.expenses.find(e => e.id === expenseId);
    if (exp) {
      document.getElementById('expense-id').value = exp.id;
      document.getElementById('expense-amount').value = exp.amount;
      document.getElementById('expense-date').value = exp.date;
      document.getElementById('expense-category').value = exp.category;
      document.getElementById('expense-property').value = exp.propertyId || '';
      document.getElementById('expense-note').value = exp.note || '';
      document.getElementById('expense-modal-title').textContent = 'Edit Expense';
    }
  } else {
    // Add Mode
    document.getElementById('expense-id').value = '';
    document.getElementById('expense-modal-title').textContent = 'Record Expense';
  }

  const inlineForm = document.getElementById('inline-expense-form');
  if (inlineForm) {
    switchTab('dashboard');
    currentReminderFilter = 'expenses';
    renderDashboard();
    inlineForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      document.getElementById('expense-amount').focus();
    }, 300);
  }
}

function deleteExpense(expenseId) {
  if (!confirm('Are you sure you want to delete this expense record?')) return;
  loadState();
  state.expenses = state.expenses.filter(e => e.id !== expenseId);
  saveState();
  renderExpenses();
  renderDashboard();
}

function renderExpenses() {

  const dateInput = document.getElementById('expense-date');
  if (dateInput && !dateInput.value) {
    const d = new Date();
    dateInput.value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  const propertySelect = document.getElementById('expense-property');
  if (propertySelect && propertySelect.options.length <= 1) {
    propertySelect.innerHTML = '<option value="">General / None</option>';
    state.rentals.filter(r => r.status === 'active').forEach(rental => {
      const opt = document.createElement('option');
      opt.value = rental.id;
      opt.textContent = `${rental.propertyName} (${rental.tenantName})`;
      propertySelect.appendChild(opt);
    });
  }

  const listContainer = el('expenses-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  // Filter expenses by the selected period (day, month, or year)
  const isDayMode = viewMode === 'day';
  const isYearMode = viewMode === 'year';
  const selectedYear = selectedDateStr.slice(0, 4);
  const visibleExpenses = isDayMode
    ? state.expenses.filter(e => e.date === selectedDateStr)
    : isYearMode
    ? state.expenses.filter(e => e.date && e.date.startsWith(selectedYear))
    : state.expenses.filter(e => e.date.startsWith(selectedMonthStr));
  const totalExpenses = visibleExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  if (visibleExpenses.length === 0) {
    listContainer.innerHTML = `
      <div class="card empty-state">
        <div class="empty-state-icon" style="color: var(--color-danger);">
          <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 4v16M2 12h20"/></svg>
        </div>
        <p>No expense logs found for this period. Tap "Record Expense" to log one.</p>
      </div>
    `;
    return;
  }

  // Sort: newest first
  const sortedExpenses = [...visibleExpenses].sort((a,b) => {
    var d = new Date(b.date) - new Date(a.date);
    if (d !== 0) return d;
    return state.expenses.indexOf(b) - state.expenses.indexOf(a);
  });

  sortedExpenses.forEach(exp => {
    // Look up associated property name if any
    let propertyStr = '';
    if (exp.propertyId) {
      const prop = state.rentals.find(r => r.id === exp.propertyId);
      if (prop) {
        propertyStr = `<span style="font-size: 0.75rem; color: var(--color-warning); background-color: rgba(245,158,11,0.08); padding: 0.15rem 0.40rem; border-radius: 4px; border: 1px solid rgba(245,158,11,0.15); margin-left: 0.5rem;">${prop.propertyName}</span>`;
      }
    }

    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '0.75rem';
    card.innerHTML = `
      <div class="item-row" style="cursor: default;">
        <div class="item-title-col">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span class="badge" style="font-size: 0.7rem; font-weight: 700; background-color: rgba(239,68,68,0.15); color: var(--color-danger); border: 1px solid rgba(239,68,68,0.25); text-transform: uppercase;">${exp.category}</span>
            ${propertyStr}
          </div>
          <div class="item-meta" style="margin-top: 0.4rem;">
            <span>Date: ${formatDate(exp.date)}</span>
            ${exp.note ? `<span class="meta-divider"></span><span>Note: <em>${exp.note}</em></span>` : ''}
          </div>
        </div>
        <div class="amount-display" style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.35rem;">
          <div class="amount-value" style="color: var(--color-danger); font-size: 1.15rem;">${formatCurrency(exp.amount)}</div>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn btn-secondary btn-sm" onclick="openExpenseModal('${exp.id}')" style="padding: 0.15rem 0.4rem; font-size: 0.7rem; min-height: auto;">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteExpense('${exp.id}')" style="padding: 0.15rem 0.4rem; font-size: 0.7rem; min-height: auto;">Delete</button>
          </div>
        </div>
      </div>
    `;
    listContainer.appendChild(card);
  });
}

function setExpensePreset(noteText, categoryValue, btn) {
  const noteInput = document.getElementById('expense-note');
  const catSelect = document.getElementById('expense-category');
  const amtInput = document.getElementById('expense-amount');
  const presetsContainer = document.getElementById('expense-amount-presets');
  const renewalDateGroup = document.getElementById('expense-renewal-date-group');
  const renewalDateInput = document.getElementById('expense-renewal-date');
  
  document.querySelectorAll('.expense-preset-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  
  if (noteInput) noteInput.value = noteText;
  if (catSelect) catSelect.value = categoryValue;
  if (presetsContainer) presetsContainer.innerHTML = '';
  
  // Show renewal date for insurance/tax/certificate presets
  const renewalPresets = ['Car Insurance', 'Health Insurance', 'Pollution Certificate', 'House Tax', 'I.T.R Filing'];
  if (renewalPresets.includes(noteText)) {
    if (renewalDateGroup) renewalDateGroup.style.display = 'block';
    if (renewalDateInput) {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      renewalDateInput.value = nextYear.toISOString().split('T')[0];
    }
  } else {
    if (renewalDateGroup) renewalDateGroup.style.display = 'none';
    if (renewalDateInput) renewalDateInput.value = '';
  }
  
  if (noteText === 'Fuel') {
    if (amtInput) {
      amtInput.value = '';
      amtInput.focus();
    }
    // Render sub-buttons under amount input: 1000, 1500, 2000, 2500, 3000
    const vals = [1000, 1500, 2000, 2500, 3000];
    vals.forEach(val => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-secondary btn-sm';
      btn.style = 'padding: 0.25rem 0.5rem; min-height: auto; font-size: 0.72rem; border-color: rgba(255,255,255,0.06); background: var(--bg-secondary); margin-right: 0.3rem;';
      btn.textContent = `Rs. ${val}`;
      btn.onclick = () => {
        if (amtInput) amtInput.value = val;
      };
      if (presetsContainer) presetsContainer.appendChild(btn);
    });
  } else if (noteText === 'Rent') {
    if (amtInput) {
      amtInput.value = '';
      amtInput.focus();
    }
    // Render sub-buttons under amount input: 23000, 32000
    const vals = [23000, 32000];
    vals.forEach(val => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-secondary btn-sm';
      btn.style = 'padding: 0.25rem 0.5rem; min-height: auto; font-size: 0.72rem; border-color: rgba(255,255,255,0.06); background: var(--bg-secondary); margin-right: 0.3rem;';
      btn.textContent = `Rs. ${val}`;
      btn.onclick = () => {
        if (amtInput) amtInput.value = val;
      };
      if (presetsContainer) presetsContainer.appendChild(btn);
    });
  } else if (noteText === 'Wifi bill') {
    if (amtInput) {
      amtInput.value = 707;
      amtInput.focus();
    }
  } else if (noteText === 'Phone bill') {
    if (amtInput) {
      amtInput.value = 1175;
      amtInput.focus();
    }
  } else {
    if (amtInput) {
      amtInput.value = '';
      amtInput.focus();
    }
  }
}

// --- Reports & Summaries ---
function openReportsModal() {
  openModal('modal-reports');
}

function exportReportsCSV() {
  if (!window.reportsCsvData || window.reportsCsvData.length === 0) {
    showToast('No data to export.');
    return;
  }
  
  const headers = ['Period', 'Type', 'Rent', 'Interest Received', 'Interest Paid', 'Expenses', 'Net Earnings'];
  let csvContent = headers.join(',') + '\n';
  
  const yearly = window.reportsCsvData.filter(d => d.type === 'Yearly');
  const monthly = window.reportsCsvData.filter(d => d.type === 'Monthly');
  const rows = [...yearly, ...monthly];
  
  rows.forEach(r => {
    csvContent += `${r.period},${r.type},${r.rent},${r.interestReceived},${r.interestPaid},${r.expenses},${r.net}\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `financial_reports_${new Date().toISOString().substring(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 14. REPORTS TAB LOGIC
let reportsViewMode = 'month';
let reportsSelectedMonth = new Date().toISOString().slice(0, 7);
let reportsChart = null;

function reportsSetViewMode(mode) {
  reportsViewMode = mode;
  const monthlyBtn = document.getElementById('reports-btn-mode-monthly');
  const yearlyBtn = document.getElementById('reports-btn-mode-yearly');
  const selectorBar = document.getElementById('reports-selector-bar');
  
  if (mode === 'month') {
    if (monthlyBtn) monthlyBtn.classList.add('active');
    if (yearlyBtn) yearlyBtn.classList.remove('active');
    if (selectorBar) selectorBar.style.display = 'flex';
    document.getElementById('reports-selector-label').textContent = formatMonth(reportsSelectedMonth);
  } else {
    if (yearlyBtn) yearlyBtn.classList.add('active');
    if (monthlyBtn) monthlyBtn.classList.remove('active');
    if (selectorBar) selectorBar.style.display = 'flex';
    document.getElementById('reports-selector-label').textContent = reportsSelectedMonth.slice(0, 4);
  }
  renderReportsChart();
}
window.reportsSetViewMode = reportsSetViewMode;

function reportsNavigate(dir) {
  if (reportsViewMode === 'month') {
    let [y, m] = reportsSelectedMonth.split('-').map(Number);
    m += dir;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    reportsSelectedMonth = `${y}-${String(m).padStart(2, '0')}`;
    document.getElementById('reports-selector-label').textContent = formatMonth(reportsSelectedMonth);
  } else {
    const y = Number(reportsSelectedMonth.slice(0, 4)) + dir;
    reportsSelectedMonth = `${y}-01`;
    document.getElementById('reports-selector-label').textContent = String(y);
  }
  renderReportsChart();
}
window.reportsNavigate = reportsNavigate;

function formatMonth(monthStr) {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const [y, m] = monthStr.split('-').map(Number);
  return `${months[m - 1]} ${y}`;
}

function renderReports() {
  
  // Set default month selector
  const selectorBar = document.getElementById('reports-selector-bar');
  if (selectorBar) selectorBar.style.display = 'flex';
  
  const monthlyBtn = document.getElementById('reports-btn-mode-monthly');
  if (monthlyBtn) monthlyBtn.classList.add('active');
  
  const label = document.getElementById('reports-selector-label');
  if (label) label.textContent = formatMonth(reportsSelectedMonth);
  
  renderReportsChart();
  renderYearlySummaryTable();
}

function renderYearlySummaryTable() {
  const tbody = document.querySelector('#yearly-reports-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  // Collect all years from data
  const years = new Set();
  state.rentPayments.forEach(p => { if (p.date) years.add(p.date.slice(0, 4)); });
  state.interestPayments.forEach(p => { if (p.date) years.add(p.date.slice(0, 4)); });
  state.expenses.forEach(e => { if (e.date) years.add(e.date.slice(0, 4)); });
  
  if (years.size === 0) {
    const currentYear = String(new Date().getFullYear());
    years.add(currentYear);
  }
  
  const sortedYears = [...years].sort().reverse();
  
  sortedYears.forEach(year => {
    const yearRent = state.rentPayments.filter(p => p.date && p.date.startsWith(year)).reduce((s, p) => s + Number(p.amount), 0);
    const yearInterestIn = state.interestPayments.filter(p => p.date && p.date.startsWith(year) && p.type === 'received' && p.category === 'interest').reduce((s, p) => s + Number(p.amount), 0);
    const yearInterestOut = state.interestPayments.filter(p => p.date && p.date.startsWith(year) && p.type === 'paid' && p.category === 'interest').reduce((s, p) => s + Number(p.amount), 0);
    const yearExpense = state.expenses.filter(e => e.date && e.date.startsWith(year)).reduce((s, e) => s + Number(e.amount), 0);
    const netEarnings = yearRent + yearInterestIn - yearInterestOut - yearExpense;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-weight: 700;">${year}</td>
      <td style="color: var(--color-success);">${formatCurrency(yearRent)}</td>
      <td style="color: var(--color-success);">${formatCurrency(yearInterestIn)}</td>
      <td style="color: var(--color-danger);">${formatCurrency(yearInterestOut)}</td>
      <td style="color: var(--color-danger);">${formatCurrency(yearExpense)}</td>
      <td style="font-weight: 700; color: ${netEarnings >= 0 ? 'var(--color-success)' : 'var(--color-danger)'};">${formatCurrency(netEarnings)}</td>
    `;
    tbody.appendChild(row);
  });
}

function renderReportsChart() {
  const [selYear, selMonth] = reportsSelectedMonth.split('-').map(Number);
  const endDate = `${reportsSelectedMonth}-${String(new Date(selYear, selMonth, 0).getDate()).padStart(2, '0')}`;
  
  let labels = [];
  let rentData = [];
  let interestData = [];
  let expenseData = [];
  
  if (reportsViewMode === 'month') {
    // Daily breakdown for the selected month
    const daysInMonth = new Date(selYear, selMonth, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${reportsSelectedMonth}-${String(d).padStart(2, '0')}`;
      labels.push(d);
      
      const dayRent = state.rentPayments.filter(p => p.date === dayStr).reduce((s, p) => s + Number(p.amount), 0);
      const dayInterest = state.interestPayments.filter(p => p.date === dayStr).reduce((s, p) => s + Number(p.amount), 0);
      const dayExpense = state.expenses.filter(e => e.date === dayStr).reduce((s, e) => s + Number(e.amount), 0);
      
      rentData.push(dayRent);
      interestData.push(dayInterest);
      expenseData.push(dayExpense);
    }
  } else {
    // Monthly breakdown for the selected year
    MONTH_NAMES
    for (let m = 1; m <= 12; m++) {
      const mStr = `${selYear}-${String(m).padStart(2, '0')}`;
      const mEnd = `${mStr}-${String(new Date(selYear, m, 0).getDate()).padStart(2, '0')}`;
      labels.push(MONTH_UPPER_NAMES[m - 1]);
      
      const mRent = state.rentPayments.filter(p => p.date && p.date.startsWith(mStr)).reduce((s, p) => s + Number(p.amount), 0);
      const mInterest = state.interestPayments.filter(p => p.date && p.date.startsWith(mStr)).reduce((s, p) => s + Number(p.amount), 0);
      const mExpense = state.expenses.filter(e => e.date && e.date.startsWith(mStr)).reduce((s, e) => s + Number(e.amount), 0);
      
      rentData.push(mRent);
      interestData.push(mInterest);
      expenseData.push(mExpense);
    }
  }
  
  const rentTotal = rentData.reduce((a, b) => a + b, 0);
  const interestTotal = interestData.reduce((a, b) => a + b, 0);
  const expenseTotal = expenseData.reduce((a, b) => a + b, 0);
  
  document.getElementById('reports-total-income').textContent = formatCurrency(rentTotal + interestTotal);
  document.getElementById('reports-total-expenses').textContent = formatCurrency(expenseTotal);
  document.getElementById('reports-net-balance').textContent = formatCurrency(rentTotal + interestTotal - expenseTotal);
  
  const canvas = document.getElementById('reports-chart');
  if (!canvas) return;
  
  if (reportsChart) reportsChart.destroy();
  
  const ctx = canvas.getContext('2d');
  reportsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Rent: ' + formatCurrency(rentTotal), data: rentData, backgroundColor: 'rgba(234, 179, 8, 0.8)', borderRadius: 4 },
        { label: 'Interest: ' + formatCurrency(interestTotal), data: interestData, backgroundColor: 'rgba(16, 185, 129, 0.8)', borderRadius: 4 },
        { label: 'Expenses: ' + formatCurrency(expenseTotal), data: expenseData, backgroundColor: 'rgba(239, 68, 68, 0.8)', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 16, usePointStyle: true } }
      },
      scales: {
        x: { stacked: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: 0 } },
        y: { stacked: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', callback: v => '₹' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v) } }
      }
    }
  });
}

// Bind to window for global templates
window.exportData = function() {
  try {
    var data = localStorage.getItem(STORAGE_KEY);
    if (!data) { alert('No data to export.'); return; }
    var blob = new Blob([data], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'capitalflow-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch(e) { alert('Export error: ' + e.message); }
};

window.importData = function(event) {
  try {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        if (!data || typeof data !== 'object') { alert('Invalid backup file.'); return; }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(STORAGE_KEY + '_v', localStorage.getItem(STORAGE_KEY + '_v') || '0');
        alert('Data imported! Refreshing...');
        location.reload();
      } catch(err) { alert('Invalid backup file: ' + err.message); }
    };
    reader.readAsText(file);
  } catch(err) { alert('Import error: ' + err.message); }
  event.target.value = '';
};

window.openExpenseModal = openExpenseModal;
window.deleteExpense = deleteExpense;
window.renderExpenses = renderExpenses;
window.setExpensePreset = setExpensePreset;
window.openReportsModal = openReportsModal;
window.exportReportsCSV = exportReportsCSV;
window.setTheme = setTheme;
window.promptConvertEMI = promptConvertEMI;
window.calculateEMIPreview = calculateEMIPreview;
window.selectTenure = selectTenure;
window.promptRecordEMI = promptRecordEMI;

window.togglePendingNames = function() {
  state.showPendingNames = document.getElementById('toggle-pending-names').checked;
  saveState();
  document.querySelectorAll('.pending-names-list').forEach(function(el) { el.remove(); });
  renderDashboard();
};

window.togglePayMethod = function() {
  state.showPayMethod = document.getElementById('toggle-pay-method').checked;
  saveState();
};

window.toggleExpenseDetails = function() {
  state.showExpenseDetails = document.getElementById('toggle-expense-details').checked;
  saveState();
  renderDashboard();
};

window.renderPropertiesList = function() {
  var container = document.getElementById('properties-list');
  if (!container) return;
  if (!state.properties || state.properties.length === 0) {
    container.innerHTML = '<span style="font-size:0.8rem;color:var(--text-muted)">No properties added yet.</span>';
    return;
  }
  container.innerHTML = state.properties.map(function(p) {
    return '<span style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.35rem 0.6rem;font-size:0.78rem;font-weight:600;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary)">' +
      p +
      '<button onclick="window.removeProperty(\'' + p.replace(/'/g, "\\'") + '\')" style="background:none;border:none;color:var(--color-danger);cursor:pointer;padding:0;font-size:1rem;line-height:1;">&times;</button>' +
    '</span>';
  }).join('');
};

window.addProperty = function() {
  var input = document.getElementById('new-property-input');
  var val = input.value.trim();
  if (!val) return;
  if (!state.properties) state.properties = [];
  if (state.properties.indexOf(val) === -1) {
    state.properties.push(val);
    saveState();
    renderPropertiesList();
    renderRentalPropertyPresets();
    renderExpensePropertyShortcuts();
    renderConstruction();
  }
  input.value = '';
};

window.removeProperty = function(name) {
  if (!state.properties) return;
  state.properties = state.properties.filter(function(p) { return p !== name; });
  saveState();
  renderPropertiesList();
  renderRentalPropertyPresets();
  renderExpensePropertyShortcuts();
  renderConstruction();
};

window.renderRentalPropertyPresets = function() {
  var container = document.getElementById('rental-property-presets');
  if (!container) return;
  var props = state.properties || [];
  container.innerHTML = props.map(function(p) {
    var escaped = p.replace(/'/g, "\\'");
    return '<button type="button" onclick="setRentalPropertyPreset(\'' + escaped + '\')" style="flex:1;padding:0.45rem 0.5rem;font-size:0.78rem;font-weight:600;border:1.5px solid var(--border-color);border-radius:10px;background:var(--bg-tertiary);color:var(--text-primary);cursor:pointer;transition:all 0.15s ease;text-align:center;" onmouseenter="this.style.borderColor=\'var(--color-accent)\';this.style.background=\'var(--bg-card-hover)\'" onmouseleave="this.style.borderColor=\'var(--border-color)\';this.style.background=\'var(--bg-tertiary)\'">' + p + '</button>';
  }).join('');
};

window.renderExpensePropertyShortcuts = function() {
  var container = document.getElementById('expense-property-shortcuts');
  if (!container) return;
  var props = state.properties || [];
  container.innerHTML = props.map(function(p) {
    var escaped = p.replace(/'/g, "\\'");
    return '<button type="button" class="btn btn-secondary btn-sm preset-btn" onclick="autoSelectProperty(\'' + escaped + '\')">' + p + '</button>';
  }).join('');
};

window.openExpenseDetails = function(mode, event) {
  if (event) event.stopPropagation();
  if (typeof mode !== 'string') { event = mode; mode = undefined; }
  if (window._expenseMode === mode) mode = undefined;
  window._expenseMode = mode;
  loadState();
  
  const today = new Date();
  const todayStr = new Date().toISOString().split('T')[0];
  const pad = n => String(n).padStart(2, '0');
  
  const todayExps = state.expenses.filter(e => e.date === todayStr);
  const todayTotal = todayExps.reduce((sum, e) => sum + Number(e.amount), 0);
  
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const startStr = `${startOfWeek.getFullYear()}-${pad(startOfWeek.getMonth()+1)}-${pad(startOfWeek.getDate())}`;
  const endStr = `${endOfWeek.getFullYear()}-${pad(endOfWeek.getMonth()+1)}-${pad(endOfWeek.getDate())}`;
  const weekExps = state.expenses.filter(e => e.date >= startStr && e.date <= endStr);
  const weekTotal = weekExps.reduce((sum, e) => sum + Number(e.amount), 0);
  
  const monthExps = state.expenses.filter(e => e.date.startsWith(selectedMonthStr));
  const monthTotal = monthExps.reduce((sum, e) => sum + Number(e.amount), 0);
  
  let filteredExpenses = [];
  let title = '';
  
  if (mode === 'month') {
    title = "This Month's Expenses";
    filteredExpenses = monthExps;
  } else if (mode === 'week') {
    title = "This Week's Expenses";
    filteredExpenses = weekExps;
  } else {
    title = "Today's Expenses";
    filteredExpenses = todayExps;
  }
  
  document.getElementById('expense-details-title').textContent = title;
  
  const listContainer = document.getElementById('expense-details-list');
  
  const allExps = !mode ? [...state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date)) : filteredExpenses;
  const allTotal = !mode ? allExps.reduce((sum, e) => sum + Number(e.amount), 0) : filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  
  const modeLabel = mode === 'day' ? 'Today' : mode === 'week' ? 'This Week' : mode === 'month' ? 'This Month' : '';
  
  let html = '';
  
  html = `
    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
      <div class="card" style="flex: 1; min-width: 100px; padding: 0.75rem; border-left: 4px solid var(--color-danger); cursor: pointer; ${mode === 'day' ? 'box-shadow: 0 0 0 2px var(--color-danger);' : ''}" onclick="window.openExpenseDetails('day', event)">
        <div style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary);">Today</div>
        <div style="font-size: 1.1rem; font-weight: 800; color: var(--color-danger); margin-top: 0.2rem;">${formatCurrency(todayTotal)}</div>
      </div>
      <div class="card" style="flex: 1; min-width: 100px; padding: 0.75rem; border-left: 4px solid var(--color-danger); cursor: pointer; ${mode === 'week' ? 'box-shadow: 0 0 0 2px var(--color-danger);' : ''}" onclick="window.openExpenseDetails('week', event)">
          <div style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary);">This Week</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: var(--color-danger); margin-top: 0.2rem;">${formatCurrency(weekTotal)}</div>
        </div>
        <div class="card" style="flex: 1; min-width: 100px; padding: 0.75rem; border-left: 4px solid var(--color-danger); cursor: pointer; ${mode === 'month' ? 'box-shadow: 0 0 0 2px var(--color-danger);' : ''}" onclick="window.openExpenseDetails('month', event)">
          <div style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary);">This Month</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: var(--color-danger); margin-top: 0.2rem;">${formatCurrency(monthTotal)}</div>
      </div>
    </div>
    <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <h4 style="margin: 0; font-size: 0.95rem;">${modeLabel || 'All Expenses'}</h4>
        <span style="font-weight: 800; color: var(--color-danger);">${formatCurrency(allTotal)}</span>
      </div>`;
  
  if (allExps.length > 0) {
    html += allExps.map(e => {
      const prop = e.propertyId ? state.rentals.find(r => r.id === e.propertyId) : null;
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid var(--border-color);">
          <div style="display: flex; flex-direction: column; gap: 0.1rem;">
            <span style="font-weight: 600; font-size: 0.85rem;">${e.note || e.description || e.category || 'Expense'}</span>
            <span style="font-size: 0.7rem; color: var(--text-muted);">${formatDisplayDate(e.date)}${e.category ? ' · ' + e.category : ''}${prop ? ' · ' + prop.propertyName : ''}</span>
          </div>
          <span style="font-weight: 700; color: var(--color-danger); font-size: 0.9rem;">${formatCurrency(e.amount)}</span>
        </div>`;
    }).join('');
  } else {
    html += '<div style="text-align: center; color: var(--text-muted); padding: 1rem;">No expenses recorded.</div>';
  }
  
  html += `</div>`;
  
  listContainer.innerHTML = html;
  
  openModal('modal-expense-details');
};

window.openTenantDetails = function(rentalId) {
  loadState();
  const rental = state.rentals.find(r => r.id === rentalId);
  if (!rental) return;
  
  const titleEl = document.getElementById('group-details-title');
  const bodyEl = document.getElementById('group-details-body');
  if (!titleEl || !bodyEl) return;
  
  const payments = state.rentPayments.filter(p => p.rentalId === rentalId).sort((a, b) => new Date(b.datePaid) - new Date(a.datePaid));
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const phone = rental.contactInfo || '';
  const waLink = phone ? `<a href="https://wa.me/91${phone.replace(/\D/g, '')}" target="_blank" class="btn-contact btn-whatsapp"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></a>` : '';
  const callLink = phone ? `<a href="tel:${phone.replace(/\D/g, '')}" class="btn-contact btn-call"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></a>` : '';
  const renewData = getNextRenewal(rental.startDate, rental.nextRenewalDate);
  const dotColor = renewData && renewData.daysLeft <= 7 ? 'var(--color-danger)' : renewData && renewData.daysLeft <= 30 ? 'var(--color-warning)' : 'var(--color-success)';
  const sinceDate = formatDate(rental.startDate);
  const renewedDate = rental.lastRenewed ? formatDate(rental.lastRenewed) : null;
  
  titleEl.innerHTML = `<span style="display:flex;align-items:center;gap:1rem;">${rental.tenantName}<span class="contact-btn-group" style="display:inline-flex;align-items:center;gap:0.3rem;">${callLink}${waLink}</span><button onclick="renewRentalAgreement('${rental.id}')" style="padding:0.2rem 0.4rem;font-size:0.6rem;background:var(--color-warning);border:none;border-radius:var(--border-radius-sm);cursor:pointer;color:#000;font-weight:700;white-space:nowrap;">Renew Agreement</button></span>`;
  
  let html = `
    <div style="margin-bottom: 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
        <div style="font-weight: 600; font-size: 1rem;">${rental.propertyName || 'Property'}</div>
        <button onclick="closeModal('modal-group-details'); editRental('${rental.id}')" style="padding: 0.2rem; font-size: 0.7rem; background: transparent; border: none; cursor: pointer; color: var(--text-secondary);" title="Edit">✏️</button>
      </div>
    </div>
    <div style="border-top: 1px solid var(--border-color); margin-bottom: 0.6rem; padding-top: 0.5rem;">
      <div style="display: flex; gap: 0.5rem;">
        <button onclick="viewDocumentImage('${rentalId}', 'aadhaar')" style="flex: 1; padding: 0.35rem; font-size: 0.65rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); cursor: pointer; color: var(--text-primary); font-weight: 600;">📄 Aadhaar</button>
        <button onclick="viewDocumentImage('${rentalId}', 'agreement')" style="flex: 1; padding: 0.35rem; font-size: 0.65rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); cursor: pointer; color: var(--text-primary); font-weight: 600;">📄 Rent Agreement</button>
      </div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
        <div class="card" style="padding: 0.75rem; text-align: center; background: var(--bg-secondary);">
          <div style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-primary); font-weight: 700; letter-spacing: 0.5px;">Monthly Rent</div>
          <div style="font-size: 1.3rem; font-weight: 800; color: var(--color-accent); margin-top: 0.25rem;">${formatCurrency(rental.monthlyRent)}</div>
        </div>
        <div class="card" style="padding: 0.75rem; text-align: center; background: var(--bg-secondary);">
          <div style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-primary); font-weight: 700; letter-spacing: 0.5px;">Security Deposit</div>
          <div style="font-size: 1.3rem; font-weight: 800; color: var(--color-purple); margin-top: 0.25rem;">${formatCurrency(rental.securityDeposit || 0)}</div>
        </div>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <div class="card" style="flex: 1; padding: 0.5rem; text-align: center; border: 1px solid ${dotColor};">
          <div style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-primary); font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.3rem;">Status <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${dotColor};"></span></div>
          <div style="font-size: 0.65rem; color: var(--text-secondary); margin-top: 0.2rem;">Since ${sinceDate}</div>
          ${renewData ? `<div style="font-size: 0.65rem; color: ${dotColor};">Renews: ${renewData.dateStr}</div>` : ''}
        </div>
        <div class="card" style="flex: 1; padding: 0.5rem; text-align: center;">
          <div style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-primary); font-weight: 700;">Total Paid</div>
          <div style="font-weight: 700; color: var(--color-success);">${formatCurrency(totalPaid)}</div>
        </div>
      </div>
    </div>
    <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
      <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem;">Payment History</h4>
      ${renewedDate ? `<div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.85rem;"><span style="color: var(--color-success); font-weight: 600;">Renewed on</span><span style="color: var(--text-primary);">${renewedDate}</span></div>` : ''}
      ${payments.length > 0 ? payments.map(p => `
        <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
          <span style="color: var(--text-primary);">${formatDisplayDate(p.monthYear || p.datePaid)}</span>
          <span style="font-weight: 600; color: var(--color-success);">${formatCurrency(p.amount)}</span>
        </div>
      `).join('') : '<div style="color: var(--text-muted); font-size: 0.85rem;">No payments recorded yet.</div>'}
    </div>
  `;
  
  bodyEl.innerHTML = html;
  openModal('modal-group-details');
};

window.openInterestDetails = function(loanId) {
  loadState();
  const loan = state.lent.find(l => l.id === loanId);
  if (!loan) return;
  
  const titleEl = document.getElementById('group-details-title');
  const bodyEl = document.getElementById('group-details-body');
  if (!titleEl || !bodyEl) return;
  
  const payments = state.interestPayments.filter(p => p.loanId === loanId && p.type === 'received').sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const phone = loan.phone || '';
  const waLink = phone ? `<a href="https://wa.me/91${phone.replace(/\D/g, '')}" target="_blank" class="btn-contact btn-whatsapp"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></a>` : '';
  const callLink = phone ? `<a href="tel:${phone.replace(/\D/g, '')}" class="btn-contact btn-call"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></a>` : '';
  
  const outstanding = getOutstandingPrincipalAtMonth(loan.id, loan.principal, selectedMonthStr);
  const expectedInterest = outstanding > 0 ? outstanding * (Number(loan.interestRate) / 100) : 0;
  
  titleEl.textContent = loan.borrowerName;
  
  let html = `
    <div style="margin-bottom: 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">Principal: ${formatCurrency(loan.principal)}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">Rate: ${loan.interestRate}%/month</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">Started: ${formatDate(loan.startDate)}</div>
        </div>
        <div class="contact-btn-group">${callLink}${waLink}</div>
      </div>
      <div style="margin-top: 0.75rem; display: flex; gap: 0.75rem;">
        <div class="card" style="flex: 1; padding: 0.5rem; text-align: center;">
          <div style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-secondary);">Outstanding</div>
          <div style="font-weight: 700;">${formatCurrency(outstanding)}</div>
        </div>
        <div class="card" style="flex: 1; padding: 0.5rem; text-align: center;">
          <div style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-secondary);">Expected Interest</div>
          <div style="font-weight: 700; color: var(--color-warning);">${formatCurrency(expectedInterest)}</div>
        </div>
        <div class="card" style="flex: 1; padding: 0.5rem; text-align: center;">
          <div style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-secondary);">Total Received</div>
          <div style="font-weight: 700; color: var(--color-success);">${formatCurrency(totalPaid)}</div>
        </div>
      </div>
    </div>
    <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
      <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem;">Payment History</h4>
      ${payments.length > 0 ? payments.map(p => `
        <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
          <span style="color: var(--text-secondary);">${formatDisplayDate(p.date)} ${p.category ? '· ' + p.category : ''}</span>
          <span style="font-weight: 600; color: var(--color-success);">${formatCurrency(p.amount)}</span>
        </div>
      `).join('') : '<div style="color: var(--text-muted); font-size: 0.85rem;">No payments received yet.</div>'}
    </div>
  `;
  
  bodyEl.innerHTML = html;
  openModal('modal-group-details');
};

window.navigateToCard = function(filterType, id, type) {
  currentReminderFilter = filterType;
  refreshActiveTab();
  renderDashboard();
  setTimeout(() => {
    const selector = type === 'rent' ? `[data-id="${id}"]` : `[data-loan-id="${id}"]`;
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({behavior:'smooth', block:'center'});
      el.classList.add('highlight-card');
      setTimeout(() => el.classList.remove('highlight-card'), 3000);
    }
  }, 200);
  closeModal('modal-collection-details');
};

window.markPendingCollected = function(collectionType, itemType, id, amount, monthStr) {
  loadState();
  const today = new Date().toISOString().split('T')[0];
  if (itemType === 'rent') {
    const paymentId = 'rp' + Math.random().toString(36).substr(2, 9);
    state.rentPayments.push({ id: paymentId, rentalId: id, amount: Number(amount), monthYear: monthStr, datePaid: today, note: 'Marked Paid from Collection' });
  } else {
    const paymentId = 'p' + Math.random().toString(36).substr(2, 9);
    const isCurrentMonth = today.slice(0, 7) === monthStr;
    let paymentDate = today;
    if (!isCurrentMonth) {
      const [y, m] = monthStr.split('-').map(Number);
      paymentDate = monthStr + '-' + String(new Date(y, m, 0).getDate()).padStart(2, '0');
    }
    state.interestPayments.push({ id: paymentId, loanId: id, type: 'received', category: 'interest', amount: Number(amount), date: paymentDate, note: 'Marked Received from Collection' });
  }
  saveState();
  renderDashboard();
  renderRentals();
  window.openCollectionDetails(collectionType, null);
};

window.window.openCollectionDetails = function(type, event) {
  if (event) event.stopPropagation();
  let collected = [];
  let pending = [];
  let title = '';

  const isDayMode = viewMode === 'day';
  const isYearMode = viewMode === 'year';
  const selectedYear = selectedDateStr.slice(0, 4);

  const filterPayment = (p) => {
    if (isDayMode) return (p.date || p.datePaid) === selectedDateStr;
    if (isYearMode) return (p.date || p.datePaid || p.monthYear || '').startsWith(selectedYear);
    return (p.date || p.datePaid || p.monthYear || '').startsWith(selectedMonthStr);
  };
  
  const selParts = selectedMonthStr.split('-');
  const selYear = parseInt(selParts[0], 10);
  const selMonth = parseInt(selParts[1], 10);
  const endDateOfSelectedMonth = `${selectedMonthStr}-${String(new Date(selYear, selMonth, 0).getDate()).padStart(2, '0')}`;

  if (type === 'rent') {
    title = 'Rent Collections';
    const rawPayments = state.rentPayments.filter(filterPayment);
    const groupedCol = {};
    const groupedIds = {};
    rawPayments.forEach(p => {
      const r = state.rentals.find(x => x.id === p.rentalId);
      const name = r ? r.tenantName : 'Unknown';
      if(!groupedCol[name]) { groupedCol[name] = 0; groupedIds[name] = []; }
      groupedCol[name] += Number(p.amount);
      if (r && !groupedIds[name].includes(r.id)) groupedIds[name].push(r.id);
    });
    collected = Object.keys(groupedCol).map(name => {var r = state.rentals.find(x => x.id === groupedIds[name][0]); var rd = r ? getNextRenewal(r.startDate) : null; var d = rd && rd.date; return {name, amount: groupedCol[name], ids: groupedIds[name], type: 'rent', propertyName: r ? r.propertyName : '', renewalDate: d ? ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear() : '', renewalDue: rd ? rd.daysLeft <= 30 : false};});
    
    if (!isDayMode && !isYearMode) {
      state.rentals.forEach(r => {
        if (r.startDate <= endDateOfSelectedMonth && r.status === 'active') {
          const pPaid = state.rentPayments.filter(p => p.rentalId === r.id && p.monthYear === selectedMonthStr).reduce((sum, p) => sum + Number(p.amount), 0);
          const pOwe = Number(r.monthlyRent) - pPaid;
          if (pOwe > 0) {var rd = getNextRenewal(r.startDate); var d = rd && rd.date; pending.push({name: r.tenantName, phone: r.contactInfo, owe: pOwe, id: r.id, type: 'rent', propertyName: r.propertyName, renewalDate: d ? ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear() : '', renewalDue: rd ? rd.daysLeft <= 30 : false});}
        }
      });
    }
  } else if (type === 'interest') {
    title = 'Interest Collections';
    const rawPayments = state.interestPayments.filter(p => p.type === 'received' && p.category !== 'issuance' && filterPayment(p));
    const groupedCol = {};
    const groupedIds = {};
    rawPayments.forEach(p => {
      const l = state.lent.find(x => x.id === p.loanId);
      const name = l ? l.borrowerName : 'Unknown';
      if(!groupedCol[name]) { groupedCol[name] = 0; groupedIds[name] = []; }
      groupedCol[name] += Number(p.amount);
      if (l && !groupedIds[name].includes(l.id)) groupedIds[name].push(l.id);
    });
    collected = Object.keys(groupedCol).map(name => {
      const normName = name.toLowerCase().trim();
      const groupId = 'group-' + btoa(encodeURIComponent(normName)).replace(/[^a-zA-Z0-9]/g, '');
      return {name, amount: groupedCol[name], ids: [groupId], type: 'interest'};
    });
    
    if (!isDayMode && !isYearMode) {
      const activeLendingLoans = state.lent.filter(l => l.startDate <= endDateOfSelectedMonth);
      activeLendingLoans.forEach(l => {
        const outstanding = getOutstandingPrincipalAtMonth(l.id, l.principal, selectedMonthStr);
        if (outstanding > 0) {
          const expected = outstanding * (Number(l.interestRate) / 100);
          const pPaid = state.interestPayments.filter(p => p.type === 'received' && p.category !== 'issuance' && p.loanId === l.id && p.date.startsWith(selectedMonthStr)).reduce((sum, p) => sum + Number(p.amount), 0);
          const pOwe = expected - pPaid;
          if (pOwe > 0) {
            const normName = (l.borrowerName || '').toLowerCase().trim();
            const groupId = 'group-' + btoa(encodeURIComponent(normName)).replace(/[^a-zA-Z0-9]/g, '');
            var dueYear = selYear;
            var dueMonth = selMonth;
            var startMonth2 = l.startDate.slice(0, 7);
            if (startMonth2 === selectedMonthStr) {
              dueMonth++;
              if (dueMonth > 12) { dueMonth = 1; dueYear++; }
            }
            const startDay = parseInt(l.startDate.split('-')[2], 10);
            const daysInMonth = new Date(dueYear, dueMonth, 0).getDate();
            const dueDay = Math.min(startDay, daysInMonth);
            const dueDateStr = dueYear + '-' + String(dueMonth).padStart(2, '0') + '-' + String(dueDay).padStart(2, '0');
            const isOverdue = dueDateStr < new Date().toISOString().split('T')[0];
            pending.push({name: l.borrowerName, phone: l.phone, owe: pOwe, id: l.id, type: 'interest', dueDate: dueDateStr, isOverdue});
          }
        }
      });
    }
  } else if (type === 'all') {
    title = 'All Pending Collections';
    if (!isDayMode && !isYearMode) {
      state.rentals.forEach(r => {
        if (r.startDate <= endDateOfSelectedMonth && r.status === 'active') {
          const pPaid = state.rentPayments.filter(p => p.rentalId === r.id && p.monthYear === selectedMonthStr).reduce((sum, p) => sum + Number(p.amount), 0);
          const pOwe = Number(r.monthlyRent) - pPaid;
          if (pOwe > 0) pending.push({name: r.tenantName, type: 'rent', phone: r.contactInfo, owe: pOwe, id: r.id});
        }
      });
      const activeLendingLoans = state.lent.filter(l => l.startDate <= endDateOfSelectedMonth);
      activeLendingLoans.forEach(l => {
        const outstanding = getOutstandingPrincipalAtMonth(l.id, l.principal, selectedMonthStr);
        if (outstanding > 0) {
          const expected = outstanding * (Number(l.interestRate) / 100);
          const pPaid = state.interestPayments.filter(p => p.type === 'received' && p.category !== 'issuance' && p.loanId === l.id && p.date.startsWith(selectedMonthStr)).reduce((sum, p) => sum + Number(p.amount), 0);
          const pOwe = expected - pPaid;
          if (pOwe > 0) {
            const normName = (l.borrowerName || '').toLowerCase().trim();
            const groupId = 'group-' + btoa(encodeURIComponent(normName)).replace(/[^a-zA-Z0-9]/g, '');
            var dueYear = selYear;
            var dueMonth = selMonth;
            var startMonth3 = l.startDate.slice(0, 7);
            if (startMonth3 === selectedMonthStr) {
              dueMonth++;
              if (dueMonth > 12) { dueMonth = 1; dueYear++; }
            }
            const startDay = parseInt(l.startDate.split('-')[2], 10);
            const daysInMonth = new Date(dueYear, dueMonth, 0).getDate();
            const dueDay = Math.min(startDay, daysInMonth);
            const dueDateStr = dueYear + '-' + String(dueMonth).padStart(2, '0') + '-' + String(dueDay).padStart(2, '0');
            const isOverdue = dueDateStr < new Date().toISOString().split('T')[0];
            pending.push({name: l.borrowerName, type: 'interest', phone: l.phone, owe: pOwe, id: l.id, dueDate: dueDateStr, isOverdue});
          }
        }
      });
    }
  }

  document.getElementById('collection-details-title').textContent = title;
  
  const listContainer = document.getElementById('collection-details-list');
  let html = '';

  if (pending.length > 0) {
    html += '<h4 style="margin-top: 0.5rem; margin-bottom: 0.5rem; color: var(--color-danger);">Pending</h4>';
    html += pending.map(p => {
      const cleanPhone = p.phone ? p.phone.replace(/\D/g, '') : '';
      const waLink = p.phone ? `<a href="https://wa.me/91${cleanPhone}" target="_blank" class="btn-contact btn-whatsapp"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></a>` : '';
      const callLink = p.phone ? `<a href="tel:${cleanPhone}" class="btn-contact btn-call"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></a>` : '';
      const navAttr = p.id ? `navigateToCard('${p.type}', '${p.id}', '${p.type}')` : '';
      return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <input type="checkbox" onclick="event.stopPropagation(); markPendingCollected('${type}', '${p.type}', '${p.id}', ${p.owe}, '${selectedMonthStr}');" style="accent-color: var(--color-success); cursor: pointer;">
          <span style="font-weight: 500; color: ${p.renewalDue ? 'var(--color-warning)' : 'var(--text-primary)'}; cursor: pointer;" ${navAttr ? `onclick="${navAttr}"` : ''}>${p.name}</span>${p.propertyName ? ' <span style="font-size:0.65rem;color:var(--text-secondary)">' + p.propertyName + (p.renewalDue && p.renewalDate ? ' <span style="color:var(--color-danger);font-weight:700">' + p.renewalDate + '</span>' : '') + '</span>' : ''}${p.dueDate ? ' <span style="font-size:0.65rem;' + (p.isOverdue ? 'color:var(--color-danger);font-weight:700' : 'color:var(--text-primary)') + '">Due: ' + p.dueDate.split('-').reverse().join('/') + '</span>' : ''}
          <div class="contact-btn-group" style="display: inline-flex;">${callLink}${waLink}</div>
          ${type === 'all' ? `<span style="font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 0.1rem 0.35rem; border-radius: 4px; background: ${p.type === 'rent' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)'}; color: ${p.type === 'rent' ? 'var(--color-success)' : 'var(--color-accent)'};">${p.type === 'rent' ? 'RENT' : 'INTEREST'}</span>` : ''}
        </div>
        <span style="color: var(--color-success); font-weight: 600;">${formatCurrency(p.owe)}</span>
      </div>
    `}).join('');
    const pendTotal = pending.reduce((s, p) => s + p.owe, 0);
    html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-top: 2px solid rgba(255, 255, 255, 0.5);">
      <span style="font-weight: 700; color: var(--text-primary);">Total</span>
      <span style="font-weight: 800; color: var(--color-success); font-size: 1.1rem;">${formatCurrency(pendTotal)}</span>
    </div>
    <div style="border-top: 2px solid rgba(255,255,255,0.4); margin: 0.25rem 0 0.25rem;"></div>`;
  }

  if (collected.length > 0) {
    html += `<h4 style="margin-top: ${pending.length > 0 ? '1.5rem' : '0.5rem'}; margin-bottom: 0.5rem; color: var(--color-success);">Collected</h4>`;
    html += collected.map(p => {
      let clickAttr = '';
      const navAttrCol = p.ids && p.ids.length === 1 ? `navigateToCard('${p.type}', '${p.ids[0]}', '${p.type}')` : '';
      if (navAttrCol) clickAttr = ` style="cursor: pointer;" onclick="${navAttrCol}"`;
      return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);"${clickAttr}>
        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <span style="font-weight: 500; color: ${p.renewalDue ? 'var(--color-warning)' : 'var(--text-primary)'};${navAttrCol ? ' cursor: pointer;' : ''}">${p.name}</span>${p.propertyName ? ' <span style="font-size:0.65rem;color:var(--text-secondary)">' + p.propertyName + (p.renewalDue && p.renewalDate ? ' <span style="color:var(--color-danger);font-weight:700">' + p.renewalDate + '</span>' : '') + '</span>' : ''}
          ${type === 'all' ? `<span style="font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 0.1rem 0.35rem; border-radius: 4px; background: ${p.type === 'rent' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)'}; color: ${p.type === 'rent' ? 'var(--color-success)' : 'var(--color-accent)'};">${p.type === 'rent' ? 'RENT' : 'INTEREST'}</span>` : ''}
          <span style="font-size: 0.8em;">✅</span>
        </div>
        <span style="color: var(--text-primary); font-weight: 600;">${formatCurrency(p.amount)}</span>
      </div>`;
    }).join('');
    const collTotal = collected.reduce((s, p) => s + p.amount, 0);
    html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-top: 2px solid rgba(255, 255, 255, 0.5);">
      <span style="font-weight: 700; color: var(--text-primary);">Total</span>
      <span style="font-weight: 800; color: var(--text-primary); font-size: 1.1rem;">${formatCurrency(collTotal)}</span>
    </div>`;
  }

  const pendTotal = pending.reduce((s, p) => s + p.owe, 0);
  const overallTotal = collected.reduce((s, p) => s + p.amount, 0) + pendTotal;
  if (pending.length > 0 || collected.length > 0) {
    html += `<div style="border-top: 2px solid rgba(255,255,255,0.4); margin: 0.1rem 0 0.1rem;"></div>
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0;">
      <span style="font-weight: 800; color: var(--color-success); font-size: 0.95rem;">Overall Total</span>
      <span style="font-weight: 800; color: var(--color-success); font-size: 1.2rem;">${formatCurrency(overallTotal)}</span>
    </div>`;
  }
  
  if (collected.length === 0 && pending.length === 0) {
    html = '<div style="text-align: center; color: var(--text-muted); padding: 1rem;">No collections found for this period.</div>';
  }
  
  listContainer.innerHTML = html;
  openModal('modal-collection-details');
};

// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  initFileDB(function() {
    initApp();
    setTheme(state.theme || 'black-and-colored-plain');
  
  const datePickerInput = document.getElementById('date-picker-input');
  if (datePickerInput) {
    datePickerInput.max = new Date().toISOString().split('T')[0];
    datePickerInput.addEventListener('change', (e) => {
      if (e.target.value) {
        selectedDateStr = e.target.value;
        selectedMonthStr = selectedDateStr.slice(0, 7);
        viewMode = 'day';
        updateHeaderDateDisplay();
        refreshActiveTab();
      }
    });
  }
  
  // ==========================================
  // SWIPE GESTURES FOR MOBILE NAVIGATION
  // ==========================================
  const tabsOrder = ['dashboard', 'records', 'settings'];
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartY = 0;
  let touchEndY = 0;

  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, {passive: true});

    mainContent.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      
      const ignoreEl = e.target.closest('.table-responsive, input[type="range"], .modal-container, select');
      if (ignoreEl) {
        if (ignoreEl.classList.contains('table-responsive')) {
          if (ignoreEl.scrollWidth > ignoreEl.clientWidth) return;
        } else {
          return;
        }
      }

      const xDiff = touchStartX - touchEndX;
      const yDiff = Math.abs(touchStartY - touchEndY);
      
      if (Math.abs(xDiff) > 60 && yDiff < 40) {
        const activeTabEl = document.querySelector('.tab-content.active');
        if (!activeTabEl) return;
        
        const currentTab = activeTabEl.id.replace('view-', '');
        const currentIndex = tabsOrder.indexOf(currentTab);
        
        if (currentIndex === -1) return;
        
        if (xDiff > 0) {
          if (currentIndex < tabsOrder.length - 1) {
            switchTab(tabsOrder[currentIndex + 1]);
          } else {
            switchTab(tabsOrder[0]); // Loop to start
          }
        } else {
          if (currentIndex > 0) {
            switchTab(tabsOrder[currentIndex - 1]);
          } else {
            switchTab(tabsOrder[tabsOrder.length - 1]); // Loop to end
          }
        }
      }
    }, {passive: true});
  }
  
  // Initialize Construction Form Listener
  const formConstruction = document.getElementById('form-construction');
  if (formConstruction) {
    formConstruction.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('construction-id').value;
      const project = document.getElementById('const-project').value;
      const laborType = document.getElementById('const-labor').value;
      const workerName = document.getElementById('const-worker').value;
      const amount = Number(document.getElementById('const-amount').value);
      const date = document.getElementById('const-date').value;
      const notes = document.getElementById('const-notes').value;
      
      if (id) {
        const index = state.expenses.findIndex(exp => exp.id === id);
        if (index !== -1) {
          state.expenses[index] = {
            ...state.expenses[index],
            project, laborType, workerName, amount, date, note: notes
          };
        }
        saveState();
        closeModal('modal-construction');
        refreshActiveTab();
      } else {
        state.expenses.push({
          id: 'exp_' + Math.random().toString(36).substr(2, 9),
          category: 'construction',
          project, laborType, workerName, amount, date, note: notes,
          propertyId: ''
        });
        saveState();
        closeModal('modal-construction');
        switchTab('dashboard');
        renderDashboard();
        setTimeout(function() {
          var card = document.getElementById('card-expenses');
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('highlight-card');
          }
        }, 150);
      }
    });
  }
  });
});

// FEATURE 1: At a Glance Widget
var _glanceRenewalTimer = null;

function renderGlanceWidget() {
  var widget = document.getElementById('at-a-glance-widget');
  if (!widget) return;
  var today = new Date();
  var todayStr = today.toISOString().slice(0, 10);
  var hour = today.getHours();
  var greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  var icon = hour < 12 ? '\u2600\uFE0F' : hour < 17 ? '\u26C5' : '\uD83C\uDF19';

  // Today's total collected
  var todayRentCollected = state.rentPayments
    .filter(function(p) { return p.datePaid === todayStr; })
    .reduce(function(s, p) { return s + Number(p.amount); }, 0);
  var todayInterestCollected = state.interestPayments
    .filter(function(p) { return p.type === 'received' && p.category !== 'issuance' && p.date === todayStr; })
    .reduce(function(s, p) { return s + Number(p.amount); }, 0);
  var totalCollected = todayRentCollected + todayInterestCollected;

  // People who owe today (rent due today + active interest not yet paid this month)
  var currentMonth = todayStr.slice(0, 7);
  var rentDueDay = today.getDate();
  var pendingPeople = [];

  state.rentals.forEach(function(r) {
    if (r.status === 'active' && r.startDate <= todayStr) {
      var isPaid = state.rentPayments.some(function(p) { return p.rentalId === r.id && p.monthYear === currentMonth; });
      if (!isPaid && Number(r.rentDueDay) === rentDueDay) {
        pendingPeople.push({ name: r.tenantName, amount: Number(r.monthlyRent), type: 'rent' });
      }
    }
  });

  state.lent.forEach(function(l) {
    if (l.status === 'active' && l.startDate <= todayStr) {
      var outstanding = getOutstandingPrincipalAtMonth(l.id, l.principal, currentMonth);
      if (outstanding > 0) {
        var expected = outstanding * (Number(l.interestRate) / 100);
        var paid = state.interestPayments
          .filter(function(p) { return p.type === 'received' && p.category !== 'issuance' && p.loanId === l.id && p.date.startsWith(currentMonth); })
          .reduce(function(s, p) { return s + Number(p.amount); }, 0);
        var owe = expected - paid;
        if (owe > 0) {
          pendingPeople.push({ name: l.borrowerName, amount: owe, type: 'interest' });
        }
      }
    }
  });

  var totalPending = pendingPeople.reduce(function(s, p) { return s + p.amount; }, 0);
  var uniqueCount = pendingPeople.length;

  document.getElementById('glance-icon').textContent = icon;
  document.getElementById('glance-greeting').textContent = greeting + '!';

  var summaryEl = document.getElementById('glance-summary');
  var detailsEl = document.getElementById('glance-details');

  if (totalCollected > 0) {
    summaryEl.innerHTML = 'Collected <strong>' + formatCurrency(totalCollected) + '</strong> today';
  } else {
    summaryEl.innerHTML = '';
  }

  function setGlanceDetails(html) {
    detailsEl.innerHTML = html;
    detailsEl.classList.remove('glance-slide-in');
    void detailsEl.offsetWidth;
    detailsEl.classList.add('glance-slide-in');
  }

  if (uniqueCount > 0) {
    setGlanceDetails('Collect <strong>' + formatCurrency(totalPending) + '</strong> from <strong>' + uniqueCount + '</strong> ' + (uniqueCount === 1 ? 'person' : 'people'));
  } else {
    // Build upcoming renewals pool
    var renewalItems = [];
    today.setHours(0,0,0,0);

    getUpcomingRenewals().forEach(function(r) {
      var due = new Date(r.dueDate);
      var diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      var emoji = r.category === 'Insurance' ? '\uD83D\uDE97' : r.category === 'Tax' ? '\uD83D\uDCCB' : r.category === 'Certificate' ? '\uD83D\uDCC4' : r.category === 'Subscription' ? '\uD83D\uDD04' : '\uD83D\uDCCC';
      renewalItems.push({ text: emoji + ' <strong>' + r.title + '</strong> renewal due in <strong>' + diff + '</strong> ' + (diff === 1 ? 'day' : 'days'), daysLeft: diff });
    });

    state.rentals.forEach(function(r) {
      if (r.status === 'active') {
        var info = getNextRenewal(r.startDate);
        if (info && info.daysLeft <= 30) {
          renewalItems.push({ text: '\uD83D\uDCCB <strong>' + r.tenantName + '\'s</strong> rent agreement renewal in <strong>' + info.daysLeft + '</strong> ' + (info.daysLeft === 1 ? 'day' : 'days'), daysLeft: info.daysLeft });
        }
      }
    });

    renewalItems.sort(function(a, b) { return a.daysLeft - b.daysLeft; });

    if (_glanceRenewalTimer) clearTimeout(_glanceRenewalTimer);

    if (typeof _glanceRenewalDismissIdx === 'undefined') _glanceRenewalDismissIdx = 0;
    if (_glanceRenewalDismissIdx < renewalItems.length) {
      var item = renewalItems[_glanceRenewalDismissIdx];
      setGlanceDetails(item.text + ' <span onclick="event.stopPropagation();dismissGlanceRenewal()" style="cursor:pointer;margin-left:0.5rem;opacity:0.5;font-size:0.82rem;">\u2715</span>');
      _glanceRenewalTimer = setTimeout(function() {
        _glanceRenewalDismissIdx++;
        renderGlanceWidget();
      }, 5000);
    } else {
      setGlanceDetails('Nothing due today. All caught up!');
      _glanceRenewalTimer = setTimeout(function() {
        _glanceRenewalDismissIdx = 0;
        renderGlanceWidget();
      }, 5000);
    }
  }

  widget.style.display = 'block';
}

window.renderGlanceWidget = renderGlanceWidget;

window.dismissGlanceRenewal = function() {
  if (_glanceRenewalTimer) clearTimeout(_glanceRenewalTimer);
  if (typeof _glanceRenewalDismissIdx === 'undefined') _glanceRenewalDismissIdx = 0;
  _glanceRenewalDismissIdx++;
  renderGlanceWidget();
};

// Quick Actions modal
window.openQuickActions = function() { openModal('modal-quick-actions'); };

// Notes Diary
window.openNotesDiary = function() {
  openModal('modal-notes-diary');
  renderDiaryEntries();
};

var _editingDiaryIdx = -1;

function renderDiaryEntries() {
  var container = document.getElementById('notes-diary-entries');
  if (!container) return;
  var notes = JSON.parse(localStorage.getItem('ft_diary_notes') || '[]');
  if (notes.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-muted); font-size: 0.82rem;">No diary entries yet. Write your first note below!</div>';
    _editingDiaryIdx = -1;
    return;
  }
  container.innerHTML = notes.slice().reverse().map(function(n, i) {
    var idx = notes.length - 1 - i;
    var isEditing = _editingDiaryIdx === idx;
    var html = '<div style="padding: 0.5rem; margin-bottom: 0.4rem; background: var(--bg-tertiary); border-radius: var(--radius-sm); border-left: 3px solid var(--color-accent); position: relative;" data-notes-idx="' + idx + '">' +
      '<div style="font-size: 0.65rem; color: var(--text-muted); margin-bottom: 0.25rem; padding-right: 1.5rem;">' + n.date + '</div>' +
      '<div style="font-size: 0.82rem; color: var(--text-primary); white-space: pre-wrap; padding-right: 1.5rem;">' + escHtml(n.text) + '</div>' +
      '<button onclick="shareDiaryNote(' + idx + ')" title="Share on WhatsApp" style="position: absolute; top: 50%; right: 0.4rem; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 0; color: #25D366; font-size: 1.1rem; line-height: 1;">' +
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
      '</button>' +
      '<div style="margin-top: 0.25rem; display: flex; gap: 0.5rem; align-items: center;">' +
        '<button onclick="editDiaryNote(' + idx + ')" style="background: none; border: none; color: var(--color-accent); cursor: pointer; font-size: 0.8rem; padding: 0; font-weight: 600;">Edit</button>' +
        '<button onclick="deleteDiaryNote(' + idx + ')" style="background: none; border: none; color: var(--color-danger); cursor: pointer; font-size: 0.8rem; padding: 0; font-weight: 600;">Delete</button>' +
      '</div>' +
    '</div>';
    if (isEditing) {
      html += '<div id="notes-edit-inline-' + idx + '" style="margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--color-accent);">' +
        '<textarea id="notes-edit-text-' + idx + '" style="width: 100%; min-height: 80px; padding: 0.4rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-primary); color: var(--text-primary); font-size: 0.82rem; resize: vertical; box-sizing: border-box;">' + escHtml(n.text) + '</textarea>' +
        '<div style="display: flex; gap: 0.4rem; margin-top: 0.4rem;">' +
          '<button class="btn btn-primary" onclick="saveDiaryNoteEdit(' + idx + ')" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;">Save</button>' +
          '<button class="btn btn-secondary" onclick="cancelDiaryNoteEdit()" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;">Cancel</button>' +
        '</div>' +
      '</div>';
    }
    return html;
  }).join('');
  attachDiaryGestures(container);
}

function attachDiaryGestures(container) {
  var cards = container.querySelectorAll('[data-notes-idx]');
  cards.forEach(function(card) {
    var holdTimer = null, isHolding = false, startX = 0;
    function clearHold() { clearTimeout(holdTimer); card.style.outline = ''; isHolding = false; }
    function onDown(x) {
      if (holdTimer !== null) return;
      if (event.target && event.target.closest('button')) return;
      startX = x;
      isHolding = false;
      holdTimer = setTimeout(function() {
        isHolding = true;
        card.style.outline = '2px solid var(--color-accent)';
      }, 500);
    }
    function onMove(x) {
      if (!isHolding) { clearHold(); return; }
      if (x - startX < -50) {
        var idx = parseInt(card.getAttribute('data-notes-idx'));
        editDiaryNote(idx);
        clearHold();
      }
    }
    card.addEventListener('touchstart', function(e) { onDown(e.touches[0].clientX); });
    card.addEventListener('touchmove', function(e) { onMove(e.touches[0].clientX); });
    card.addEventListener('touchend', clearHold);
    card.addEventListener('touchcancel', clearHold);
    card.addEventListener('mousedown', function(e) { onDown(e.clientX); });
    card.addEventListener('mousemove', function(e) { if (isHolding) onMove(e.clientX); });
    card.addEventListener('mouseup', clearHold);
    card.addEventListener('mouseleave', clearHold);
  });
}

window.saveDiaryNote = function() {
  var input = document.getElementById('notes-diary-input');
  var text = input.value.trim();
  if (!text) return;
  var notes = JSON.parse(localStorage.getItem('ft_diary_notes') || '[]');
  notes.push({ date: new Date().toLocaleString(), text: text });
  localStorage.setItem('ft_diary_notes', JSON.stringify(notes));
  input.value = '';
  renderDiaryEntries();
};

window.shareDiaryNote = function(index) {
  var notes = JSON.parse(localStorage.getItem('ft_diary_notes') || '[]');
  var note = notes[index];
  if (!note) return;
  var text = note.text;
  var url = 'https://wa.me/?text=' + encodeURIComponent(text);
  window.open(url, '_blank');
};

window.deleteDiaryNote = function(index) {
  var notes = JSON.parse(localStorage.getItem('ft_diary_notes') || '[]');
  notes.splice(index, 1);
  localStorage.setItem('ft_diary_notes', JSON.stringify(notes));
  renderDiaryEntries();
};

window.editDiaryNote = function(index) {
  _editingDiaryIdx = index;
  renderDiaryEntries();
  setTimeout(function() {
    var el = document.getElementById('notes-edit-inline-' + index);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var ta = document.getElementById('notes-edit-text-' + index);
    if (ta) ta.focus();
  }, 50);
};

window.saveDiaryNoteEdit = function(index) {
  var ta = document.getElementById('notes-edit-text-' + index);
  if (!ta) return;
  var text = ta.value.trim();
  if (!text) return;
  var notes = JSON.parse(localStorage.getItem('ft_diary_notes') || '[]');
  if (notes[index]) {
    notes[index].text = text;
    notes[index].date = 'Edited ' + new Date().toLocaleString();
  }
  localStorage.setItem('ft_diary_notes', JSON.stringify(notes));
  _editingDiaryIdx = -1;
  renderDiaryEntries();
};

window.cancelDiaryNoteEdit = function() {
  _editingDiaryIdx = -1;
  renderDiaryEntries();
};

// Calculator
var calcTokens = [{v: '0', label: ''}];
var _editingCalcToken = -1;
var calcHistory = JSON.parse(localStorage.getItem('ft_calc_history') || '[]');
var _calcHistoryVisible = false;
var _calcShowExpr = true;
var _calcSavedExpr = '';
var _calcSavedResult = 0;

function calcExprFromTokens() {
  return calcTokens.map(function(t) { return t.v; }).join('');
}

window.openCalculator = function() {
  calcTokens = [{v: '0', label: ''}];
  _editingCalcToken = -1;
  _calcHistoryVisible = false;
  _calcShowExpr = true;
  _calcSavedExpr = '';
  _calcSavedResult = 0;
  var btn = document.getElementById('calc-history-btn');
  if (btn) btn.textContent = 'Show History';
  document.getElementById('calc-display').textContent = '0';
  openModal('modal-calculator');
  renderCalcButtons();
  calcUpdateDisplay();
  renderCalcHistory();
};

function renderCalcButtons() {
  var grid = document.getElementById('calc-buttons');
  if (!grid) return;
  var buttons = [
    '±', 'C', '%', '×',
    '7', '8', '9', '÷',
    '4', '5', '6', '-',
    '1', '2', '3', '+',
    '.', '0', '⌫', '='
  ];
  grid.innerHTML = buttons.map(function(label) {
    var isEq = label === '=';
    var isOp = ['÷','×','-','+','C','±','%','⌫'].indexOf(label) !== -1;
    var bg = isEq ? 'var(--color-accent)' : isOp ? 'var(--bg-tertiary)' : 'var(--bg-primary)';
    var color = isEq ? '#fff' : 'var(--text-primary)';
    var action = label === 'C' ? "calcClear()" : label === '⌫' ? "calcBackspace()" : label === '±' ? "calcNegate()" : label === '=' ? "calcEqual()" : "calcInput('" + label.replace(/'/g, "\\'") + "')";
    return '<button onclick="' + action + '" style="padding:1rem;border:1px solid var(--border-color);border-radius:var(--radius-sm);background:' + bg + ';color:' + color + ';font-size:1.1rem;font-weight:600;cursor:pointer;text-align:center;">' + label + '</button>';
  }).join('');
}

function calcUpdateDisplay() {
  var display = document.getElementById('calc-display');
  var expr = document.getElementById('calc-expression');
  if (!display) return;
  if (!_calcShowExpr) {
    if (expr) expr.innerHTML = '';
    try {
      var live = eval(calcExprFromTokens());
      if (isFinite(live)) display.textContent = live;
    } catch(e) {}
    renderCalcLabelEditor();
    return;
  }
  var str = calcExprFromTokens();
  var parts = [];
  calcTokens.forEach(function(t, i) {
    if (['+','-','*','/'].indexOf(t.v) !== -1) {
      parts.push('<span style="margin:0 0.15rem;">' + escHtml(t.v) + '</span>');
    } else {
      var showLabel = t.label ? ' <span style="color:var(--color-accent);font-size:0.75em;">(' + escHtml(t.label) + ')</span>' : '';
      parts.push('<span onclick="editCalcTokenLabel(' + i + ')" style="cursor:pointer;font-weight:600;text-decoration:underline dotted var(--color-accent);">' + escHtml(t.v) + '</span>' + showLabel);
    }
  });
  if (expr) expr.innerHTML = parts.join('');
  try {
    var live = eval(str);
    if (isFinite(live)) {
      display.textContent = live;
    }
  } catch(e) {}
  renderCalcLabelEditor();
}

function renderCalcLabelEditor() {
  var container = document.getElementById('calc-label-editor');
  if (!container) return;
  if (_editingCalcToken === -1 || !calcTokens[_editingCalcToken] || ['+','-','*','/'].indexOf(calcTokens[_editingCalcToken].v) !== -1) {
    container.innerHTML = '';
    return;
  }
  var tok = calcTokens[_editingCalcToken];
  container.innerHTML = '<div style="display:flex;gap:0.3rem;align-items:center;padding:0.25rem 0;">' +
    '<span style="font-size:0.75rem;color:var(--text-muted);white-space:nowrap;">Label for <strong>' + escHtml(tok.v) + '</strong>:</span>' +
    '<input id="calc-label-input" type="text" value="' + escHtml(tok.label) + '" placeholder="..." style="flex:1;padding:0.3rem;border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--bg-primary);color:var(--text-primary);font-size:0.78rem;min-width:60px;">' +
    '<button onclick="saveCalcTokenLabel()" style="padding:0.3rem 0.5rem;background:var(--color-accent);color:#fff;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.75rem;">OK</button>' +
    '<button onclick="cancelCalcTokenLabel()" style="padding:0.3rem 0.5rem;background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--border-color);border-radius:var(--radius-sm);cursor:pointer;font-size:0.75rem;">✕</button>' +
  '</div>';
  setTimeout(function() {
    var inp = document.getElementById('calc-label-input');
    if (inp) inp.focus();
  }, 50);
}

window.editCalcTokenLabel = function(index) {
  _editingCalcToken = _editingCalcToken === index ? -1 : index;
  calcUpdateDisplay();
};

window.saveCalcTokenLabel = function() {
  var inp = document.getElementById('calc-label-input');
  if (!inp || _editingCalcToken === -1) return;
  if (calcTokens[_editingCalcToken]) {
    calcTokens[_editingCalcToken].label = inp.value.trim();
  }
  _editingCalcToken = -1;
  calcUpdateDisplay();
};

window.cancelCalcTokenLabel = function() {
  _editingCalcToken = -1;
  calcUpdateDisplay();
};

window.calcClear = function() {
  if (!_calcSavedExpr || _calcSavedExpr === '0') {
    var str = calcExprFromTokens();
    if (str !== '0') {
      try {
        var result = eval(str);
        if (isFinite(result)) {
          var displayStr = calcTokens.map(function(t) {
            if (['+','-','*','/'].indexOf(t.v) !== -1) return ' ' + t.v + ' ';
            return t.label ? t.v + '(' + t.label + ')' : t.v;
          }).join('').replace(/\*/g, '×').replace(/\//g, '÷');
          calcHistory.push({ expression: displayStr, result: result, date: new Date().toLocaleString() });
          localStorage.setItem('ft_calc_history', JSON.stringify(calcHistory));
          renderCalcHistory();
        }
      } catch(e) {}
    }
  }
  _calcSavedExpr = '';
  calcTokens = [{v: '0', label: ''}];
  _editingCalcToken = -1;
  _calcShowExpr = true;
  calcUpdateDisplay();
};

window.calcBackspace = function() {
  if (!_calcShowExpr) {
    calcTokens = [{v: '0', label: ''}];
    _calcShowExpr = true;
    _calcSavedExpr = '';
    calcUpdateDisplay();
    return;
  }
  var last = calcTokens[calcTokens.length - 1];
  if (!last) return;
  if (last.v.length > 1) {
    last.v = last.v.slice(0, -1);
  } else {
    calcTokens.pop();
    if (calcTokens.length === 0) calcTokens = [{v: '0', label: ''}];
  }
  calcUpdateDisplay();
};

window.calcNegate = function() {
  if (!_calcShowExpr) {
    calcTokens = [{v: '0', label: ''}];
    _calcShowExpr = true;
    _calcSavedExpr = '';
    calcUpdateDisplay();
    return;
  }
  var last = calcTokens[calcTokens.length - 1];
  if (!last || ['+','-','*','/'].indexOf(last.v) !== -1) return;
  if (last.v.charAt(0) === '-') last.v = last.v.slice(1);
  else last.v = '-' + last.v;
  calcUpdateDisplay();
};

window.calcInput = function(val) {
  if (!_calcShowExpr) {
    calcTokens = [{v: '0', label: ''}];
    _calcShowExpr = true;
    _calcSavedExpr = '';
  }
  var map = { '×': '*', '÷': '/' };
  var mapped = map[val] || val;
  var last = calcTokens[calcTokens.length - 1];
  if (val === '%') {
    if (last && ['+','-','*','/'].indexOf(last.v) === -1) {
      try {
        var n = parseFloat(last.v) / 100;
        last.v = String(n);
        _editingCalcToken = -1;
        calcUpdateDisplay();
      } catch(e) {}
    }
    return;
  }
  if (['+','-','*','/'].indexOf(mapped) !== -1) {
    if (last && ['+','-','*','/'].indexOf(last.v) !== -1) {
      last.v = mapped;
    } else {
      calcTokens.push({v: mapped, label: ''});
    }
  } else {
    if (last && ['+','-','*','/'].indexOf(last.v) === -1) {
      if (last.v === '0' && mapped !== '.') {
        last.v = mapped;
      } else {
        last.v += mapped;
      }
    } else {
      calcTokens.push({v: mapped, label: ''});
    }
  }
  _editingCalcToken = -1;
  calcUpdateDisplay();
};

window.calcEqual = function() {
  if (!_calcShowExpr) {
    calcTokens = [{v: '0', label: ''}];
    _calcShowExpr = true;
    _calcSavedExpr = '';
    calcUpdateDisplay();
    return;
  }
  try {
    var str = calcExprFromTokens();
    var result = eval(str);
    if (!isFinite(result)) return;
    var displayStr = calcTokens.map(function(t) {
      if (['+','-','*','/'].indexOf(t.v) !== -1) return ' ' + t.v + ' ';
      return t.label ? t.v + '(' + t.label + ')' : t.v;
    }).join('').replace(/\*/g, '×').replace(/\//g, '÷');
    _calcSavedExpr = displayStr;
    _calcSavedResult = result;
    calcHistory.push({ expression: displayStr, result: result, date: new Date().toLocaleString() });
    localStorage.setItem('ft_calc_history', JSON.stringify(calcHistory));
    renderCalcHistory();
    calcTokens = [{v: String(result), label: ''}];
    _editingCalcToken = -1;
    _calcShowExpr = false;
    calcUpdateDisplay();
  } catch(e) {}
};

function renderCalcHistory() {
  var container = document.getElementById('calc-history');
  if (!container) return;
  container.style.display = _calcHistoryVisible ? 'block' : 'none';
  if (calcHistory.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:0.5rem;color:var(--text-muted);font-size:0.78rem;">No calculations yet</div>';
    return;
  }
  var html = calcHistory.slice().reverse().map(function(h, i) {
    var origIdx = calcHistory.length - 1 - i;
    var escExpr = escHtml(h.expression);
    return '<div onclick="loadCalcEntry(' + origIdx + ')" style="padding:0.35rem 0.5rem;margin-bottom:0.25rem;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:2px solid var(--color-accent);font-size:0.82rem;cursor:pointer;">' +
      '<div style="color:var(--text-primary);">' + escExpr + ' = <strong>' + h.result + '</strong></div>' +
      '<div style="font-size:0.6rem;color:var(--text-muted);margin-top:0.15rem;">' + h.date + '</div>' +
    '</div>';
  }).join('');
  html += '<div style="margin-top:0.4rem;"><button class="btn btn-secondary" onclick="clearCalcHistory()" style="padding:0.3rem 0.6rem;font-size:0.72rem;">Clear History</button></div>';
  container.innerHTML = html;
}

window.loadCalcEntry = function(idx) {
  var h = calcHistory[idx];
  if (!h) return;
  var raw = h.expression.replace(/×/g, '*').replace(/÷/g, '/');
  var parts = raw.split(/\s*([+\-*/])\s*/);
  calcTokens = [];
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].trim();
    if (!p) continue;
    if (['+','-','*','/'].indexOf(p) !== -1) {
      calcTokens.push({v: p, label: ''});
    } else {
      var labelMatch = p.match(/^([\d.]+)\((.+)\)$/);
      if (labelMatch) {
        calcTokens.push({v: labelMatch[1], label: labelMatch[2]});
      } else {
        calcTokens.push({v: p, label: ''});
      }
    }
  }
  _calcShowExpr = true;
  _calcHistoryVisible = false;
  calcUpdateDisplay();
  var btn = document.getElementById('calc-history-btn');
  if (btn) btn.textContent = 'Show History';
  var container = document.getElementById('calc-history');
  if (container) container.style.display = 'none';
};

window.toggleCalcHistory = function() {
  _calcHistoryVisible = !_calcHistoryVisible;
  var btn = document.getElementById('calc-history-btn');
  if (btn) btn.textContent = _calcHistoryVisible ? 'Hide History' : 'Show History';
  renderCalcHistory();
};

window.clearCalcHistory = function() {
  calcHistory = [];
  localStorage.setItem('ft_calc_history', JSON.stringify(calcHistory));
  renderCalcHistory();
};

window.shareCalcExpression = function() {
  var lines = [];
  var currentLine = '';
  for (var i = 0; i < calcTokens.length; i++) {
    var t = calcTokens[i];
    if (['+', '-', '*', '/'].indexOf(t.v) !== -1) {
      if (t.v === '+') {
        if (currentLine) lines.push(currentLine);
        currentLine = '';
      } else {
        var sym = t.v === '*' ? '×' : t.v === '/' ? '÷' : t.v;
        currentLine += ' ' + sym + ' ';
      }
      continue;
    }
    currentLine += t.label ? t.v + '(' + t.label + ')' : t.v;
  }
  if (currentLine) lines.push(currentLine);
  var str = lines[0] || '0';
  for (var j = 1; j < lines.length; j++) {
    str += '\n+ ' + lines[j];
  }
  try {
    var live = eval(calcExprFromTokens());
    if (isFinite(live)) str += '\n= ' + live;
  } catch(e) {}
  if (!str || str === '0') return;
  var url = 'https://wa.me/?text=' + encodeURIComponent(str);
  window.open(url, '_blank');
};

window.scrollToRecentActivity = function() {
  currentReminderFilter = 'all';
  renderDashboard();
  var el = document.getElementById('notifications-wrapper-card');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};




