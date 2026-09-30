Company id=4 module
{{url}}/wapi/global/company/4 || {{url}}/wapi/global/company/wajira-transindo
{
    "status": true,
    "message": "Company retrieved successfully",
    "errors": null,
    "data": {
        "id": 4,
        "uuid": "edb9bda3-0ee2-4cb2-ac08-7f69505cdc3e",
        "slug": "wajira-transindo",
        "code": "4",
        "description": "PT Wajira Transindo",
        "type": "transport_office",
        "created_at": "2026-09-28T02:19:52.000000Z",
        "updated_at": "2026-09-28T02:19:52.000000Z",
        "name": "PT Wajira Transindo",
        "preferences": [
            {
                "id": 19,
                "uuid": "958855bd-7eaf-44b2-ab30-1f2aaa7a1cc1",
                "company_id": 4,
                "name": "company_address",
                "description": null,
                "value": null,
                "file": null,
                "is_hidden": false,
                "type": "textarea",
                "created_at": "2026-09-28T02:19:55.000000Z",
                "updated_at": "2026-09-28T02:19:55.000000Z"
            },
            {
                "id": 18,
                "uuid": "b9657c85-ee77-4a2d-b097-9c56a89fca0a",
                "company_id": 4,
                "name": "company_background",
                "description": null,
                "value": null,
                "file": null,
                "is_hidden": false,
                "type": "file",
                "created_at": "2026-09-28T02:19:55.000000Z",
                "updated_at": "2026-09-28T02:19:55.000000Z"
            },
            {
                "id": 17,
                "uuid": "2825671a-7cfb-4eed-9b5e-3c2456009b88",
                "company_id": 4,
                "name": "company_logo",
                "description": null,
                "value": null,
                "file": null,
                "is_hidden": false,
                "type": "file",
                "created_at": "2026-09-28T02:19:55.000000Z",
                "updated_at": "2026-09-28T02:19:55.000000Z"
            },
            {
                "id": 16,
                "uuid": "4a6961ba-2306-4abb-bd02-a88ccca8da5d",
                "company_id": 4,
                "name": "company_name",
                "description": null,
                "value": "PT Wajira Transindo",
                "file": null,
                "is_hidden": false,
                "type": "text",
                "created_at": "2026-09-28T02:19:55.000000Z",
                "updated_at": "2026-09-28T02:19:55.000000Z"
            },
            {
                "id": 20,
                "uuid": "bfea34ec-82b3-48cb-8cf9-c8563911bae4",
                "company_id": 4,
                "name": "company_phone",
                "description": null,
                "value": null,
                "file": null,
                "is_hidden": false,
                "type": "text",
                "created_at": "2026-09-28T02:19:55.000000Z",
                "updated_at": "2026-09-28T02:19:55.000000Z"
            }
        ],
        "modules": [
            {
                "id": 1,
                "name": "Dashboard",
                "slug": "dashboard",
                "description": "Dashboard",
                "created_at": "2026-09-28T02:19:53.000000Z",
                "updated_at": "2026-09-28T02:19:53.000000Z",
                "pivot": {
                    "company_id": 4,
                    "module_id": 1
                }
            },
            {
                "id": 2,
                "name": "Master Data",
                "slug": "master-data",
                "description": "Data Utama",
                "created_at": "2026-09-28T02:19:53.000000Z",
                "updated_at": "2026-09-28T02:19:53.000000Z",
                "pivot": {
                    "company_id": 4,
                    "module_id": 2
                }
            },
            {
                "id": 3,
                "name": "Transaction",
                "slug": "transaction",
                "description": "Transaksi",
                "created_at": "2026-09-28T02:19:53.000000Z",
                "updated_at": "2026-09-28T02:19:53.000000Z",
                "pivot": {
                    "company_id": 4,
                    "module_id": 3
                }
            },
            {
                "id": 4,
                "name": "Warehouse",
                "slug": "warehouse",
                "description": "Gudang",
                "created_at": "2026-09-28T02:19:53.000000Z",
                "updated_at": "2026-09-28T02:19:53.000000Z",
                "pivot": {
                    "company_id": 4,
                    "module_id": 4
                }
            },
            {
                "id": 5,
                "name": "Finance",
                "slug": "finance",
                "description": "Keuangan",
                "created_at": "2026-09-28T02:19:53.000000Z",
                "updated_at": "2026-09-28T02:19:53.000000Z",
                "pivot": {
                    "company_id": 4,
                    "module_id": 5
                }
            },
            {
                "id": 6,
                "name": "Report",
                "slug": "report",
                "description": "Laporan",
                "created_at": "2026-09-28T02:19:53.000000Z",
                "updated_at": "2026-09-28T02:19:53.000000Z",
                "pivot": {
                    "company_id": 4,
                    "module_id": 6
                }
            },
            {
                "id": 7,
                "name": "User",
                "slug": "user",
                "description": "Manajemen Pengguna",
                "created_at": "2026-09-28T02:19:53.000000Z",
                "updated_at": "2026-09-28T02:19:53.000000Z",
                "pivot": {
                    "company_id": 4,
                    "module_id": 7
                }
            },
            {
                "id": 8,
                "name": "Setting",
                "slug": "setting",
                "description": "Pengaturan",
                "created_at": "2026-09-28T02:19:53.000000Z",
                "updated_at": "2026-09-28T02:19:53.000000Z",
                "pivot": {
                    "company_id": 4,
                    "module_id": 8
                }
            }
        ]
    }
}

