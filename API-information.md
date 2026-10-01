1. Vehicle Fleet Detail API
{{url}}/wapi/master-data/vehicle-fleet/:vehicle_fleet_id
{
    "status": true,
    "message": "Vehicle Fleet retrieved successfully",
    "errors": null,
    "data": {
        "id": 1,
        "uuid": "3ca84720-4b2e-437e-b4ee-7bf9d76cd371",
        "registration_number": "AB 5795 OUU",
        "type": "towing",
        "machine_number": "MCHX36V164D4",
        "chassis_number": "CHSC68G556W6",
        "stnk_age": "2029-09-22",
        "kir_age": "2027-07-04",
        "stnk_number": "86782573671",
        "kir_book": "KIR-79130831",
        "created_at": "2026-10-01T13:04:54.000000Z",
        "updated_at": "2026-10-01T13:04:54.000000Z",
        "vehicle_equipment_assigned": [
            {
                "id": 1,
                "uuid": "b87e7692-fa98-48a1-ad56-f01f3b8e78f8",
                "code": "KNCING001",
                "name": "KUNCI INGGRIS",
                "description": null,
                "created_at": "2026-10-01T13:13:14.000000Z",
                "updated_at": "2026-10-01T13:13:14.000000Z",
                "stock": 20,
                "buy_price": 50000,
                "sell_price": 65000
            }
        ]
    }
}

2. Warehouse Activity List
{{url}}/wapi/warehouse/warehouse-activity
{
    "status": true,
    "message": "Warehouse activities retrieved successfully",
    "errors": null,
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 4,
                "uuid": "aa691780-cb9f-467d-ab73-16eff3b3fb99",
                "person_id": null,
                "cash_id": null,
                "warehouse_id": 4,
                "type": "vehicle-equipment",
                "unit_transaction_id": null,
                "goods_transaction_id": null,
                "sparepart_transaction_id": null,
                "activity_number": "KR-WJT/20261001-0002",
                "activity_type": "assign",
                "activity_date": "2026-10-10 00:00:00",
                "description": "description",
                "state": "done",
                "is_refund_activity": false,
                "state_note": "done",
                "created_at": "2026-10-01T14:01:16.000000Z",
                "warehouse": {
                    "id": 4,
                    "uuid": "fd5a0ec8-8b22-454b-a657-d308af0539f9",
                    "name": "PT Wajira Transindo Warehouse"
                },
                "person": null,
                "cash": null,
                "unit_transaction": null,
                "goods_transaction": null,
                "sparepart_transaction": null
            },
            {
                "id": 3,
                "uuid": "eef86d1a-b82e-4509-9491-c8ee5b240659",
                "person_id": null,
                "cash_id": null,
                "warehouse_id": 4,
                "type": "vehicle-equipment",
                "unit_transaction_id": null,
                "goods_transaction_id": null,
                "sparepart_transaction_id": null,
                "activity_number": "KR-WJT/20261001-0001",
                "activity_type": "assign",
                "activity_date": "2026-10-10 00:00:00",
                "description": "description",
                "state": "done",
                "is_refund_activity": false,
                "state_note": "done",
                "created_at": "2026-10-01T13:34:48.000000Z",
                "warehouse": {
                    "id": 4,
                    "uuid": "fd5a0ec8-8b22-454b-a657-d308af0539f9",
                    "name": "PT Wajira Transindo Warehouse"
                },
                "person": null,
                "cash": null,
                "unit_transaction": null,
                "goods_transaction": null,
                "sparepart_transaction": null
            },
            {
                "id": 2,
                "uuid": "8b954852-7f3d-4dea-9299-ea682977c2bf",
                "person_id": 3,
                "cash_id": null,
                "warehouse_id": 4,
                "type": "vehicle-equipment",
                "unit_transaction_id": null,
                "goods_transaction_id": 2,
                "sparepart_transaction_id": null,
                "activity_number": "TMU-WJT/20261001-0002",
                "activity_type": "receipt",
                "activity_date": "2026-10-01 00:00:00",
                "description": "Penerimaan perlengkapan TRM-PK/20261001-0002 sebanyak 14",
                "state": "done",
                "is_refund_activity": false,
                "state_note": null,
                "created_at": "2026-10-01T13:32:09.000000Z",
                "warehouse": {
                    "id": 4,
                    "uuid": "fd5a0ec8-8b22-454b-a657-d308af0539f9",
                    "name": "PT Wajira Transindo Warehouse"
                },
                "person": {
                    "id": 3,
                    "uuid": "e10b856b-3aa1-46b7-b5de-216b33732776",
                    "name": "Galang",
                    "company_list": "",
                    "company": null
                },
                "cash": null,
                "unit_transaction": null,
                "goods_transaction": {
                    "id": 2,
                    "uuid": "1a017675-ba21-4617-a49d-f5aeaf848a08",
                    "code": "TRM-PK/20261001-0002",
                    "total_brutto": 0,
                    "has_warehouse_activity": true
                },
                "sparepart_transaction": null
            },
            {
                "id": 1,
                "uuid": "6256780f-b72b-423d-9f0e-981e7782ce03",
                "person_id": 3,
                "cash_id": null,
                "warehouse_id": 4,
                "type": "vehicle-equipment",
                "unit_transaction_id": null,
                "goods_transaction_id": 1,
                "sparepart_transaction_id": null,
                "activity_number": "TMU-WJT/20261001-0001",
                "activity_type": "receipt",
                "activity_date": "2026-10-01 00:00:00",
                "description": "Penerimaan perlengkapan TRM-PK/20261001-0001 sebanyak 50",
                "state": "done",
                "is_refund_activity": false,
                "state_note": null,
                "created_at": "2026-10-01T13:16:11.000000Z",
                "warehouse": {
                    "id": 4,
                    "uuid": "fd5a0ec8-8b22-454b-a657-d308af0539f9",
                    "name": "PT Wajira Transindo Warehouse"
                },
                "person": {
                    "id": 3,
                    "uuid": "e10b856b-3aa1-46b7-b5de-216b33732776",
                    "name": "Galang",
                    "company_list": "",
                    "company": null
                },
                "cash": null,
                "unit_transaction": null,
                "goods_transaction": {
                    "id": 1,
                    "uuid": "d6525111-aeb8-4841-b72a-2b2ef139a4d4",
                    "code": "TRM-PK/20261001-0001",
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
        "to": 4,
        "total": 4
    }
}

