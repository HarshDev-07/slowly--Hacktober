# Slowly Requirements

## Product

- Users can create, read, update, archive, and restore subscription records.
- A record supports service name, category, amount, currency, billing cadence, renewal date, account email, payment label, notes, and an accent color.
- The dashboard shows recurring monthly cost, the next renewal, active count, search, and renewal filters.
- Users can export a JSON backup and import it later without a server.
- Users can cancel or close every form at any time without submitting or triggering required-field validation.
- No phone or mobile number is required anywhere.

## AI

- AI is optional; the ordinary CRUD form must work when no model is installed or reachable.
- The default model connection is local Ollama, but users may enter another Ollama-compatible endpoint and model name.
- Model output is treated as untrusted, validated locally, and shown as an editable draft before saving.
- Source files contain no API keys, access tokens, personal information, or hidden remote endpoints.

## Privacy and portability

- Subscription data stays in browser IndexedDB unless the user explicitly exports it.
- There is no required account, analytics, cloud database, or paid service.
- The app runs from a local file or a simple static HTTP server and has no npm requirement.
- The project must remain usable offline after its static assets are cached.

## Accessibility and usability

- Inputs and actions have labels or accessible names.
- Keyboard users can reach dialogs, cancel actions, and save actions.
- The heading remains readable at desktop and mobile widths; the sticky note cannot cover it.
- Reduced-motion preferences are respected.

## Acceptance checks

1. Open the add dialog, partially fill it, then cancel or close it; no validation message appears and no record is created.
2. Create, edit, archive, export, import, search, and filter a record.
3. Run without Ollama and confirm all non-AI workflows work.
4. Configure a local endpoint and arbitrary compatible model name without editing source code.
5. Inspect the source tree and confirm no secrets or personal data are present.