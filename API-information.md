1. unit transaction refund
POST {{url}}/wapi/transaction/unit-transaction/unit-transaction-refund
REQUEST:
unit_transaction_id:1
refund_date:2026-05-22
refund_amount:54000
note:refund karena terdapat kecacatan
unit_transaction_item_detail_ids:[1,2,3]

FAILURE:
{
    "status": false,
    "message": "The given data was invalid.",
    "errors": {
        "unit_transaction_item_detail_ids": [
            "One or more of the selected item details have already been refunded."
        ]
    },
    "data": null
}

SUCCESS:
{
    "status": true,
    "message": "Unit transaction refund created successfully",
    "errors": null,
    "data": {
        "unit_transaction_id": "1",
        "code": "RFDWJM202605210001",
        "refund_date": "2026-05-21T17:00:00.000000Z",
        "refund_amount": "54000.00",
        "note": "refund karena terdapat kecacatan",
        "uuid": "a9923b45-70f9-414b-ac5b-909ca0e32c27",
        "updated_at": "2026-05-21T12:47:38.000000Z",
        "created_at": "2026-05-21T12:47:38.000000Z",
        "id": 1,
        "unit_transaction": {
            "id": 1,
            "uuid": "cc7893ab-9a9a-4a15-8808-af98d04c7b4a",
            "warehouse_id": 1,
            "person_id": 1,
            "code": "PBL-WJM/20260521-0001",
            "type": "purchase",
            "max_capacity": "10.00",
            "stock_state": "inbound_incoming_goods",
            "invoice_file": null,
            "is_refunded": false,
            "created_at": "2026-05-21T12:35:10.000000Z",
            "updated_at": "2026-05-21T12:38:02.000000Z"
        },
        "unit_transaction_item_details": [
            {
                "id": 1,
                "unit_transaction_item_id": 1,
                "uuid": "553564c9-4de5-4c80-af2a-2a975ff8dea4",
                "color": "HITAM",
                "machine_number": "KR32487342801",
                "chassis_number": "KTR3283242901",
                "in_stock": true,
                "is_forecast": false,
                "status": "normal",
                "created_at": "2026-05-21T12:35:51.000000Z",
                "updated_at": "2026-05-21T12:39:12.000000Z",
                "pivot": {
                    "unit_transaction_refund_id": 1,
                    "unit_transaction_item_detail_id": 1
                }
            },
            {
                "id": 2,
                "unit_transaction_item_id": 1,
                "uuid": "7de5a40c-6e4f-43d6-8084-e977e9472d1a",
                "color": "HITAM",
                "machine_number": "KR32487342802",
                "chassis_number": "KTR3283242902",
                "in_stock": true,
                "is_forecast": false,
                "status": "normal",
                "created_at": "2026-05-21T12:35:54.000000Z",
                "updated_at": "2026-05-21T12:39:12.000000Z",
                "pivot": {
                    "unit_transaction_refund_id": 1,
                    "unit_transaction_item_detail_id": 2
                }
            },
            {
                "id": 3,
                "unit_transaction_item_id": 1,
                "uuid": "3aa95b1b-d39f-4ce0-ac09-b1d6a8913298",
                "color": "HITAM",
                "machine_number": "KR32487342803",
                "chassis_number": "KTR3283242903",
                "in_stock": true,
                "is_forecast": false,
                "status": "normal",
                "created_at": "2026-05-21T12:35:56.000000Z",
                "updated_at": "2026-05-21T12:39:12.000000Z",
                "pivot": {
                    "unit_transaction_refund_id": 1,
                    "unit_transaction_item_detail_id": 3
                }
            }
        ]
    }
}

2. add payment
POST {{url}}/wapi/transaction/unit-transaction/unit-transaction-refund-payment
REQUEST:
unit_transaction_refund_id:1
cash_id:2
amount:32000
payment_date:2026-05-22
note:DP-2

FAILURE:
{
    "status": false,
    "message": "The given data was invalid.",
    "errors": {
        "amount": [
            "This refund has already been fully paid."
        ]
    },
    "data": null
}

