GET {{url}}/wapi/report/profit-loss-report/:company_id?year=2026&month=january
{
    "status": true,
    "message": "Profit & Loss report data retrieved successfully",
    "errors": null,
    "data": {
        "year": 2026,
        "month": "january",
        "summary": {
            "opening_balance": 0,
            "ending_balance": 0
        },
        "revenue_account_ids": [
            156,
            19,
            16,
            67
        ],
        "cogs_account_ids": [
            155,
            154,
            121
        ],
        "opex_account_ids": [
            152,
            38
        ],
        "tax": 10,
        "revenue_calc": {
            "total": 0,
            "accounts": [
                {
                    "id": 156,
                    "account_id": 156,
                    "account_code": "72000099",
                    "account_name": "BIAYA LAIN-LAIN",
                    "account_type": "credit",
                    "amount": 0,
                    "type": "IDR"
                },
                {
                    "id": 19,
                    "account_id": 19,
                    "account_code": "11410010",
                    "account_name": "PERSEDIAAN MOTOR HONDA GENIO",
                    "account_type": "debet",
                    "amount": 0,
                    "type": "IDR"
                },
                {
                    "id": 16,
                    "account_id": 16,
                    "account_code": "11410007",
                    "account_name": "PERSEDIAAN MOTOR HONDA CRF",
                    "account_type": "debet",
                    "amount": 0,
                    "type": "IDR"
                },
                {
                    "id": 67,
                    "account_id": 67,
                    "account_code": "32000002",
                    "account_name": "LABA (RUGI) TAHUN BERJALAN",
                    "account_type": "credit",
                    "amount": 0,
                    "type": "IDR"
                }
            ]
        },
        "cogs_calc": {
            "total": 0,
            "accounts": [
                {
                    "id": 155,
                    "account_id": 155,
                    "account_code": "72000006",
                    "account_name": "RUGI SELISIH KURS",
                    "account_type": "credit",
                    "amount": 0,
                    "type": "IDR"
                },
                {
                    "id": 154,
                    "account_id": 154,
                    "account_code": "72000005",
                    "account_name": "BIAYA DENDA PAJAK",
                    "account_type": "credit",
                    "amount": 0,
                    "type": "IDR"
                },
                {
                    "id": 121,
                    "account_id": 121,
                    "account_code": "61000004",
                    "account_name": "BIAYA GAJI PEGAWAI",
                    "account_type": "credit",
                    "amount": 0,
                    "type": "IDR"
                }
            ]
        },
        "opex_calc": {
            "total": 0,
            "accounts": [
                {
                    "id": 152,
                    "account_id": 152,
                    "account_code": "72000003",
                    "account_name": "BIAYA TRANSFER ANTAR BANK",
                    "account_type": "credit",
                    "amount": 0,
                    "type": "IDR"
                },
                {
                    "id": 38,
                    "account_id": 38,
                    "account_code": "11500003",
                    "account_name": "UANG MUKA PPH 23",
                    "account_type": "debet",
                    "amount": 0,
                    "type": "IDR"
                }
            ]
        },
        "profit_loss_before_tax": 0,
        "tax_amount": 0,
        "profit_loss_after_tax": 0
    }
}   