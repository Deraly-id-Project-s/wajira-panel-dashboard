GET {{url}}/wapi/transaction/unit-transaction/unit-transaction-item/:id

{
    "status": true,
    "message": "Unit Transaction Item retrieved successfully",
    "errors": null,
    "data": {
        "id": 5,
        "uuid": "4fea17ab-dc3c-4df8-8624-80f340849066",
        "unit_transaction_id": 5,
        "unit_type_id": 2,
        "sparepart_id": null,
        "qty_total": 9,
        "price": 0,
        "price_per_unit_usd": 1300,
        "price_usd": 11700,
        "is_usd_transaction": true,
        "bbn_price": 0,
        "hpp_per_unit_price": 0,
        "dpp_per_unit_price": 0,
        "ppn_per_unit_price": 0,
        "hpp_total_price": 0,
        "dpp_total_price": 0,
        "ppn_total_price": 0,
        "expedition_fee": 0,
        "other_fee": 0,
        "dpp_tax_id": 2,
        "dpp_tax_rate": 111,
        "ppn_tax_id": 1,
        "ppn_tax_rate": 11,
        "price_discount": 0,
        "price_usd_discount": 0,
        "created_at": "2026-10-26T07:30:58.000000Z",
        "updated_at": "2026-10-26T07:41:14.000000Z",
        "total_usd_cost": 200,
        "usd_cost_freight_total": 0,
        "usd_cost_box_packing_total": 200,
        "usd_cost_admin_cost_total": 0,
        "usd_cost_ckd_processing_cost_total": 0,
        "usd_cost_bill_of_lading_switch_cost_total": 0,
        "usd_cost_customs_clearance_cost_total": 0,
        "usd_cost_other_total": 0,
        "unit_transaction": {
            "id": 5,
            "uuid": "87ef3c7f-ce8c-4441-a315-3871543b69bb",
            "warehouse_id": 1,
            "person_id": 3,
            "transaction_type": "unit_type",
            "code": "INV-WAJ/20261026-07982",
            "type": "sales",
            "invoice_file": null,
            "is_refunded": false,
            "is_usd_transaction": true,
            "document_template_id": 1,
            "created_at": "2026-10-26T07:30:58.000000Z",
            "updated_at": "2026-10-26T07:30:58.000000Z",
            "has_warehouse_activity": false,
            "has_refund_transaction": false,
            "expedition_fee_total": "0.00"
        },
        "unit_transaction_usd_costs": [
            {
                "id": 5,
                "unit_transaction_item_id": 5,
                "cost_type": "box_packing",
                "amount": 200,
                "note": "Box Packing",
                "created_at": "2026-10-26T07:30:58.000000Z",
                "updated_at": "2026-10-26T07:30:58.000000Z"
            }
        ],
        "unit_transaction_item_details": [],
        "unit_transaction_item_sales": [
            {
                "id": 2,
                "uuid": "0ac0161f-c77c-4e89-b04d-0005f269138f",
                "unit_transaction_item_id": 5,
                "unit_transaction_item_detail_id": 62,
                "created_at": "2026-10-26T07:41:42.000000Z",
                "updated_at": "2026-10-26T07:41:42.000000Z",
                "unit_transaction_item_detail": {
                    "id": 62,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "819670ab-47cf-4c8f-b41e-a5d89eb5cffc",
                    "color": "MERAH",
                    "machine_number": "32N42N34L2",
                    "chassis_number": "234L2342L3",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:05:11.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "source_transaction_before": null
                }
            },
            {
                "id": 3,
                "uuid": "01d80fc9-e32e-4fd3-bdb1-e0d65b547066",
                "unit_transaction_item_id": 5,
                "unit_transaction_item_detail_id": 61,
                "created_at": "2026-10-26T07:41:42.000000Z",
                "updated_at": "2026-10-26T07:41:42.000000Z",
                "unit_transaction_item_detail": {
                    "id": 61,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "53e358a4-7a4f-4bf9-8988-988d7eb56773",
                    "color": "BIRU",
                    "machine_number": "JMA1E1228611",
                    "chassis_number": "MH1JMA113TK230320",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:04:53.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "source_transaction_before": null
                }
            },
            {
                "id": 4,
                "uuid": "7e09fbda-61d5-4217-94c1-308a5877faa1",
                "unit_transaction_item_id": 5,
                "unit_transaction_item_detail_id": 60,
                "created_at": "2026-10-26T07:41:42.000000Z",
                "updated_at": "2026-10-26T07:41:42.000000Z",
                "unit_transaction_item_detail": {
                    "id": 60,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "1b987be7-6689-4273-868d-6c512cb150b9",
                    "color": "BIRU",
                    "machine_number": "JMA1E1228610",
                    "chassis_number": "MH1JMA113TK230319",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:04:53.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "source_transaction_before": null
                }
            },
            {
                "id": 5,
                "uuid": "5d5ca1fd-bec3-4dca-a124-41d07806f267",
                "unit_transaction_item_id": 5,
                "unit_transaction_item_detail_id": 59,
                "created_at": "2026-10-26T07:41:42.000000Z",
                "updated_at": "2026-10-26T07:41:42.000000Z",
                "unit_transaction_item_detail": {
                    "id": 59,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "f2b2a327-723d-4417-9013-e9c159237e0c",
                    "color": "BIRU",
                    "machine_number": "JMA1E1228609",
                    "chassis_number": "MH1JMA113TK230318",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:04:53.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "source_transaction_before": null
                }
            },
            {
                "id": 6,
                "uuid": "0e170eeb-b31f-4ce9-a778-0186e635b375",
                "unit_transaction_item_id": 5,
                "unit_transaction_item_detail_id": 58,
                "created_at": "2026-10-26T07:41:42.000000Z",
                "updated_at": "2026-10-26T07:41:42.000000Z",
                "unit_transaction_item_detail": {
                    "id": 58,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "504e7c32-15be-4cb0-a0f5-de2a19907e7b",
                    "color": "BIRU",
                    "machine_number": "JMA1E1228608",
                    "chassis_number": "MH1JMA113TK230317",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:04:53.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "source_transaction_before": null
                }
            },
            {
                "id": 7,
                "uuid": "9289c873-c3f8-490e-b75f-a719ef5dafee",
                "unit_transaction_item_id": 5,
                "unit_transaction_item_detail_id": 57,
                "created_at": "2026-10-26T07:41:42.000000Z",
                "updated_at": "2026-10-26T07:41:42.000000Z",
                "unit_transaction_item_detail": {
                    "id": 57,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "13b3b2f0-9c4d-4a51-9266-244aa71df523",
                    "color": "BIRU",
                    "machine_number": "JMA1E1228607",
                    "chassis_number": "MH1JMA113TK230316",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:04:53.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "source_transaction_before": null
                }
            },
            {
                "id": 8,
                "uuid": "6d9132f4-c4d6-4546-b5be-d7f7345bdbaa",
                "unit_transaction_item_id": 5,
                "unit_transaction_item_detail_id": 56,
                "created_at": "2026-10-26T07:41:42.000000Z",
                "updated_at": "2026-10-26T07:41:42.000000Z",
                "unit_transaction_item_detail": {
                    "id": 56,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "eabde8fd-8052-4aa5-9403-be5e75ee945e",
                    "color": "BIRU",
                    "machine_number": "JMA1E1228606",
                    "chassis_number": "MH1JMA113TK230315",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:04:53.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "source_transaction_before": null
                }
            },
            {
                "id": 9,
                "uuid": "b6b34538-11a7-403f-8603-d444174bfea9",
                "unit_transaction_item_id": 5,
                "unit_transaction_item_detail_id": 55,
                "created_at": "2026-10-26T07:41:42.000000Z",
                "updated_at": "2026-10-26T07:41:42.000000Z",
                "unit_transaction_item_detail": {
                    "id": 55,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "a3a29bac-720b-455f-850c-1c5c6995d4a9",
                    "color": "BIRU",
                    "machine_number": "JMA1E1228605",
                    "chassis_number": "MH1JMA113TK230314",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:04:53.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "source_transaction_before": null
                }
            },
            {
                "id": 10,
                "uuid": "e52c66af-8ee8-4e14-b176-13d7b64c4a06",
                "unit_transaction_item_id": 5,
                "unit_transaction_item_detail_id": 54,
                "created_at": "2026-10-26T07:41:42.000000Z",
                "updated_at": "2026-10-26T07:41:42.000000Z",
                "unit_transaction_item_detail": {
                    "id": 54,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "17bff9cf-529e-4f24-98dc-35f47bce65de",
                    "color": "BIRU",
                    "machine_number": "JMA1E1228604",
                    "chassis_number": "MH1JMA113TK230313",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:04:53.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "source_transaction_before": null
                }
            }
        ],
        "unit_type": {
            "id": 2,
            "uuid": "16a0d921-b02d-46cc-be8b-a0fabcee3050",
            "code": "VBS02",
            "name": "HONDA BVA",
            "buy_price": 45000000,
            "sell_price": 47000000,
            "buy_price_usd": "4300.00",
            "sell_price_usd": "43500.00"
        }
    }
}