SUCCESS:
{
  "status": true,
  "message": "Unit transaction refund payment created successfully",
  "errors": null,
  "data": {
    "unit_transaction_refund_id": 1,
    "code": "PAY-REF-20261103-0002",
    "amount": 22000,
    "payment_date": "2026-05-21T17:00:00.000000Z",
    "note": "DP-2",
    "uuid": "0a410df7-98a1-426b-8538-cfc77283aca3",
    "updated_at": "2026-11-03T13:31:03.000000Z",
    "created_at": "2026-11-03T13:31:03.000000Z",
    "id": 2,
    "payment_remaining": 0,
    "unit_transaction_refund": {
      "id": 1,
      "uuid": "4895c65b-cdcc-4ed0-8fcc-ab57d1669839",
      "unit_transaction_id": 1,
      "code": "RFB-WJM/20261103-0001",
      "is_paid": false,
      "is_usd_transaction": true,
      "refund_date": "2026-05-21T17:00:00.000000Z",
      "refund_amount": 54000,
      "note": "refund karena terdapat kecacatan",
      "created_at": "2026-11-03T13:18:10.000000Z",
      "updated_at": "2026-11-03T13:18:10.000000Z",
      "remaining_payment": 0,
      "unit_transaction_refund_payments": [
        {
          "id": 1,
          "uuid": "b04d4b09-fc33-4e7f-8be1-bcf727532b83",
          "unit_transaction_refund_id": 1,
          "code": "PAY-REF-20261103-0001",
          "amount": 32000,
          "payment_date": "2026-05-21T17:00:00.000000Z",
          "note": null,
          "created_at": "2026-11-03T13:24:29.000000Z",
          "updated_at": "2026-11-03T13:24:29.000000Z"
        },
        {
          "id": 2,
          "uuid": "0a410df7-98a1-426b-8538-cfc77283aca3",
          "unit_transaction_refund_id": 1,
          "code": "PAY-REF-20261103-0002",
          "amount": 22000,
          "payment_date": "2026-05-21T17:00:00.000000Z",
          "note": "DP-2",
          "created_at": "2026-11-03T13:31:03.000000Z",
          "updated_at": "2026-11-03T13:31:03.000000Z"
        }
      ]
    }
  }
}

3.Update paid status
PUT {{url}}/wapi/transaction/unit-transaction/unit-transaction-refund/:unit_transaction_refund_id/paid-status
REQUEST:
is_paid:true
note:test

SUCCESS:
{
  "status": true,
  "message": "Unit transaction refund paid status updated successfully",
  "errors": null,
  "data": {
    "id": 1,
    "uuid": "4895c65b-cdcc-4ed0-8fcc-ab57d1669839",
    "unit_transaction_id": 1,
    "code": "RFB-WJM/20261103-0001",
    "is_paid": true,
    "is_usd_transaction": true,
    "refund_date": "2026-05-21T17:00:00.000000Z",
    "refund_amount": 54000,
    "note": "refund karena terdapat kecacatan",
    "created_at": "2026-11-03T13:18:10.000000Z",
    "updated_at": "2026-11-03T13:36:10.000000Z",
    "remaining_payment": 0,
    "unit_transaction_refund_payments": [
      {
        "id": 1,
        "uuid": "b04d4b09-fc33-4e7f-8be1-bcf727532b83",
        "unit_transaction_refund_id": 1,
        "code": "PAY-REF-20261103-0001",
        "amount": 32000,
        "payment_date": "2026-05-21T17:00:00.000000Z",
        "note": null,
        "created_at": "2026-11-03T13:24:29.000000Z",
        "updated_at": "2026-11-03T13:24:29.000000Z"
      },
      {
        "id": 2,
        "uuid": "0a410df7-98a1-426b-8538-cfc77283aca3",
        "unit_transaction_refund_id": 1,
        "code": "PAY-REF-20261103-0002",
        "amount": 22000,
        "payment_date": "2026-05-21T17:00:00.000000Z",
        "note": "DP-2",
        "created_at": "2026-11-03T13:31:03.000000Z",
        "updated_at": "2026-11-03T13:31:03.000000Z"
      }
    ]
  }
}

POST {{url}}/wapi/finance/finance-billing
REQUEST:
finance_refund_id:4
cash_id:1
account_id:1
amount:14000
payment_at:2026-10-10
note:pembayaran termin 1 cash

