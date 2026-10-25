import { storage } from './storage.js';
import { createRecord, daysUntil, escapeHtml, monthlyAmount, renewalLabel, today, validateDraft } from './subscriptions.js';
import { createDraft, loadModelSettings, saveModelSettings } from './ollama.js';

const $ = (selector) => document.querySelector(selector);
let records = [];

export async function startApp() {
  wireEvents();
  await refresh();
}

async function refresh() {
  records = (await storage.list()).filter((record) => !record.archived);
  render();
}

function render() {
  const query = $('#search-input').value.toLowerCase();
  const filter = $('#filter-select').value;
  const visible = records.filter((record) => {
    const days = daysUntil(record.nextRenewal);
    const textMatch = `${record.serviceName} ${record.category} ${record.accountEmail}`.toLowerCase().includes(query);
    const filterMatch = filter === 'all' || (filter === 'soon' && days <= 7) || (filter === 'month' && new Date(record.nextRenewal).getMonth() === new Date().getMonth()) || (filter === 'annual' && record.cadence === 'yearly');
    return textMatch && filterMatch;
  }).sort((a, b) => a.nextRenewal.localeCompare(b.nextRenewal));

  $('#monthly-total').textContent = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(records.reduce((total, record) => total + monthlyAmount(record), 0));
  $('#subscription-count').textContent = records.length;
  const next = [...records].sort((a, b) => a.nextRenewal.localeCompare(b.nextRenewal))[0];
  $('#next-renewal').textContent = next ? renewalLabel(next.nextRenewal) : 'Nothing due';
  $('#next-renewal-label').textContent = next ? next.serviceName : 'add your first subscription';

  $('#subscription-list').innerHTML = visible.length ? visible.map(subscriptionTemplate).join('') : `<div class="empty-state"><strong>${records.length ? 'Nothing matches that search.' : 'A blank page is a good beginning.'}</strong><span>${records.length ? 'Try another filter.' : 'Add your first subscription and let future-you breathe easier.'}</span></div>`;
}

function subscriptionTemplate(record) {
  return `<article class="subscription-item"><span class="accent" style="background:${record.color}"></span><div><div class="subscription-name">${escapeHtml(record.serviceName)}</div><div class="subscription-meta">${escapeHtml(record.category)} · ${escapeHtml(record.accountEmail || 'no email added')}</div></div><div class="renewal"><strong>${renewalLabel(record.nextRenewal)}</strong><small>${new Date(`${record.nextRenewal}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</small></div><div class="item-price">${escapeHtml(record.currency)} ${record.amount.toFixed(2)}<div class="item-actions"><button type="button" data-edit="${record.id}">edit</button><button type="button" data-archive="${record.id}">archive</button></div></div></article>`;
}

function openSubscription(record = null) {
  $('#subscription-form').reset();
  $('#subscription-id').value = record?.id || '';
  $('#dialog-title').textContent = record ? 'Edit subscription' : 'Add subscription';
  $('#renewal-date').value = record?.nextRenewal || today();
  if (record) Object.entries({ 'service-name': record.serviceName, category: record.category, amount: record.amount, currency: record.currency, cadence: record.cadence, 'account-email': record.accountEmail, 'payment-label': record.paymentLabel, notes: record.notes }).forEach(([id, value]) => { $(`#${id}`).value = value || ''; });
  $('#subscription-dialog').showModal();
}

async function saveSubscription(event) {
  event.preventDefault();
  try {
    const id = $('#subscription-id').value;
    const existing = records.find((record) => record.id === id);
    const record = createRecord({ serviceName: $('#service-name').value, category: $('#category').value, amount: $('#amount').value, currency: $('#currency').value, cadence: $('#cadence').value, nextRenewal: $('#renewal-date').value, accountEmail: $('#account-email').value, paymentLabel: $('#payment-label').value, notes: $('#notes').value }, existing, records.length);
    await storage.save(record);
    closeDialog('#subscription-dialog');
    toast(`${record.serviceName} is tucked away.`);
    await refresh();
  } catch (error) { toast(error.message); }
}

async function lazyAdd(text) {
  const status = $('#ai-status');
  const fallback = { serviceName: text.split(',')[0].replace(/^\s*[\"]|[\"]\s*$/g, '').trim(), amount: '', currency: 'USD', cadence: 'monthly', nextRenewal: today(), category: 'Other' };
  openSubscription(fallback);
  status.textContent = 'Draft opened. Local AI can fill in the details when available.';
  try {
    const draft = await createDraft(text, loadModelSettings());
    const valid = validateDraft(draft);
    if (!valid) throw new Error('The local model returned an incomplete draft.');
    const dialog = $('#subscription-dialog');
    if (dialog.open) openSubscription(valid);
    status.textContent = 'Draft ready. Check it, then save when it feels right.';
  } catch {
    status.textContent = 'Local AI is unavailable. The editable draft is ready to complete manually.';
  }
}

function closeDialog(selector) { $(selector).close(); }
function toast(message) { const element = $('#toast'); element.textContent = message; element.classList.add('visible'); setTimeout(() => element.classList.remove('visible'), 2800); }
function exportBackup() { storage.exportRecords().then((data) => { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); link.download = `slowly-backup-${today()}.json`; link.click(); URL.revokeObjectURL(link.href); toast('Your backup is ready.'); }); }
async function importBackup(event) { try { const data = JSON.parse(await event.target.files[0].text()); if (!Array.isArray(data.subscriptions)) throw new Error(); await storage.importRecords(data.subscriptions); await refresh(); toast('Backup restored gently.'); } catch { toast('That backup could not be read.'); } event.target.value = ''; }

function wireEvents() {
  $('#add-button').addEventListener('click', () => openSubscription());
  $('#subscription-form').addEventListener('submit', saveSubscription);
  $('#cancel-subscription').addEventListener('click', () => closeDialog('#subscription-dialog'));
  $('#close-subscription').addEventListener('click', () => closeDialog('#subscription-dialog'));
  $('#search-input').addEventListener('input', render);
  $('#filter-select').addEventListener('change', render);
  $('#export-button').addEventListener('click', exportBackup);
  $('#import-input').addEventListener('change', importBackup);
  $('#settings-button').addEventListener('click', () => { const settings = loadModelSettings(); $('#ollama-url').value = settings.endpoint; $('#ollama-model').value = settings.model; $('#settings-dialog').showModal(); });
  $('#done-settings').addEventListener('click', () => { saveModelSettings($('#ollama-url').value, $('#ollama-model').value); closeDialog('#settings-dialog'); toast('Local model settings saved.'); });
  $('#close-settings').addEventListener('click', () => closeDialog('#settings-dialog'));
  $('#lazy-form').addEventListener('submit', (event) => { event.preventDefault(); const text = $('#lazy-input').value.trim(); if (text) lazyAdd(text); });
  $('#digest-button').addEventListener('click', () => { const next = records.slice().sort((a, b) => a.nextRenewal.localeCompare(b.nextRenewal)).slice(0, 3); toast(next.length ? `Next: ${next.map((record) => `${record.serviceName} ${renewalLabel(record.nextRenewal)}`).join(' · ')}` : 'Your list is wonderfully empty.'); });
  $('#subscription-list').addEventListener('click', async (event) => { const edit = event.target.closest('[data-edit]'); const archive = event.target.closest('[data-archive]'); if (edit) openSubscription(records.find((record) => record.id === edit.dataset.edit)); if (archive) { const record = records.find((item) => item.id === archive.dataset.archive); await storage.save({ ...record, archived: true, updatedAt: new Date().toISOString() }); toast(`${record.serviceName} is archived.`); await refresh(); } });
}
