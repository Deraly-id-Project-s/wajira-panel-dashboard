GET {{url}}/wapi/finance/cash-flow?company_id=1
{
    "status": true,
    "message": "Cash Flow list retrieved successfully",
    "errors": null,
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "uuid": "1c586a02-0a76-453b-9c74-3af09a2884bc",
                "company_id": 1,
                "unit_transaction_billing_id": 1,
                "sparepart_transaction_billing_id": null,
                "goods_transaction_billing_id": null,
                "driver_cash_advance_billing_id": null,
                "do_invoice_billing_id": null,
                "code": "PBL-WJM/20261008-0001-payment",
                "date": "2026-10-07T17:00:00.000000Z",
                "note": "Pelunasan Total PBL-WJM/20261008-0001",
                "payment_proof": null,
                "is_paid": false,
                "is_valid": false,
                "created_at": "2026-10-08T14:39:43.000000Z",
                "updated_at": "2026-10-08T14:39:43.000000Z",
                "invoice_number": "PBL-WJM/20261008-0001",
                "debet_total": 57940000,
                "credit_total": 0,
                "debet_usd_total": 237,
                "credit_usd_total": 0,
                "grand_total": 57940000,
                "grand_total_usd": 237,
                "remaining_payment": 57940000,
                "remaining_payment_usd": 237,
                "cash_position": {
                    "debet_idr_total": 57940000,
                    "credit_idr_total": 0,
                    "debet_usd_total": 237,
                    "credit_usd_total": 0
                },
                "company": {
                    "id": 1,
                    "uuid": "db72335a-2f2f-469b-928a-d2040b580a80",
                    "name": "PT Wajira Morindo"
                },
                "unit_transaction_billing": {
                    "id": 1,
                    "uuid": "0dfa21dd-9989-4b8f-895a-03db39fc20b8",
                    "unit_transaction_id": 2,
                    "grand_total": 57940000,
                    "last_payment_at": "2026-10-07T17:00:00.000000Z",
                    "is_paid": true,
                    "created_at": "2026-10-08T14:39:36.000000Z",
                    "updated_at": "2026-10-08T14:39:43.000000Z",
                    "unit_transaction": {
                        "id": 2,
                        "code": "PBL-WJM/20261008-0001",
                        "type": "purchase",
                        "has_warehouse_activity": false,
                        "has_refund_transaction": false,
                        "expedition_fee_total": "152000.00"
                    }
                },
                "goods_transaction_billing": null,
                "sparepart_transaction_billing": null
            }
        ],
        "first_page_url": "http://localhost:8000/wapi/finance/cash-flow?page=1",
        "from": 1,
        "last_page": 1,
        "last_page_url": "http://localhost:8000/wapi/finance/cash-flow?page=1",
        "links": [
            {
                "url": null,
                "label": "&laquo; Previous",
                "active": false
            },
            {
                "url": "http://localhost:8000/wapi/finance/cash-flow?page=1",
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
        "path": "http://localhost:8000/wapi/finance/cash-flow",
        "per_page": 10,
        "prev_page_url": null,
        "to": 1,
        "total": 1
    }
}