Company id=4 sidebar
{{url}}/wapi/auth/get-sidebar?company_id=4
{
    "status": true,
    "message": "Sidebar modules and features retrieved successfully",
    "errors": null,
    "data": [
        {
            "module": {
                "id": 1,
                "name": "Dashboard",
                "slug": "dashboard",
                "description": "Dashboard"
            },
            "features": [
                {
                    "id": 1,
                    "slug": "dashboard-stat",
                    "name": "Dashboard",
                    "description": "Dashboard",
                    "pivot": {
                        "module_id": 1,
                        "feature_id": 1
                    }
                }
            ]
        },
        {
            "module": {
                "id": 2,
                "name": "Master Data",
                "slug": "master-data",
                "description": "Data Utama"
            },
            "features": [
                {
                    "id": 2,
                    "slug": "group-accounts",
                    "name": "Master Grub Akun",
                    "description": "Data master untuk grub akun perusahaan",
                    "pivot": {
                        "module_id": 2,
                        "feature_id": 2
                    }
                },
                {
                    "id": 3,
                    "slug": "accounts",
                    "name": "Master Akun",
                    "description": "Data master untuk akun perusahaan",
                    "pivot": {
                        "module_id": 2,
                        "feature_id": 3
                    }
                },
                {
                    "id": 4,
                    "slug": "suppliers",
                    "name": "Master Supplier",
                    "description": "Data master penyedia barang atau jasa (supplier)",
                    "pivot": {
                        "module_id": 2,
                        "feature_id": 4
                    }
                },
                {
                    "id": 5,
                    "slug": "customers",
                    "name": "Master Customer",
                    "description": "Data master pelanggan atau pembeli (customer)",
                    "pivot": {
                        "module_id": 2,
                        "feature_id": 5
                    }
                },
                {
                    "id": 8,
                    "slug": "cash-accounts",
                    "name": "Master Kas",
                    "description": "Data master rekening kas dan bank perusahaan",
                    "pivot": {
                        "module_id": 2,
                        "feature_id": 8
                    }
                },
                {
                    "id": 9,
                    "slug": "dealers",
                    "name": "Master Dealer",
                    "description": "Data master dealer atau mitra bisnis",
                    "pivot": {
                        "module_id": 2,
                        "feature_id": 9
                    }
                },
                {
                    "id": 10,
                    "slug": "tariffs",
                    "name": "Master Tarif",
                    "description": "Data master tarif pengiriman ekspedisi",
                    "pivot": {
                        "module_id": 2,
                        "feature_id": 10
                    }
                },
                {
                    "id": 11,
                    "slug": "drivers",
                    "name": "Master Driver",
                    "description": "Data master pengemudi (driver) ekspedisi",
                    "pivot": {
                        "module_id": 2,
                        "feature_id": 11
                    }
                },
                {
                    "id": 12,
                    "slug": "vehicles",
                    "name": "Master Kendaraan",
                    "description": "Data master armada kendaraan operasional",
                    "pivot": {
                        "module_id": 2,
                        "feature_id": 12
                    }
                },
                {
                    "id": 13,
                    "slug": "asset",
                    "name": "Master Aset",
                    "description": "Data master aset fisik perusahaan",
                    "pivot": {
                        "module_id": 2,
                        "feature_id": 13
                    }
                },
                {
                    "id": 14,
                    "slug": "tax",
                    "name": "Master Pajak",
                    "description": "Data master jenis dan tarif pajak",
                    "pivot": {
                        "module_id": 2,
                        "feature_id": 14
                    }
                },
                {
                    "id": 16,
                    "slug": "document-template",
                    "name": "Master Template Dokumen",
                    "description": "Data master template dokumen perusahaan",
                    "pivot": {
                        "module_id": 2,
                        "feature_id": 16
                    }
                }
            ]
        },
        {
            "module": {
                "id": 3,
                "name": "Transaction",
                "slug": "transaction",
                "description": "Transaksi"
            },
            "features": [
                {
                    "id": 17,
                    "slug": "transaction-flow",
                    "name": "Arus Transaksi",
                    "description": "Catatan riwayat alur transaksi masuk dan keluar",
                    "pivot": {
                        "module_id": 3,
                        "feature_id": 17
                    }
                },
                {
                    "id": 22,
                    "slug": "order-list",
                    "name": "Order List",
                    "description": "Daftar surat jalan yang akan dikirim ke dealer",
                    "pivot": {
                        "module_id": 3,
                        "feature_id": 22
                    }
                },
                {
                    "id": 23,
                    "slug": "do-expedition",
                    "name": "DO Ekspedisi",
                    "description": "Surat DO Ekspedisi untuk Driver",
                    "pivot": {
                        "module_id": 3,
                        "feature_id": 23
                    }
                },
                {
                    "id": 24,
                    "slug": "driver-cash-advance",
                    "name": "Kas Bon",
                    "description": "Catatan kas bon untuk driver",
                    "pivot": {
                        "module_id": 3,
                        "feature_id": 24
                    }
                },
                {
                    "id": 25,
                    "slug": "do-invoice",
                    "name": "DO Invoice",
                    "description": "Membuat invoice dari surat jalan",
                    "pivot": {
                        "module_id": 3,
                        "feature_id": 25
                    }
                },
                {
                    "id": 26,
                    "slug": "witholding-tax",
                    "name": "Bukti Potong",
                    "description": "Catatan bukti pemotongan pajak (PPh)",
                    "pivot": {
                        "module_id": 3,
                        "feature_id": 26
                    }
                },
                {
                    "id": 27,
                    "slug": "vehicle-equipment-purchases",
                    "name": "Pembelian Perlengkapan",
                    "description": "Transaksi pembelian Perlengkapan kendaraan baru",
                    "pivot": {
                        "module_id": 3,
                        "feature_id": 27
                    }
                },
                {
                    "id": 28,
                    "slug": "vehicle-equipment-sales",
                    "name": "Penjualan Perlengkapan",
                    "description": "Transaksi penjualan Perlengkapan kendaraan kepada customer",
                    "pivot": {
                        "module_id": 3,
                        "feature_id": 28
                    }
                }
            ]
        },
        {
            "module": {
                "id": 4,
                "name": "Warehouse",
                "slug": "warehouse",
                "description": "Gudang"
            },
            "features": [
                {
                    "id": 35,
                    "slug": "vehicle-equipment-inventory",
                    "name": "Stok Perlengkapan",
                    "description": "Data persediaan (stok) perlengkapan kendaraan di gudang",
                    "pivot": {
                        "module_id": 4,
                        "feature_id": 35
                    }
                },
                {
                    "id": 36,
                    "slug": "vehicle-equipment-receipts",
                    "name": "Penerimaan Perlengkapan",
                    "description": "Catatan penerimaan perlengkapan kendaraan di gudang",
                    "pivot": {
                        "module_id": 4,
                        "feature_id": 36
                    }
                },
                {
                    "id": 37,
                    "slug": "vehicle-equipment-dispatches",
                    "name": "Pengeluaran Perlengkapan",
                    "description": "Catatan pengeluaran perlengkapan kendaraan dari gudang",
                    "pivot": {
                        "module_id": 4,
                        "feature_id": 37
                    }
                }
            ]
        },
        {
            "module": {
                "id": 5,
                "name": "Finance",
                "slug": "finance",
                "description": "Keuangan"
            },
            "features": [
                {
                    "id": 38,
                    "slug": "daily-cash-transactions",
                    "name": "Transaksi Kas Harian",
                    "description": "Catatan transaksi arus kas masuk dan keluar harian",
                    "pivot": {
                        "module_id": 5,
                        "feature_id": 38
                    }
                },
                {
                    "id": 43,
                    "slug": "accounts-payable",
                    "name": "Data Hutang",
                    "description": "Catatan saldo hutang kepada supplier atau pihak ketiga",
                    "pivot": {
                        "module_id": 5,
                        "feature_id": 43
                    }
                },
                {
                    "id": 44,
                    "slug": "payable-payments",
                    "name": "Data Pembayaran Hutang",
                    "description": "Catatan transaksi pembayaran hutang perusahaan",
                    "pivot": {
                        "module_id": 5,
                        "feature_id": 44
                    }
                },
                {
                    "id": 45,
                    "slug": "accounts-receivable",
                    "name": "Data Piutang",
                    "description": "Catatan saldo piutang dari customer",
                    "pivot": {
                        "module_id": 5,
                        "feature_id": 45
                    }
                },
                {
                    "id": 46,
                    "slug": "receivable-collections",
                    "name": "Data Terima Piutang",
                    "description": "Catatan transaksi penerimaan/pencairan piutang",
                    "pivot": {
                        "module_id": 5,
                        "feature_id": 46
                    }
                },
                {
                    "id": 47,
                    "slug": "finance-assets",
                    "name": "Data Aset",
                    "description": "Catatan nilai buku, umur ekonomis, dan depresiasi aset keuangan",
                    "pivot": {
                        "module_id": 5,
                        "feature_id": 47
                    }
                }
            ]
        },
        {
            "module": {
                "id": 6,
                "name": "Report",
                "slug": "report",
                "description": "Laporan"
            },
            "features": [
                {
                    "id": 48,
                    "slug": "cash-transaction-reports",
                    "name": "Laporan Transaksi Kas",
                    "description": "Laporan rekapitulasi transaksi arus kas harian dan bank",
                    "pivot": {
                        "module_id": 6,
                        "feature_id": 48
                    }
                },
                {
                    "id": 49,
                    "slug": "accounting-reports",
                    "name": "Laporan Akuntansi",
                    "description": "Laporan akuntansi keuangan seperti neraca dan laba rugi",
                    "pivot": {
                        "module_id": 6,
                        "feature_id": 49
                    }
                },
                {
                    "id": 55,
                    "slug": "expedition-reports",
                    "name": "Laporan Ekspedisi",
                    "description": "Laporan aktivitas pengiriman logistik/ekspedisi",
                    "pivot": {
                        "module_id": 6,
                        "feature_id": 55
                    }
                },
                {
                    "id": 56,
                    "slug": "invoice-reports",
                    "name": "Laporan Invoice",
                    "description": "Laporan Invoice",
                    "pivot": {
                        "module_id": 6,
                        "feature_id": 56
                    }
                },
                {
                    "id": 57,
                    "slug": "order-list-reports",
                    "name": "Laporan Order List",
                    "description": "Laporan DO Order List",
                    "pivot": {
                        "module_id": 6,
                        "feature_id": 57
                    }
                },
                {
                    "id": 58,
                    "slug": "cash-advance-reports",
                    "name": "Laporan Kas Bon",
                    "description": "Laporan Kas Bon",
                    "pivot": {
                        "module_id": 6,
                        "feature_id": 58
                    }
                },
                {
                    "id": 59,
                    "slug": "expedition-claim-reports",
                    "name": "Laporan Klaim Ekspedisi",
                    "description": "Laporan Klaim Ekspedisi",
                    "pivot": {
                        "module_id": 6,
                        "feature_id": 59
                    }
                },
                {
                    "id": 60,
                    "slug": "vehicle-usage-reports",
                    "name": "Laporan Pemakaian Kendaraan",
                    "description": "Laporan pemakaian dan operasional kendaraan",
                    "pivot": {
                        "module_id": 6,
                        "feature_id": 60
                    }
                }
            ]
        },
        {
            "module": {
                "id": 7,
                "name": "User",
                "slug": "user",
                "description": "Manajemen Pengguna"
            },
            "features": [
                {
                    "id": 68,
                    "slug": "users",
                    "name": "Pengguna",
                    "description": "Pengaturan hak pengguna dan otentikasi sistem",
                    "pivot": {
                        "module_id": 7,
                        "feature_id": 68
                    }
                },
                {
                    "id": 69,
                    "slug": "roles",
                    "name": "Hak Akses",
                    "description": "Pengaturan peran (role) kelompok pengguna",
                    "pivot": {
                        "module_id": 7,
                        "feature_id": 69
                    }
                },
                {
                    "id": 70,
                    "slug": "permissions",
                    "name": "Izin Akses",
                    "description": "Pengaturan hak akses (permission) spesifik fitur",
                    "pivot": {
                        "module_id": 7,
                        "feature_id": 70
                    }
                }
            ]
        },
        {
            "module": {
                "id": 8,
                "name": "Setting",
                "slug": "setting",
                "description": "Pengaturan"
            },
            "features": [
                {
                    "id": 71,
                    "slug": "preference",
                    "name": "Preferensi",
                    "description": "Pengaturan Preferensi Perusahaan",
                    "pivot": {
                        "module_id": 8,
                        "feature_id": 71
                    }
                }
            ]
        }
    ]
}

