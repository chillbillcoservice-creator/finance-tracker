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
  const dayName = selected.toLocaleDateString('en-US', { weekday: 'long' });
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
      const removedThemes = ['dark-blue', 'light-elegant', 'midnight-purple'];
      if (removedThemes.includes(state.theme)) {
        const themeMap = { 'dark-blue': 'black-and-colored', 'light-elegant': 'white-and-black', 'midnight-purple': 'soft-sage' };
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
  } else {
    // Seed with dummy sample data if empty or outdated
    localStorage.removeItem(STORAGE_KEY);
    seedInitialData();
    localStorage.setItem(STORAGE_KEY + '_v', SEED_VERSION);
  }
}

// Save Data to LocalStorage
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Seed initial values if empty (gives a premium impression out of the box)
function seedInitialData() {
  state.lent = [
    { id: 'loan_1', borrowerName: 'Rahul Sharma', phone: '9876543210', principal: '100000', interestRate: '2', startDate: '2026-01-15', notes: 'Business loan', status: 'active' },
    { id: 'loan_2', borrowerName: 'Priya Patel', phone: '9876543211', principal: '50000', interestRate: '1.5', startDate: '2026-03-01', notes: 'Personal loan', status: 'active' }
  ];
  state.borrowed = [
    { id: 'borrow_1', lenderName: 'SBI Bank', phone: '', principal: '500000', interestRate: '1', startDate: '2025-06-01', notes: 'Home renovation loan', status: 'active' }
  ];
  state.rentals = [
    { id: 'rent_1', propertyName: '23/48 Ground Floor', tenantName: 'Amit Verma', contactInfo: '9876543212', monthlyRent: '23000', securityDeposit: '46000', startDate: '2025-11-01', dueDay: '5', status: 'active' },
    { id: 'rent_2', propertyName: '23/48 3rd Floor', tenantName: 'Sunita Yadav', contactInfo: '9876543213', monthlyRent: '32000', securityDeposit: '64000', startDate: '2026-02-01', dueDay: '7', status: 'active' },
    { id: 'rent_3', propertyName: '1/104', tenantName: 'Vikram Singh', contactInfo: '9876543214', monthlyRent: '18000', securityDeposit: '36000', startDate: '2026-04-01', dueDay: '10', status: 'active' }
  ];
  state.rentPayments = [
    { id: 'rp_1', rentalId: 'rent_1', monthYear: '2026-07', amount: '23000', datePaid: '2026-07-05', note: 'Full payment' },
    { id: 'rp_2', rentalId: 'rent_2', monthYear: '2026-07', amount: '15000', datePaid: '2026-07-07', note: 'Partial' },
    { id: 'rp_3', rentalId: 'rent_3', monthYear: '2026-06', amount: '18000', datePaid: '2026-06-10', note: 'June cleared' },
    { id: 'rp_4', rentalId: 'rent_1', monthYear: '2026-06', amount: '23000', datePaid: '2026-06-05', note: '' },
    { id: 'rp_5', rentalId: 'rent_2', monthYear: '2026-06', amount: '32000', datePaid: '2026-06-07', note: '' }
  ];
  state.interestPayments = [
    { id: 'ip_1', type: 'received', loanId: 'loan_1', amount: '2000', date: '2026-07-01', category: 'interest', note: 'July interest' },
    { id: 'ip_2', type: 'received', loanId: 'loan_2', amount: '500', date: '2026-06-15', category: 'interest', note: 'June interest' },
    { id: 'ip_3', type: 'paid', loanId: 'borrow_1', amount: '5000', date: '2026-07-01', category: 'interest', note: 'July interest to bank' },
    { id: 'ip_4', type: 'received', loanId: 'loan_1', amount: '2000', date: '2026-06-01', category: 'interest', note: 'June interest' }
  ];
  state.expenses = [
    { id: 'exp_1', amount: '1500', date: '2026-07-03', category: 'Utilities', note: 'Electricity bill', propertyId: '' },
    { id: 'exp_2', amount: '500', date: '2026-07-03', category: 'Travel', note: 'Fuel', propertyId: '' },
    { id: 'exp_3', amount: '3000', date: '2026-07-01', category: 'Maintenance', note: 'Plumber repair', propertyId: 'rent_1' },
    { id: 'exp_4', amount: '250', date: '2026-06-28', category: 'Food', note: 'Office snacks', propertyId: '' },
    { id: 'exp_5', amount: '12000', date: '2026-06-25', category: 'Insurance', note: 'Car Insurance', propertyId: '' }
  ];
  state.renewals = [];
  state.files = [];
  saveState();
}

// 3. UI Helpers & Formatting
const formatCurrency = (val) => {
  return 'Rs. ' + Number(val).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });
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
  document.querySelectorAll('.quick-lend-preset-btn').forEach(function(b) {
    b.style.borderColor = '';
    b.style.background = '';
  });
  if (event && event.target) {
    event.target.style.borderColor = 'var(--color-accent)';
    event.target.style.background = 'rgba(var(--color-accent-rgb), 0.1)';
  }
}