GET {{url}}/wapi/finance/cash-flow/:cash_flow_id
{
    "status": true,
    "message": "Cash Flow data retrieved successfully",
    "errors": null,
    "data": {
        "id": 1,
        "uuid": "1c586a02-0a76-453b-9c74-3af09a2884bc",
        "company_id": 1,
        "unit_transaction_billing_id": 1,
        "sparepart_transaction_billing_id": null,
        "goods_transaction_billing_id": null,
        "driver_cash_advance_billing_id": null,
        "do_invoice_billing_id": null,
        "code": "PBL-WJM/20261008-0001-payment",
        "date": "2026-10-07T17:00:00.000000Z",
        "note": "Pelunasan Total PBL-WJM/20261008-0001",
        "payment_proof": null,
        "is_paid": false,
        "is_valid": false,
        "created_at": "2026-10-08T14:39:43.000000Z",
        "updated_at": "2026-10-08T14:39:43.000000Z",
        "invoice_number": "PBL-WJM/20261008-0001",
        "debet_total": 57940000,
        "credit_total": 0,
        "debet_usd_total": 237,
        "credit_usd_total": 0,
        "grand_total": 57940000,
        "grand_total_usd": 237,
        "remaining_payment": 57940000,
        "remaining_payment_usd": 237,
        "cash_position": {
            "debet_idr_total": 57940000,
            "credit_idr_total": 0,
            "debet_usd_total": 237,
            "credit_usd_total": 0
        },
        "cash_summaries": [
            {
                "cash_id": 2,
                "cash": {
                    "id": 2,
                    "uuid": "9d5419c1-e7e8-44bd-8b9e-61d4d51325c3",
                    "company_id": 1,
                    "code": "bca_idr",
                    "cash_name": "BCA IDR",
                    "currency_type": "idr",
                    "type": "bank"
                },
                "debet_total": 57940000,
                "credit_total": 0,
                "debet_usd_total": 0,
                "credit_usd_total": 0
            },
            {
                "cash_id": 3,
                "cash": {
                    "id": 3,
                    "uuid": "3f6442a9-23f3-42ea-b93b-bad2ecd2b1a0",
                    "company_id": 1,
                    "code": "bca_usd",
                    "cash_name": "BCA USD",
                    "currency_type": "usd",
                    "type": "bank"
                },
                "debet_total": 0,
                "credit_total": 0,
                "debet_usd_total": 237,
                "credit_usd_total": 0
            }
        ],
        "company": {
            "id": 1,
            "uuid": "db72335a-2f2f-469b-928a-d2040b580a80",
            "name": "PT Wajira Morindo"
        },
        "cash_flow_cashes": [
            {
                "id": 1,
                "cash_flow_id": 1,
                "cash_id": 2,
                "amount": 57940000,
                "amount_original": 57940000,
                "type": "debet",
                "created_at": "2026-10-08T14:39:43.000000Z",
                "updated_at": "2026-10-08T14:39:43.000000Z",
                "cash": {
                    "id": 2,
                    "uuid": "9d5419c1-e7e8-44bd-8b9e-61d4d51325c3",
                    "company_id": 1,
                    "currency_type": "idr",
                    "cash_name": "BCA IDR",
                    "type": "bank",
                    "code": "bca_idr"
                }
            },
            {
                "id": 2,
                "cash_flow_id": 1,
                "cash_id": 3,
                "amount": 237,
                "amount_original": 0,
                "type": "debet",
                "created_at": "2026-10-08T14:39:43.000000Z",
                "updated_at": "2026-10-08T14:39:43.000000Z",
                "cash": {
                    "id": 3,
                    "uuid": "3f6442a9-23f3-42ea-b93b-bad2ecd2b1a0",
                    "company_id": 1,
                    "currency_type": "usd",
                    "cash_name": "BCA USD",
                    "type": "bank",
                    "code": "bca_usd"
                }
            }
        ],
        "finance_billings": [],
        "unit_transaction_billing": {
            "id": 1,
            "uuid": "0dfa21dd-9989-4b8f-895a-03db39fc20b8",
            "unit_transaction_id": 2,
            "grand_total": 57940000,
            "last_payment_at": "2026-10-07T17:00:00.000000Z",
            "is_paid": true,
            "created_at": "2026-10-08T14:39:36.000000Z",
            "updated_at": "2026-10-08T14:39:43.000000Z",
            "unit_transaction": {
                "id": 2,
                "uuid": "9605210d-0cda-4477-adfe-75bb01517f9e",
                "warehouse_id": 1,
                "person_id": 3,
                "transaction_type": "unit_type",
                "code": "PBL-WJM/20261008-0001",
                "type": "purchase",
                "invoice_file": null,
                "is_refunded": false,
                "document_template_id": 1,
                "created_at": "2026-10-08T14:19:06.000000Z",
                "updated_at": "2026-10-08T14:19:06.000000Z",
                "dpp_total": 52171170,
                "ppn_total": 5738830,
                "expedition_total": 152000,
                "bbn_price_total": 25000,
                "other_fee_total": 5000,
                "unit_transaction_costs": {
                    "hpp_total_price": 57910000,
                    "bbn_total_price": 25000,
                    "expedition_total_fee": 152000,
                    "other_total_fee": 5000
                },
                "has_warehouse_activity": false,
                "has_refund_transaction": false,
                "expedition_fee_total": 152000,
                "unit_transaction_usd_costs": [
                    {
                        "id": 7,
                        "unit_transaction_item_id": 2,
                        "cost_type": "freight",
                        "amount": 250,
                        "note": "Biaya kontainer pengiriman laut",
                        "created_at": "2026-10-08T14:19:06.000000Z",
                        "updated_at": "2026-10-08T14:19:06.000000Z",
                        "laravel_through_key": 2
                    },
                    {
                        "id": 8,
                        "unit_transaction_item_id": 2,
                        "cost_type": "customs_clearance_cost",
                        "amount": 100,
                        "note": "Biaya bea cukai pelabuhan",
                        "created_at": "2026-10-08T14:19:06.000000Z",
                        "updated_at": "2026-10-08T14:19:06.000000Z",
                        "laravel_through_key": 2
                    },
                    {
                        "id": 9,
                        "unit_transaction_item_id": 2,
                        "cost_type": "other",
                        "amount": 45,
                        "note": "Biaya materai dokumen USD",
                        "created_at": "2026-10-08T14:19:06.000000Z",
                        "updated_at": "2026-10-08T14:19:06.000000Z",
                        "laravel_through_key": 2
                    },
                    {
                        "id": 10,
                        "unit_transaction_item_id": 2,
                        "cost_type": "other",
                        "amount": 75.5,
                        "note": "Handling tambahan",
                        "created_at": "2026-10-08T14:19:06.000000Z",
                        "updated_at": "2026-10-08T14:19:06.000000Z",
                        "laravel_through_key": 2
                    }
                ]
            }
        },
        "goods_transaction_billing": null,
        "sparepart_transaction_billing": null
    }
}

