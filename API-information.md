GET {{url}}/wapi/finance/cash-flow/:cash_flow_id
{
    "status": true,
    "message": "Cash Flow data retrieved successfully",
    "errors": null,
    "data": {
        "id": 2,
        "uuid": "c8914652-5740-4864-8b93-09f3f01b84cc",
        "company_id": 1,
        "unit_transaction_billing_id": null,
        "sparepart_transaction_billing_id": null,
        "goods_transaction_billing_id": null,
        "driver_cash_advance_billing_id": null,
        "do_invoice_billing_id": null,
        "code": "TRX2026101000001",
        "date": "2026-10-09T17:00:00.000000Z",
        "note": "Kas harian pembayaran operasional kantor saja",
        "payment_proof": null,
        "is_paid": false,
        "is_valid": true,
        "created_at": "2026-10-10T03:47:10.000000Z",
        "updated_at": "2026-10-11T04:22:32.000000Z",
        "invoice_number": null,
        "debet_total": 3000000,
        "credit_total": 500000,
        "debet_usd_total": 0,
        "credit_usd_total": 0,
        "grand_total": 3500000,
        "grand_total_usd": 0,
        "remaining_payment": 3500000,
        "remaining_payment_usd": 0,
        "dual_remaining_payment": 500000,
        "dual_remaining_payment_usd": 0,
        "cash_position": {
            "debet_idr_total": 3000000,
            "credit_idr_total": 500000,
            "debet_usd_total": 0,
            "credit_usd_total": 0
        },
        "cash_summaries": [
            {
                "cash_id": 1,
                "cash": {
                    "id": 1,
                    "uuid": "12d452db-f794-48db-b5e5-001de6324664",
                    "company_id": 1,
                    "code": "cash_idr",
                    "cash_name": "Cash IDR",
                    "currency_type": "idr",
                    "type": "cash"
                },
                "debet_total": 3000000,
                "credit_total": 0,
                "debet_usd_total": 0,
                "credit_usd_total": 0
            },
            {
                "cash_id": 2,
                "cash": {
                    "id": 2,
                    "uuid": "23f9bcb7-4448-42a5-973c-fb183db58246",
                    "company_id": 1,
                    "code": "bca_idr",
                    "cash_name": "BCA IDR",
                    "currency_type": "idr",
                    "type": "bank"
                },
                "debet_total": 0,
                "credit_total": 500000,
                "debet_usd_total": 0,
                "credit_usd_total": 0
            }
        ],
        "company": {
            "id": 1,
            "uuid": "0ade6c17-70a1-40e4-bd8a-ff0069c36223",
            "name": "PT Wajira Morindo"
        },
        "cash_flow_cashes": [
            {
                "id": 4,
                "cash_flow_id": 2,
                "cash_id": 1,
                "amount": 300000,
                "amount_original": 1500000,
                "type": "debet",
                "created_at": "2026-10-10T03:50:10.000000Z",
                "updated_at": "2026-10-10T03:50:10.000000Z",
                "cash": {
                    "id": 1,
                    "uuid": "12d452db-f794-48db-b5e5-001de6324664",
                    "company_id": 1,
                    "currency_type": "idr",
                    "cash_name": "Cash IDR",
                    "type": "cash",
                    "code": "cash_idr"
                }
            },
            {
                "id": 5,
                "cash_flow_id": 2,
                "cash_id": 2,
                "amount": 400,
                "amount_original": 500000,
                "type": "credit",
                "created_at": "2026-10-10T03:50:10.000000Z",
                "updated_at": "2026-10-10T03:50:10.000000Z",
                "cash": {
                    "id": 2,
                    "uuid": "23f9bcb7-4448-42a5-973c-fb183db58246",
                    "company_id": 1,
                    "currency_type": "idr",
                    "cash_name": "BCA IDR",
                    "type": "bank",
                    "code": "bca_idr"
                }
            },
            {
                "id": 6,
                "cash_flow_id": 2,
                "cash_id": 1,
                "amount": 300000,
                "amount_original": 1500000,
                "type": "debet",
                "created_at": "2026-10-10T03:50:10.000000Z",
                "updated_at": "2026-10-10T03:50:10.000000Z",
                "cash": {
                    "id": 1,
                    "uuid": "12d452db-f794-48db-b5e5-001de6324664",
                    "company_id": 1,
                    "currency_type": "idr",
                    "cash_name": "Cash IDR",
                    "type": "cash",
                    "code": "cash_idr"
                }
            }
        ],
        "finance_billings": [
            {
                "id": 5,
                "uuid": "029d765c-8e85-4d27-bcbd-baf0b0878ab9",
                "cash_flow_id": 2,
                "cash_id": 1,
                "account_id": 156,
                "amount": 3000000,
                "amount_original": 3000000,
                "payment_proof": null,
                "payment_at": "2026-10-08T17:00:00.000000Z",
                "note": null,
                "is_usd_payment": false,
                "cash_position_before": 0,
                "cash_position_after": null,
                "created_at": "2026-10-11T04:22:32.000000Z",
                "updated_at": "2026-10-11T04:22:32.000000Z",
                "cash": {
                    "id": 1,
                    "uuid": "12d452db-f794-48db-b5e5-001de6324664",
                    "company_id": 1,
                    "code": "cash_idr",
                    "cash_name": "Cash IDR",
                    "currency_type": "idr"
                },
                "account": {
                    "id": 156,
                    "type": "credit"
                }
            }
        ],
        "unit_transaction_billing": null,
        "goods_transaction_billing": null,
        "sparepart_transaction_billing": null
    }
}