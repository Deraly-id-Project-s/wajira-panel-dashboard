import { Piutang, PiutangPayment } from '@/types/piutang.types';

// Helper to generate dummy data
const generatePiutangData = (): Piutang[] => {
  const data: Piutang[] = [];
  const customers = ['PT Maju Jaya', 'CV Berkah Abadi', 'UD Sumber Makmur', 'PT Sinar Terang', 'CV Karya Mandiri', 'Toko Sejahtera', 'PT Harapan Baru'];

  // Specific item for testing
  data.push({
    id: '1',
    noPenjualan: 'INV/2026/001',
    tanggal: '01/02/2026',
    namaCustomer: 'PT Maju Jaya',
    totalJual: 15000000,
    totalBayar: 5000000,
    amountPiutang: 10000000,
  });

  for (let i = 2; i <= 150; i++) {
    const totalJual = Math.floor(Math.random() * 50000000) + 1000000;
    const totalBayar = Math.floor(Math.random() * (totalJual * 0.8));
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const date = new Date(2026, Math.floor(Math.random() * 2), Math.floor(Math.random() * 28) + 1);

    data.push({
      id: i.toString(),
      noPenjualan: `INV/2026/${i.toString().padStart(3, '0')}`,
      tanggal: date.toLocaleDateString('id-ID'),
      namaCustomer: customer,
      totalJual: totalJual,
      totalBayar: totalBayar,
      amountPiutang: totalJual - totalBayar,
    });
  }
  return data;
};

const piutangDB: Piutang[] = generatePiutangData();
const paymentDB: Record<string, PiutangPayment[]> = {};

export const PiutangService = {
  getAll: () => piutangDB,

  getById: (id: string) => piutangDB.find((p) => p.id === id),

  getPayments: (id: string) => paymentDB[id] || [],

  addPayment: (id: string, payment: PiutangPayment) => {
    if (!paymentDB[id]) paymentDB[id] = [];
    paymentDB[id].push(payment);

    const piutang = piutangDB.find((p) => p.id === id);
    if (piutang) {
      piutang.totalBayar += payment.jumlahBayar;
      piutang.amountPiutang = piutang.totalJual - piutang.totalBayar;
    }
  },
};