SUCCESS:
{
  "status": true,
  "message": "Finance Billing created successfully",
  "errors": null,
  "data": {
    "finance_refund_id": 4,
    "cash_id": 1,
    "account_id": 1,
    "amount": 14000,
    "payment_at": "2026-10-09T17:00:00.000000Z",
    "note": "pembayaran termin 1 cash",
    "is_usd_payment": false,
    "amount_original": 14000,
    "type": "debet",
    "cash_flow_id": null,
    "cash_position_before": 0,
    "uuid": "9b27310e-f9f9-40de-bf86-ec5f8ad81666",
    "updated_at": "2026-11-05T04:01:57.000000Z",
    "created_at": "2026-11-05T04:01:57.000000Z",
    "id": 6,
    "finance_refund": {
      "id": 4,
      "uuid": "c68871bc-fc74-4159-800e-89c0215f0711",
      "code": "PBL-WAJ/20261105-48531-refund",
      "company_id": 1,
      "unit_transaction_refund_id": 1,
      "goods_transaction_refund_id": null,
      "transaction_of": "unit_type",
      "date": "2026-05-21T17:00:00.000000Z",
      "note": "test",
      "is_paid": false,
      "is_valid": false,
      "created_at": "2026-11-05T03:18:17.000000Z",
      "updated_at": "2026-11-05T04:01:24.000000Z",
      "remaining_payment": 0,
      "cash_position": {
        "debet_idr_total": 54000,
        "credit_idr_total": 0,
        "debet_usd_total": 0,
        "credit_usd_total": 0
      },
      "last_payment_at": "2026-10-10"
    },
    "remaining_payment": 0,
    "remaining_payment_usd": 0,
    "dual_remaining_payment": 0,
    "dual_remaining_payment_usd": 0,
    "usd_payment_set": false
  }
}

PUT {{url}}/wapi/finance/finance-refund/{finance_refund_id}/paid-status
REQUEST:
is_paid:true