function setPrincipalPreset(val) {
  var input = document.getElementById('loan-principal');
  var current = Number(input.value) || 0;
  input.value = current + val;
  input.focus();
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
      var normName = (borrowerName || '').toLowerCase().trim();
    var groupId = 'group-' + btoa(encodeURIComponent(normName)).replace(/[^a-zA-Z0-9]/g, '');
      _expandedCards.add(groupId);
      setTimeout(function() {
        switchTab('dashboard');
        if (currentReminderFilter === 'interest') currentReminderFilter = 'all';
        toggleReminderFilter('interest');
        var card = document.getElementById('card-interest');
        if (card) card.classList.add('highlight-card');
        setTimeout(function() {
          var newCard = document.querySelector('[data-group-id="' + groupId + '"]');
          if (newCard) newCard.classList.add('new-entry-highlight');
        }, 100);
      }, 150);
      _isSubmittingQuickLend = false;
      alert(`✓ Added ${formatCurrency(principal)} to ${borrowerName}'s existing loan.\nNew principal: ${formatCurrency(Number(existingLoan.principal) + principal)}`);
      return;
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
    category: 'issuance',
    amount: principal,
    date: startDate,
    note: 'Original Principal (Quick Lent)'
  });

  saveState();
  closeModal('modal-quick-lend');
  renderDashboard();
  var normName = (borrowerName || '').toLowerCase().trim();
  var groupId = 'group-' + btoa(encodeURIComponent(normName)).replace(/[^a-zA-Z0-9]/g, '');
  _expandedCards.add(groupId);
  setTimeout(function() {
    switchTab('dashboard');
    if (currentReminderFilter === 'interest') currentReminderFilter = 'all';
    toggleReminderFilter('interest');
    var card = document.getElementById('card-interest');
    if (card) card.classList.add('highlight-card');
    setTimeout(function() {
      var newCard = document.querySelector('[data-group-id="' + groupId + '"]');
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
        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      </a>
      <a href="${waUrl}" target="_blank" class="contact-action-btn wa-btn" title="WhatsApp">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.73.44 3.42 1.28 4.92l-1.36 4.96c-.1.35.2.68.55.58l4.96-1.36c1.5.84 3.19 1.28 4.92 1.28 5.52 0 10-4.48 10-10C22.004 6.48 17.52 2 12.004 2zm5.79 13.91c-.24.67-1.22 1.24-1.78 1.3-1.63.16-3.71-.62-5.74-2.65-2.03-2.03-2.81-4.11-2.65-5.74.06-.56.63-1.54 1.3-1.78.36-.13.72-.11.89.24.22.46.77 1.88.84 2.03.07.15.03.34-.08.48l-.51.62c-.14.17-.18.4-.07.59.39.69.97 1.37 1.63 2.03.66.66 1.34 1.24 2.03 1.63.19.11.42.07.59-.07l.62-.51c.14-.11.33-.15.48-.08.15.07 1.57.62 2.03.84.35.17.37.53.24.89z"/></svg>
      </a>
    </span>
  `;
}

function getNextRenewal(startDateStr) {
  if (!startDateStr) return null;
  const start = new Date(startDateStr);
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

// Export modals to global scope for inline onclicks
// Lend More: Opens Quick Lend modal pre-filled with the borrower's name
function lendMore(loanId) {
  loadState();
  const loan = state.lent.find(l => l.id === loanId);
  if (!loan) return;

  openQuickLend();

  // Wait for the modal to render, then select the borrower
  setTimeout(() => {
    const select = document.getElementById('quick-lend-borrower-select');
    if (select) {
      // Find matching option by borrower name
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === loan.borrowerName) {
          select.value = loan.borrowerName;
          break;
        }
      }
      toggleQuickLendNewName();
    }
  }, 100);
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
  
  // Always update dashboard background state
  if (activeTabId !== 'dashboard') {
    renderDashboard();
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
function renderRecords() {
  // Records dashboard
  renderConstruction();
  if (typeof renderFiles === 'function') renderFiles();
}

const VIEWS = {
  dashboard: { title: 'Status', subtitle: 'Your aggregated financial overview at a glance.', render: renderDashboard },
  records: { title: 'Records', subtitle: 'Bills, documents, construction, and settings.', render: renderRecords }
};

let activeRecordsTab = 'bills';

function selectRecordsTab(tab, projectName) {
  if (projectName) {
    window._selectedConstProject = projectName;
  }
  activeRecordsTab = tab;
  
  renderConstruction();
  
  // Update UI highlights
  // Update UI highlights
  const cards = { bills: 'card-records-bills', documents: 'card-records-documents', policies: 'card-records-policies', construction: 'card-records-construction' };
  Object.entries(cards).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) {
      if (key === tab) {
        el.classList.add('active');
        el.style.opacity = '1';
        el.style.transform = 'scale(1.02)';
      } else {
        el.classList.remove('active');
        el.style.opacity = '0.9';
        el.style.transform = 'scale(1)';
      }
    }
  });

  // Toggle sections
  const billsEl = document.getElementById('section-records-bills');
  const docsEl = document.getElementById('section-records-documents');
  const polEl = document.getElementById('section-records-policies');
  const constrEl = document.getElementById('section-records-construction');
  
  if(billsEl) billsEl.style.display = tab === 'bills' ? 'block' : 'none';
  if(docsEl) docsEl.style.display = tab === 'documents' ? 'block' : 'none';
  if(polEl) polEl.style.display = tab === 'policies' ? 'block' : 'none';
  if(constrEl) constrEl.style.display = tab === 'construction' ? 'block' : 'none';
  
  // Auto-scroll to the activated section
  setTimeout(() => {
    let scrollTargetId = 'section-records-bills';
    if (tab === 'documents') scrollTargetId = 'section-records-documents';
    if (tab === 'policies') scrollTargetId = 'section-records-policies';
    if (tab === 'construction') scrollTargetId = 'section-records-construction';
    
    const el = document.getElementById(scrollTargetId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
}
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
  loadState();
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
    netIncomeNode.innerHTML = `Total Income: <span style="color: var(--text-primary); font-weight: 800;">${formatCurrency(totalIncome)}</span>`;
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
      rentalBalanceNode.innerHTML = `<span style="color: var(--text-primary);">Collected: <span style="color: var(--color-warning); font-weight: 800; margin-left: 2px;">${formatCurrency(totalRentCollected)}</span></span> <span style="color: var(--text-primary); font-weight: 600; margin-left: 10px;">${isYearMode ? '(Year view)' : '(Day view)'}</span>`;
    } else {
      rentalBalanceNode.innerHTML = `<span style="color: var(--text-primary);">Collected: <span style="color: var(--color-warning); font-weight: 800; margin-left: 2px;">${formatCurrency(totalRentCollected)}</span></span> <span style="color: var(--text-primary);">Total: <span style="color: var(--text-primary); font-weight: 800; margin-left: 2px;">${formatCurrency(monthlyRent)}</span></span>`;
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
          expHtml += '<div style="display: flex; justify-content: space-between; align-items: center; padding: 0.2rem 0.4rem; background: var(--input-bg); border-radius: 4px; font-size: 0.7rem;">' +
            '<span style="font-weight: 600; color: var(--text-primary);">' + (exp.note || exp.category) + '</span>' +
            (exp.paymentMethod ? '<span style="font-size:0.6rem; color:var(--text-secondary); font-weight:400;">[' + (exp.paymentMethod === 'upi' ? 'UPI' : 'Cash') + ']</span>' : '<span></span>') +
            '<span style="font-weight: 700; color: var(--color-danger);">' + formatCurrency(exp.amount) + '</span>' +
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
      interestReceivedBalanceNode.innerHTML = `<span style="color: var(--text-primary);">Collected: <span style="color: var(--color-warning); font-weight: 800; margin-left: 2px;">${formatCurrency(totalInterestReceived)}</span></span> <span style="color: var(--text-primary); font-weight: 600; margin-left: 10px;">${isYearMode ? '(Year view)' : '(Day view)'}</span>`;
    } else {
      interestReceivedBalanceNode.innerHTML = `<span style="color: var(--text-primary);">Collected: <span style="color: var(--color-warning); font-weight: 800; margin-left: 2px;">${formatCurrency(totalInterestReceived)}</span></span> <span style="color: var(--text-primary);">Total: <span style="color: var(--text-primary); font-weight: 800; margin-left: 2px;">${formatCurrency(expectedInterestReceived)}</span></span>`;
    }
  }

  // Clear existing pending names lists
  ['card-rent', 'card-interest', 'card-reports'].forEach(id => {
    const card = document.getElementById(id);
    if(card) {
      const oldList = card.querySelector('.pending-names-list');
      if(oldList) oldList.remove();
    }
  });

  // Inject Pending Names if enabled
  if (state.showPendingNames !== false && !isDayMode && !isYearMode) {
    const pTenants = [];
    state.rentals.forEach(r => {
      if (r.startDate <= endDateOfSelectedMonth && r.status === 'active') {
        const pPaid = state.rentPayments.filter(p => p.rentalId === r.id && p.monthYear === selectedMonthStr).reduce((sum, p) => sum + Number(p.amount), 0);
        const pOwe = Number(r.monthlyRent) - pPaid;
        if (pOwe > 0) pTenants.push({name: r.tenantName, owe: pOwe});
      }
    });
    
      if (pTenants.length > 0) {
        const pendingTenantsHTML = '<div class="pending-names-list">' + state.rentals.filter(r => r.startDate <= endDateOfSelectedMonth && r.status === 'active').map(r => {
          const pPaid = state.rentPayments.filter(p => p.rentalId === r.id && p.monthYear === selectedMonthStr).reduce((sum, p) => sum + Number(p.amount), 0);
          const pOwe = Number(r.monthlyRent) - pPaid;
          if (pOwe <= 0) return '';
          return `<div class="pending-name-item"><span>${r.tenantName}</span> (${formatCurrency(pOwe)})</div>`;
        }).filter(Boolean).join('') + '</div>';
        document.getElementById('card-rent').insertAdjacentHTML('beforeend', pendingTenantsHTML);
      }

    const pBorrowers = [];
    activeLendingLoans.forEach(l => {
      const outstanding = getOutstandingPrincipalAtMonth(l.id, l.principal, selectedMonthStr);
      if (outstanding > 0) {
        const expected = outstanding * (Number(l.interestRate) / 100);
        const pPaid = state.interestPayments.filter(p => p.type === 'received' && p.loanId === l.id && p.date.startsWith(selectedMonthStr)).reduce((sum, p) => sum + Number(p.amount), 0);
        const pOwe = expected - pPaid;
        if (pOwe > 0) pBorrowers.push({name: l.borrowerName, owe: pOwe});
      }
    });

    if (pBorrowers.length > 0) {
      const pendingBorrowersHTML = '<div class="pending-names-list">' + activeLendingLoans.map(l => {
        const outstanding = getOutstandingPrincipalAtMonth(l.id, l.principal, selectedMonthStr);
        if (outstanding <= 0) return '';
        const expected = outstanding * (Number(l.interestRate) / 100);
        const pPaid = state.interestPayments.filter(p => p.type === 'received' && p.loanId === l.id && p.date.startsWith(selectedMonthStr)).reduce((sum, p) => sum + Number(p.amount), 0);
        const pOwe = expected - pPaid;
        if (pOwe <= 0) return '';
        return `<div class="pending-name-item"><span>${l.borrowerName}</span> (${formatCurrency(pOwe)})</div>`;
      }).filter(Boolean).join('') + '</div>';
      document.getElementById('card-interest').insertAdjacentHTML('beforeend', pendingBorrowersHTML);
    }
    
    // Attach click-selection to all pending-name-items
    document.querySelectorAll('.pending-name-item').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.pending-name-item.selected').forEach(function(x) {
          if (x !== el) x.classList.remove('selected');
        });
        el.classList.toggle('selected');
      });
    });
    
    // Removed pending names from balance to receive card per user request
  }

  // F. Reminders Logic (for the selected month)
  const rentRemindersNode = document.getElementById('dashboard-rent-reminders');
  if (rentRemindersNode) rentRemindersNode.innerHTML = '';
  
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
      if (notifTitle) notifTitle.textContent = 'Notifications';
    }
  }
  
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
    const anniversaryDay = new Date(loan.startDate).getDate();
    const year = reportingToday.getFullYear();
    const month = reportingToday.getMonth();
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
    const anniversaryDay = new Date(loan.startDate).getDate();
    const year = reportingToday.getFullYear();
    const month = reportingToday.getMonth();
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

// 7. LENDING TAB LOGIC
function renderLending() {
  loadState();

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
        <button class="btn btn-primary" onclick="openModal('modal-add-lent')" style="margin-top: 1rem;">Add First Loan</button>
      </div>`;
    return;
  }

  const groupedLent = {};
  visibleLoans.forEach(loan => {
    const normName = (loan.borrowerName || '').toLowerCase().trim();
    if (!groupedLent[normName]) {
      groupedLent[normName] = {
        id: 'group-' + btoa(encodeURIComponent(normName)).replace(/[^a-zA-Z0-9]/g, ''),
        name: loan.borrowerName,
        phone: loan.phone || '',
        loans: [],
        totalPrincipal: 0,
        totalOutstanding: 0,
        totalRepaid: 0,
        totalReceived: 0,
        statusInMonth: 'paid',
        allActiveInterestPaid: true,
        hasActiveLoans: false
      };
    }
    groupedLent[normName].phone = groupedLent[normName].phone || loan.phone;
    groupedLent[normName].loans.push(loan);
  });

  Object.values(groupedLent).forEach(group => {
    group.loans.sort((a,b) => new Date(a.startDate) - new Date(b.startDate));
    
    group.loans.forEach(loan => {
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
      const statusInMonth = outstandingPrincipal > 0 ? 'active' : 'paid';

      loan._stats = {
        outstandingPrincipal, totalReceived, totalRepaid, monthlyYield,
        isInterestFullyPaidThisMonth, statusInMonth, lastPaymentDate
      };

      group.totalPrincipal += Number(loan.principal);
      group.totalOutstanding += outstandingPrincipal;
      group.totalRepaid += totalRepaid;
      group.totalReceived += totalReceived;

      if (statusInMonth === 'active') {
        group.statusInMonth = 'active';
        group.hasActiveLoans = true;
        if (!isInterestFullyPaidThisMonth) {
          group.allActiveInterestPaid = false;
        }
      }
    });
  });

  const sortedGroups = Object.values(groupedLent).sort((a,b) => {
    if (a.statusInMonth !== b.statusInMonth) return a.statusInMonth === 'active' ? -1 : 1;
    return b.totalOutstanding - a.totalOutstanding;
  });

  sortedGroups.forEach(group => {
    const card = document.createElement('div');
    card.className = `card loan-card ${_expandedCards.has(group.id) ? 'expanded' : ''}`;
    card.setAttribute('data-group-id', group.id);

    let stampHtml = '';
    if (group.hasActiveLoans && group.allActiveInterestPaid) {
      stampHtml = `<div class="card-stamp stamp-received">INTEREST RECEIVED</div>`;
    }

    const principalHtml = `<div class="amount-value" style="color: var(--color-warning);">${formatCurrency(group.totalOutstanding)}</div>
       <div class="amount-in-words" style="font-size: 0.68rem; color: var(--text-secondary); max-width: 180px; line-height: 1.25; margin-top: 0.15rem; font-style: italic; text-align: right; word-wrap: break-word;">(${numberToIndianWords(group.totalOutstanding)})</div>
       <div class="amount-label" style="margin-top: 0.25rem;">Total Outstanding</div>`;

    let loansHtml = '';
    group.loans.forEach((loan, idx) => {
      const stats = loan._stats;
      const loanIdxStr = group.loans.length > 1 ? ` <span style="font-size: 0.8em; color: var(--text-secondary); font-weight: normal;">(Loan No ${String(idx + 1).padStart(2, '0')})</span>` : '';
      
      loansHtml += `
      <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; margin-top: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
          <div>
            <h4 style="margin: 0 0 0.25rem 0; font-size: 0.95rem;">${loan.borrowerName}${loanIdxStr} ${stats.statusInMonth !== 'active' ? '<span class="badge badge-muted">Settled</span>' : ''}</h4>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Issued: ${formatDate(loan.startDate)} ${loan.dueDate ? `• Due: ${formatDate(loan.dueDate)}` : ''}</div>
          </div>
          <div class="contact-btn-group">${loan.phone ? getContactActionsHTML(loan.phone) : ''}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
          <div class="card" style="padding: 0.75rem; text-align: center; background: var(--bg-secondary);">
            <div style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Principal</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: var(--color-warning); margin-top: 0.25rem;">${formatCurrency(stats.outstandingPrincipal)}</div>
            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 0.15rem;">Outstanding</div>
          </div>
          <div class="card" style="padding: 0.75rem; text-align: center; background: var(--bg-secondary);">
            <div style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Monthly Yield</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: #16a34a; margin-top: 0.25rem;">${formatCurrency(stats.monthlyYield)}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 0.75rem;">
          <div class="card" style="padding: 0.5rem; text-align: center;">
            <div style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">${loan.isEMI ? 'EMI' : 'Interest Rate'}</div>
            <div style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-top: 0.2rem;">${loan.isEMI ? formatCurrency(loan.emiAmount) : loan.interestRate + '%'}</div>
            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 0.15rem;">/ month</div>
          </div>
          <div class="card" style="padding: 0.5rem; text-align: center;">
            <div style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">${loan.isEMI ? 'Tenure' : 'Total Received'}</div>
            <div style="font-size: 1rem; font-weight: 700; color: var(--color-success); margin-top: 0.2rem;">${loan.isEMI ? loan.tenureMonths + 'm' : formatCurrency(stats.totalReceived)}</div>
          </div>
          <div class="card" style="padding: 0.5rem; text-align: center;">
            <div style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Last Payment</div>
            <div style="font-size: 1rem; font-weight: 700; margin-top: 0.2rem;">${stats.lastPaymentDate ? formatDate(stats.lastPaymentDate) : '—'}</div>
          </div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.5rem;" onclick="event.stopPropagation();">
          ${stats.isInterestFullyPaidThisMonth || stats.statusInMonth !== 'active' ? '' : `<label for="chk-interest-received-${loan.id}" style="cursor: pointer; font-size: 0.85rem; color: var(--text-primary); margin: 0;">Interest Received</label><input type="checkbox" id="chk-interest-received-${loan.id}" onchange="if(this.checked) { quickMarkInterestPaid('${loan.id}', 'received', ${stats.monthlyYield}, '${selectedMonthStr}'); }" style="width: 15px; height: 15px; cursor: pointer; accent-color: var(--color-success); margin: 0; flex-shrink: 0;">`}
        </div>

        ${loan.notes ? `<div style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic; margin-bottom: 0.5rem;">Notes: ${loan.notes}</div>` : ''}

        <div class="loan-actions" style="margin-top: 0.5rem;">
          ${stats.statusInMonth === 'active' 
            ? (loan.isEMI
               ? `<button class="btn btn-primary btn-sm" onclick="promptRecordEMI('${loan.id}', 'received')">Record EMI</button>
                  <button class="btn btn-sm" style="background: linear-gradient(135deg, var(--color-accent), #0369a1); color: #fff; box-shadow: 0 4px 14px rgba(14,165,233,0.3);" onclick="lendMore('${loan.id}')">Lend More</button>`
               : `<button class="btn btn-primary btn-sm" onclick="promptPayment('${loan.id}', 'received', 'interest')">Record interest</button>
                  <button class="btn btn-success btn-sm" onclick="promptPayment('${loan.id}', 'received', 'principal')">Repay principal</button>
                  <button class="btn btn-sm" style="background: linear-gradient(135deg, var(--color-accent), #0369a1); color: #fff; box-shadow: 0 4px 14px rgba(14,165,233,0.3);" onclick="lendMore('${loan.id}')">Lend More</button>
                  <button class="btn btn-secondary btn-sm" onclick="promptConvertEMI('${loan.id}', 'lent')">Convert to EMI</button>`)
            : `<button class="btn btn-secondary btn-sm" onclick="toggleLoanStatus('${loan.id}', 'lent')">Reopen</button>`
          }
          <button class="btn btn-secondary btn-sm" onclick="showLedger('${loan.id}', 'lent')">History</button>
          <button class="btn btn-secondary btn-sm" onclick="editLoan('${loan.id}', 'lent')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteLoan('${loan.id}', 'lent')">Del</button>
        </div>
      </div>`;
    });

    card.innerHTML = `
      <div class="item-row">
        <div class="item-title-col">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span class="item-name">${group.name}</span>
            ${group.statusInMonth === 'active' ? '' : '<span class="badge badge-muted">Settled</span>'}
            ${stampHtml}
          </div>
          ${group.phone ? `<div style="margin-top: 0.25rem; font-size: 0.85rem; color: var(--text-secondary);">${getContactActionsHTML(group.phone)}</div>` : ''}
          <div class="item-meta" style="margin-top: 0.25rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
            <span>${group.loans.length} Loan${group.loans.length > 1 ? 's' : ''}</span>
            <div style="display: flex; gap: 0.4rem; align-items: center;" onclick="event.stopPropagation()">
              <input type="number" id="quick-pay-${group.id}" class="form-input" placeholder="₹ Amount" style="width: 90px; padding: 0.2rem 0.5rem; min-height: auto; font-size: 0.75rem;">
              <button class="btn btn-primary" style="padding: 0.2rem 0.6rem; font-size: 0.75rem; min-height: auto;" onclick="quickGroupPayment('${group.id}', 'lent')">Recv</button>
            </div>
          </div>
        </div>
        <div class="amount-display" style="text-align: right;">
          ${principalHtml}
        </div>
      </div>
    `;

    const itemRow = card.querySelector('.item-row');
    itemRow.addEventListener('click', (e) => {
      try {
        if (e.target.closest('.contact-action-btn')) return;
        const titleEl = document.getElementById('group-details-title');
        const bodyEl = document.getElementById('group-details-body');
        if (!titleEl || !bodyEl) {
          alert('Error: Modal elements not found. Please do a hard refresh (Ctrl+F5) to clear your cache.');
          return;
        }
        titleEl.textContent = `${group.name}'s Loans`;
        bodyEl.innerHTML = loansHtml;
        openModal('modal-group-details');
      } catch (err) {
        alert('Error opening modal: ' + err.message);
      }
    });

    listContainer.appendChild(card);
  });
}

// 8. BORROWING TAB LOGIC
function renderBorrowing() {
  loadState();

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
        <button class="btn btn-primary" onclick="openModal('modal-add-borrowed')" style="margin-top: 1rem;">Add First Borrowing</button>
      </div>`;
    return;
  }

  const groupedBorrowed = {};
  visibleLoans.forEach(loan => {
    const normName = (loan.financierName || '').toLowerCase().trim();
    if (!groupedBorrowed[normName]) {
      groupedBorrowed[normName] = {
        id: 'group-b-' + btoa(encodeURIComponent(normName)).replace(/[^a-zA-Z0-9]/g, ''),
        name: loan.financierName,
        phone: loan.phone || '',
        loans: [],
        totalPrincipal: 0,
        totalOutstanding: 0,
        totalRepaid: 0,
        totalPaid: 0,
        statusInMonth: 'paid',
        allActiveInterestPaid: true,
        hasActiveLoans: false
      };
    }
    groupedBorrowed[normName].phone = groupedBorrowed[normName].phone || loan.phone;
    groupedBorrowed[normName].loans.push(loan);
  });

  Object.values(groupedBorrowed).forEach(group => {
    group.loans.sort((a,b) => new Date(a.startDate) - new Date(b.startDate));
    
    group.loans.forEach(loan => {
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

      group.totalPrincipal += Number(loan.principal);
      group.totalOutstanding += outstandingPrincipal;
      group.totalRepaid += totalRepaid;
      group.totalPaid += totalPaid;

      if (statusInMonth === 'active') {
        group.statusInMonth = 'active';
        group.hasActiveLoans = true;
        if (!isInterestFullyPaidThisMonth) {
          group.allActiveInterestPaid = false;
        }
      }
    });
  });

  const sortedGroups = Object.values(groupedBorrowed).sort((a,b) => {
    if (a.statusInMonth !== b.statusInMonth) return a.statusInMonth === 'active' ? -1 : 1;
    return b.totalOutstanding - a.totalOutstanding;
  });

  sortedGroups.forEach(group => {
    const card = document.createElement('div');
    card.className = `card loan-card ${_expandedCards.has(group.id) ? 'expanded' : ''}`;
    card.setAttribute('data-group-id', group.id);

    let stampHtml = '';
    if (group.hasActiveLoans && group.allActiveInterestPaid) {
      stampHtml = `<div class="card-stamp stamp-paid">INTEREST PAID</div>`;
    }

    const principalHtml = `<div class="amount-value" style="color: var(--color-danger); font-size: 1.1rem;">${formatCurrency(group.totalOutstanding)}</div>
       <div class="amount-in-words" style="font-size: 0.68rem; color: var(--text-secondary); max-width: 180px; line-height: 1.25; margin-top: 0.15rem; font-style: italic; text-align: right; word-wrap: break-word;">(${numberToIndianWords(group.totalOutstanding)})</div>
       <div class="amount-label" style="margin-top: 0.25rem;">Total Outstanding</div>`;

    let loansHtml = '';
    group.loans.forEach((loan, idx) => {
      const stats = loan._stats;
      const loanIdxStr = group.loans.length > 1 ? ` <span style="font-size: 0.8em; color: var(--text-secondary); font-weight: normal;">(Loan No ${String(idx + 1).padStart(2, '0')})</span>` : '';
      
      loansHtml += `
      <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; margin-top: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
          <div>
            <h4 style="margin: 0 0 0.25rem 0; font-size: 0.95rem;">${loan.financierName}${loanIdxStr} ${stats.statusInMonth !== 'active' ? '<span class="badge badge-muted">Settled</span>' : ''}</h4>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Issued: ${formatDate(loan.startDate)} ${loan.dueDate ? `• Due: ${formatDate(loan.dueDate)}` : ''}</div>
          </div>
          <div style="text-align: right;">
            <div style="color: var(--color-danger); font-weight: bold;">${formatCurrency(stats.outstandingPrincipal)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Principal</div>
          </div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.75rem;" onclick="event.stopPropagation();">
          ${stats.isInterestFullyPaidThisMonth || stats.statusInMonth !== 'active' ? '' : `<label for="chk-interest-paid-${loan.id}" style="cursor: pointer; font-size: 0.85rem; color: var(--text-primary); margin: 0;">Interest Paid</label><input type="checkbox" id="chk-interest-paid-${loan.id}" onchange="if(this.checked) { quickMarkInterestPaid('${loan.id}', 'paid', ${stats.monthlyCost}, '${selectedMonthStr}'); }" style="width: 15px; height: 15px; cursor: pointer; accent-color: var(--color-success); margin: 0; flex-shrink: 0;">`}
        </div>

        <div class="loan-stats-grid">
          <div class="loan-stat-box" style="padding: 0.5rem;">
            <span class="loan-stat-val" style="font-size: 0.9rem;">${loan.isEMI ? `${formatCurrency(loan.emiAmount)} / mo` : `${loan.interestRate}% / mo`}</span>
            <span class="loan-stat-lbl" style="font-size: 0.7rem;">${loan.isEMI ? 'EMI Amount' : 'Interest Rate'}</span>
          </div>
          <div class="loan-stat-box" style="padding: 0.5rem;">
            <span class="loan-stat-val" style="font-size: 0.9rem;">${loan.isEMI ? loan.tenureMonths + ' Months' : formatCurrency(stats.totalPaid)}</span>
            <span class="loan-stat-lbl" style="font-size: 0.7rem;">${loan.isEMI ? 'Tenure' : 'Interest Paid'}</span>
          </div>
          <div class="loan-stat-box" style="padding: 0.5rem;">
            <span class="loan-stat-val" style="font-size: 0.9rem;">${stats.lastPaymentDate ? formatDate(stats.lastPaymentDate) : 'Never'}</span>
            <span class="loan-stat-lbl" style="font-size: 0.7rem;">Last Payment</span>
          </div>
        </div>

        <div style="font-size: 0.8rem; color: var(--text-secondary); display:flex; justify-content:space-between; flex-wrap:wrap; gap: 0.5rem; margin-top: 0.75rem; margin-bottom: 0.75rem;">
          <div><span><strong>${formatCurrency(stats.monthlyCost)}</strong>/mo ${loan.isEMI ? '(Interest part)' : ''}</span></div>
          ${loan.notes ? `<div><span style="font-style: italic;">Notes: ${loan.notes}</span></div>` : ''}
        </div>

        <div class="loan-actions" style="margin-top: 0.5rem;">
          <button class="btn btn-secondary btn-sm" onclick="showLedger('${loan.id}', 'borrowed')">History</button>
          <button class="btn btn-secondary btn-sm" onclick="editLoan('${loan.id}', 'borrowed')">Edit</button>
          ${stats.statusInMonth === 'active' 
            ? (loan.isEMI
               ? `<button class="btn btn-primary btn-sm" onclick="promptRecordEMI('${loan.id}', 'paid')">Record EMI</button>
                  <button class="btn btn-sm" style="background: linear-gradient(135deg, var(--color-accent), #0369a1); color: #fff; box-shadow: 0 4px 14px rgba(14,165,233,0.3);" onclick="lendMore('${loan.id}')">Borrow More</button>`
               : `${stats.isInterestFullyPaidThisMonth ? '' : `<button class="btn btn-primary btn-sm" onclick="promptPayment('${loan.id}', 'paid', 'interest')">Record payout</button>`}
                  <button class="btn btn-success btn-sm" onclick="promptPayment('${loan.id}', 'paid', 'principal')">Repay principal</button>
                  <button class="btn btn-secondary btn-sm" onclick="toggleLoanStatus('${loan.id}', 'borrowed')">Mark Settled</button>`)
            : `<button class="btn btn-secondary btn-sm" onclick="toggleLoanStatus('${loan.id}', 'borrowed')">Reopen</button>`
          }
          ${loan.isEMI ? '' : `<button class="btn btn-secondary btn-sm" onclick="promptConvertEMI('${loan.id}', 'borrowed')">Convert to EMI</button>`}
          <button class="btn btn-danger btn-sm" onclick="deleteLoan('${loan.id}', 'borrowed')">Del</button>
        </div>
      </div>`;
    });

    card.innerHTML = `
      <div class="item-row">
        <div class="item-title-col">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span class="item-name">${group.name}</span>
            ${group.statusInMonth === 'active' ? '' : '<span class="badge badge-muted">Settled</span>'}
            ${stampHtml}
          </div>
          ${group.phone ? `<div style="margin-top: 0.25rem; font-size: 0.85rem; color: var(--text-secondary);">${getContactActionsHTML(group.phone)}</div>` : ''}
          <div class="item-meta" style="margin-top: 0.25rem;">
            <span>${group.loans.length} Loan${group.loans.length > 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="amount-display" style="text-align: right;">
          ${principalHtml}
        </div>
      </div>
    `;

    const itemRow = card.querySelector('.item-row');
    itemRow.addEventListener('click', (e) => {
      try {
        if (e.target.closest('.contact-action-btn')) return;
        const titleEl = document.getElementById('group-details-title');
        const bodyEl = document.getElementById('group-details-body');
        if (!titleEl || !bodyEl) {
          alert('Error: Modal elements not found. Please do a hard refresh (Ctrl+F5) to clear your cache.');
          return;
        }
        titleEl.textContent = `${group.name}'s Loans`;
        bodyEl.innerHTML = loansHtml;
        openModal('modal-group-details');
      } catch (err) {
        alert('Error opening modal: ' + err.message);
      }
    });

    listContainer.appendChild(card);
  });
}

