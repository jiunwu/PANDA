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