SUCCESS:
{
  "status": true,
  "message": "Finance Refund paid status updated successfully",
  "errors": null,
  "data": {
    "id": 4,
    "uuid": "c68871bc-fc74-4159-800e-89c0215f0711",
    "code": "PBL-WAJ/20261105-48531-refund",
    "company_id": 1,
    "unit_transaction_refund_id": 1,
    "goods_transaction_refund_id": null,
    "transaction_of": "unit_type",
    "date": "2026-05-21T17:00:00.000000Z",
    "note": "test",
    "is_paid": true,
    "is_valid": true,
    "created_at": "2026-11-05T03:18:17.000000Z",
    "updated_at": "2026-11-05T04:11:50.000000Z",
    "remaining_payment": 0,
    "cash_position": {
      "debet_idr_total": 54000,
      "credit_idr_total": 0,
      "debet_usd_total": 0,
      "credit_usd_total": 0
    },
    "last_payment_at": "2026-10-10",
    "company": {
      "id": 1,
      "uuid": "4150dcf1-6981-481f-93c3-f24a86d6f115",
      "name": "PT Wajira Morindo"
    },
    "finance_refund_cashes": [
      {
        "id": 7,
        "finance_refund_id": 4,
        "cash_id": 2,
        "amount": 32000,
        "amount_original": 32000,
        "type": "debet",
        "created_at": "2026-11-05T03:18:17.000000Z",
        "updated_at": "2026-11-05T03:18:17.000000Z",
        "cash": {
          "id": 2,
          "uuid": "153081b4-1432-4823-a71b-456485e20ac5",
          "company_id": 1,
          "currency_type": "idr",
          "cash_name": "BCA IDR",
          "type": "bank",
          "code": "bca_idr"
        }
      },
      {
        "id": 8,
        "finance_refund_id": 4,
        "cash_id": 1,
        "amount": 22000,
        "amount_original": 22000,
        "type": "debet",
        "created_at": "2026-11-05T03:18:17.000000Z",
        "updated_at": "2026-11-05T03:18:17.000000Z",
        "cash": {
          "id": 1,
          "uuid": "5324e89d-c953-4345-a751-b61aa034f3ab",
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
        "id": 4,
        "uuid": "cfd1a48e-69ee-4ecd-a135-012982fbfbde",
        "cash_flow_id": null,
        "finance_refund_id": 4,
        "cash_id": 2,
        "account_id": 1,
        "type": "debet",
        "amount": 40000,
        "amount_original": 40000,
        "payment_proof": null,
        "payment_at": "2026-10-09T17:00:00.000000Z",
        "note": "pembayaran termin 1 cash",
        "is_usd_payment": false,
        "cash_position_before": 0,
        "cash_position_after": null,
        "created_at": "2026-11-05T04:00:28.000000Z",
        "updated_at": "2026-11-05T04:00:28.000000Z",
        "cash": {
          "id": 2,
          "uuid": "153081b4-1432-4823-a71b-456485e20ac5",
          "company_id": 1,
          "code": "bca_idr",
          "cash_name": "BCA IDR",
          "currency_type": "idr"
        },
        "account": {
          "id": 1,
          "type": "debet"
        }
      },
      {
        "id": 6,
        "uuid": "9b27310e-f9f9-40de-bf86-ec5f8ad81666",
        "cash_flow_id": null,
        "finance_refund_id": 4,
        "cash_id": 1,
        "account_id": 1,
        "type": "debet",
        "amount": 14000,
        "amount_original": 14000,
        "payment_proof": null,
        "payment_at": "2026-10-09T17:00:00.000000Z",
        "note": "pembayaran termin 1 cash",
        "is_usd_payment": false,
        "cash_position_before": 0,
        "cash_position_after": null,
        "created_at": "2026-11-05T04:01:57.000000Z",
        "updated_at": "2026-11-05T04:01:57.000000Z",
        "cash": {
          "id": 1,
          "uuid": "5324e89d-c953-4345-a751-b61aa034f3ab",
          "company_id": 1,
          "code": "cash_idr",
          "cash_name": "Cash IDR",
          "currency_type": "idr"
        },
        "account": {
          "id": 1,
          "type": "debet"
        }
      }
    ],
    "unit_transaction_refund": {
      "id": 1,
      "uuid": "62f7d2a6-3e26-47c3-b198-dbc1e293c1d9",
      "unit_transaction_id": 1,
      "code": "RFB-WJM/20261105-0001",
      "refund_date": "2026-05-21T17:00:00.000000Z",
      "refund_amount": 54000,
      "note": "refund karena terdapat kecacatan",
      "is_paid": true,
      "is_with_stock": false,
      "remaining_payment": 0
    },
    "goods_transaction_refund": null
  }
}

GET {{url}}/wapi/transaction/unit-transaction/unit-transaction/:unit_transaction_id
{
    "status": true,
    "message": "Unit Transaction retrieved successfully",
    "errors": null,
    "data": {
        "id": 2,
        "uuid": "af2d1f67-4425-41cf-a469-8013cd1ed9a3",
        "warehouse_id": 1,
        "person_id": 1,
        "document_template_id": 1,
        "code": "PBL-WAJ/20261105-11979",
        "type": "purchase",
        "invoice_file": null,
        "is_refunded": false,
        "is_usd_transaction": true,
        "created_at": "2026-11-05T07:02:02.000000Z",
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
        "total_usd_cost": 50,
        "transaction_usd_cost_total": 50,
        "usd_cost_freight_total": 10,
        "usd_cost_box_packing_total": 10,
        "usd_cost_admin_cost_total": 10,
        "usd_cost_ckd_processing_cost_total": 0,
        "usd_cost_bill_of_lading_switch_cost_total": 0,
        "usd_cost_customs_clearance_cost_total": 0,
        "usd_cost_other_total": 20,
        "unit_transaction_bruto_total": 0,
        "unit_transaction_bruto_total_actual": 0,
        "unit_transaction_bruto_refund": 0,
        "unit_transaction_bruto_return": 0,
        "unit_transaction_price_usd_total": 2470,
        "unit_transaction_price_usd_total_actual": 0,
        "is_unit_type_detail_valid": false,
        "billing_summary": null,
        "has_warehouse_activity": false,
        "has_refund_transaction": false,
        "expedition_fee_total": 0,
        "warehouse": {
            "id": 1,
            "uuid": "a8c3229d-e126-4a30-9db7-9906b935daf3",
            "name": "wajira-morindo Warehouse",
            "capacity": 10000
        },
        "person": {
            "id": 1,
            "uuid": "14ed2256-f6e1-4504-8892-293cbd206220",
            "code": "SPL-M/0001",
            "type": "supplier",
            "name": "mansurin",
            "company_list": "",
            "company": null
        },
        "transaction_flow": null,
        "unit_transaction_billing": null,
        "unit_transaction_items": [
            {
                "id": 2,
                "uuid": "478ffa70-35b7-47e5-bd59-b12c1ec865ad",
                "unit_transaction_id": 2,
                "unit_type_id": 47,
                "sparepart_id": null,
                "is_usd_transaction": true,
                "dpp_tax_id": 2,
                "dpp_tax_rate": 111,
                "ppn_tax_id": 1,
                "ppn_tax_rate": 11,
                "qty_total": 2,
                "price": 0,
                "price_discount": 0,
                "price_per_unit_usd": 1300,
                "price_usd": 2470,
                "bbn_price": 0,
                "hpp_per_unit_price": 0,
                "dpp_per_unit_price": 0,
                "ppn_per_unit_price": 0,
                "hpp_total_price": 0,
                "dpp_total_price": 0,
                "ppn_total_price": 0,
                "price_total": 0,
                "price_total_usd": 2520,
                "expedition_fee": 0,
                "other_fee": 0,
                "created_at": "2026-11-05T07:02:02.000000Z",
                "updated_at": "2026-11-05T07:02:02.000000Z",
                "price_usd_discount": 5,
                "total_usd_cost": 50,
                "usd_cost_freight_total": 10,
                "usd_cost_box_packing_total": 10,
                "usd_cost_admin_cost_total": 10,
                "usd_cost_ckd_processing_cost_total": 0,
                "usd_cost_bill_of_lading_switch_cost_total": 0,
                "usd_cost_customs_clearance_cost_total": 0,
                "usd_cost_other_total": 20,
                "unit_transaction_item_details": [],
                "unit_type_sold_details": [],
                "unit_transaction_usd_costs": [
                    {
                        "id": 1,
                        "unit_transaction_item_id": 2,
                        "cost_type": "freight",
                        "amount": 10,
                        "note": "Freight",
                        "created_at": "2026-11-05T07:02:02.000000Z",
                        "updated_at": "2026-11-05T07:02:02.000000Z"
                    },
                    {
                        "id": 2,
                        "unit_transaction_item_id": 2,
                        "cost_type": "box_packing",
                        "amount": 10,
                        "note": "Box Packing",
                        "created_at": "2026-11-05T07:02:02.000000Z",
                        "updated_at": "2026-11-05T07:02:02.000000Z"
                    },
                    {
                        "id": 3,
                        "unit_transaction_item_id": 2,
                        "cost_type": "admin_cost",
                        "amount": 10,
                        "note": "Admin Cost",
                        "created_at": "2026-11-05T07:02:02.000000Z",
                        "updated_at": "2026-11-05T07:02:02.000000Z"
                    },
                    {
                        "id": 4,
                        "unit_transaction_item_id": 2,
                        "cost_type": "other",
                        "amount": 20,
                        "note": "coba",
                        "created_at": "2026-11-05T07:02:02.000000Z",
                        "updated_at": "2026-11-05T07:02:02.000000Z"
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
                                "created_at": "2026-11-05T02:25:25.000000Z",
                                "updated_at": "2026-11-05T02:25:25.000000Z"
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
                                "created_at": "2026-11-05T02:25:25.000000Z",
                                "updated_at": "2026-11-05T02:25:25.000000Z"
                            }
                        ]
                    }
                }
            }
        ],
        "unit_transaction_usd_costs": [
            {
                "id": 1,
                "unit_transaction_item_id": 2,
                "cost_type": "freight",
                "amount": 10,
                "note": "Freight",
                "created_at": "2026-11-05T07:02:02.000000Z",
                "updated_at": "2026-11-05T07:02:02.000000Z",
                "laravel_through_key": 2
            },
            {
                "id": 2,
                "unit_transaction_item_id": 2,
                "cost_type": "box_packing",
                "amount": 10,
                "note": "Box Packing",
                "created_at": "2026-11-05T07:02:02.000000Z",
                "updated_at": "2026-11-05T07:02:02.000000Z",
                "laravel_through_key": 2
            },
            {
                "id": 3,
                "unit_transaction_item_id": 2,
                "cost_type": "admin_cost",
                "amount": 10,
                "note": "Admin Cost",
                "created_at": "2026-11-05T07:02:02.000000Z",
                "updated_at": "2026-11-05T07:02:02.000000Z",
                "laravel_through_key": 2
            },
            {
                "id": 4,
                "unit_transaction_item_id": 2,
                "cost_type": "other",
                "amount": 20,
                "note": "coba",
                "created_at": "2026-11-05T07:02:02.000000Z",
                "updated_at": "2026-11-05T07:02:02.000000Z",
                "laravel_through_key": 2
            }
        ],
        "warehouse_activity": null
    }
}

