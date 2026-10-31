1. menambah data general journal (jurnal umum)
POST {{url}}/wapi/finance/general-journal

request body:
  {
      "company_id": 1,
      "date": "2026-10-30",
      "note": "Pengeluaran operasional cabang",          
      "billings": [                                      
        {
          "date": "2026-10-30",
          "note": "Operasional logistik minggu ke-4",    
          "cashes": [
            {
              "cash_id": 1,                              
              "amount": 1500000.00                       
            },
            {
              "cash_id": 2,
              "amount": 1000000.00
            }
          ]
        }
      ]
    }
  

response:
{
  "status": true,
  "message": "General Journal created successfully",
  "errors": null,
  "data": {
    "id": 2,
    "uuid": "7ada9e25-ff2c-43ec-821f-600ffe2ab67d",
    "company_id": 1,
    "code": "JRN2026103000002",
    "date": "2026-10-29T17:00:00.000000Z",
    "note": "Pengeluaran operasional cabang",
    "payment_proof": null,
    "is_paid": false,
    "amount": "2500000.00",
    "amount_original": "2500000.00",
    "is_usd_transaction": false,
    "is_valid": false,
    "created_at": "2026-10-30T15:40:33.000000Z",
    "updated_at": "2026-10-30T15:40:33.000000Z",
    "total_amount": 2500000,
    "total_paid": 0,
    "remaining_amount": 2500000,
    "is_balanced": false,
    "total_debit": 2500000,
    "total_credit": 0,
    "company": {
      "id": 1,
      "uuid": "8510767b-8ec4-455e-b486-c068e5f0fcd1",
      "slug": "wajira-morindo",
      "name": "PT Wajira Morindo"
    },
    "billings": [
      {
        "id": 3,
        "uuid": "018e6e0d-535a-48ee-a916-5dcbc3a3f879",
        "general_journal_id": 2,
        "note": "Operasional logistik minggu ke-4",
        "is_paid": false,
        "is_valid": false,
        "date": "2026-10-29T17:00:00.000000Z",
        "created_at": "2026-10-30T15:40:33.000000Z",
        "updated_at": "2026-10-30T15:40:33.000000Z",
        "total_amount": 2500000,
        "total_paid": 0,
        "remaining_amount": 2500000,
        "cashes": [
          {
            "id": 1,
            "general_journal_billing_id": 3,
            "cash_id": 1,
            "amount": "1500000.00",
            "created_at": "2026-10-30T15:40:33.000000Z",
            "updated_at": "2026-10-30T15:40:33.000000Z",
            "cash": {
              "id": 1,
              "uuid": "9df21425-1418-4c58-b441-5363cf791171",
              "company_id": 1,
              "currency_type": "idr",
              "cash_name": "Cash IDR",
              "code": "cash_idr",
              "type": "cash"
            }
          },
          {
            "id": 2,
            "general_journal_billing_id": 3,
            "cash_id": 2,
            "amount": "1000000.00",
            "created_at": "2026-10-30T15:40:33.000000Z",
            "updated_at": "2026-10-30T15:40:33.000000Z",
            "cash": {
              "id": 2,
              "uuid": "b16a5b48-b727-4652-b2a1-7d43c7911c9a",
              "company_id": 1,
              "currency_type": "idr",
              "cash_name": "BCA IDR",
              "code": "bca_idr",
              "type": "bank"
            }
          }
        ],
        "payments": []
      }
    ]
  }
}

2. menambah data general journal billing payment

POST {{url}}/wapi/finance/general-journal-billing-payment

request body:
{
    "general_journal_billing_id": 3,
    "account_id": 2,
    "amount": 1000000,
    "amount_original": 0,
    "note": "Biaya operasional gudang"
}

response:
{
    "status": true,
    "message": "General Journal billing payment created successfully",
    "errors": null,
    "data": {
        "id": 5,
        "general_journal_billing_id": 3,
        "account_id": 2,
        "amount": "1000000.00",
        "amount_original": "0.00",
        "note": "Biaya operasional gudang",
        "transaction_proof": null,
        "account": {
            "id": 2,
            "uuid": "09e53e47-c77d-4176-abac-074aa0e15cf4",
            "code": "11100002",
            "name": "KAS KECIL"
        },
        "billing": {
            "id": 3,
            "uuid": "018e6e0d-535a-48ee-a916-5dcbc3a3f879",
            "general_journal_id": 2,
            "note": "Operasional logistik minggu ke-4",
            "is_paid": true,
            "is_valid": true,
            "date": "2026-10-29T17:00:00.000000Z",
            "created_at": "2026-10-30T15:40:33.000000Z",
            "updated_at": "2026-10-30T16:02:21.000000Z",
            "total_amount": 2500000,
            "total_paid": 2500000,
            "remaining_amount": 0,
            "cashes": [
                {
                    "id": 1,
                    "general_journal_billing_id": 3,
                    "cash_id": 1,
                    "amount": "1500000.00",
                    "created_at": "2026-10-30T15:40:33.000000Z",
                    "updated_at": "2026-10-30T15:40:33.000000Z",
                    "cash": {
                        "id": 1,
                        "uuid": "9df21425-1418-4c58-b441-5363cf791171",
                        "company_id": 1,
                        "currency_type": "idr",
                        "cash_name": "Cash IDR",
                        "code": "cash_idr",
                        "type": "cash"
                    }
                },
                {
                    "id": 2,
                    "general_journal_billing_id": 3,
                    "cash_id": 2,
                    "amount": "1000000.00",
                    "created_at": "2026-10-30T15:40:33.000000Z",
                    "updated_at": "2026-10-30T15:40:33.000000Z",
                    "cash": {
                        "id": 2,
                        "uuid": "b16a5b48-b727-4652-b2a1-7d43c7911c9a",
                        "company_id": 1,
                        "currency_type": "idr",
                        "cash_name": "BCA IDR",
                        "code": "bca_idr",
                        "type": "bank"
                    }
                }
            ]
        }
    }
}