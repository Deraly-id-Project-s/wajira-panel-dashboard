GET {{url}}/wapi/report/cash-flow-report?is_paid=true
{
    "status": true,
    "message": "Cash Flow report data retrieved successfully",
    "errors": null,
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "uuid": "1825309b-1d5e-4940-bfbf-cf83359648ba",
                "tanggal": "2026-10-31",
                "nota_ref": "PBL-WAJ/20261031-12179",
                "keterangan": "Pelunasan Total PBL-WAJ/20261031-12179",
                "debit_cash_idr": 0,
                "kredit_cash_idr": 0,
                "debit_bank_idr": 0,
                "kredit_bank_idr": 0,
                "debit_bank_usd": 0,
                "kredit_bank_usd": 2620,
                "DEBIT (CASH IDR)": 0,
                "KREDIT (CASH IDR)": 0,
                "DEBIT (BANK IDR)": 0,
                "KREDIT (BANK IDR)": 0,
                "DEBIT (BANK USD)": 0,
                "KREDIT (BANK USD)": 2620
            }
        ],
        "first_page_url": "http://localhost:8000/wapi/report/cash-flow-report?page=1",
        "from": 1,
        "last_page": 1,
        "last_page_url": "http://localhost:8000/wapi/report/cash-flow-report?page=1",
        "links": [
            {
                "url": null,
                "label": "&laquo; Previous",
                "active": false
            },
            {
                "url": "http://localhost:8000/wapi/report/cash-flow-report?page=1",
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
        "path": "http://localhost:8000/wapi/report/cash-flow-report",
        "per_page": 10,
        "prev_page_url": null,
        "to": 1,
        "total": 1
    }
}