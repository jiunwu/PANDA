import { MAX_INVOICES_PER_EXPENSE, parseInvoices, serializeInvoices, validateInvoiceFile } from './invoice-files';

const pdf = { name: 'hotel.pdf', type: 'application/pdf', size: 100, arrayBuffer: async () => new ArrayBuffer(100) };

describe('validateInvoiceFile', () => {
  it('accepts a receipt', () => expect(validateInvoiceFile(pdf)).toBeNull());
  it.each([null, 'not a file', { ...pdf, type: 'text/html' }, { ...pdf, size: 0 }, { ...pdf, size: 4 * 1024 * 1024 + 1 }])
    ('rejects %p', file => expect(validateInvoiceFile(file)).toEqual(expect.any(String)));
});

describe('parseInvoices', () => {
  it('reads the JSON column written by the API', () => {
    expect(parseInvoices({ invoices: '[{"url":"/a","name":"hotel.pdf"},{"url":"/b","name":"zug.pdf"}]' }))
      .toEqual([{ url: '/a', name: 'hotel.pdf' }, { url: '/b', name: 'zug.pdf' }]);
  });

  it('accepts an array straight from the client', () => {
    expect(parseInvoices({ invoices: [{ url: '/a', name: 'bus.pdf' }] })).toEqual([{ url: '/a', name: 'bus.pdf' }]);
  });

  it('falls back to the legacy single-invoice columns', () => {
    expect(parseInvoices({ invoice_url: '/legacy', invoice_name: 'alt.pdf' })).toEqual([{ url: '/legacy', name: 'alt.pdf' }]);
  });

  it('prefers the list over the legacy columns once both exist', () => {
    expect(parseInvoices({ invoices: '[{"url":"/new","name":"neu.pdf"}]', invoice_url: '/legacy', invoice_name: 'alt.pdf' }))
      .toEqual([{ url: '/new', name: 'neu.pdf' }]);
  });

  it('drops malformed entries and names the unnamed', () => {
    expect(parseInvoices({ invoices: [{ url: '/a' }, { name: 'no url' }, null, 'x'] })).toEqual([{ url: '/a', name: 'Rechnung' }]);
  });

  it.each(['not json', '', null, undefined])('returns an empty list for %p', invoices => {
    expect(parseInvoices({ invoices })).toEqual([]);
  });

  it('caps how many receipts one expense can carry', () => {
    const many = Array.from({ length: MAX_INVOICES_PER_EXPENSE + 5 }, (_, i) => ({ url: `/${i}`, name: `${i}.pdf` }));
    expect(parseInvoices({ invoices: many })).toHaveLength(MAX_INVOICES_PER_EXPENSE);
  });

  it('survives a missing expense', () => expect(parseInvoices(null)).toEqual([]));
});

describe('serializeInvoices', () => {
  it('round-trips through the column', () => {
    const list = [{ url: '/a', name: 'hotel.pdf' }, { url: '/b', name: 'zug.pdf' }];
    expect(parseInvoices({ invoices: serializeInvoices(list) })).toEqual(list);
  });

  it('stores NULL rather than an empty array', () => {
    expect(serializeInvoices([])).toBeNull();
    expect(serializeInvoices(undefined)).toBeNull();
  });
});