GET {{url}}/wapi/finance/finance-refund/:finance_refund_id
{
    "status": true,
    "message": "Finance Refund retrieved successfully",
    "errors": null,
    "data": {
        "id": 4,
        "uuid": "44cf76ac-7ce4-43ed-af04-0d38d7317c06",
        "code": "PBL-WAJ/20261105-54049-refund",
        "company_id": 1,
        "unit_transaction_refund_id": 1,
        "goods_transaction_refund_id": null,
        "transaction_of": "unit_type",
        "date": "2026-11-03T17:00:00.000000Z",
        "note": "test",
        "is_paid": false,
        "is_valid": true,
        "created_at": "2026-11-05T13:36:17.000000Z",
        "updated_at": "2026-11-05T13:38:32.000000Z",
        "remaining_payment": 0,
        "cash_position": {
            "debet_idr_total": 0,
            "credit_idr_total": 0,
            "debet_usd_total": 23423423,
            "credit_usd_total": 0
        },
        "last_payment_at": "2026-10-10",
        "company": {
            "id": 1,
            "uuid": "7a245b28-aa2d-492e-83e9-c729a59b049d",
            "name": "PT Wajira Morindo"
        },
        "finance_refund_cashes": [
            {
                "id": 4,
                "finance_refund_id": 4,
                "cash_id": 3,
                "amount": 23423423,
                "amount_original": 23423423,
                "type": "debet",
                "created_at": "2026-11-05T13:36:17.000000Z",
                "updated_at": "2026-11-05T13:36:17.000000Z",
                "cash": {
                    "id": 3,
                    "uuid": "e87bf836-7e1d-450a-bd90-44d0e86c32d2",
                    "company_id": 1,
                    "currency_type": "usd",
                    "cash_name": "BCA USD",
                    "type": "bank",
                    "code": "bca_usd"
                }
            }
        ],
        "finance_billings": [
            {
                "id": 1,
                "uuid": "caa9d2cb-a759-4cf4-bf8d-f5baaacdc25a",
                "cash_flow_id": null,
                "finance_refund_id": 4,
                "cash_id": 3,
                "account_id": 1,
                "type": "debet",
                "amount": 14000,
                "amount_original": 224000000,
                "payment_proof": null,
                "payment_at": "2026-10-09T17:00:00.000000Z",
                "note": "pembayaran termin 1 cash",
                "is_usd_payment": true,
                "cash_position_before": 0,
                "cash_position_after": null,
                "created_at": "2026-11-05T13:38:16.000000Z",
                "updated_at": "2026-11-05T13:38:16.000000Z",
                "cash": {
                    "id": 3,
                    "uuid": "e87bf836-7e1d-450a-bd90-44d0e86c32d2",
                    "company_id": 1,
                    "code": "bca_usd",
                    "cash_name": "BCA USD",
                    "currency_type": "usd"
                },
                "account": {
                    "id": 1,
                    "type": "debet"
                }
            },
            {
                "id": 2,
                "uuid": "b4b2c0f4-4fc0-4d27-b957-c55f26da04dd",
                "cash_flow_id": null,
                "finance_refund_id": 4,
                "cash_id": 3,
                "account_id": 1,
                "type": "debet",
                "amount": 23409423,
                "amount_original": 374550768000,
                "payment_proof": null,
                "payment_at": "2026-10-09T17:00:00.000000Z",
                "note": "pembayaran termin 1 cash",
                "is_usd_payment": true,
                "cash_position_before": 0,
                "cash_position_after": null,
                "created_at": "2026-11-05T13:38:32.000000Z",
                "updated_at": "2026-11-05T13:38:32.000000Z",
                "cash": {
                    "id": 3,
                    "uuid": "e87bf836-7e1d-450a-bd90-44d0e86c32d2",
                    "company_id": 1,
                    "code": "bca_usd",
                    "cash_name": "BCA USD",
                    "currency_type": "usd"
                },
                "account": {
                    "id": 1,
                    "type": "debet"
                }
            }
        ],
        "unit_transaction_refund": {
            "id": 1,
            "uuid": "93e3ad45-5635-4eb4-871c-2aee220eba6e",
            "unit_transaction_id": 1,
            "code": "RFB-WJM/20261105-0001",
            "refund_date": "2026-11-04T17:00:00.000000Z",
            "refund_amount": 23423423,
            "note": null,
            "is_paid": true,
            "is_with_stock": false,
            "remaining_payment": 0,
            "unit_transaction_item_details": [],
            "unit_transaction": {
                "id": 1,
                "uuid": "fdda6a0a-676f-469e-bceb-efa4406cf692",
                "person_id": 1,
                "code": "PBL-WAJ/20261105-54049",
                "type": "purchase",
                "has_warehouse_activity": false,
                "has_refund_transaction": true,
                "expedition_fee_total": "0.00",
                "person": {
                    "id": 1,
                    "uuid": "06e7969a-4732-4ca5-8fbe-213938f39233",
                    "name": "Mansurin",
                    "type": "supplier",
                    "company_list": "",
                    "company": null
                }
            }
        },
        "goods_transaction_refund": null
    }
}