{{url}}/wapi/master-data/unit-type/:unit_type_id?company_id=1&in_stock=true

{
    "status": true,
    "message": "Unit Type retrieved successfully",
    "errors": null,
    "data": {
        "id": 2,
        "uuid": "16a0d921-b02d-46cc-be8b-a0fabcee3050",
        "brand_id": 2,
        "code": "VBS02",
        "name": "HONDA BVA",
        "capacity": 0,
        "image": null,
        "unit_type": "EV",
        "unit_model": null,
        "netto_weight": 120,
        "bruto_weight": 130,
        "created_at": "2026-10-24T04:53:08.000000Z",
        "updated_at": "2026-10-24T04:53:08.000000Z",
        "available_stock": 61,
        "forecasted_stock": 62,
        "unit_item_details": {
            "current_page": 1,
            "data": [
                {
                    "id": 62,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "819670ab-47cf-4c8f-b41e-a5d89eb5cffc",
                    "color": "MERAH",
                    "machine_number": "32N42N34L2",
                    "chassis_number": "234L2342L3",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:05:11.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "warehouse_sub_block": null,
                    "unit_transaction_item_sales": {
                        "id": 2,
                        "unit_transaction_item_id": 5,
                        "unit_transaction_item_detail_id": 62,
                        "unit_transaction_item": {
                            "id": 5,
                            "unit_transaction_id": 5,
                            "unit_transaction": {
                                "id": 5,
                                "code": "INV-WAJ/20261026-07982",
                                "type": "sales",
                                "created_at": "2026-10-26T07:30:58.000000Z",
                                "has_warehouse_activity": false,
                                "has_refund_transaction": false,
                                "expedition_fee_total": "0.00"
                            }
                        }
                    }
                },
                {
                    "id": 61,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "53e358a4-7a4f-4bf9-8988-988d7eb56773",
                    "color": "BIRU",
                    "machine_number": "JMA1E1228611",
                    "chassis_number": "MH1JMA113TK230320",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:04:53.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "warehouse_sub_block": null,
                    "unit_transaction_item_sales": {
                        "id": 3,
                        "unit_transaction_item_id": 5,
                        "unit_transaction_item_detail_id": 61,
                        "unit_transaction_item": {
                            "id": 5,
                            "unit_transaction_id": 5,
                            "unit_transaction": {
                                "id": 5,
                                "code": "INV-WAJ/20261026-07982",
                                "type": "sales",
                                "created_at": "2026-10-26T07:30:58.000000Z",
                                "has_warehouse_activity": false,
                                "has_refund_transaction": false,
                                "expedition_fee_total": "0.00"
                            }
                        }
                    }
                },
                {
                    "id": 60,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "1b987be7-6689-4273-868d-6c512cb150b9",
                    "color": "BIRU",
                    "machine_number": "JMA1E1228610",
                    "chassis_number": "MH1JMA113TK230319",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:04:53.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "warehouse_sub_block": null,
                    "unit_transaction_item_sales": {
                        "id": 4,
                        "unit_transaction_item_id": 5,
                        "unit_transaction_item_detail_id": 60,
                        "unit_transaction_item": {
                            "id": 5,
                            "unit_transaction_id": 5,
                            "unit_transaction": {
                                "id": 5,
                                "code": "INV-WAJ/20261026-07982",
                                "type": "sales",
                                "created_at": "2026-10-26T07:30:58.000000Z",
                                "has_warehouse_activity": false,
                                "has_refund_transaction": false,
                                "expedition_fee_total": "0.00"
                            }
                        }
                    }
                },
                {
                    "id": 59,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "f2b2a327-723d-4417-9013-e9c159237e0c",
                    "color": "BIRU",
                    "machine_number": "JMA1E1228609",
                    "chassis_number": "MH1JMA113TK230318",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:04:53.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "warehouse_sub_block": null,
                    "unit_transaction_item_sales": {
                        "id": 5,
                        "unit_transaction_item_id": 5,
                        "unit_transaction_item_detail_id": 59,
                        "unit_transaction_item": {
                            "id": 5,
                            "unit_transaction_id": 5,
                            "unit_transaction": {
                                "id": 5,
                                "code": "INV-WAJ/20261026-07982",
                                "type": "sales",
                                "created_at": "2026-10-26T07:30:58.000000Z",
                                "has_warehouse_activity": false,
                                "has_refund_transaction": false,
                                "expedition_fee_total": "0.00"
                            }
                        }
                    }
                },
                {
                    "id": 58,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "504e7c32-15be-4cb0-a0f5-de2a19907e7b",
                    "color": "BIRU",
                    "machine_number": "JMA1E1228608",
                    "chassis_number": "MH1JMA113TK230317",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:04:53.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "warehouse_sub_block": null,
                    "unit_transaction_item_sales": {
                        "id": 6,
                        "unit_transaction_item_id": 5,
                        "unit_transaction_item_detail_id": 58,
                        "unit_transaction_item": {
                            "id": 5,
                            "unit_transaction_id": 5,
                            "unit_transaction": {
                                "id": 5,
                                "code": "INV-WAJ/20261026-07982",
                                "type": "sales",
                                "created_at": "2026-10-26T07:30:58.000000Z",
                                "has_warehouse_activity": false,
                                "has_refund_transaction": false,
                                "expedition_fee_total": "0.00"
                            }
                        }
                    }
                },
                {
                    "id": 57,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "13b3b2f0-9c4d-4a51-9266-244aa71df523",
                    "color": "BIRU",
                    "machine_number": "JMA1E1228607",
                    "chassis_number": "MH1JMA113TK230316",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:04:53.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "warehouse_sub_block": null,
                    "unit_transaction_item_sales": {
                        "id": 7,
                        "unit_transaction_item_id": 5,
                        "unit_transaction_item_detail_id": 57,
                        "unit_transaction_item": {
                            "id": 5,
                            "unit_transaction_id": 5,
                            "unit_transaction": {
                                "id": 5,
                                "code": "INV-WAJ/20261026-07982",
                                "type": "sales",
                                "created_at": "2026-10-26T07:30:58.000000Z",
                                "has_warehouse_activity": false,
                                "has_refund_transaction": false,
                                "expedition_fee_total": "0.00"
                            }
                        }
                    }
                },
                {
                    "id": 56,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "eabde8fd-8052-4aa5-9403-be5e75ee945e",
                    "color": "BIRU",
                    "machine_number": "JMA1E1228606",
                    "chassis_number": "MH1JMA113TK230315",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:04:53.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "warehouse_sub_block": null,
                    "unit_transaction_item_sales": {
                        "id": 8,
                        "unit_transaction_item_id": 5,
                        "unit_transaction_item_detail_id": 56,
                        "unit_transaction_item": {
                            "id": 5,
                            "unit_transaction_id": 5,
                            "unit_transaction": {
                                "id": 5,
                                "code": "INV-WAJ/20261026-07982",
                                "type": "sales",
                                "created_at": "2026-10-26T07:30:58.000000Z",
                                "has_warehouse_activity": false,
                                "has_refund_transaction": false,
                                "expedition_fee_total": "0.00"
                            }
                        }
                    }
                },
                {
                    "id": 55,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "a3a29bac-720b-455f-850c-1c5c6995d4a9",
                    "color": "BIRU",
                    "machine_number": "JMA1E1228605",
                    "chassis_number": "MH1JMA113TK230314",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:04:53.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "warehouse_sub_block": null,
                    "unit_transaction_item_sales": {
                        "id": 9,
                        "unit_transaction_item_id": 5,
                        "unit_transaction_item_detail_id": 55,
                        "unit_transaction_item": {
                            "id": 5,
                            "unit_transaction_id": 5,
                            "unit_transaction": {
                                "id": 5,
                                "code": "INV-WAJ/20261026-07982",
                                "type": "sales",
                                "created_at": "2026-10-26T07:30:58.000000Z",
                                "has_warehouse_activity": false,
                                "has_refund_transaction": false,
                                "expedition_fee_total": "0.00"
                            }
                        }
                    }
                },
                {
                    "id": 54,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "17bff9cf-529e-4f24-98dc-35f47bce65de",
                    "color": "BIRU",
                    "machine_number": "JMA1E1228604",
                    "chassis_number": "MH1JMA113TK230313",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": true,
                    "created_at": "2026-10-26T07:04:53.000000Z",
                    "updated_at": "2026-10-26T07:41:42.000000Z",
                    "warehouse_sub_block": null,
                    "unit_transaction_item_sales": {
                        "id": 10,
                        "unit_transaction_item_id": 5,
                        "unit_transaction_item_detail_id": 54,
                        "unit_transaction_item": {
                            "id": 5,
                            "unit_transaction_id": 5,
                            "unit_transaction": {
                                "id": 5,
                                "code": "INV-WAJ/20261026-07982",
                                "type": "sales",
                                "created_at": "2026-10-26T07:30:58.000000Z",
                                "has_warehouse_activity": false,
                                "has_refund_transaction": false,
                                "expedition_fee_total": "0.00"
                            }
                        }
                    }
                },
                {
                    "id": 53,
                    "unit_transaction_item_id": 4,
                    "warehouse_sub_block_id": null,
                    "source_transaction_before_id": null,
                    "uuid": "abc9b613-7b45-49ca-9022-43541a30d389",
                    "color": "BIRU",
                    "machine_number": "JMA1E1228603",
                    "chassis_number": "MH1JMA113TK230312",
                    "in_stock": true,
                    "is_forecast": false,
                    "status": "normal",
                    "stock_state": "receipt",
                    "is_sold_unit": false,
                    "is_reserved": false,
                    "created_at": "2026-10-26T07:04:53.000000Z",
                    "updated_at": "2026-10-26T07:29:23.000000Z",
                    "warehouse_sub_block": null,
                    "unit_transaction_item_sales": null
                }
            ],
            "first_page_url": "http://localhost:8000/wapi/master-data/unit-type/2?page=1",
            "from": 1,
            "last_page": 7,
            "last_page_url": "http://localhost:8000/wapi/master-data/unit-type/2?page=7",
            "links": [
                {
                    "url": null,
                    "label": "&laquo; Previous",
                    "active": false
                },
                {
                    "url": "http://localhost:8000/wapi/master-data/unit-type/2?page=1",
                    "label": "1",
                    "active": true
                },
                {
                    "url": "http://localhost:8000/wapi/master-data/unit-type/2?page=2",
                    "label": "2",
                    "active": false
                },
                {
                    "url": "http://localhost:8000/wapi/master-data/unit-type/2?page=3",
                    "label": "3",
                    "active": false
                },
                {
                    "url": "http://localhost:8000/wapi/master-data/unit-type/2?page=4",
                    "label": "4",
                    "active": false
                },
                {
                    "url": "http://localhost:8000/wapi/master-data/unit-type/2?page=5",
                    "label": "5",
                    "active": false
                },
                {
                    "url": "http://localhost:8000/wapi/master-data/unit-type/2?page=6",
                    "label": "6",
                    "active": false
                },
                {
                    "url": "http://localhost:8000/wapi/master-data/unit-type/2?page=7",
                    "label": "7",
                    "active": false
                },
                {
                    "url": "http://localhost:8000/wapi/master-data/unit-type/2?page=2",
                    "label": "Next &raquo;",
                    "active": false
                }
            ],
            "next_page_url": "http://localhost:8000/wapi/master-data/unit-type/2?page=2",
            "path": "http://localhost:8000/wapi/master-data/unit-type/2",
            "per_page": 10,
            "prev_page_url": null,
            "to": 10,
            "total": 61
        },
        "buy_price": 45000000,
        "sell_price": 47000000,
        "buy_price_usd": "4300.00",
        "sell_price_usd": "43500.00",
        "brand": {
            "id": 2,
            "uuid": "8317f666-c168-495c-8fbe-9ce5f81d9204",
            "name": "Honda",
            "image": null,
            "created_at": "2026-10-20T04:21:57.000000Z",
            "updated_at": "2026-10-20T04:21:57.000000Z"
        },
        "unit_type_price_versions": [
            {
                "id": 1,
                "uuid": "049402a5-e37f-4779-ace1-cadeaf1eaf0d",
                "unit_type_id": 2,
                "name": "Initial Price",
                "buy_price": 45000000,
                "buy_price_usd": "4300.00",
                "sell_price": 47000000,
                "sell_price_usd": "43500.00",
                "effective_from": "2026-10-24",
                "effective_until": null,
                "is_default": true,
                "is_lock": false,
                "created_at": "2026-10-24T04:53:08.000000Z",
                "updated_at": "2026-10-24T04:53:08.000000Z"
            }
        ]
    }
}

DELETE {{url}}/wapi/transaction/unit-transaction/unit-transaction-item-sales/bulk-delete
request body: 
unit_transaction_item_sales_id:[2,3,4]

POST {{url}}/wapi/transaction/unit-transaction/unit-transaction-item-sales
request body:
unit_transaction_item_id:2
unit_transaction_details:[1,2,3]