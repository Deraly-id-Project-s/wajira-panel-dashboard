GET {{url}}/wapi/report/general-journal-report
{
    "status": true,
    "message": "General journal report data retrieved successfully",
    "errors": null,
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 3,
                "uuid": "495c1802-b494-4fee-9b60-67924f69fca5",
                "general_journal_id": 3,
                "note": "lha wong saya suka kok",
                "is_paid": true,
                "is_valid": true,
                "date": "2026-11-10T17:00:00.000000Z",
                "created_at": "2026-11-11T03:07:33.000000Z",
                "is_balanced": true,
                "debit": 900000,
                "credit": 900000,
                "total_amount": 900000,
                "total_paid": 1800000,
                "paid_debit": 900000,
                "paid_credit": 900000,
                "remaining_payment": 0,
                "dual_remaining_payment": 0,
                "remaining_amount": 0,
                "original_direction": "debit",
                "dual_direction": "credit",
                "general_journal": {
                    "id": 3,
                    "company_id": 1,
                    "code": "JRN2026111100002",
                    "note": "lha wong saya suka kok",
                    "date": "2026-11-10T17:00:00.000000Z",
                    "total_amount": 900000,
                    "total_paid": 1800000,
                    "paid_debit": 900000,
                    "paid_credit": 900000,
                    "remaining_payment": 0,
                    "dual_remaining_payment": 0,
                    "remaining_amount": 0,
                    "is_balanced": true,
                    "total_debit": 900000,
                    "total_credit": 900000,
                    "is_paid": true,
                    "is_valid": true
                }
            },
            {
                "id": 1,
                "uuid": "932bc507-7522-4f10-8ded-5f7a6b357fa0",
                "general_journal_id": 1,
                "note": "jujurly",
                "is_paid": true,
                "is_valid": true,
                "date": "2026-11-10T17:00:00.000000Z",
                "created_at": "2026-11-11T01:58:31.000000Z",
                "is_balanced": true,
                "debit": 4000,
                "credit": 4000,
                "total_amount": 4000,
                "total_paid": 8000,
                "paid_debit": 4000,
                "paid_credit": 4000,
                "remaining_payment": 0,
                "dual_remaining_payment": 0,
                "remaining_amount": 0,
                "original_direction": "debit",
                "dual_direction": "credit",
                "general_journal": {
                    "id": 1,
                    "company_id": 1,
                    "code": "JRN2026111100001",
                    "note": "jujurly",
                    "date": "2026-11-10T17:00:00.000000Z",
                    "total_amount": 4000,
                    "total_paid": 8000,
                    "paid_debit": 4000,
                    "paid_credit": 4000,
                    "remaining_payment": 0,
                    "dual_remaining_payment": 0,
                    "remaining_amount": 0,
                    "is_balanced": true,
                    "total_debit": 4000,
                    "total_credit": 4000,
                    "is_paid": true,
                    "is_valid": true
                }
            }
        ],
        "first_page_url": "http://localhost:8000/wapi/report/general-journal-report?page=1",
        "from": 1,
        "last_page": 1,
        "last_page_url": "http://localhost:8000/wapi/report/general-journal-report?page=1",
        "links": [
            {
                "url": null,
                "label": "&laquo; Previous",
                "active": false
            },
            {
                "url": "http://localhost:8000/wapi/report/general-journal-report?page=1",
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
        "path": "http://localhost:8000/wapi/report/general-journal-report",
        "per_page": 10,
        "prev_page_url": null,
        "to": 2,
        "total": 2
    }
}