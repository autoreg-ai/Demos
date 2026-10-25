const STORE_KEY = 'coverly-demo-v1';
const categoryRates = {
  Electronics: 1,
  Appliances: 0.85,
  'Home goods': 0.72,
  Other: 1.1
};
const plans = {
  essential: {
    name: 'Essential',
    rate: 0.075,
    minimum: 9,
    description: 'For the everyday what-ifs.',
    features: ['Sample mechanical breakdown protection', 'Simple online claim experience', 'One place for plan details']
  },
  plus: {
    name: 'Plus',
    rate: 0.125,
    minimum: 15,
    description: 'A little extra room to relax.',
    features: ['Everything in Essential', 'Sample accidental damage protection', 'Drops and spills in the example scope']
  }
};

const $ = id => document.getElementById(id);
const currency = value => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',maximumFractionDigits:2}).format(value);
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
let category = 'Electronics';
let term = 1;
let selectedPlan = null;
let activeModal = null;
let previousFocus = null;
let toastTimer;
let records = {policies:[], claims:[]};

try {
  const saved = JSON.parse(localStorage.getItem(STORE_KEY));
  if (saved && Array.isArray(saved.policies) && Array.isArray(saved.claims)) records = saved;
} catch { /* Browser storage may be unavailable. The demo still runs in memory. */ }

function saveRecords() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(records)); }
  catch { showToast('Browser storage is unavailable; this session will not be saved.'); }
  updatePlanCount();
}

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);
}

function priceValue() {
  return Number($('purchase-price').value);
}

function validPrice() {
  const value = priceValue();
  return Number.isFinite(value) && value >= 25 && value <= 5000;
}

function calculatePrice(planKey, purchasePrice = priceValue(), itemCategory = category, years = term) {
  const plan = plans[planKey];
  const factor = years === 2 ? 1.65 : 1;
  return Math.round(Math.max(plan.minimum, purchasePrice * plan.rate * categoryRates[itemCategory]) * factor * 100) / 100;
}

function renderPlans() {
  const valid = validPrice();
  $('quote-error').hidden = valid;
  $('quote-error').textContent = valid ? '' : 'Enter a purchase price between $25 and $5,000 to see sample plans.';
  $('plan-cards').innerHTML = Object.entries(plans).map(([key, plan]) => `
    <article class="plan-card ${key === 'plus' ? 'featured' : ''}">
      ${key === 'plus' ? '<div class="popular-tag">A LITTLE EXTRA</div>' : ''}
      <div class="plan-card-top"><span class="plan-symbol">${key === 'plus' ? '✳' : '◌'}</span><span class="plan-term">${term} ${term === 1 ? 'year' : 'years'}</span></div>
      <h3>${plan.name}</h3><p class="plan-description">${plan.description}</p>
      <div class="plan-price"><strong>${valid ? currency(calculatePrice(key)) : '—'}</strong><span>one time</span></div>
      <button class="button ${key === 'plus' ? 'button-dark' : 'button-outline'} full-button" type="button" data-plan="${key}" ${valid ? '' : 'disabled'}>Choose ${plan.name} <span aria-hidden="true">↗</span></button>
      <div class="plan-divider"></div><p class="includes-label">WHAT'S IN THE EXAMPLE</p>
      <ul>${plan.features.map(feature => `<li><span aria-hidden="true">✓</span>${feature}</li>`).join('')}</ul>
    </article>`).join('');
}

function openModal(id) {
  previousFocus = document.activeElement;
  activeModal = $(id);
  $('modal-backdrop').hidden = false;
  activeModal.hidden = false;
  document.body.classList.add('modal-open');
  activeModal.querySelector('input:not([type="hidden"]), button')?.focus();
}

function closeModal() {
  if (!activeModal) return;
  activeModal.hidden = true;
  $('modal-backdrop').hidden = true;
  document.body.classList.remove('modal-open');
  activeModal = null;
  previousFocus?.focus();
}

function switchModal(id) {
  closeModal();
  openModal(id);
}

function updatePlanCount() {
  const badge = $('plan-count');
  badge.textContent = records.policies.length;
  badge.hidden = records.policies.length === 0;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
}

