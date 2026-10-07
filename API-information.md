GET {{url}}/wapi/transaction/unit-transaction/unit-transaction/:unit_transaction_id
{
    "status": true,
    "message": "Unit Transaction retrieved successfully",
    "errors": null,
    "data": {
        "id": 1,
        "uuid": "7756d315-9f75-46f6-bc6d-1e3db8165301",
        "warehouse_id": 1,
        "person_id": 3,
        "document_template_id": 1,
        "code": "PBL-WJM/20261007-0001",
        "type": "purchase",
        "invoice_file": null,
        "is_refunded": false,
        "created_at": "2026-10-07T14:22:17.000000Z",
        "total_dpp": 107045045,
        "transaction_dpp_total": 107045045,
        "total_ppn": 11774955,
        "transaction_ppn_total": 11774955,
        "total_hpp": 118820000,
        "transaction_hpp_total": 118820000,
        "total_bbn": 50000,
        "total_bbn_fee": 50000,
        "transaction_bbn_total": 50000,
        "total_expedition_fee": 304000,
        "transaction_expedition_total": 304000,
        "total_other_fee": 10000,
        "transaction_other_fee": 10000,
        "total_operational_fee": 364000,
        "total_purchase": 120000000,
        "total_usd_cost": 941,
        "transaction_usd_cost_total": 941,
        "usd_cost_freight_total": 500,
        "usd_cost_box_packing_total": 0,
        "usd_cost_admin_cost_total": 0,
        "usd_cost_ckd_processing_cost_total": 0,
        "usd_cost_bill_of_lading_switch_cost_total": 0,
        "usd_cost_customs_clearance_cost_total": 200,
        "usd_cost_other_total": 241,
        "unit_transaction_bruto_total": 118880000,
        "unit_transaction_bruto_total_actual": 0,
        "unit_transaction_bruto_refund": 0,
        "unit_transaction_bruto_return": 0,
        "unit_transaction_price_usd_total": 487,
        "unit_transaction_price_usd_total_actual": 0,
        "is_unit_type_detail_valid": false,
        "billing_summary": null,
        "has_warehouse_activity": false,
        "has_refund_transaction": false,
        "expedition_fee_total": 304000,
        "warehouse": {
            "id": 1,
            "uuid": "4e783bef-baa6-45b7-9d7c-8b2c4a7265fc",
            "name": "PT Wajira Morindo Warehouse",
            "capacity": 10000
        },
        "person": {
            "id": 3,
            "uuid": "768f4347-9be9-405a-a31f-a6f72ebf1c51",
            "code": "SPL-M/0001",
            "type": "supplier",
            "name": "PT Integral Solusi Sparepart",
            "company_list": "",
            "company": null
        },
        "transaction_flow": null,
        "unit_transaction_billing": null,
        "unit_transaction_items": [
            {
                "id": 1,
                "uuid": "bdfb3e0d-fb33-4a19-bf52-6f5c006bc0ca",
                "unit_transaction_id": 1,
                "unit_type_id": 1,
                "sparepart_id": null,
                "is_usd_transaction": true,
                "dpp_tax_id": 2,
                "dpp_tax_rate": 111,
                "ppn_tax_id": 1,
                "ppn_tax_rate": 11,
                "qty_total": 5,
                "price": 12000000,
                "price_discount": "5.00",
                "price_per_unit_usd": 40,
                "price_usd": 237.5,
                "bbn_price": 25000,
                "hpp_per_unit_price": 11582000,
                "dpp_per_unit_price": 10434234,
                "ppn_per_unit_price": 1147766,
                "hpp_total_price": 57910000,
                "dpp_total_price": 52171170,
                "ppn_total_price": 5738830,
                "price_total": 57910000,
                "price_total_usd": 707.5,
                "expedition_fee": 152000,
                "other_fee": 5000,
                "created_at": "2026-10-07T14:22:17.000000Z",
                "updated_at": "2026-10-07T14:22:17.000000Z",
                "price_usd_discount": "5.00",
                "total_usd_cost": 470.5,
                "usd_cost_freight_total": 250,
                "usd_cost_box_packing_total": 0,
                "usd_cost_admin_cost_total": 0,
                "usd_cost_ckd_processing_cost_total": 0,
                "usd_cost_bill_of_lading_switch_cost_total": 0,
                "usd_cost_customs_clearance_cost_total": 100,
                "usd_cost_other_total": 120.5,
                "unit_transaction_item_details": [],
                "unit_type_sold_details": [],
                "unit_transaction_usd_costs": [
                    {
                        "id": 1,
                        "unit_transaction_item_id": 1,
                        "cost_type": "freight",
                        "amount": 250,
                        "note": "Biaya kontainer pengiriman laut",
                        "created_at": "2026-10-07T14:22:17.000000Z",
                        "updated_at": "2026-10-07T14:22:17.000000Z"
                    },
                    {
                        "id": 2,
                        "unit_transaction_item_id": 1,
                        "cost_type": "customs_clearance_cost",
                        "amount": 100,
                        "note": "Biaya bea cukai pelabuhan",
                        "created_at": "2026-10-07T14:22:17.000000Z",
                        "updated_at": "2026-10-07T14:22:17.000000Z"
                    },
                    {
                        "id": 3,
                        "unit_transaction_item_id": 1,
                        "cost_type": "other",
                        "amount": 45,
                        "note": "Biaya materai dokumen USD",
                        "created_at": "2026-10-07T14:22:17.000000Z",
                        "updated_at": "2026-10-07T14:22:17.000000Z"
                    },
                    {
                        "id": 4,
                        "unit_transaction_item_id": 1,
                        "cost_type": "other",
                        "amount": 75.5,
                        "note": "Handling tambahan",
                        "created_at": "2026-10-07T14:22:17.000000Z",
                        "updated_at": "2026-10-07T14:22:17.000000Z"
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
                                "created_at": "2026-10-07T14:20:33.000000Z",
                                "updated_at": "2026-10-07T14:20:33.000000Z"
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
                                "created_at": "2026-10-07T14:20:33.000000Z",
                                "updated_at": "2026-10-07T14:20:33.000000Z"
                            }
                        ]
                    }
                }
            },
            {
                "id": 2,
                "uuid": "4cc57e82-a07d-4c3e-82fa-9741286654e8",
                "unit_transaction_id": 1,
                "unit_type_id": 2,
                "sparepart_id": null,
                "is_usd_transaction": true,
                "dpp_tax_id": 2,
                "dpp_tax_rate": 111,
                "ppn_tax_id": 1,
                "ppn_tax_rate": 11,
                "qty_total": 5,
                "price": 12000000,
                "price_discount": "0.00",
                "price_per_unit_usd": 40,
                "price_usd": 250,
                "bbn_price": 25000,
                "hpp_per_unit_price": 12182000,
                "dpp_per_unit_price": 10974775,
                "ppn_per_unit_price": 1207225,
                "hpp_total_price": 60910000,
                "dpp_total_price": 54873875,
                "ppn_total_price": 6036125,
                "price_total": 60910000,
                "price_total_usd": 720,
                "expedition_fee": 152000,
                "other_fee": 5000,
                "created_at": "2026-10-07T14:31:23.000000Z",
                "updated_at": "2026-10-07T14:31:23.000000Z",
                "price_usd_discount": "0.00",
                "total_usd_cost": 470.5,
                "usd_cost_freight_total": 250,
                "usd_cost_box_packing_total": 0,
                "usd_cost_admin_cost_total": 0,
                "usd_cost_ckd_processing_cost_total": 0,
                "usd_cost_bill_of_lading_switch_cost_total": 0,
                "usd_cost_customs_clearance_cost_total": 100,
                "usd_cost_other_total": 120.5,
                "unit_transaction_item_details": [],
                "unit_type_sold_details": [],
                "unit_transaction_usd_costs": [
                    {
                        "id": 5,
                        "unit_transaction_item_id": 2,
                        "cost_type": "freight",
                        "amount": 250,
                        "note": "Biaya kontainer pengiriman laut",
                        "created_at": "2026-10-07T14:31:23.000000Z",
                        "updated_at": "2026-10-07T14:31:23.000000Z"
                    },
                    {
                        "id": 6,
                        "unit_transaction_item_id": 2,
                        "cost_type": "customs_clearance_cost",
                        "amount": 100,
                        "note": "Biaya bea cukai pelabuhan",
                        "created_at": "2026-10-07T14:31:23.000000Z",
                        "updated_at": "2026-10-07T14:31:23.000000Z"
                    },
                    {
                        "id": 7,
                        "unit_transaction_item_id": 2,
                        "cost_type": "other",
                        "amount": 45,
                        "note": "Biaya materai dokumen USD",
                        "created_at": "2026-10-07T14:31:23.000000Z",
                        "updated_at": "2026-10-07T14:31:23.000000Z"
                    },
                    {
                        "id": 8,
                        "unit_transaction_item_id": 2,
                        "cost_type": "other",
                        "amount": 75.5,
                        "note": "Handling tambahan",
                        "created_at": "2026-10-07T14:31:23.000000Z",
                        "updated_at": "2026-10-07T14:31:23.000000Z"
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
                                "created_at": "2026-10-07T14:20:33.000000Z",
                                "updated_at": "2026-10-07T14:20:33.000000Z"
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
                                "created_at": "2026-10-07T14:20:33.000000Z",
                                "updated_at": "2026-10-07T14:20:33.000000Z"
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
                "amount": 250,
                "note": "Biaya kontainer pengiriman laut",
                "created_at": "2026-10-07T14:22:17.000000Z",
                "updated_at": "2026-10-07T14:22:17.000000Z",
                "laravel_through_key": 1
            },
            {
                "id": 2,
                "unit_transaction_item_id": 1,
                "cost_type": "customs_clearance_cost",
                "amount": 100,
                "note": "Biaya bea cukai pelabuhan",
                "created_at": "2026-10-07T14:22:17.000000Z",
                "updated_at": "2026-10-07T14:22:17.000000Z",
                "laravel_through_key": 1
            },
            {
                "id": 3,
                "unit_transaction_item_id": 1,
                "cost_type": "other",
                "amount": 45,
                "note": "Biaya materai dokumen USD",
                "created_at": "2026-10-07T14:22:17.000000Z",
                "updated_at": "2026-10-07T14:22:17.000000Z",
                "laravel_through_key": 1
            },
            {
                "id": 4,
                "unit_transaction_item_id": 1,
                "cost_type": "other",
                "amount": 75.5,
                "note": "Handling tambahan",
                "created_at": "2026-10-07T14:22:17.000000Z",
                "updated_at": "2026-10-07T14:22:17.000000Z",
                "laravel_through_key": 1
            },
            {
                "id": 5,
                "unit_transaction_item_id": 2,
                "cost_type": "freight",
                "amount": 250,
                "note": "Biaya kontainer pengiriman laut",
                "created_at": "2026-10-07T14:31:23.000000Z",
                "updated_at": "2026-10-07T14:31:23.000000Z",
                "laravel_through_key": 1
            },
            {
                "id": 6,
                "unit_transaction_item_id": 2,
                "cost_type": "customs_clearance_cost",
                "amount": 100,
                "note": "Biaya bea cukai pelabuhan",
                "created_at": "2026-10-07T14:31:23.000000Z",
                "updated_at": "2026-10-07T14:31:23.000000Z",
                "laravel_through_key": 1
            },
            {
                "id": 7,
                "unit_transaction_item_id": 2,
                "cost_type": "other",
                "amount": 45,
                "note": "Biaya materai dokumen USD",
                "created_at": "2026-10-07T14:31:23.000000Z",
                "updated_at": "2026-10-07T14:31:23.000000Z",
                "laravel_through_key": 1
            },
            {
                "id": 8,
                "unit_transaction_item_id": 2,
                "cost_type": "other",
                "amount": 75.5,
                "note": "Handling tambahan",
                "created_at": "2026-10-07T14:31:23.000000Z",
                "updated_at": "2026-10-07T14:31:23.000000Z",
                "laravel_through_key": 1
            }
        ],
        "warehouse_activity": null
    }
}