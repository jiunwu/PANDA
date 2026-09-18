import { GET, POST } from './route';
import { getClient } from '../../../lib/data';

jest.mock('../../../lib/data', () => ({ getClient: jest.fn(), ensureTables: jest.fn() }));

const db = { execute: jest.fn() };
const post = body => POST({ json: async () => body });
const sqlOf = call => (typeof call[0] === 'string' ? call[0] : call[0].sql);
const expenseWrite = () => db.execute.mock.calls.map(c => c[0]).find(a => a.sql?.includes('expenses'));
// UPDATE args end with: …, invoice_url, invoice_name, invoices, invoice_to, project_relevance, id
const invoicesArg = write => write.args[write.args.length - 4];

beforeEach(() => {
  jest.clearAllMocks();
  getClient.mockReturnValue(db);
  db.execute.mockResolvedValue({ rows: [] });
});

describe('editing an expense', () => {
  it('persists an edit and reports success', async () => {
    const res = await post({
      type: 'expense', action: 'update', author: 'User',
      data: { id: 'e1', category: 'sach_travel', description: 'Berlin', amount: 63, date: '2026-09-11', invoices: [{ url: '/api/finance/invoice/a', name: 'hotel.pdf' }] },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });

    const write = expenseWrite();
    expect(write.sql).toContain('UPDATE expenses');
    expect(write.args).toContain('e1');
    expect(write.args).toContain('[{"url":"/api/finance/invoice/a","name":"hotel.pdf"}]');
  });

  it('keeps every attached receipt, not just the first', async () => {
    await post({
      type: 'expense', action: 'update', author: 'User',
      data: { id: 'e1', amount: 63, invoices: [{ url: '/a', name: 'hotel.pdf' }, { url: '/b', name: 'zug.pdf' }, { url: '/c', name: 'bus.pdf' }] },
    });
    const write = expenseWrite();
    expect(JSON.parse(invoicesArg(write))).toHaveLength(3);
    // The legacy columns still mirror the first receipt.
    expect(write.args).toContain('/a');
    expect(write.args).toContain('hotel.pdf');
  });

  it('can clear the last receipt (the columns are not COALESCEd)', async () => {
    await post({ type: 'expense', action: 'update', author: 'User', data: { id: 'e1', amount: 10, invoices: [] } });
    const write = expenseWrite();
    expect(write.sql).toContain('invoices = ?');
    expect(write.sql).not.toContain('invoices = COALESCE');
    expect(invoicesArg(write)).toBeNull();
    expect(write.args[write.args.length - 6]).toBeNull(); // invoice_url
    expect(write.args[write.args.length - 5]).toBeNull(); // invoice_name
  });

  it('accepts a legacy single-invoice payload', async () => {
    await post({ type: 'expense', action: 'update', author: 'User', data: { id: 'e1', amount: 10, invoice_url: '/legacy', invoice_name: 'alt.pdf' } });
    const write = expenseWrite();
    expect(write.args).toContain('[{"url":"/legacy","name":"alt.pdf"}]');
  });

  it('surfaces a database failure instead of reporting success', async () => {
    db.execute.mockRejectedValue(new Error('no such column: invoices'));
    const res = await post({ type: 'expense', action: 'update', author: 'User', data: { id: 'e1', amount: 10 } });
    expect(res.status).toBe(500);
    expect((await res.json()).details).toBe('no such column: invoices');
  });
});

describe('adding an expense', () => {
  it('stores all receipts on insert', async () => {
    const res = await post({
      type: 'expense', action: 'add', author: 'User',
      data: { category: 'sach_travel', amount: 63, date: '2026-09-11', invoices: [{ url: '/a', name: 'hotel.pdf' }, { url: '/b', name: 'zug.pdf' }] },
    });
    expect(res.status).toBe(200);
    const write = expenseWrite();
    expect(write.sql).toContain('INSERT INTO expenses');
    expect(JSON.parse(write.args.find(a => typeof a === 'string' && a.startsWith('[{')))).toHaveLength(2);
  });
});

describe('reading expenses', () => {
  it('normalises legacy rows into an invoices list', async () => {
    db.execute.mockImplementation(sql => Promise.resolve({
      rows: sqlOf([sql]).includes('FROM expenses')
        ? [{ id: 'e1', amount: 5, invoice_url: '/legacy', invoice_name: 'alt.pdf', invoices: null }]
        : [],
    }));
    const { expenses } = await (await GET()).json();
    expect(expenses[0].invoices).toEqual([{ url: '/legacy', name: 'alt.pdf' }]);
  });

  it('selects the fields the edit form round-trips', async () => {
    await GET();
    expect(sqlOf(db.execute.mock.calls.find(c => sqlOf(c).includes('FROM expenses')))).toContain('invoice_to');
    expect(sqlOf(db.execute.mock.calls.find(c => sqlOf(c).includes('FROM expenses')))).toContain('project_relevance');
  });
});
