warehouse vehicle equipment stock list 
{{url}}/wapi/warehouse/warehouse-get-vehicle-equipment/:company_id

{
    "status": true,
    "message": "Warehouse vehicle equipment retrieved successfully",
    "errors": null,
    "data": {
        "current_page": 1,
        "data": [
            {
                "kode_perlengkapan": "KNCING001",
                "nama_perlengkapan": "KUNCI INGGRIS",
                "stok_tersedia": 64,
                "stok_terpakai": 17,
                "total_stok": 81
            }
        ],
        "first_page_url": "http://localhost:8000/wapi/warehouse/warehouse-get-vehicle-equipment/4?page=1",
        "from": 1,
        "last_page": 1,
        "last_page_url": "http://localhost:8000/wapi/warehouse/warehouse-get-vehicle-equipment/4?page=1",
        "links": [
            {
                "url": null,
                "label": "&laquo; Previous",
                "active": false
            },
            {
                "url": "http://localhost:8000/wapi/warehouse/warehouse-get-vehicle-equipment/4?page=1",
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
        "path": "http://localhost:8000/wapi/warehouse/warehouse-get-vehicle-equipment/4",
        "per_page": 10,
        "prev_page_url": null,
        "to": 1,
        "total": 1
    }
}

{{url}}/wapi/report/vehicle-equipment-transaction-report
{
  "status": true,
  "message": "Vehicle equipment transaction report retrieved successfully",
  "errors": null,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 2,
        "uuid": "1a017675-ba21-4617-a49d-f5aeaf848a08",
        "code": "TRM-PK/20261001-0002",
        "type": "purchase",
        "billing_type": "cash",
        "is_refunded": false,
        "qty": 14,
        "price": 50000,
        "discount": 0,
        "total_brutto": 700000,
        "total_netto": 700000,
        "transaction_date": "2026-10-01",
        "nota_number": "NOTA2L342L",
        "billing_due_date": null,
        "invoice_file": null,
        "note": null,
        "created_at": "2026-10-01T13:31:49.000000Z",
        "warehouse": {
          "id": 4,
          "uuid": "fd5a0ec8-8b22-454b-a657-d308af0539f9",
          "name": "PT Wajira Transindo Warehouse"
        },
        "person": {
          "id": 3,
          "uuid": "e10b856b-3aa1-46b7-b5de-216b33732776",
          "code": "SPL-W/0001",
          "name": "Galang",
          "type": "supplier",
          "company_list": "",
          "company": null
        },
        "vehicle_equipment": {
          "id": 1,
          "code": "KNCING001",
          "name": "KUNCI INGGRIS"
        },
        "billing_summary": {
          "grand_total": 700000,
          "total_paid": 700000,
          "remaining_payment": 0,
          "is_paid": true,
          "last_payment_at": "2026-09-30T17:00:00.000000Z"
        }
      },
      {
        "id": 1,
        "uuid": "d6525111-aeb8-4841-b72a-2b2ef139a4d4",
        "code": "TRM-PK/20261001-0001",
        "type": "purchase",
        "billing_type": "cash",
        "is_refunded": false,
        "qty": 50,
        "price": 50000,
        "discount": 250000,
        "total_brutto": 2500000,
        "total_netto": 2250000,
        "transaction_date": "2026-10-01",
        "nota_number": "NOTA23L4J23",
        "billing_due_date": null,
        "invoice_file": null,
        "note": null,
        "created_at": "2026-10-01T13:13:24.000000Z",
        "warehouse": {
          "id": 4,
          "uuid": "fd5a0ec8-8b22-454b-a657-d308af0539f9",
          "name": "PT Wajira Transindo Warehouse"
        },
        "person": {
          "id": 3,
          "uuid": "e10b856b-3aa1-46b7-b5de-216b33732776",
          "code": "SPL-W/0001",
          "name": "Galang",
          "type": "supplier",
          "company_list": "",
          "company": null
        },
        "vehicle_equipment": {
          "id": 1,
          "code": "KNCING001",
          "name": "KUNCI INGGRIS"
        },
        "billing_summary": {
          "grand_total": 2250000,
          "total_paid": 2250000,
          "remaining_payment": 0,
          "is_paid": true,
          "last_payment_at": "2026-09-30T17:00:00.000000Z"
        }
      }
    ],
    "first_page_url": "http://localhost:8000/wapi/report/vehicle-equipment-transaction-report?page=1",
    "from": 1,
    "last_page": 1,
    "last_page_url": "http://localhost:8000/wapi/report/vehicle-equipment-transaction-report?page=1",
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "active": false
      },
      {
        "url": "http://localhost:8000/wapi/report/vehicle-equipment-transaction-report?page=1",
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
    "path": "http://localhost:8000/wapi/report/vehicle-equipment-transaction-report",
    "per_page": 10,
    "prev_page_url": null,
    "to": 2,
    "total": 2
  }
}

