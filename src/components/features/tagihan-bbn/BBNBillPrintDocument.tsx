import type { CSSProperties } from 'react';
import { Loader2, Search } from 'lucide-react';
import type { BBNBillDetail, BBNBillBillingItem } from '@/types/bbn-bill.types';
import { formatBillCode, formatCurrency, formatShortDate } from './utils';

interface Props {
  data: BBNBillDetail;
  paymentItems: (BBNBillBillingItem & { cashLabel: string })[];
}

const aggregateFees = (data: BBNBillDetail) =>
  (data.dealerDetail?.vehicleDatas ?? []).reduce(
    (acc, vehicle) => {
      const r = vehicle.vehicleRegistration;
      acc.bbn += r?.bbnRegistrationFee || 0;
      acc.garwil += r?.garwilFee || 0;
      acc.nik += r?.nikValidationFee || 0;
      acc.acceleration += r?.accelerationFee || 0;
      acc.stamp += r?.stampFee || 0;
      acc.pnbp += r?.pnbpBpkb || 0;
      acc.skpd += r?.skpdFee || 0;
      return acc;
    },
    { bbn: 0, garwil: 0, nik: 0, acceleration: 0, stamp: 0, pnbp: 0, skpd: 0 },
  );

export function BBNBillPrintDocument({ data, paymentItems }: Props) {
  const fees = aggregateFees(data);
  const vehicles = data.dealerDetail?.vehicleDatas ?? [];
  const billCode = data.code || formatBillCode(data.id);
  const grandTotal = data.bruttoAmount - (data.pph23Amount ?? 0);

  return (
    <div
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: '12px',
        color: '#000',
        lineHeight: '1.5',
        width: '100%',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', letterSpacing: '1px' }}>
          PT. YANOTAMA
        </h1>
        <p style={{ fontSize: '11px', margin: '0 0 2px 0' }}>Jl. Contoh Alamat No. 123, Jakarta</p>
        <p style={{ fontSize: '11px', margin: '0' }}>Telp: (021) 000-0000</p>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 4px 0', textDecoration: 'underline' }}>
          TAGIHAN BBN
        </h2>
      </div>

      {/* Bill Info */}
      <table style={{ width: '100%', marginBottom: '20px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ width: '160px', paddingBottom: '4px' }}>Nomor Tagihan</td>
            <td style={{ paddingBottom: '4px' }}>: <strong>{billCode}</strong></td>
            <td style={{ width: '160px', paddingBottom: '4px' }}>Kode Ditlantas</td>
            <td style={{ paddingBottom: '4px' }}>: {data.ditlantasProcess?.code || '-'}</td>
          </tr>
          <tr>
            <td style={{ paddingBottom: '4px' }}>Dealer</td>
            <td style={{ paddingBottom: '4px' }}>: {data.dealer?.name || '-'}</td>
            <td style={{ paddingBottom: '4px' }}>Tanggal Penagihan</td>
            <td style={{ paddingBottom: '4px' }}>: {formatShortDate(data.billDate)}</td>
          </tr>
          <tr>
            <td>Tanggal Bayar</td>
            <td>: {formatShortDate(data.paidDate)}</td>
            <td />
            <td />
          </tr>
        </tbody>
      </table>

      {/* Vehicle Table */}
      <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>Daftar Kendaraan</p>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '11px',
          marginBottom: '20px',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={thStyle}>No</th>
            <th style={thStyle}>Nama STNK</th>
            <th style={thStyle}>No. Polisi</th>
            <th style={thStyle}>No. Rangka</th>
            <th style={thStyle}>No. Mesin</th>
            <th style={thStyle}>Daftar BBN</th>
            <th style={thStyle}>Acc Garwil</th>
            <th style={thStyle}>Acc NIK</th>
            <th style={thStyle}>Percepatan</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: '#666' }}>
                Tidak ada data kendaraan.
              </td>
            </tr>
          ) : (
            vehicles.map((vehicle, index) => (
              <tr key={vehicle.id}>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{index + 1}</td>
                <td style={tdStyle}>{vehicle.stnkName || '-'}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{vehicle.vehicleRegistration?.tnkbNumber || '-'}</td>
                <td style={tdStyle}>{vehicle.chassisNumber || '-'}</td>
                <td style={tdStyle}>{vehicle.machineNumber || '-'}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(vehicle.vehicleRegistration?.bbnRegistrationFee || 0)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(vehicle.vehicleRegistration?.garwilFee || 0)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(vehicle.vehicleRegistration?.nikValidationFee || 0)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(vehicle.vehicleRegistration?.accelerationFee || 0)}</td>
              </tr>
            ))
          )}
          {/* Subtotal row */}
          {vehicles.length > 0 && (
            <tr style={{ backgroundColor: '#f9f9f9', fontWeight: 'bold' }}>
              <td colSpan={5} style={{ ...tdStyle, textAlign: 'right' }}>Total</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(fees.bbn)}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(fees.garwil)}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(fees.nik)}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(fees.acceleration)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Fee Summary */}
      <div style={{ display: 'flex', gap: '32px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>Ringkasan Biaya</p>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                { label: 'Daftar BBN', value: fees.bbn },
                { label: 'Acc Garwil', value: fees.garwil },
                { label: 'Acc NIK', value: fees.nik },
                { label: 'Percepatan', value: fees.acceleration },
                { label: 'Materai', value: fees.stamp },
                { label: 'PNBP BPKB', value: fees.pnbp },
                { label: 'Notice SKPD', value: fees.skpd },
              ].map(({ label, value }) => (
                <tr key={label}>
                  <td style={{ paddingBottom: '3px', width: '140px' }}>{label}</td>
                  <td style={{ paddingBottom: '3px' }}>: {formatCurrency(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>Ringkasan Tagihan</p>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ paddingBottom: '3px', width: '160px' }}>Jumlah Tagihan</td>
                <td style={{ paddingBottom: '3px' }}>: {formatCurrency(data.bruttoAmount)}</td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '3px' }}>PPH 23 (2%)</td>
                <td style={{ paddingBottom: '3px' }}>: {formatCurrency(data.pph23Amount ?? 0)}</td>
              </tr>
              <tr style={{ fontWeight: 'bold' }}>
                <td style={{ paddingBottom: '3px' }}>Grand Total</td>
                <td style={{ paddingBottom: '3px' }}>: {formatCurrency(grandTotal)}</td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '3px' }}>Terbayar</td>
                <td style={{ paddingBottom: '3px' }}>: {formatCurrency(data.paidAmount)}</td>
              </tr>
              <tr style={{ color: data.remainingAmount !== undefined && data.remainingAmount > 0 ? '#cc0000' : 'inherit', fontWeight: 'bold' }}>
                <td style={{ paddingBottom: '3px' }}>Kurang Bayar</td>
                <td style={{ paddingBottom: '3px' }}>
                  : {formatCurrency(data.remainingAmount !== undefined ? data.remainingAmount : Math.max(data.bruttoAmount - data.paidAmount, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History */}
      {paymentItems.length > 0 && (
        <>
          <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>Riwayat Pembayaran</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={thStyle}>Tanggal</th>
                <th style={thStyle}>BCA IDR</th>
                <th style={thStyle}>BCA USD</th>
                <th style={thStyle}>Cash IDR</th>
              </tr>
            </thead>
            <tbody>
              {paymentItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{formatShortDate(item.paidDate)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{item.cashLabel === 'BCA IDR' ? formatCurrency(item.amount) : '-'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{item.cashLabel === 'BCA USD' ? formatCurrency(item.amount) : '-'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{item.cashLabel === 'CASH IDR' ? formatCurrency(item.amount) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: '11px' }}>
        <div style={{ textAlign: 'center', width: '160px' }}>
          <p>Dibuat oleh,</p>
          <div style={{ marginTop: '48px', borderTop: '1px solid #000', paddingTop: '4px' }}>
            <p>__________________</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', width: '160px' }}>
          <p>Diperiksa oleh,</p>
          <div style={{ marginTop: '48px', borderTop: '1px solid #000', paddingTop: '4px' }}>
            <p>__________________</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', width: '160px' }}>
          <p>Disetujui oleh,</p>
          <div style={{ marginTop: '48px', borderTop: '1px solid #000', paddingTop: '4px' }}>
            <p>__________________</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const thStyle: CSSProperties = {
  border: '1px solid #999',
  padding: '5px 6px',
  textAlign: 'left',
  fontWeight: 'bold',
};

const tdStyle: CSSProperties = {
  border: '1px solid #ccc',
  padding: '4px 6px',
};
