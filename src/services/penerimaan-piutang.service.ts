import { PenerimaanPiutang, PenerimaanPiutangDetail } from '@/types/penerimaan-piutang.types';
import { LiabilityPaymentHistory } from '@/types/pembayaran-hutang.types';

const generateData = (): PenerimaanPiutang[] => {
  const data: PenerimaanPiutang[] = [];

  for (let i = 1; i <= 150; i++) {
    const totalTerima = Math.floor(Math.random() * 50000000) + 1000000;
    const date = new Date(2026, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

    data.push({
      id: i,
      code: `INV-WIN/2026${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}02-${(1000 + i).toString().substring(1)}`,
      date: date.toLocaleDateString('id-ID'),
      supplier_name: 'Customer ' + i,
      grand_total: totalTerima + 5000000,
      total_paid: totalTerima,
      remaining_payment: 5000000,
      paid_percentage: Math.round((totalTerima / (totalTerima + 5000000)) * 100)
    });
  }
  return data;
};

const mockData: PenerimaanPiutang[] = generateData();

export const PenerimaanPiutangService = {
  getAll: () => mockData,

  getById: (id: string | number): PenerimaanPiutangDetail | null => {
    const item = mockData.find((d) => d.id === Number(id));
    if (!item) return null;

    const history: LiabilityPaymentHistory[] = [
      {
        id: item.id,
        cash_payment_amount: item.total_paid,
        bca_payment_amount: 0,
        bca_payment_usd_amount: 0,
        payment_at: item.date,
        note: 'Mock',
        payment_proof: '',
        created_at: item.date,
      }
    ];

    return {
      id: item.id,
      code: item.code,
      date: item.date,
      person: { id: 1, name: item.supplier_name },
      billing_summary: {
        grand_total: item.grand_total,
        total_paid: item.total_paid,
        remaining_payment: item.remaining_payment,
        is_paid: false,
        paid_percentage: item.paid_percentage,
      },
      unit_transaction_billing: {
        id: item.id,
        unit_transaction_billing_histories: history,
      },
      unit_transaction_items: []
    };
  },
};
