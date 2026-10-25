export const COLORS = ['#ef806f', '#e6b84d', '#76b995', '#9f8fc4', '#70a9c2'];

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function daysUntil(date) {
  return Math.ceil((new Date(`${date}T12:00:00`) - new Date(`${today()}T12:00:00`)) / 86400000);
}

export function monthlyAmount(subscription) {
  if (subscription.cadence === 'yearly') return subscription.amount / 12;
  if (subscription.cadence === 'weekly') return subscription.amount * 4.345;
  return subscription.amount;
}

export function renewalLabel(date) {
  const days = daysUntil(date);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days <= 7) return `in ${days} days`;
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function validateDraft(draft) {
  const allowedCadences = ['monthly', 'yearly', 'weekly'];
  const record = {
    serviceName: String(draft.serviceName || '').trim().slice(0, 100),
    category: String(draft.category || 'Other').slice(0, 40),
    amount: Number(draft.amount),
    currency: String(draft.currency || 'USD').slice(0, 3).toUpperCase(),
    cadence: allowedCadences.includes(draft.cadence) ? draft.cadence : 'monthly',
    nextRenewal: String(draft.nextRenewal || today()),
    accountEmail: String(draft.accountEmail || '').slice(0, 160),
    paymentLabel: String(draft.paymentLabel || '').slice(0, 100),
    notes: String(draft.notes || '').slice(0, 500)
  };
  if (!record.serviceName || !Number.isFinite(record.amount) || record.amount < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(record.nextRenewal)) return null;
  return record;
}

export function createRecord(draft, existing, count) {
  const valid = validateDraft(draft);
  if (!valid) throw new Error('Please add a service, amount, and renewal date.');
  const now = new Date().toISOString();
  return { ...valid, id: existing?.id || crypto.randomUUID(), color: existing?.color || COLORS[count % COLORS.length], createdAt: existing?.createdAt || now, updatedAt: now, archived: false };
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>\'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}