3. Warehouse Activity Detail
{{url}}/wapi/warehouse/warehouse-activity/:warehouse_activity_id
{
    "status": true,
    "message": "Warehouse activity retrieved successfully",
    "errors": null,
    "data": {
        "id": 2,
        "uuid": "8b954852-7f3d-4dea-9299-ea682977c2bf",
        "person_id": 3,
        "cash_id": null,
        "warehouse_id": 4,
        "type": "vehicle-equipment",
        "unit_transaction_id": null,
        "goods_transaction_id": 2,
        "sparepart_transaction_id": null,
        "activity_number": "TMU-WJT/20261001-0002",
        "activity_type": "receipt",
        "activity_date": "2026-10-01 00:00:00",
        "description": "Penerimaan perlengkapan TRM-PK/20261001-0002 sebanyak 14",
        "state": "done",
        "is_refund_activity": false,
        "state_note": null,
        "created_at": "2026-10-01T13:32:09.000000Z",
        "total_unit_transaction_item_details": 0,
        "warehouse": {
            "id": 4,
            "uuid": "fd5a0ec8-8b22-454b-a657-d308af0539f9",
            "name": "PT Wajira Transindo Warehouse"
        },
        "person": {
            "id": 3,
            "uuid": "e10b856b-3aa1-46b7-b5de-216b33732776",
            "name": "Galang",
            "company_list": "",
            "company": null
        },
        "cash": null,
        "unit_transaction": null,
        "goods_transaction": {
            "id": 2,
            "uuid": "1a017675-ba21-4617-a49d-f5aeaf848a08",
            "code": "TRM-PK/20261001-0002",
            "transaction_type": "vehicle_equipment",
            "warehouse_id": 4,
            "person_id": 3,
            "material_id": null,
            "vehicle_equipment_id": 1,
            "type": "purchase",
            "billing_type": "cash",
            "is_refunded": false,
            "qty": 14,
            "price": 50000,
            "discount": 0,
            "transaction_date": "2026-09-30T17:00:00.000000Z",
            "nota_number": "NOTA2L342L",
            "billing_due_date": null,
            "invoice_file": null,
            "note": null,
            "created_at": "2026-10-01T13:31:49.000000Z",
            "updated_at": "2026-10-01T13:31:49.000000Z",
            "total_brutto": 700000,
            "has_warehouse_activity": true,
            "material": null,
            "vehicle_equipment": {
                "id": 1,
                "uuid": "b87e7692-fa98-48a1-ad56-f01f3b8e78f8",
                "code": "KNCING001",
                "name": "KUNCI INGGRIS",
                "description": null,
                "created_at": "2026-10-01T13:13:14.000000Z",
                "updated_at": "2026-10-01T13:13:14.000000Z",
                "buy_price": 50000,
                "sell_price": 65000
            }
        },
        "sparepart_transaction": null,
        "warehouse_movements": []
    }
}
{
    "status": true,
    "message": "Warehouse activity retrieved successfully",
    "errors": null,
    "data": {
        "id": 4,
        "uuid": "aa691780-cb9f-467d-ab73-16eff3b3fb99",
        "person_id": null,
        "cash_id": null,
        "warehouse_id": 4,
        "type": "vehicle-equipment",
        "unit_transaction_id": null,
        "goods_transaction_id": null,
        "sparepart_transaction_id": null,
        "activity_number": "KR-WJT/20261001-0002",
        "activity_type": "assign",
        "activity_date": "2026-10-10 00:00:00",
        "description": "description",
        "state": "done",
        "is_refund_activity": false,
        "state_note": "done",
        "created_at": "2026-10-01T14:01:16.000000Z",
        "total_unit_transaction_item_details": 1,
        "warehouse": {
            "id": 4,
            "uuid": "fd5a0ec8-8b22-454b-a657-d308af0539f9",
            "name": "PT Wajira Transindo Warehouse"
        },
        "person": null,
        "cash": null,
        "unit_transaction": null,
        "goods_transaction": null,
        "sparepart_transaction": null,
        "warehouse_movement_assignment": {
            "id": 2,
            "warehouse_movement_id": 2,
            "vehicle_fleet_id": 1,
            "vehicle_equipment_id": 1,
            "qty": 10,
            "created_at": "2026-10-01T14:01:16.000000Z",
            "updated_at": "2026-10-01T14:01:16.000000Z",
            "laravel_through_key": 4,
            "vehicle_equipment": {
                "id": 1,
                "uuid": "b87e7692-fa98-48a1-ad56-f01f3b8e78f8",
                "code": "KNCING001",
                "name": "KUNCI INGGRIS",
                "description": null,
                "created_at": "2026-10-01T13:13:14.000000Z",
                "updated_at": "2026-10-01T13:13:14.000000Z",
                "buy_price": 50000,
                "sell_price": 65000
            },
            "vehicle_fleet": {
                "id": 1,
                "uuid": "3ca84720-4b2e-437e-b4ee-7bf9d76cd371",
                "registration_number": "AB 5795 OUU",
                "type": "towing",
                "machine_number": "MCHX36V164D4",
                "chassis_number": "CHSC68G556W6",
                "stnk_age": "2029-09-22",
                "kir_age": "2027-07-04",
                "stnk_number": "86782573671",
                "kir_book": "KIR-79130831",
                "created_at": "2026-10-01T13:04:54.000000Z",
                "updated_at": "2026-10-01T13:04:54.000000Z"
            }
        },
        "warehouse_movements": [
            {
                "id": 2,
                "uuid": "892c0aa1-2f33-4f6a-8f29-cb01eeeddda0",
                "serial_number": "TRX2026100100002",
                "warehouse_activity_id": 4,
                "unit_transaction_id": null,
                "unit_transaction_item_detail_id": null,
                "goods_transaction_id": null,
                "status": "out",
                "created_at": "2026-10-01T14:01:16.000000Z",
                "updated_at": "2026-10-01T14:01:16.000000Z"
            }
        ]
    }
}

4. Alur Assign atau Dispatch Perlengkapan Kendaraan
   1. membuat data wareouse activity menggunakan API POST {{url}}/wapi/warehouse/warehouse-activity
   2. melakukan update state warehouse menjadi done menggunakan API PUT {{url}}/wapi/warehouse/warehouse-activity/:warehouse_activity_id