GET {{url}}/wapi/master-data/cash?company_id=1
{
    "status": true,
    "message": "Cash list retrieved successfully",
    "errors": null,
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 3,
                "uuid": "3f6442a9-23f3-42ea-b93b-bad2ecd2b1a0",
                "company_id": 1,
                "account_id": null,
                "code": "bca_usd",
                "currency_type": "usd",
                "cash_name": "BCA USD",
                "description": "Kas bca_usd PT Wajira Morindo",
                "type": "bank",
                "amount": 0,
                "created_at": "2026-10-08T13:58:04.000000Z",
                "account": null
            },
            {
                "id": 2,
                "uuid": "9d5419c1-e7e8-44bd-8b9e-61d4d51325c3",
                "company_id": 1,
                "account_id": null,
                "code": "bca_idr",
                "currency_type": "idr",
                "cash_name": "BCA IDR",
                "description": "Kas bca_idr PT Wajira Morindo",
                "type": "bank",
                "amount": 0,
                "created_at": "2026-10-08T13:58:04.000000Z",
                "account": null
            },
            {
                "id": 1,
                "uuid": "6ee336ad-791a-461e-a7c9-755238e204f2",
                "company_id": 1,
                "account_id": null,
                "code": "cash_idr",
                "currency_type": "idr",
                "cash_name": "Cash IDR",
                "description": "Kas cash_idr PT Wajira Morindo",
                "type": "cash",
                "amount": 0,
                "created_at": "2026-10-08T13:58:04.000000Z",
                "account": null
            }
        ],
        "first_page_url": "http://localhost:8000/wapi/master-data/cash?page=1",
        "from": 1,
        "last_page": 1,
        "last_page_url": "http://localhost:8000/wapi/master-data/cash?page=1",
        "links": [
            {
                "url": null,
                "label": "&laquo; Previous",
                "active": false
            },
            {
                "url": "http://localhost:8000/wapi/master-data/cash?page=1",
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
        "path": "http://localhost:8000/wapi/master-data/cash",
        "per_page": 10,
        "prev_page_url": null,
        "to": 3,
        "total": 3
    }
}