<!-- Purchase API -->
1. Vehicle Equipment transaction
REST {{url}}/wapi/transaction/goods-transaction
request body: 
transaction_type:in:vehicle_equipment
company_id:int
person_id:int
vehicle_equipment_id:int
type:in:purchase,sales
billing_type:in:transfer,cash
qty:int
price:int
discount:int
transaction_date:date
//nota_number:string
//billing_due_date:date
//invoice_file:file
//note:text

response :
{
  "status": true,
  "message": "Goods Transaction list retrieved successfully",
  "errors": null,
  "data": [
    {
      "id": 2,
      "uuid": "d76a51a4-ef9d-40f1-bb40-55dc2790be2f",
      "code": "TRM-PK/20260928-0001",
      "transaction_type": "vehicle_equipment",
      "warehouse_id": 3,
      "person_id": 3,
      "material_id": null,
      "vehicle_equipment_id": 1,
      "type": "purchase",
      "billing_type": "cash",
      "is_refunded": false,
      "qty": 6,
      "price": 450000,
      "discount": 135000,
      "transaction_date": "2026-09-26T17:00:00.000000Z",
      "nota_number": null,
      "billing_due_date": null,
      "invoice_file": null,
      "note": null,
      "created_at": "2026-09-28T03:11:25.000000Z",
      "updated_at": "2026-09-28T03:13:47.000000Z",
      "transaction_bruto_total": 2700000,
      "transaction_netto_total": 2565000,
      "billing_summary": {
        "grand_total": 2565000,
        "total_paid": 0,
        "remaining_payment": 2565000,
        "is_paid": false
      },
      "total_brutto": 2565000,
      "warehouse": {
        "id": 3,
        "name": "PT Wajira Yanotama Warehouse",
        "company_id": 3
      },
      "person": {
        "id": 3,
        "uuid": "fc733502-bb65-4577-aa23-842b43fe5708",
        "name": "Malik",
        "type": "vendor",
        "company_list": "",
        "company": null
      },
      "material": null,
      "vehicle_equipment": {
        "id": 1,
        "uuid": "e5a49950-722a-4431-b725-0a929c44524e",
        "code": "KNC-ING",
        "name": "Kunci Inggris",
        "buy_price": 5000,
        "sell_price": 6000
      },
      "goods_transaction_billing": {
        "id": 2,
        "goods_transaction_id": 2,
        "grand_total": 2565000,
        "last_payment_at": null,
        "is_paid": false
      }
    }
  ]
}

