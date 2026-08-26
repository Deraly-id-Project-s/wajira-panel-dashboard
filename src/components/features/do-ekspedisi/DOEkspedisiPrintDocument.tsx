import React from 'react';
import { format } from 'date-fns';
import type { DoEkspedisi } from '@/types/do-ekspedisi.types';

interface Props {
  data: DoEkspedisi;
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-slate-200 py-1 text-sm">
      <div className="text-slate-700">{label}</div>
      <div className="font-medium text-slate-900">{value ?? '-'}</div>
    </div>
  );
}

export const DOEkspedisiPrintDocument: React.FC<Props> = ({ data }) => {
  const order = data.orderList;

  return (
    <article className="w-full bg-white text-slate-900">
      <header className="mb-4 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Wajira - Delivery Order Ekspedisi</h1>
          <p className="text-sm text-slate-700">Alamat perusahaan · Telepon · Email</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-700">Tanggal Cetak</div>
          <div className="font-semibold">{format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
        </div>
      </header>

      <section className="mb-4 rounded border border-slate-200 p-3">
        <h2 className="text-lg font-semibold mb-2">Informasi DO</h2>
        <div className="grid grid-cols-2 gap-2">
          <Row label="Kode DO" value={data.doCode} />
          <Row label="Kode Order" value={data.orderCode} />
          <Row label="Tanggal Pengiriman" value={data.date ? format(new Date(data.date), 'dd/MM/yyyy') : '-'} />
          <Row label="Nama Driver" value={data.driver?.name || '-'} />
          <Row label="Tipe Armada" value={data.vehicle?.type || '-'} />
          <Row label="Nomor Polisi" value={data.vehicle?.registrationNumber || '-'} />
        </div>
        <div className="mt-3 border-t border-slate-200 pt-2">
          <div className="text-sm text-slate-700 font-medium">Atensi Driver</div>
          <div className="mt-1 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
            {data.driverNote || '-'}
          </div>
        </div>
      </section>

      <section className="mb-4 rounded border border-slate-200 p-3">
        <h2 className="text-lg font-semibold mb-2">Detail Order Customer</h2>
        <div className="mb-2">
          <div className="text-sm text-slate-700">Nama Customer</div>
          <div className="font-semibold text-lg">{order?.customerName || '-'}</div>
        </div>

        <div className="space-y-2">
          {(order?.tarifs && order.tarifs.length > 0 ? order.tarifs : [
            {
              id: 0,
              loadingIn: order?.loadingIn || '-',
              loadingOut: order?.loadingOut || '-',
              deliveryDestination: order?.destination || '-',
              loadContent: order?.loadContent || '-',
              qty: order?.qty || 0,
            },
          ]).map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="rounded p-2 border border-slate-100">
              <div className="mb-1 text-sm font-medium text-slate-800">Item #{idx + 1}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-slate-600">Loading In</div>
                  <div className="font-medium">{item.loadingIn || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-600">Loading Out</div>
                  <div className="font-medium">{item.loadingOut || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-600">Tujuan Kirim</div>
                  <div className="font-medium">{item.deliveryDestination || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-600">Muatan</div>
                  <div className="font-medium">{item.loadContent || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-600">QTY</div>
                  <div className="font-medium">{item.qty ? `${item.qty}` : '-'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-6 text-sm text-slate-700">
        <div>Catatan: Pastikan dokumen dan tanda terima dilampirkan sesuai kebutuhan.</div>
      </footer>
    </article>
  );
};

export default DOEkspedisiPrintDocument;