// 9. RENTAL TAB LOGIC
function renderRentals() {
  loadState();

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
        <p>No tenant agreements logged yet for this period. Tap "Add Tenant" to record a rental.</p>
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
    
    let stampHtml = '';
    if (isRentPaidThisMonth) {
      stampHtml = `<div class="card-stamp stamp-received" style="margin-left: 0; margin-bottom: 0.25rem;">RENT RECEIVED</div>`;
    } else {
      if (rentPayments.length > 0) {
        stampHtml = `<div class="card-stamp stamp-received" style="margin-left: 0; margin-bottom: 0.25rem;">RENT RECEIVED</div>`;
      }
    }

    const card = document.createElement('div');
    const renewData = getNextRenewal(rental.startDate);
    const isRenewalSoon = renewData && renewData.daysLeft <= 30;
    card.className = `card loan-card ${_expandedCards.has(rental.id) ? 'expanded' : ''}`;
    card.style.padding = '0.85rem';
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
      <div class="item-row">
        <div class="item-title-col">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <svg class="card-chevron" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><polyline points="6 9 12 15 18 9"/></svg>
            <span class="item-name">${rental.tenantName}</span>
            <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">${rental.propertyName}</span>
            ${rental.status === 'active' ? '' : '<span class="badge badge-muted">Ended</span>'}
          </div>
          ${rental.contactInfo ? `<div style="font-size: 0.85rem; color: var(--text-secondary);">${getContactActionsHTML(rental.contactInfo)}</div>` : ''}
          <div class="item-meta" style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; font-size: 0.68rem;">
            <span>Due: <strong>${rental.rentDueDay}<sup>th</sup></strong></span>
            <span class="meta-divider"></span>
            <span>Since <strong>${formatDate(rental.startDate)}</strong></span>
            ${renewData ? `<span class="meta-divider"></span><span>Renews: <strong>${renewData.dateStr}</strong></span>` : ''}
          </div>
        </div>
        <div class="amount-display" style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
          ${stampHtml}
          <div class="amount-value" style="color: var(--color-success);">${formatCurrency(rental.monthlyRent)}</div>
          <div class="amount-label" style="margin-top: 0.15rem;">Monthly Rent</div>
        </div>
      </div>

      <div class="card-collapse-content">
        <div class="loan-stats-grid" style="margin-top: 1rem;">
          <div class="loan-stat-box">
            <span class="loan-stat-val">${formatCurrency(rental.securityDeposit)}</span>
            <span class="loan-stat-lbl">Security Deposit</span>
          </div>
          <div class="loan-stat-box">
            <span class="loan-stat-val">${formatCurrency(totalCollected)}</span>
            <span class="loan-stat-lbl">Total Rent Collected</span>
          </div>
          <div class="loan-stat-box">
            <span class="loan-stat-val">${rentPayments.length}</span>
            <span class="loan-stat-lbl">Payments Logged</span>
          </div>
        </div>

        <div class="loan-actions">
          <button class="btn btn-secondary btn-sm" onclick="showRentalLedger('${rental.id}')">History</button>
          <button class="btn btn-secondary btn-sm" onclick="editRental('${rental.id}')">Edit</button>
          ${rental.aadhaarImg ? `<button class="btn btn-secondary btn-sm" onclick="viewDocumentImage('${rental.id}', 'aadhaar')" style="border-color: var(--color-success); color: var(--color-success); background: rgba(16,185,129,0.05); display: inline-flex; align-items: center; gap: 4px;"><svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Aadhaar</button>` : ''}
          ${rental.agreementImg ? `<button class="btn btn-secondary btn-sm" onclick="viewDocumentImage('${rental.id}', 'agreement')" style="border-color: var(--color-success); color: var(--color-success); background: rgba(16,185,129,0.05); display: inline-flex; align-items: center; gap: 4px;"><svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Agreement</button>` : ''}
          ${rental.status === 'active' 
            ? `${isRentPaidThisMonth ? '' : `<button class="btn btn-primary btn-sm" onclick="promptRentPayment('${rental.id}')">Log Rent Payment</button>`}
               <button class="btn btn-secondary btn-sm" onclick="toggleRentalStatus('${rental.id}')">End Lease</button>`
            : `<button class="btn btn-secondary btn-sm" onclick="toggleRentalStatus('${rental.id}')">Activate Lease</button>`
          }
          <button class="btn btn-danger btn-sm" onclick="deleteRental('${rental.id}')">Delete</button>
        </div>
      </div>
    `;

    const itemRow = card.querySelector('.item-row');
    const cardClick = (e) => {
      if (e.target.closest('.contact-action-btn, button, .btn, input')) return;
      window.openTenantDetails(rental.id);
    };
    itemRow.addEventListener('click', cardClick);
    card.addEventListener('click', (e) => {
      if (e.target.closest('.contact-action-btn, button, .btn, input')) return;
      window.openTenantDetails(rental.id);
    });

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
      note: 'Original Principal'
    });
  }

  saveState();
  closeModal('modal-loan');
  
  if (direction === 'lent') {
    var normName = (party || '').toLowerCase().trim();
    var groupId = 'group-' + btoa(encodeURIComponent(normName)).replace(/[^a-zA-Z0-9]/g, '');
    _expandedCards.add(groupId);
    renderDashboard();
    setTimeout(function() {
      switchTab('dashboard');
      if (currentReminderFilter === 'interest') currentReminderFilter = 'all';
      toggleReminderFilter('interest');
      var card = document.getElementById('card-interest');
      if (card) card.classList.add('highlight-card');
      setTimeout(function() {
        var newCard = document.querySelector('[data-group-id="' + groupId + '"]');
        if (newCard) newCard.classList.add('new-entry-highlight');
      }, 100);
    }, 150);
  } else {
    var normName = (party || '').toLowerCase().trim();
    var groupId = 'group-b-' + btoa(encodeURIComponent(normName)).replace(/[^a-zA-Z0-9]/g, '');
    _expandedCards.add(groupId);
    renderDashboard();
    setTimeout(function() {
      switchTab('dashboard');
      if (currentReminderFilter === 'interest') currentReminderFilter = 'all';
      toggleReminderFilter('interest');
      var card = document.getElementById('card-interest');
      if (card) card.classList.add('highlight-card');
      setTimeout(function() {
        var newCard = document.querySelector('[data-group-id="' + groupId + '"]');
        if (newCard) newCard.classList.add('new-entry-highlight-red');
      }, 100);
    }, 150);
  }
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
  document.getElementById('loan-rate').value = loan.interestRate;
  document.getElementById('loan-start-date').value = loan.startDate;
  document.getElementById('loan-due-date').value = loan.dueDate || '';
  document.getElementById('loan-notes').value = loan.notes || '';

  // Setup Modal labels based on Direction
  document.getElementById('loan-modal-title').textContent = direction === 'lent' ? 'Edit Lent Loan Details' : 'Edit Borrowing Details';
  document.getElementById('loan-party-label').textContent = direction === 'lent' ? 'Borrower Name' : 'Financier / Lender Name';
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
  
  if (type === 'received') renderLending();
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
          ${item.note ? `<span class="ledger-note">${item.note}</span>` : ''}
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

  rental.status = rental.status === 'active' ? 'inactive' : 'active';
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

// Hard system reset
document.getElementById('btn-reset-data').addEventListener('click', () => {
  if (confirm('CRITICAL WARNING: This will completely delete all your loans, properties, tenants, and logged history. Are you absolutely sure?')) {
    if (confirm('Confirm one last time. This cannot be undone.')) {
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
      seedInitialData();
      localStorage.setItem(STORAGE_KEY + '_v', SEED_VERSION);
      alert('Local database wiped and reseeded successfully.');
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
      l.borrowerName.toLowerCase().includes(query) || 
      (l.notes && l.notes.toLowerCase().includes(query))
    );

    // Search Borrowed
    const matchedBorrowed = state.borrowed.filter(b => 
      b.financierName.toLowerCase().includes(query) || 
      (b.notes && b.notes.toLowerCase().includes(query))
    );

    // Search Rentals
    const matchedRentals = state.rentals.filter(r => 
      r.tenantName.toLowerCase().includes(query) || 
      r.propertyName.toLowerCase().includes(query) ||
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
        switchTab('interest');
        searchInput.value = '';
        performSearch();
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
        switchTab('interest');
        searchInput.value = '';
        performSearch();
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
        switchTab('rental');
        searchInput.value = '';
        performSearch();
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
    var projects = ['23/48 Ground Floor', '23/48 3rd Floor', '1/104'];
    var constructionExpenses = (state.expenses || []).filter(function(e) { return e && e.category === 'construction'; });
    var categories = ['Carpenter', 'Painter', 'Welding', 'Mistri', 'Electrician', 'Plumber', 'Malba', 'Hardware', 'Furniture', 'Ghisai', 'Glass Work', 'AC Service', 'Others'];
    
    var selectedProject = window._selectedConstProject || projects[0];
    var payMethod = window._selectedConstPayMethod || 'cash';
    
    var exps = constructionExpenses.filter(function(e) { return e && e.project === selectedProject; }).sort(function(a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });
    var total = exps.reduce(function(sum, e) { return sum + (Number(e.amount) || 0); }, 0);
    
    var catButtonsHtml = categories.map(function(cat) {
      var isSelected = window._selectedConstCat === cat;
      var bg = isSelected ? 'var(--color-accent)' : 'var(--bg-primary)';
      var color = isSelected ? '#fff' : 'var(--text-secondary)';
      var border = isSelected ? '1px solid var(--color-accent)' : '1px solid var(--border-color)';
      return '<button type="button" class="const-cat-btn" data-cat="' + cat + '" onclick="selectConstCategory(\'' + cat + '\')" style="padding: 0.3rem 0.45rem; font-size: 0.7rem; border-radius: 4px; background: ' + bg + '; color: ' + color + '; border: ' + border + '; cursor: pointer; transition: all 0.2s;">' + cat + '</button>';
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
        (state.showPayMethod !== false ? '<div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">' +
          '<span style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 600;">Pay via:</span>' +
          '<button type="button" class="btn btn-sm" onclick="selectConstPayMethod(\'cash\')" style="padding:0.15rem 0.5rem; font-size:0.65rem; background:' + (payMethod === 'cash' ? 'var(--color-success)' : 'var(--bg-secondary)') + '; color:' + (payMethod === 'cash' ? '#fff' : 'var(--text-primary)') + '; border:1px solid ' + (payMethod === 'cash' ? 'var(--color-success)' : 'var(--border-color)') + '; cursor:pointer;">💰 Cash</button>' +
          '<button type="button" class="btn btn-sm" onclick="selectConstPayMethod(\'upi\')" style="padding:0.15rem 0.5rem; font-size:0.65rem; background:' + (payMethod === 'upi' ? 'var(--color-accent)' : 'var(--bg-secondary)') + '; color:' + (payMethod === 'upi' ? '#fff' : 'var(--text-primary)') + '; border:1px solid ' + (payMethod === 'upi' ? 'var(--color-accent)' : 'var(--border-color)') + '; cursor:pointer;">📱 UPI</button>' +
        '</div>' : '') +
        '<div style="display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: stretch; margin-bottom: 0.35rem;">' +
          '<input type="number" id="const-amount" class="form-input" placeholder="Amount" style="flex: 1; min-width: 100px; background: var(--input-bg); margin: 0; padding: 0.35rem 0.5rem; font-size: 0.8rem;">' +
          '<input type="text" id="const-notes" class="form-input" placeholder="Note" style="flex: 1; min-width: 120px; background: var(--input-bg); margin: 0; padding: 0.35rem 0.5rem; font-size: 0.8rem;">' +
          '<button class="btn btn-primary" onclick="submitQuickConst()" style="margin: 0; padding: 0.35rem 0.75rem; font-size: 0.75rem;">' +
            '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-right: 2px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>' +
            'Save' +
          '</button>' +
        '</div>' +
        '<div style="display: flex; gap: 0.3rem; flex-wrap: wrap; margin-bottom: 0.5rem;">' +
          '<button type="button" class="btn btn-sm" onclick="var i=document.getElementById(\'const-amount\'); i.value=(Number(i.value)||0)+100" style="padding:0.15rem 0.4rem; font-size:0.65rem; background:var(--bg-secondary); border:1px solid var(--border-color); cursor:pointer;">+100</button>' +
          '<button type="button" class="btn btn-sm" onclick="var i=document.getElementById(\'const-amount\'); i.value=(Number(i.value)||0)+500" style="padding:0.15rem 0.4rem; font-size:0.65rem; background:var(--bg-secondary); border:1px solid var(--border-color); cursor:pointer;">+500</button>' +
          '<button type="button" class="btn btn-sm" onclick="var i=document.getElementById(\'const-amount\'); i.value=(Number(i.value)||0)+1000" style="padding:0.15rem 0.4rem; font-size:0.65rem; background:var(--bg-secondary); border:1px solid var(--border-color); cursor:pointer;">+1000</button>' +
          '<button type="button" class="btn btn-sm" onclick="var i=document.getElementById(\'const-amount\'); i.value=(Number(i.value)||0)+1500" style="padding:0.15rem 0.4rem; font-size:0.65rem; background:var(--bg-secondary); border:1px solid var(--border-color); cursor:pointer;">+1500</button>' +
          '<button type="button" class="btn btn-sm" onclick="var i=document.getElementById(\'const-amount\'); i.value=(Number(i.value)||0)+2000" style="padding:0.15rem 0.4rem; font-size:0.65rem; background:var(--bg-secondary); border:1px solid var(--border-color); cursor:pointer;">+2000</button>' +
          '<button type="button" class="btn btn-sm" onclick="var i=document.getElementById(\'const-amount\'); i.value=(Number(i.value)||0)+2500" style="padding:0.15rem 0.4rem; font-size:0.65rem; background:var(--bg-secondary); border:1px solid var(--border-color); cursor:pointer;">+2500</button>' +
          '<button type="button" class="btn btn-sm" onclick="var i=document.getElementById(\'const-amount\'); i.value=(Number(i.value)||0)+5000" style="padding:0.15rem 0.4rem; font-size:0.65rem; background:var(--bg-secondary); border:1px solid var(--border-color); cursor:pointer;">+5000</button>' +
        '</div>' +
        '<div style="font-size: 0.7rem; font-weight: 700; margin-bottom: 0.4rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Recent Payments</div>' +
        '<div style="display: flex; flex-direction: column; gap: 0.35rem;">' +
          (expensesHtml || '<div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; padding: 0.75rem; background: var(--input-bg); border-radius: 6px;">No payments.</div>') +
        '</div>' +
      '</div>';
    
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<div style="color:var(--color-danger); padding: 1rem; background: var(--bg-card); border-radius: 8px;">Error loading construction data: ' + err.message + '. Please clear your cache or check data integrity.</div>';
    console.error('Construction render error:', err);
  }
}

// FILE UPLOAD LOGIC
window.openUploadModal = function(type, method) {
  const form = document.getElementById('form-upload');
  if(form) form.reset();
  
  document.getElementById('upload-type').value = type;
  const img = document.getElementById('upload-preview-img');
  const txt = document.getElementById('upload-preview-text');
  if(img) { img.style.display = 'none'; img.src = ''; }
  if(txt) txt.style.display = 'block';
  if(txt) txt.textContent = 'No file selected';
  
  const fileInput = document.getElementById('upload-file-input');
  if (fileInput) {
    if (method === 'camera') {
      fileInput.setAttribute('accept', 'image/*');
      fileInput.setAttribute('capture', 'environment');
    } else {
      fileInput.setAttribute('accept', 'image/*,application/pdf');
      fileInput.removeAttribute('capture');
    }
  }
  
  document.getElementById('upload-modal-title').textContent = 'Upload ' + type.charAt(0).toUpperCase() + type.slice(1);
  openModal('modal-upload');
  
  if (method === 'camera' && fileInput) {
    fileInput.click();
  }
};

window.deleteFile = function(id) {
  if(!confirm('Are you sure you want to delete this file?')) return;
  loadState();
  state.files = state.files.filter(f => f.id !== id);
  saveState();
  renderFiles();
};

window.viewFile = function(id) {
  const file = state.files.find(f => f.id === id);
  if(file && file.data) {
    const w = window.open('');
    w.document.write(`<img src="${file.data}" style="max-width:100%; height:auto;">`);
  }
};

function renderFiles() {
  const container = document.getElementById('policies-list-container');
  if (!container) return;
  const policies = state.files.filter(f => f.type === 'policies').sort((a,b) => new Date(b.date) - new Date(a.date));
  
  if (policies.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <p>No documents uploaded yet.</p>
      </div>`;
    return;
  }
  
  let html = '';
  policies.forEach(p => {
    html += `
      <div class="card" style="margin-bottom: 0.75rem; display: flex; align-items: center; gap: 1rem; padding: 0.75rem;">
        <div style="width: 48px; height: 48px; background: var(--input-bg); border-radius: 8px; overflow: hidden; flex-shrink: 0; display:flex; align-items:center; justify-content:center;">
          ${p.data ? `<img src="${p.data}" style="width:100%; height:100%; object-fit:cover;">` : '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: var(--text-primary); font-size: 0.95rem;">${p.title}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Uploaded: ${p.date}</div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm" onclick="viewFile('${p.id}')">View</button>
          <button class="btn btn-danger btn-sm" onclick="deleteFile('${p.id}')">Delete</button>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// 13. BOOTSTRAP INITIALIZATION
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
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('upload-preview-img').src = ev.target.result;
          document.getElementById('upload-preview-img').style.display = 'block';
          document.getElementById('upload-preview-text').style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    });
  }
  if (formUpload) {
    formUpload.addEventListener('submit', (e) => {
      e.preventDefault();
      loadState();
      const type = document.getElementById('upload-type').value;
      const title = document.getElementById('upload-title').value;
      const data = document.getElementById('upload-preview-img').src;
      if (!data || data === window.location.href || data === '') {
        alert('Please select a file or take a photo.');
        return;
      }
      state.files.push({
        id: 'file_' + Date.now(),
        type: type,
        title: title,
        data: data,
        date: new Date().toISOString().slice(0, 10)
      });
      saveState();
      closeModal('modal-upload');
      renderFiles();
    });
  }
  
  // Set default lending rates for new entries (4%)
  document.getElementById('btn-add-loan-lent').addEventListener('click', () => {
    document.getElementById('form-loan').reset();
    document.getElementById('loan-id').value = '';
    document.getElementById('loan-direction').value = 'lent';
    document.getElementById('loan-rate').value = '4.00'; // Default interest rate
    document.getElementById('loan-start-date').value = new Date().toISOString().split('T')[0];
    
    // Label updates
    document.getElementById('loan-modal-title').textContent = 'Lend Money';
    document.getElementById('loan-party-label').textContent = 'Borrower Name';
    document.getElementById('loan-party').placeholder = 'e.g. John Doe';
    
    updatePrincipalPresets('lent');
    openModal('modal-loan');
  });

  // Add borrowing loan trigger
  document.getElementById('btn-add-loan-borrowed').addEventListener('click', () => {
    document.getElementById('form-loan').reset();
    document.getElementById('loan-id').value = '';
    document.getElementById('loan-direction').value = 'borrowed';
    document.getElementById('loan-rate').value = '3.00'; // Default interest rate
    document.getElementById('loan-start-date').value = new Date().toISOString().split('T')[0];
    
    // Label updates
    document.getElementById('loan-modal-title').textContent = 'Record Borrowed Money';
    document.getElementById('loan-party-label').textContent = 'Financier / Lender Name';
    document.getElementById('loan-party').placeholder = 'e.g. Apex Bank';
    
    updatePrincipalPresets('borrowed');
    openModal('modal-loan');
  });

  // Add rentals trigger
  document.getElementById('btn-add-rental').addEventListener('click', () => {
    document.getElementById('form-rental').reset();
    document.getElementById('rental-id').value = '';
    document.getElementById('rental-start-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('rental-due-day').value = '1'; // Default to first of month
    
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
    
    // Switch to expenses tab if we logged it from dashboard to see it immediately
    switchTab('expenses');
    renderDashboard();
  });

  // Renewal Form Submit
  document.getElementById('form-renewal').addEventListener('submit', saveRenewal);

  // Initialize search logic
  initSearch();

  // Initialize header date display
  updateHeaderDateDisplay();

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
  loadState();

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
  const sortedExpenses = [...visibleExpenses].sort((a,b) => new Date(b.date) - new Date(a.date));

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
  loadState();
  
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
  loadState();
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
    const yearInterestIn = state.interestPayments.filter(p => p.date && p.date.startsWith(year) && p.type === 'received').reduce((s, p) => s + Number(p.amount), 0);
    const yearInterestOut = state.interestPayments.filter(p => p.date && p.date.startsWith(year) && p.type === 'paid').reduce((s, p) => s + Number(p.amount), 0);
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
  loadState();
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
  
  const totalIncome = rentData.reduce((a, b) => a + b, 0) + interestData.reduce((a, b) => a + b, 0);
  const totalExpenses = expenseData.reduce((a, b) => a + b, 0);
  
  document.getElementById('reports-total-income').textContent = formatCurrency(totalIncome);
  document.getElementById('reports-total-expenses').textContent = formatCurrency(totalExpenses);
  document.getElementById('reports-net-balance').textContent = formatCurrency(totalIncome - totalExpenses);
  
  const canvas = document.getElementById('reports-chart');
  if (!canvas) return;
  
  if (reportsChart) reportsChart.destroy();
  
  const ctx = canvas.getContext('2d');
  reportsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Rent', data: rentData, backgroundColor: 'rgba(234, 179, 8, 0.8)', borderRadius: 4 },
        { label: 'Interest', data: interestData, backgroundColor: 'rgba(16, 185, 129, 0.8)', borderRadius: 4 },
        { label: 'Expenses', data: expenseData, backgroundColor: 'rgba(239, 68, 68, 0.8)', borderRadius: 4 }
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
  
  titleEl.textContent = rental.tenantName;
  
  let html = `
    <div style="margin-bottom: 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
        <div style="font-weight: 600; font-size: 1rem;">${rental.propertyName || 'Property'}</div>
        <div class="contact-btn-group">${callLink}${waLink}</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
        <div class="card" style="padding: 0.75rem; text-align: center; background: var(--bg-secondary);">
          <div style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Monthly Rent</div>
          <div style="font-size: 1.3rem; font-weight: 800; color: var(--color-accent); margin-top: 0.25rem;">${formatCurrency(rental.monthlyRent)}</div>
        </div>
        <div class="card" style="padding: 0.75rem; text-align: center; background: var(--bg-secondary);">
          <div style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Security Deposit</div>
          <div style="font-size: 1.3rem; font-weight: 800; color: var(--color-purple); margin-top: 0.25rem;">${formatCurrency(rental.securityDeposit || 0)}</div>
        </div>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <div class="card" style="flex: 1; padding: 0.5rem; text-align: center;">
          <div style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-secondary);">Status</div>
          <div style="font-weight: 700; color: ${rental.status === 'active' ? 'var(--color-success)' : 'var(--color-danger)'};">${rental.status === 'active' ? 'Active' : 'Inactive'}</div>
        </div>
        <div class="card" style="flex: 1; padding: 0.5rem; text-align: center;">
          <div style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-secondary);">Total Paid</div>
          <div style="font-weight: 700; color: var(--color-success);">${formatCurrency(totalPaid)}</div>
        </div>
      </div>
    </div>
    <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
      <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem;">Payment History</h4>
      ${payments.length > 0 ? payments.map(p => `
        <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
          <span style="color: var(--text-secondary);">${formatDisplayDate(p.monthYear || p.datePaid)}</span>
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
    const selector = type === 'rent' ? `[data-id="${id}"]` : `[data-group-id="${id}"]`;
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
    state.interestPayments.push({ id: paymentId, loanId: id, type: 'received', amount: Number(amount), date: paymentDate, note: 'Marked Received from Collection' });
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
    collected = Object.keys(groupedCol).map(name => ({name, amount: groupedCol[name], ids: groupedIds[name], type: 'rent'}));
    
    if (!isDayMode && !isYearMode) {
      state.rentals.forEach(r => {
        if (r.startDate <= endDateOfSelectedMonth && r.status === 'active') {
          const pPaid = state.rentPayments.filter(p => p.rentalId === r.id && p.monthYear === selectedMonthStr).reduce((sum, p) => sum + Number(p.amount), 0);
          const pOwe = Number(r.monthlyRent) - pPaid;
          if (pOwe > 0) pending.push({name: r.tenantName, phone: r.contactInfo, owe: pOwe, id: r.id, type: 'rent'});
        }
      });
    }
  } else if (type === 'interest') {
    title = 'Interest Collections';
    const rawPayments = state.interestPayments.filter(p => p.type === 'received' && filterPayment(p));
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
          const pPaid = state.interestPayments.filter(p => p.type === 'received' && p.loanId === l.id && p.date.startsWith(selectedMonthStr)).reduce((sum, p) => sum + Number(p.amount), 0);
          const pOwe = expected - pPaid;
          if (pOwe > 0) {
            const normName = (l.borrowerName || '').toLowerCase().trim();
            const groupId = 'group-' + btoa(encodeURIComponent(normName)).replace(/[^a-zA-Z0-9]/g, '');
            pending.push({name: l.borrowerName, phone: l.phone, owe: pOwe, id: groupId, type: 'interest'});
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
          const pPaid = state.interestPayments.filter(p => p.type === 'received' && p.loanId === l.id && p.date.startsWith(selectedMonthStr)).reduce((sum, p) => sum + Number(p.amount), 0);
          const pOwe = expected - pPaid;
          if (pOwe > 0) {
            const normName = (l.borrowerName || '').toLowerCase().trim();
            const groupId = 'group-' + btoa(encodeURIComponent(normName)).replace(/[^a-zA-Z0-9]/g, '');
            pending.push({name: l.borrowerName, type: 'interest', phone: l.phone, owe: pOwe, id: groupId});
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
          <span style="font-weight: 500; color: var(--text-primary); cursor: pointer;" ${navAttr ? `onclick="${navAttr}"` : ''}>${p.name}</span>
          <div class="contact-btn-group" style="display: inline-flex;">${callLink}${waLink}</div>
          <input type="checkbox" onclick="markPendingCollected('${type}', '${p.type}', '${p.id}', ${p.owe}, '${selectedMonthStr}'); event.stopPropagation();" style="margin-left: 0.5rem; accent-color: var(--color-success); cursor: pointer;">
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
          <span style="font-weight: 500; color: var(--text-primary);${navAttrCol ? ' cursor: pointer;' : ''}">${p.name}</span>
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
