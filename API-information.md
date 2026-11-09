GET {{url}}/wapi/transaction/unit-transaction/unit-transaction/:unit_transaction_id
{
    "status": true,
    "message": "Unit Transaction retrieved successfully",
    "errors": null,
    "data": {
        "id": 2,
        "uuid": "9f39bc63-1aef-4d08-82f9-2b6f20a50b2e",
        "warehouse_id": 1,
        "person_id": 1,
        "document_template_id": 1,
        "code": "PBL-WAJ/20261106-24808",
        "type": "purchase",
        "invoice_file": null,
        "is_refunded": false,
        "is_usd_transaction": false,
        "created_at": "2026-11-06T06:32:46.000000Z",
        "total_dpp": 56027028,
        "transaction_dpp_total": 56027028,
        "total_ppn": 6162972,
        "transaction_ppn_total": 6162972,
        "total_hpp": 62190000,
        "transaction_hpp_total": 62190000,
        "total_bbn": 10000,
        "total_bbn_fee": 10000,
        "transaction_bbn_total": 10000,
        "total_expedition_fee": 20000,
        "transaction_expedition_total": 20000,
        "total_other_fee": 0,
        "transaction_other_fee": 0,
        "total_operational_fee": 30000,
        "total_purchase": 69000000,
        "total_usd_cost": 0,
        "transaction_usd_cost_total": 0,
        "usd_cost_freight_total": 0,
        "usd_cost_box_packing_total": 0,
        "usd_cost_admin_cost_total": 0,
        "usd_cost_ckd_processing_cost_total": 0,
        "usd_cost_bill_of_lading_switch_cost_total": 0,
        "usd_cost_customs_clearance_cost_total": 0,
        "usd_cost_other_total": 0,
        "unit_transaction_bruto_total": 69030000,
        "transaction_bruto_total": 69030000,
        "bruto_total": 69030000,
        "total_discount": 6900000,
        "transaction_discount_total": 6900000,
        "price_discount_total": 6900000,
        "unit_transaction_bruto_total_actual": 0,
        "unit_transaction_bruto_refund": 0,
        "unit_transaction_bruto_return": 0,
        "unit_transaction_price_usd_total": 0,
        "transaction_price_usd_total": 0,
        "unit_transaction_price_usd_total_actual": 0,
        "is_unit_type_detail_valid": false,
        "billing_summary": {
            "grand_total": 62130000,
            "bruto_total": 69030000,
            "total_usd_payment": 0,
            "total_cash_payment": 30130000,
            "total_bca_payment": 32000000,
            "total_paid": 62130000,
            "total_paid_usd": 0,
            "remaining_payment": 0,
            "remaining_payment_usd": 0,
            "is_paid": true
        },
        "remaining_payment": 0,
        "remaining_payment_usd": 0,
        "has_warehouse_activity": false,
        "has_refund_transaction": true,
        "expedition_fee_total": 20000,
        "warehouse": {
            "id": 1,
            "uuid": "6a834a8a-ab41-43bf-8b84-f96014275709",
            "name": "wajira-morindo Warehouse",
            "capacity": 10000
        },
        "person": {
            "id": 1,
            "uuid": "95f48805-c06f-4d9c-91a0-012bd35b5951",
            "code": "SPL-M/0001",
            "type": "supplier",
            "name": "Mansurin",
            "company_list": "",
            "company": null
        },
        "transaction_flow": null,
        "unit_transaction_billing": {
            "id": 2,
            "uuid": "51aca7ae-a425-40dc-831b-031d46cd1559",
            "unit_transaction_id": 2,
            "grand_total": 62130000,
            "last_payment_at": "2026-11-05T17:00:00.000000Z",
            "is_paid": true,
            "is_usd_transaction": false,
            "created_at": "2026-11-06T06:34:19.000000Z",
            "updated_at": "2026-11-06T06:34:26.000000Z",
            "bruto_total": 69030000,
            "total_paid": 62130000,
            "remaining_payment": 0,
            "unit_transaction_billing_histories": [
                {
                    "id": 2,
                    "uuid": "4b96a96b-d87d-4310-a151-898495823d08",
                    "unit_transaction_billing_id": 2,
                    "payment_proof": null,
                    "payment_at": "2026-11-05T17:00:00.000000Z",
                    "note": "test saja mas",
                    "created_at": "2026-11-06T06:34:19.000000Z",
                    "updated_at": "2026-11-06T06:34:19.000000Z",
                    "cashes": [
                        {
                            "id": 2,
                            "uuid": "f030e9fd-bdcd-47ea-87df-e70e5d49e17e",
                            "company_id": 1,
                            "account_id": null,
                            "code": "bca_idr",
                            "currency_type": "idr",
                            "cash_name": "BCA IDR",
                            "description": "Kas bca_idr PT Wajira Morindo",
                            "amount": 0,
                            "type": "bank",
                            "created_at": "2026-11-06T02:28:01.000000Z",
                            "updated_at": "2026-11-06T02:28:01.000000Z",
                            "pivot": {
                                "unit_transaction_billing_history_id": 2,
                                "cash_id": 2,
                                "amount": 32000000,
                                "original_amount": 0,
                                "exchange_amount": 0
                            }
                        }
                    ]
                },
                {
                    "id": 3,
                    "uuid": "96ee25bf-f65a-4c9a-bb37-26ff83801d53",
                    "unit_transaction_billing_id": 2,
                    "payment_proof": null,
                    "payment_at": "2026-11-05T17:00:00.000000Z",
                    "note": "test saja mas",
                    "created_at": "2026-11-06T06:34:19.000000Z",
                    "updated_at": "2026-11-06T06:34:19.000000Z",
                    "cashes": [
                        {
                            "id": 1,
                            "uuid": "a37bd922-e667-48d1-8f02-d9b5e90d83b7",
                            "company_id": 1,
                            "account_id": null,
                            "code": "cash_idr",
                            "currency_type": "idr",
                            "cash_name": "Cash IDR",
                            "description": "Kas cash_idr PT Wajira Morindo",
                            "amount": 0,
                            "type": "cash",
                            "created_at": "2026-11-06T02:28:01.000000Z",
                            "updated_at": "2026-11-06T02:28:01.000000Z",
                            "pivot": {
                                "unit_transaction_billing_history_id": 3,
                                "cash_id": 1,
                                "amount": 30130000,
                                "original_amount": 0,
                                "exchange_amount": 0
                            }
                        }
                    ]
                }
            ]
        },
        "unit_transaction_items": [
            {
                "id": 2,
                "uuid": "e722594b-f13a-416a-b779-61e308793a34",
                "unit_transaction_id": 2,
                "unit_type_id": 1,
                "sparepart_id": null,
                "is_usd_transaction": false,
                "dpp_tax_id": 2,
                "dpp_tax_rate": 111,
                "ppn_tax_id": 1,
                "ppn_tax_rate": 11,
                "qty_total": 3,
                "price": 23000000,
                "price_discount": 10,
                "price_per_unit_usd": 0,
                "price_usd": 0,
                "bbn_price": 10000,
                "hpp_per_unit_price": 20730000,
                "dpp_per_unit_price": 18675676,
                "ppn_per_unit_price": 2054324,
                "hpp_total_price": 62190000,
                "dpp_total_price": 56027028,
                "ppn_total_price": 6162972,
                "price_total": 62190000,
                "price_total_usd": 0,
                "expedition_fee": 20000,
                "other_fee": 0,
                "created_at": "2026-11-06T06:32:46.000000Z",
                "updated_at": "2026-11-06T06:32:46.000000Z",
                "price_usd_discount": 0,
                "total_usd_cost": 0,
                "usd_cost_freight_total": 0,
                "usd_cost_box_packing_total": 0,
                "usd_cost_admin_cost_total": 0,
                "usd_cost_ckd_processing_cost_total": 0,
                "usd_cost_bill_of_lading_switch_cost_total": 0,
                "usd_cost_customs_clearance_cost_total": 0,
                "usd_cost_other_total": 0,
                "unit_transaction_item_details": [],
                "unit_type_sold_details": [],
                "unit_transaction_usd_costs": [],
                "dpp_tax": {
                    "id": 2,
                    "tax_id": 2,
                    "tax": {
                        "id": 2,
                        "name": "Dasar Pengenaan Pajak",
                        "code": "dpp",
                        "tax_version_count": 1,
                        "tax_versions": [
                            {
                                "id": 2,
                                "tax_id": 2,
                                "name": "DPP 100%",
                                "rate": 111,
                                "effective_from": null,
                                "effective_until": null,
                                "is_default": 1,
                                "is_lock": 0,
                                "created_at": "2026-11-06T02:28:12.000000Z",
                                "updated_at": "2026-11-06T02:28:12.000000Z"
                            }
                        ]
                    }
                },
                "ppn_tax": {
                    "id": 1,
                    "tax_id": 1,
                    "tax": {
                        "id": 1,
                        "name": "Pajak Pertambahan Nilai",
                        "code": "ppn",
                        "tax_version_count": 1,
                        "tax_versions": [
                            {
                                "id": 1,
                                "tax_id": 1,
                                "name": "PPN 11%",
                                "rate": 11,
                                "effective_from": null,
                                "effective_until": null,
                                "is_default": 1,
                                "is_lock": 1,
                                "created_at": "2026-11-06T02:28:12.000000Z",
                                "updated_at": "2026-11-06T02:28:12.000000Z"
                            }
                        ]
                    }
                }
            }
        ],
        "unit_transaction_usd_costs": [],
        "warehouse_activity": null,
        "unit_transaction_refunds": [
            {
                "id": 1,
                "code": "RFB-WJM/20261109-0001",
                "unit_transaction_id": 2,
                "is_paid": false,
                "is_usd_transaction": false,
                "refund_date": "2026-11-08T17:00:00.000000Z",
                "refund_amount": 3000000,
                "is_with_stock": false,
                "remaining_payment": 3000000
            }
        ]
    }
}