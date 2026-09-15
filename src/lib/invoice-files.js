// Vercel serverless functions reject request bodies above ~4.5 MB, so keep the
// limit below that: a larger file would fail before the route ever runs.
export const MAX_INVOICE_SIZE = 4 * 1024 * 1024;
export const INVOICE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export function validateInvoiceFile(file) {
  if (!file || typeof file.arrayBuffer !== 'function') return 'Bitte eine Datei auswählen.';
  if (!INVOICE_TYPES.includes(file.type)) return 'Nur PDF, JPG, PNG oder WebP sind erlaubt.';
  if (!file.size) return 'Die Datei ist leer.';
  if (file.size > MAX_INVOICE_SIZE) return 'Die Datei darf maximal 4 MB groß sein.';
  return null;
}

// An expense can carry several receipts (hotel, train, bus…). They live in the
// expenses.invoices JSON column; invoice_url/invoice_name still hold the first
// one so rows written before this column stay readable.
export const MAX_INVOICES_PER_EXPENSE = 10;

export function parseInvoices(expense) {
  if (!expense) return [];
  let list = [];
  if (typeof expense.invoices === 'string' && expense.invoices.trim()) {
    try {
      list = JSON.parse(expense.invoices);
    } catch {
      list = [];
    }
  } else if (Array.isArray(expense.invoices)) {
    list = expense.invoices;
  }

  const clean = (Array.isArray(list) ? list : [])
    .filter(i => i && typeof i.url === 'string' && i.url)
    .map(i => ({ url: i.url, name: typeof i.name === 'string' && i.name ? i.name : 'Rechnung' }))
    .slice(0, MAX_INVOICES_PER_EXPENSE);

  // Legacy row: only the single invoice_url column was ever written.
  if (!clean.length && expense.invoice_url) {
    return [{ url: expense.invoice_url, name: expense.invoice_name || 'Rechnung' }];
  }
  return clean;
}

export function serializeInvoices(invoices) {
  const clean = parseInvoices({ invoices });
  return clean.length ? JSON.stringify(clean) : null;
}
