import { format } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Mendapatkan tanggal saat ini berdasarkan Waktu Indonesia Barat (WIB / Asia/Jakarta).
 * Mengembalikan objek Date dengan tahun, bulan, tanggal, dan jam sesuai WIB pada mesin lokal.
 */
export function getNowWIB(date: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return new Date(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
}

/**
 * Mendapatkan tanggal hari ini (jam 00:00:00) berdasarkan Waktu Indonesia Barat (WIB).
 */
export function getTodayWIB(date: Date = new Date()): Date {
  const nowWib = getNowWIB(date);
  nowWib.setHours(0, 0, 0, 0);
  return nowWib;
}

/**
 * Format tanggal standar untuk tampilan UI Bahasa Indonesia.
 * Output: DD MMMM YYYY (contoh: 03 Juli 2026)
 * 
 * @param date - Objek Date atau string ISO
 * @returns String tanggal terformat
 */
export function formatDateUI(date: Date | string | number | null | undefined): string {
  if (!date) return '-';
  
  try {
    const d = new Date(date);
    // Cek apakah date valid
    if (isNaN(d.getTime())) return '-';
    
    return format(d, 'dd MMMM yyyy', { locale: id });
  } catch (error) {
    return '-';
  }
}

