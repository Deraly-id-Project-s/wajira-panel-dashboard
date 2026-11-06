{
    "status": true,
    "message": "Unit Transaction retrieved successfully",
    "errors": null,
    "data": {
        "id": 1,
        "uuid": "edfc4a00-642d-43fd-96d6-ae08af8a4a9d",
        "warehouse_id": 1,
        "person_id": 1,
        "document_template_id": 1,
        "code": "PBL-WAJ/20261106-55294",
        "type": "purchase",
        "invoice_file": null,
        "is_refunded": false,
        "is_usd_transaction": true,
        "created_at": "2026-11-06T03:16:37.000000Z",
        "total_dpp": 0,
        "transaction_dpp_total": 0,
        "total_ppn": 0,
        "transaction_ppn_total": 0,
        "total_hpp": 0,
        "transaction_hpp_total": 0,
        "total_bbn": 0,
        "total_bbn_fee": 0,
        "transaction_bbn_total": 0,
        "total_expedition_fee": 0,
        "transaction_expedition_total": 0,
        "total_other_fee": 0,
        "transaction_other_fee": 0,
        "total_operational_fee": 0,
        "total_purchase": 0,
        "total_usd_cost": 60,
        "transaction_usd_cost_total": 60,
        "usd_cost_freight_total": 10,
        "usd_cost_box_packing_total": 10,
        "usd_cost_admin_cost_total": 10,
        "usd_cost_ckd_processing_cost_total": 10,
        "usd_cost_bill_of_lading_switch_cost_total": 10,
        "usd_cost_customs_clearance_cost_total": 10,
        "usd_cost_other_total": 0,
        "unit_transaction_bruto_total": 3960,
        "transaction_bruto_total": 3960,
        "bruto_total": 3960,
        "total_discount": 1584,
        "transaction_discount_total": 1584,
        "price_discount_total": 1584,
        "unit_transaction_bruto_total_actual": 0,
        "unit_transaction_bruto_refund": 0,
        "unit_transaction_bruto_return": 0,
        "unit_transaction_price_usd_total": 2376,
        "transaction_price_usd_total": 2376,
        "unit_transaction_price_usd_total_actual": 0,
        "is_unit_type_detail_valid": false,
        "billing_summary": {
            "grand_total": 2376,
            "bruto_total": 3960,
            "total_cash_payment": 0,
            "total_bca_payment": 0,
            "total_usd_payment": 0,
            "total_paid": 0,
            "total_paid_usd": 0,
            "remaining_payment": 2376,
            "remaining_payment_usd": 2376,
            "is_paid": false
        },
        "remaining_payment": 2376,
        "remaining_payment_usd": 2376,
        "has_warehouse_activity": false,
        "has_refund_transaction": false,
        "expedition_fee_total": 0,
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
        "unit_transaction_billing": null,
        "unit_transaction_items": [
            {
                "id": 1,
                "uuid": "a06919f9-fc5d-415b-b747-8eb083556385",
                "unit_transaction_id": 1,
                "unit_type_id": 1,
                "sparepart_id": null,
                "is_usd_transaction": true,
                "dpp_tax_id": 2,
                "dpp_tax_rate": 111,
                "ppn_tax_id": 1,
                "ppn_tax_rate": 11,
                "qty_total": 3,
                "price": 0,
                "price_discount": 0,
                "price_per_unit_usd": 1300,
                "price_usd": 2340,
                "bbn_price": 0,
                "hpp_per_unit_price": 0,
                "dpp_per_unit_price": 0,
                "ppn_per_unit_price": 0,
                "hpp_total_price": 0,
                "dpp_total_price": 0,
                "ppn_total_price": 0,
                "price_total": 0,
                "price_total_usd": 2376,
                "expedition_fee": 0,
                "other_fee": 0,
                "created_at": "2026-11-06T03:16:37.000000Z",
                "updated_at": "2026-11-06T03:16:37.000000Z",
                "price_usd_discount": 40,
                "total_usd_cost": 60,
                "usd_cost_freight_total": 10,
                "usd_cost_box_packing_total": 10,
                "usd_cost_admin_cost_total": 10,
                "usd_cost_ckd_processing_cost_total": 10,
                "usd_cost_bill_of_lading_switch_cost_total": 10,
                "usd_cost_customs_clearance_cost_total": 10,
                "usd_cost_other_total": 0,
                "unit_transaction_item_details": [],
                "unit_type_sold_details": [],
                "unit_transaction_usd_costs": [
                    {
                        "id": 1,
                        "unit_transaction_item_id": 1,
                        "cost_type": "freight",
                        "amount": 10,
                        "note": "Freight",
                        "created_at": "2026-11-06T03:16:37.000000Z",
                        "updated_at": "2026-11-06T03:16:37.000000Z"
                    },
                    {
                        "id": 2,
                        "unit_transaction_item_id": 1,
                        "cost_type": "box_packing",
                        "amount": 10,
                        "note": "Box Packing",
                        "created_at": "2026-11-06T03:16:37.000000Z",
                        "updated_at": "2026-11-06T03:16:37.000000Z"
                    },
                    {
                        "id": 3,
                        "unit_transaction_item_id": 1,
                        "cost_type": "admin_cost",
                        "amount": 10,
                        "note": "Admin Cost",
                        "created_at": "2026-11-06T03:16:37.000000Z",
                        "updated_at": "2026-11-06T03:16:37.000000Z"
                    },
                    {
                        "id": 4,
                        "unit_transaction_item_id": 1,
                        "cost_type": "ckd_processing_cost",
                        "amount": 10,
                        "note": "CKD Processing Cost",
                        "created_at": "2026-11-06T03:16:37.000000Z",
                        "updated_at": "2026-11-06T03:16:37.000000Z"
                    },
                    {
                        "id": 5,
                        "unit_transaction_item_id": 1,
                        "cost_type": "bill_of_lading_switch_cost",
                        "amount": 10,
                        "note": "Bill of Lading Switch Cost",
                        "created_at": "2026-11-06T03:16:37.000000Z",
                        "updated_at": "2026-11-06T03:16:37.000000Z"
                    },
                    {
                        "id": 6,
                        "unit_transaction_item_id": 1,
                        "cost_type": "customs_clearance_cost",
                        "amount": 10,
                        "note": "Customs Clearance Cost",
                        "created_at": "2026-11-06T03:16:37.000000Z",
                        "updated_at": "2026-11-06T03:16:37.000000Z"
                    }
                ],
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
        "unit_transaction_usd_costs": [
            {
                "id": 1,
                "unit_transaction_item_id": 1,
                "cost_type": "freight",
                "amount": 10,
                "note": "Freight",
                "created_at": "2026-11-06T03:16:37.000000Z",
                "updated_at": "2026-11-06T03:16:37.000000Z",
                "laravel_through_key": 1
            },
            {
                "id": 2,
                "unit_transaction_item_id": 1,
                "cost_type": "box_packing",
                "amount": 10,
                "note": "Box Packing",
                "created_at": "2026-11-06T03:16:37.000000Z",
                "updated_at": "2026-11-06T03:16:37.000000Z",
                "laravel_through_key": 1
            },
            {
                "id": 3,
                "unit_transaction_item_id": 1,
                "cost_type": "admin_cost",
                "amount": 10,
                "note": "Admin Cost",
                "created_at": "2026-11-06T03:16:37.000000Z",
                "updated_at": "2026-11-06T03:16:37.000000Z",
                "laravel_through_key": 1
            },
            {
                "id": 4,
                "unit_transaction_item_id": 1,
                "cost_type": "ckd_processing_cost",
                "amount": 10,
                "note": "CKD Processing Cost",
                "created_at": "2026-11-06T03:16:37.000000Z",
                "updated_at": "2026-11-06T03:16:37.000000Z",
                "laravel_through_key": 1
            },
            {
                "id": 5,
                "unit_transaction_item_id": 1,
                "cost_type": "bill_of_lading_switch_cost",
                "amount": 10,
                "note": "Bill of Lading Switch Cost",
                "created_at": "2026-11-06T03:16:37.000000Z",
                "updated_at": "2026-11-06T03:16:37.000000Z",
                "laravel_through_key": 1
            },
            {
                "id": 6,
                "unit_transaction_item_id": 1,
                "cost_type": "customs_clearance_cost",
                "amount": 10,
                "note": "Customs Clearance Cost",
                "created_at": "2026-11-06T03:16:37.000000Z",
                "updated_at": "2026-11-06T03:16:37.000000Z",
                "laravel_through_key": 1
            }
        ],
        "warehouse_activity": null
    }
}