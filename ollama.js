const DEFAULT_ENDPOINT = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.2:3b';

export function loadModelSettings() {
  return { endpoint: localStorage.getItem('slowly-ollama-endpoint') || DEFAULT_ENDPOINT, model: localStorage.getItem('slowly-ollama-model') || DEFAULT_MODEL };
}

export function saveModelSettings(endpoint, model) {
  localStorage.setItem('slowly-ollama-endpoint', endpoint.trim() || DEFAULT_ENDPOINT);
  localStorage.setItem('slowly-ollama-model', model.trim() || DEFAULT_MODEL);
}

export async function createDraft(text, settings) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${settings.endpoint.replace(/\/$/, '')}/api/generate`, {
      method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: settings.model, stream: false, format: 'json', prompt: `Extract a subscription from this text. Return JSON only with serviceName, amount, currency, cadence (monthly/yearly/weekly), nextRenewal (YYYY-MM-DD), category, accountEmail, notes. Use null for missing fields. Text: ${text}` })
    });
    if (!response.ok) throw new Error('Local model request failed.');
    const payload = await response.json();
    return JSON.parse(payload.response);
  } finally {
    clearTimeout(timeout);
  }
}