detail:
{
  "status": true,
  "message": "Goods Transaction retrieved successfully",
  "errors": null,
  "data": {
    "id": 2,
    "uuid": "d76a51a4-ef9d-40f1-bb40-55dc2790be2f",
    "code": "TRM-PK/20260928-0001",
    "transaction_type": "vehicle_equipment",
    "warehouse_id": 3,
    "person_id": 3,
    "material_id": null,
    "vehicle_equipment_id": 1,
    "type": "purchase",
    "billing_type": "cash",
    "is_refunded": false,
    "qty": 6,
    "price": 450000,
    "discount": 135000,
    "transaction_date": "2026-09-26T17:00:00.000000Z",
    "nota_number": null,
    "billing_due_date": null,
    "invoice_file": null,
    "note": null,
    "created_at": "2026-09-28T03:11:25.000000Z",
    "updated_at": "2026-09-28T03:13:47.000000Z",
    "transaction_bruto_total": 2700000,
    "transaction_netto_total": 2565000,
    "billing_summary": {
      "grand_total": 2565000,
      "total_paid": 2565000,
      "remaining_payment": 0,
      "is_paid": true
    },
    "total_brutto": 2565000,
    "has_warehouse_activity": false,
    "warehouse": {
      "id": 3,
      "uuid": "3aad488f-fba3-4a69-af97-dddd42b1cba8",
      "company_id": 3,
      "name": "PT Wajira Yanotama Warehouse",
      "capacity": 10000,
      "description": null,
      "created_at": "2026-09-28T02:19:54.000000Z",
      "updated_at": "2026-09-28T02:19:56.000000Z"
    },
    "person": {
      "id": 3,
      "uuid": "fc733502-bb65-4577-aa23-842b43fe5708",
      "company_id": 3,
      "code": "VDR-Y/0001",
      "type": "vendor",
      "name": "Malik",
      "username": null,
      "is_active": true,
      "last_login": null,
      "address": "jl. pancasila no 12",
      "map_coordinate": null,
      "phone": "082143942233",
      "npwp": "350.10.10.1199",
      "pic_name": "Ahmad",
      "identity_number": null,
      "drive_license_identity_number": null,
      "image": null,
      "map_link": null,
      "social_media_1_link": null,
      "social_media_2_link": null,
      "social_media_3_link": null,
      "social_media_4_link": null,
      "website_link": null,
      "join_date": null,
      "created_at": "2026-09-28T03:07:15.000000Z",
      "updated_at": "2026-09-28T03:07:15.000000Z",
      "company_list": "PT Wajira Yanotama"
    },
    "material": null,
    "vehicle_equipment": {
      "id": 1,
      "uuid": "e5a49950-722a-4431-b725-0a929c44524e",
      "code": "KNC-ING",
      "name": "Kunci Inggris",
      "description": "kunci asal inggris",
      "created_at": "2026-09-28T03:09:32.000000Z",
      "updated_at": "2026-09-28T03:09:32.000000Z",
      "buy_price": 5000,
      "sell_price": 6000
    },
    "goods_transaction_billing": {
      "id": 2,
      "uuid": "4b62ddc1-e1c5-4bc7-a1ef-39168fa571c6",
      "goods_transaction_id": 2,
      "grand_total": 2565000,
      "last_payment_at": "2026-09-28T04:02:56.000000Z",
      "is_paid": true,
      "created_at": "2026-09-28T03:11:25.000000Z",
      "updated_at": "2026-09-28T04:02:56.000000Z",
      "goods_transaction_billing_histories": [
        {
          "id": 1,
          "uuid": "f65d8442-b3a8-4f1a-a843-0b4fd2d70931",
          "goods_transaction_id": 2,
          "grand_total": 50000,
          "last_payment_at": "2026-09-28T03:41:54.000000Z",
          "is_paid": false,
          "note": "test",
          "created_at": "2026-09-28T03:41:54.000000Z",
          "updated_at": "2026-09-28T03:41:54.000000Z",
          "cashes": [
            {
              "id": 8,
              "uuid": "e4ac7999-5605-4be2-a764-86c0b258b57c",
              "company_id": 3,
              "account_id": null,
              "code": "bca_idr",
              "currency_type": "idr",
              "cash_name": "BCA IDR",
              "description": "Kas bca_idr PT Wajira Yanotama",
              "amount": 0,
              "type": "bank",
              "created_at": "2026-09-28T02:19:53.000000Z",
              "updated_at": "2026-09-28T02:19:53.000000Z",
              "pivot": {
                "goods_transaction_billing_history_id": 1,
                "cash_id": 8,
                "amount": "50000.00",
                "created_at": "2026-09-28T03:41:54.000000Z",
                "updated_at": "2026-09-28T03:41:54.000000Z"
              }
            }
          ]
        },
        {
          "id": 3,
          "uuid": "b46375f7-0dcf-45b1-a34a-6246233603c5",
          "goods_transaction_id": 2,
          "grand_total": 2505400,
          "last_payment_at": "2026-09-27T17:00:00.000000Z",
          "is_paid": false,
          "note": "test",
          "created_at": "2026-09-28T03:51:59.000000Z",
          "updated_at": "2026-09-28T03:53:42.000000Z",
          "cashes": [
            {
              "id": 8,
              "uuid": "e4ac7999-5605-4be2-a764-86c0b258b57c",
              "company_id": 3,
              "account_id": null,
              "code": "bca_idr",
              "currency_type": "idr",
              "cash_name": "BCA IDR",
              "description": "Kas bca_idr PT Wajira Yanotama",
              "amount": 0,
              "type": "bank",
              "created_at": "2026-09-28T02:19:53.000000Z",
              "updated_at": "2026-09-28T02:19:53.000000Z",
              "pivot": {
                "goods_transaction_billing_history_id": 3,
                "cash_id": 8,
                "amount": "2505000.00",
                "created_at": "2026-09-28T03:51:59.000000Z",
                "updated_at": "2026-09-28T03:53:42.000000Z"
              }
            },
            {
              "id": 9,
              "uuid": "ee0e22f8-6806-4081-bc67-17b91e4f89c1",
              "company_id": 3,
              "account_id": null,
              "code": "bca_usd",
              "currency_type": "usd",
              "cash_name": "BCA USD",
              "description": "Kas bca_usd PT Wajira Yanotama",
              "amount": 0,
              "type": "bank",
              "created_at": "2026-09-28T02:19:53.000000Z",
              "updated_at": "2026-09-28T02:19:53.000000Z",
              "pivot": {
                "goods_transaction_billing_history_id": 3,
                "cash_id": 9,
                "amount": "400.00",
                "created_at": "2026-09-28T03:51:59.000000Z",
                "updated_at": "2026-09-28T03:53:42.000000Z"
              }
            }
          ]
        },
        {
          "id": 4,
          "uuid": "394a563a-ad63-41ab-99d7-25ca1d402261",
          "goods_transaction_id": 2,
          "grand_total": 9600,
          "last_payment_at": "2026-09-28T04:02:56.000000Z",
          "is_paid": false,
          "note": "test",
          "created_at": "2026-09-28T04:02:56.000000Z",
          "updated_at": "2026-09-28T04:02:56.000000Z",
          "cashes": [
            {
              "id": 7,
              "uuid": "f29bc3af-3f2b-43ea-b670-f199983a8613",
              "company_id": 3,
              "account_id": null,
              "code": "cash_idr",
              "currency_type": "idr",
              "cash_name": "Cash IDR",
              "description": "Kas cash_idr PT Wajira Yanotama",
              "amount": 0,
              "type": "cash",
              "created_at": "2026-09-28T02:19:53.000000Z",
              "updated_at": "2026-09-28T02:19:53.000000Z",
              "pivot": {
                "goods_transaction_billing_history_id": 4,
                "cash_id": 7,
                "amount": "9600.00",
                "created_at": "2026-09-28T04:02:56.000000Z",
                "updated_at": "2026-09-28T04:02:56.000000Z"
              }
            }
          ]
        }
      ]
    },
    "goods_transaction_refunds": []
  }
}