{{url}}/wapi/report/vehicle-equipment-assignment-report
{
  "status": true,
  "message": "Vehicle equipment assignment report retrieved successfully",
  "errors": null,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 5,
        "uuid": "1936c827-f3a2-4be6-983d-981f54e34d8a",
        "activity_number": "KR-WJT/20261003-0001",
        "activity_type": "dispatch",
        "activity_date": "2026-10-03 00:00:00",
        "state": "done",
        "state_note": null,
        "description": "selesai",
        "is_refund_activity": false,
        "created_at": "2026-10-03T06:02:51.000000Z",
        "warehouse": {
          "id": 4,
          "uuid": "fd5a0ec8-8b22-454b-a657-d308af0539f9",
          "name": "PT Wajira Transindo Warehouse"
        },
        "person": null,
        "assignment": {
          "id": 3,
          "qty": 3,
          "vehicle_fleet": {
            "id": 1,
            "uuid": "3ca84720-4b2e-437e-b4ee-7bf9d76cd371",
            "registration_number": "AB 5795 OUU",
            "type": "towing"
          },
          "vehicle_equipment": {
            "id": 1,
            "uuid": "b87e7692-fa98-48a1-ad56-f01f3b8e78f8",
            "code": "KNCING001",
            "name": "KUNCI INGGRIS",
            "description": null
          }
        },
        "stock_info": {
          "stock_available": 47,
          "stock_used": 17,
          "total_stock": 64
        }
      },
      {
        "id": 4,
        "uuid": "aa691780-cb9f-467d-ab73-16eff3b3fb99",
        "activity_number": "KR-WJT/20261001-0002",
        "activity_type": "assign",
        "activity_date": "2026-10-10 00:00:00",
        "state": "done",
        "state_note": "done",
        "description": "description",
        "is_refund_activity": false,
        "created_at": "2026-10-01T14:01:16.000000Z",
        "warehouse": {
          "id": 4,
          "uuid": "fd5a0ec8-8b22-454b-a657-d308af0539f9",
          "name": "PT Wajira Transindo Warehouse"
        },
        "person": null,
        "assignment": {
          "id": 2,
          "qty": 10,
          "vehicle_fleet": {
            "id": 1,
            "uuid": "3ca84720-4b2e-437e-b4ee-7bf9d76cd371",
            "registration_number": "AB 5795 OUU",
            "type": "towing"
          },
          "vehicle_equipment": {
            "id": 1,
            "uuid": "b87e7692-fa98-48a1-ad56-f01f3b8e78f8",
            "code": "KNCING001",
            "name": "KUNCI INGGRIS",
            "description": null
          }
        },
        "stock_info": {
          "stock_available": 47,
          "stock_used": 17,
          "total_stock": 64
        }
      },
      {
        "id": 3,
        "uuid": "eef86d1a-b82e-4509-9491-c8ee5b240659",
        "activity_number": "KR-WJT/20261001-0001",
        "activity_type": "assign",
        "activity_date": "2026-10-10 00:00:00",
        "state": "done",
        "state_note": "done",
        "description": "description",
        "is_refund_activity": false,
        "created_at": "2026-10-01T13:34:48.000000Z",
        "warehouse": {
          "id": 4,
          "uuid": "fd5a0ec8-8b22-454b-a657-d308af0539f9",
          "name": "PT Wajira Transindo Warehouse"
        },
        "person": null,
        "assignment": {
          "id": 1,
          "qty": 10,
          "vehicle_fleet": {
            "id": 1,
            "uuid": "3ca84720-4b2e-437e-b4ee-7bf9d76cd371",
            "registration_number": "AB 5795 OUU",
            "type": "towing"
          },
          "vehicle_equipment": {
            "id": 1,
            "uuid": "b87e7692-fa98-48a1-ad56-f01f3b8e78f8",
            "code": "KNCING001",
            "name": "KUNCI INGGRIS",
            "description": null
          }
        },
        "stock_info": {
          "stock_available": 47,
          "stock_used": 17,
          "total_stock": 64
        }
      }
    ],
    "first_page_url": "http://localhost:8000/wapi/report/vehicle-equipment-assignment-report?page=1",
    "from": 1,
    "last_page": 1,
    "last_page_url": "http://localhost:8000/wapi/report/vehicle-equipment-assignment-report?page=1",
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "active": false
      },
      {
        "url": "http://localhost:8000/wapi/report/vehicle-equipment-assignment-report?page=1",
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
    "path": "http://localhost:8000/wapi/report/vehicle-equipment-assignment-report",
    "per_page": 10,
    "prev_page_url": null,
    "to": 3,
    "total": 3
  }
}