function renderDashboard() {
  const container = $('dashboard-content');
  if (!records.policies.length) {
    container.innerHTML = `<div class="dashboard-empty"><span>✳</span><h3>Nothing here just yet.</h3><p>Start with a sample quote and save a demo plan to see it here.</p><button class="button button-dark" id="empty-quote" type="button">Explore plans <span aria-hidden="true">↗</span></button></div>`;
    return;
  }
  container.innerHTML = `<div class="dashboard-list">${records.policies.map(policy => {
    const claims = records.claims.filter(claim => claim.policyId === policy.id);
    return `<article class="dashboard-policy"><div class="policy-head"><span class="policy-icon">✳</span><span class="demo-pill">DEMO PLAN</span></div><h3>${escapeHtml(policy.itemName)}</h3><p>${escapeHtml(policy.category)} · ${escapeHtml(policy.planName)} · ${policy.term} ${policy.term === 1 ? 'year' : 'years'}</p><div class="policy-detail"><span>Purchase value <strong>${currency(policy.purchasePrice)}</strong></span><span>Sample plan price <strong>${currency(policy.planPrice)}</strong></span></div><div class="policy-date">Saved ${formatDate(policy.createdAt)} · ${escapeHtml(policy.id)}</div>${claims.length ? `<div class="claims-list"><strong>Demo claims</strong>${claims.map(claim => `<div><span>${escapeHtml(claim.reason)}</span><span>Received · ${formatDate(claim.createdAt)}</span></div>`).join('')}</div>` : ''}<div class="policy-actions"><button type="button" data-claim="${escapeHtml(policy.id)}">Start demo claim ↗</button><button type="button" data-remove="${escapeHtml(policy.id)}">Remove plan</button></div></article>`;
  }).join('')}</div><p class="dashboard-footnote">These entries live only in this browser. They are not insurance policies or claims.</p>`;
}

document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
  category = button.dataset.category;
  $('category').value = category;
  document.querySelectorAll('[data-category]').forEach(option => {
    const selected = option === button;
    option.classList.toggle('selected', selected);
    option.setAttribute('aria-pressed', String(selected));
  });
  renderPlans();
}));

document.querySelectorAll('[data-term]').forEach(button => button.addEventListener('click', () => {
  term = Number(button.dataset.term);
  document.querySelectorAll('[data-term]').forEach(option => {
    const selected = option === button;
    option.classList.toggle('selected', selected);
    option.setAttribute('aria-pressed', String(selected));
  });
  renderPlans();
}));

$('purchase-price').addEventListener('input', renderPlans);
$('quote-form').addEventListener('submit', event => event.preventDefault());

$('plan-cards').addEventListener('click', event => {
  const button = event.target.closest('[data-plan]');
  if (!button || !validPrice()) return;
  selectedPlan = button.dataset.plan;
  const plan = plans[selectedPlan];
  $('selected-plan').innerHTML = `<div><strong>${plan.name} · ${term} ${term === 1 ? 'year' : 'years'}</strong><span>${escapeHtml(category)} · ${currency(priceValue())} purchase</span></div><strong>${currency(calculatePrice(selectedPlan))}</strong>`;
  $('item-name').value = '';
  openModal('enroll-modal');
});

$('enroll-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!selectedPlan || !validPrice()) return;
  const itemName = $('item-name').value.trim();
  if (!itemName) return;
  records.policies.unshift({
    id:'CV-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
    itemName:itemName.slice(0, 70),
    category,
    purchasePrice:priceValue(),
    planName:plans[selectedPlan].name,
    planPrice:calculatePrice(selectedPlan),
    term,
    createdAt:new Date().toISOString()
  });
  saveRecords();
  renderDashboard();
  switchModal('dashboard-modal');
  showToast('Demo plan saved in this browser.');
});

$('my-plans-button').addEventListener('click', () => { renderDashboard(); openModal('dashboard-modal'); });
$('dashboard-content').addEventListener('click', event => {
  if (event.target.closest('#empty-quote')) { closeModal(); $('quote').scrollIntoView({behavior:'smooth'}); return; }
  const claimButton = event.target.closest('[data-claim]');
  if (claimButton) {
    $('claim-form').reset();
    $('claim-policy-id').value = claimButton.dataset.claim;
    switchModal('claim-modal');
    return;
  }
  const removeButton = event.target.closest('[data-remove]');
  if (removeButton) {
    const id = removeButton.dataset.remove;
    records.policies = records.policies.filter(policy => policy.id !== id);
    records.claims = records.claims.filter(claim => claim.policyId !== id);
    saveRecords();
    renderDashboard();
    showToast('Demo plan removed.');
  }
});

$('claim-form').addEventListener('submit', event => {
  event.preventDefault();
  const policyId = $('claim-policy-id').value;
  if (!records.policies.some(policy => policy.id === policyId)) return;
  const reason = $('claim-reason').value;
  const description = $('claim-description').value.trim();
  if (!reason || description.length < 10) return;
  records.claims.unshift({id:'CL-' + Math.random().toString(36).slice(2, 10).toUpperCase(), policyId, reason, description:description.slice(0, 500), createdAt:new Date().toISOString()});
  saveRecords();
  renderDashboard();
  switchModal('dashboard-modal');
  showToast('Demo claim saved. No real claim was filed.');
});

document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', closeModal));
$('modal-backdrop').addEventListener('click', closeModal);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeModal();
  if (event.key !== 'Tab' || !activeModal) return;
  const focusable = [...activeModal.querySelectorAll('button:not([disabled]), input:not([type="hidden"]), select, textarea, a[href]')].filter(element => !element.hidden);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

updatePlanCount();
renderPlans();