2. Billing payment (history)
{{url}}/wapi/transaction/goods-transaction-billing-history
request body:
goods_transaction_billing_id:2
bca_payment_amount:50000
//bca_payment_usd_amount:
//cash_payment_amount:
payment_at:2026-09-28
note:test

3. update status billing
{{url}}/wapi/transaction/goods-transaction-billing/:goods_transaction_billing_id
request body:
is_paid:true

<!-- Warehouse API -->
4. create warehouse activity
POST {{url}}/wapi/warehouse/warehouse-activity
person_id:int
warehouse_id:int
activity_type:in:receipt,dispatch
activity_date:date
description:string
goods_transaction_id:int
type:vehicle_equipment

//note: receript for purchase and dispatch for sales

response:
{
    "status": true,
    "message": "Warehouse activities retrieved successfully",
    "errors": null,
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "uuid": "ba297035-395d-41ba-ba1f-c918f6538ccc",
                "person_id": 1,
                "cash_id": null,
                "warehouse_id": 3,
                "type": "vehicle-equipment",
                "unit_transaction_id": null,
                "goods_transaction_id": 2,
                "sparepart_transaction_id": null,
                "activity_number": "TMU-WJY/20260928-0001",
                "activity_type": "receipt",
                "activity_date": "2026-01-01 00:00:00",
                "description": null,
                "state": "done",
                "is_refund_activity": false,
                "state_note": null,
                "created_at": "2026-09-28T04:23:33.000000Z",
                "warehouse": {
                    "id": 3,
                    "uuid": "3aad488f-fba3-4a69-af97-dddd42b1cba8",
                    "name": "PT Wajira Yanotama Warehouse"
                },
                "person": {
                    "id": 1,
                    "uuid": "8d460859-001c-4c86-b662-b83fa8b81ee5",
                    "name": "Rifqo Dwi Fahmi",
                    "company_list": "",
                    "company": null
                },
                "cash": null,
                "unit_transaction": null,
                "goods_transaction": {
                    "id": 2,
                    "uuid": "d76a51a4-ef9d-40f1-bb40-55dc2790be2f",
                    "code": "TRM-PK/20260928-0001",
                    "total_brutto": 0,
                    "has_warehouse_activity": true
                },
                "sparepart_transaction": null
            }
        ],
        "first_page_url": "http://localhost:8000/wapi/warehouse/warehouse-activity?page=1",
        "from": 1,
        "last_page": 1,
        "last_page_url": "http://localhost:8000/wapi/warehouse/warehouse-activity?page=1",
        "links": [
            {
                "url": null,
                "label": "&laquo; Previous",
                "active": false
            },
            {
                "url": "http://localhost:8000/wapi/warehouse/warehouse-activity?page=1",
                "label": "1",
                "active": true
            },
            {
                "url": null,
                "label": "Next &raquo;",
                "active": false
            }
        ],
        "next_page_url": null,
        "path": "http://localhost:8000/wapi/warehouse/warehouse-activity",
        "per_page": 10,
        "prev_page_url": null,
        "to": 1,
        "total": 1
    }
}

