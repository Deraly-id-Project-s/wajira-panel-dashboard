import { Hutang, HutangPayment } from '@/types/hutang.types';
import { v4 as uuidv4 } from 'uuid';

const generateHutangData = (): Hutang[] => {
  const data: Hutang[] = [];
  const suppliers = ['PT BERKAH JAYA', 'CV MAKMUR ABADI', 'TOKO SUMBER REJEKI', 'PT SINAR HARAPAN', 'UD SENTOSA'];

  // Add the specific item from the design
  data.push({
    id: '1',
    noPembelian: 'TRX-011',
    tanggal: '31/12/2026',
    namaSupplier: 'PT XX',
    totalBeli: 99999999,
    totalBayar: 0,
    amountHutang: 99999999,
  });

  for (let i = 2; i <= 50; i++) {
    const totalBeli = Math.floor(Math.random() * 50000000) + 1000000;
    const totalBayar = Math.floor(Math.random() * (totalBeli * 0.8));

    data.push({
      id: i.toString(),
      noPembelian: `TRX-${100 + i}`,
      tanggal: `${Math.floor(Math.random() * 28) + 1}/12/2026`,
      namaSupplier: suppliers[Math.floor(Math.random() * suppliers.length)],
      totalBeli: totalBeli,
      totalBayar: totalBayar,
      amountHutang: totalBeli - totalBayar,
    });
  }
  return data;
};

let hutangDB: Hutang[] = generateHutangData();

let paymentDB: HutangPayment[] = [];

const generateId = () => uuidv4();

export const getHutang = async (companyId?: string | number | null): Promise<Hutang[]> => {
  void companyId;
  return hutangDB;
};

export const getHutangById = async (id: string): Promise<Hutang | undefined> => {
  return hutangDB.find((h) => h.id === id);
};

export const getPaymentsByHutang = async (hutangId: string): Promise<HutangPayment[]> => {
  return paymentDB.filter((p) => p.hutangId === hutangId);
};

export const bayarHutang = async (hutangId: string, data: Omit<HutangPayment, 'id' | 'hutangId'>) => {
  const newPayment: HutangPayment = {
    id: generateId(),
    hutangId,
    ...data,
  };

  paymentDB = [...paymentDB, newPayment];

  hutangDB = hutangDB.map((h) => {
    if (h.id === hutangId) {
      const totalBayar = h.totalBayar + data.jumlahBayar;
      return {
        ...h,
        totalBayar,
        amountHutang: h.totalBeli - totalBayar,
      };
    }
    return h;
  });

  return newPayment;
};
