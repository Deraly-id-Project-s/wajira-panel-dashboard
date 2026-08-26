import type { Customer } from '@/types/customer.types';

export let DUMMY_TRANSINDO_CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: 'ELLA YOUNG WIDJAYANTO NUGRAHA',
    pic: 'Emilia Clarke',
    address: 'Jl. Raya Kalimalang No, Rt 000, Rw 000, Duren Sawit, Duren Sawit, Kota Adm. Jakarta Timur, DKI Jakarta 00000',
    map_link: 'https://maps.app.goo.gl/example',
    phone: '08xx xxxx xxxx',
  },
  {
    id: 2,
    name: 'BUDI SANTOSO',
    pic: 'John Doe',
    address: 'Jl. Pangeran Diponegoro No 10, Gowongan, Jetis, Kota Yogyakarta, DIY 55233',
    map_link: 'https://maps.app.goo.gl/example',
    phone: '0812 3456 7890',
  },
  {
    id: 3,
    name: 'SITI RAHMAWATI',
    pic: 'Jane Smith',
    address: 'Jl. Magelang KM 5.5, Kutu Patran, Sinduadi, Mlati, Kabupaten Sleman, DIY 55284',
    map_link: 'https://maps.app.goo.gl/example',
    phone: '0857 1122 3344',
  },
  {
    id: 4,
    name: 'AHMAD FAUZI',
    pic: 'Tom Holland',
    address: 'Jl. Laksda Adisucipto No 15, Ambarukmo, Caturtunggal, Depok, Sleman, DIY 55281',
    map_link: 'https://maps.app.goo.gl/example',
    phone: '0878 9988 5544',
  },
  {
    id: 5,
    name: 'DEWI KARTIKA',
    pic: 'Emma Watson',
    address: 'Jl. Ringroad Utara, Jombor Kidul, Sinduadi, Mlati, Kabupaten Sleman, DIY 55284',
    map_link: 'https://maps.app.goo.gl/example',
    phone: '0819 6633 2211',
  },
];

export const setDummyTransindoCustomers = (data: Customer[]) => {
  DUMMY_TRANSINDO_CUSTOMERS = data;
};