{{url}}/wapi/warehouse/warehouse-activity/:warehouse_activity_id
{
    "status": true,
    "message": "Warehouse activity retrieved successfully",
    "errors": null,
    "data": {
        "id": 1,
        "uuid": "ba297035-395d-41ba-ba1f-c918f6538ccc",
        "person_id": 1,
        "cash_id": null,
        "warehouse_id": 3,
        "type": "vehicle-equipment",
        "unit_transaction_id": null,
        "goods_transaction_id": 2,
        "sparepart_transaction_id": null,
        "activity_number": "TMU-WJY/20260928-0001",
        "activity_type": "receipt",
        "activity_date": "2026-01-01 00:00:00",
        "description": null,
        "state": "done",
        "is_refund_activity": false,
        "state_note": null,
        "created_at": "2026-09-28T04:23:33.000000Z",
        "total_unit_transaction_item_details": 0,
        "warehouse": {
            "id": 3,
            "uuid": "3aad488f-fba3-4a69-af97-dddd42b1cba8",
            "name": "PT Wajira Yanotama Warehouse"
        },
        "person": {
            "id": 1,
            "uuid": "8d460859-001c-4c86-b662-b83fa8b81ee5",
            "name": "Rifqo Dwi Fahmi",
            "company_list": "",
            "company": null
        },
        "cash": null,
        "unit_transaction": null,
        "goods_transaction": {
            "id": 2,
            "uuid": "d76a51a4-ef9d-40f1-bb40-55dc2790be2f",
            "code": "TRM-PK/20260928-0001",
            "transaction_type": "vehicle_equipment",
            "warehouse_id": 3,
            "person_id": 3,
            "material_id": null,
            "vehicle_equipment_id": 1,
            "type": "purchase",
            "billing_type": "cash",
            "is_refunded": false,
            "qty": 6,
            "price": 450000,
            "discount": 135000,
            "transaction_date": "2026-09-26T17:00:00.000000Z",
            "nota_number": null,
            "billing_due_date": null,
            "invoice_file": null,
            "note": null,
            "created_at": "2026-09-28T03:11:25.000000Z",
            "updated_at": "2026-09-28T03:13:47.000000Z",
            "total_brutto": 2565000,
            "has_warehouse_activity": true,
            "material": null,
            "vehicle_equipment": {
                "id": 1,
                "uuid": "e5a49950-722a-4431-b725-0a929c44524e",
                "code": "KNC-ING",
                "name": "Kunci Inggris",
                "description": "kunci asal inggris",
                "created_at": "2026-09-28T03:09:32.000000Z",
                "updated_at": "2026-09-28T03:09:32.000000Z",
                "buy_price": 5000,
                "sell_price": 6000
            }
        },
        "sparepart_transaction": null,
        "warehouse_movements": []
    }
}

5. update warehouse activity state
{{url}}/wapi/warehouse/warehouse-activity/:warehouse_activity_id/update-state
request body:
state:process