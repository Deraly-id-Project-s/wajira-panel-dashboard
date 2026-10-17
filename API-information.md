POST {{url}}/wapi/master-data/tarif
request body:
distance:45
uj_towing:50000
uj_cdd:45000
uj_fuso:550000
inv_cdd:10000
inv_fuso:20000
inv_towing:23922
is_active:true
routes:[{"route_id": 1,"order": 1,"state_at": "loading_in"},{"route_id": 2,"order": 2,"state_at": "loading_out"}]

response :
{
  "status": true,
  "message": "Tarif created successfully",
  "errors": null,
  "data": {
    "distance": 45,
    "inv_cdd": 10000,
    "inv_fuso": 20000,
    "inv_towing": 23922,
    "is_active": 1,
    "uuid": "81b4d57f-8a90-4789-90d6-325cd2e80ddb",
    "updated_at": "2026-10-15T16:00:48.000000Z",
    "created_at": "2026-10-15T16:00:48.000000Z",
    "id": 3,
    "uj_towing": 50000,
    "uj_cdd": 45000,
    "uj_fuso": 550000,
    "tarif_price_versions": [
      {
        "id": 3,
        "uuid": "fec1c7f8-a89e-468f-93b1-ff482c7a9771",
        "tarif_id": 3,
        "name": "Initial Price",
        "uj_towing": 50000,
        "uj_cdd": 45000,
        "uj_fuso": 550000,
        "effective_from": "2026-10-15",
        "effective_until": null,
        "is_default": true,
        "is_lock": false,
        "created_at": "2026-10-15T16:00:48.000000Z",
        "updated_at": "2026-10-15T16:00:48.000000Z"
      }
    ],
    "routes": [
      {
        "id": 1,
        "uuid": "f3b074be-bebc-47cc-879c-678b1ac642f7",
        "name": "Surakarta",
        "address": "Jl. pademangan",
        "link": "https://maps.google.com",
        "other_information": "ruko warna merah",
        "description": "clear",
        "created_at": "2026-10-15T15:15:25.000000Z",
        "updated_at": "2026-10-15T15:15:25.000000Z",
        "pivot": {
          "tarif_id": 3,
          "route_id": 1,
          "id": 1,
          "order": 1,
          "state_at": "loading_in",
          "created_at": "2026-10-15T16:00:48.000000Z",
          "updated_at": "2026-10-15T16:00:48.000000Z"
        }
      },
      {
        "id": 2,
        "uuid": "31580eee-5322-4c73-8da8-05872081d088",
        "name": "Yogyakarta",
        "address": "Jl. Maguwo",
        "link": "https://maps.google.com",
        "other_information": "ruko warna merah",
        "description": "clear",
        "created_at": "2026-10-15T15:15:32.000000Z",
        "updated_at": "2026-10-15T15:15:32.000000Z",
        "pivot": {
          "tarif_id": 3,
          "route_id": 2,
          "id": 2,
          "order": 2,
          "state_at": "loading_out",
          "created_at": "2026-10-15T16:00:48.000000Z",
          "updated_at": "2026-10-15T16:00:48.000000Z"
        }
      }
    ]
  }
}

GET {{url}}/wapi/master-data/tarif
{
    "status": true,
    "message": "Tarif list retrieved successfully",
    "errors": null,
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 51,
                "uuid": "cdcaf1e3-5510-4fa9-8a46-05bbc611af14",
                "distance": 45,
                "inv_cdd": 10000,
                "inv_fuso": 20000,
                "is_active": 1,
                "created_at": "2026-10-16T03:24:18.000000Z",
                "updated_at": "2026-10-16T03:24:18.000000Z",
                "inv_towing": 23922,
                "uj_towing": 50000,
                "uj_cdd": 45000,
                "uj_fuso": 550000,
                "loading_in": "Jakarta",
                "loading_out": "Bandung",
                "tarif_price_versions": [
                    {
                        "id": 51,
                        "uuid": "4ec11811-c576-4936-8b36-7a185678db9a",
                        "tarif_id": 51,
                        "name": "Initial Price",
                        "uj_towing": 50000,
                        "uj_cdd": 45000,
                        "uj_fuso": 550000
                    }
                ]
            },
            {
                "id": 50,
                "uuid": "5d173cee-1bfc-4b19-826a-0ffe7e8f1556",
                "distance": 200,
                "inv_cdd": 4393721,
                "inv_fuso": 5417027,
                "is_active": 1,
                "created_at": "2026-10-16T03:23:10.000000Z",
                "updated_at": "2026-10-16T03:23:10.000000Z",
                "inv_towing": 1056712,
                "uj_towing": 2712963,
                "uj_cdd": 1364281,
                "uj_fuso": 5859523,
                "loading_in": "Banda Aceh",
                "loading_out": "Banyuwangi",
                "tarif_price_versions": [
                    {
                        "id": 50,
                        "uuid": "a2af9a9d-5431-436f-b6f0-3d10cc736317",
                        "tarif_id": 50,
                        "name": "Initial Price",
                        "uj_towing": 2712963,
                        "uj_cdd": 1364281,
                        "uj_fuso": 5859523
                    }
                ]
            },
            {
                "id": 49,
                "uuid": "a182fbb3-8bde-4e47-9b68-415cd6c46a85",
                "distance": 129,
                "inv_cdd": 3256775,
                "inv_fuso": 4521130,
                "is_active": 1,
                "created_at": "2026-10-16T03:23:10.000000Z",
                "updated_at": "2026-10-16T03:23:10.000000Z",
                "inv_towing": 1160297,
                "uj_towing": 1444031,
                "uj_cdd": 931245,
                "uj_fuso": 1983345,
                "loading_in": "Tangerang",
                "loading_out": "Banda Aceh",
                "tarif_price_versions": [
                    {
                        "id": 49,
                        "uuid": "f2b214f1-4f23-4e8e-b7eb-64cf53135f0d",
                        "tarif_id": 49,
                        "name": "Initial Price",
                        "uj_towing": 1444031,
                        "uj_cdd": 931245,
                        "uj_fuso": 1983345
                    }
                ]
            },
            {
                "id": 48,
                "uuid": "4f16a79f-954f-4f06-8a9e-e8bf09883152",
                "distance": 392,
                "inv_cdd": 1199955,
                "inv_fuso": 3754611,
                "is_active": 1,
                "created_at": "2026-10-16T03:23:10.000000Z",
                "updated_at": "2026-10-16T03:23:10.000000Z",
                "inv_towing": 3520779,
                "uj_towing": 2581300,
                "uj_cdd": 1070667,
                "uj_fuso": 4568916,
                "loading_in": "Denpasar",
                "loading_out": "Jember",
                "tarif_price_versions": [
                    {
                        "id": 48,
                        "uuid": "80e0f01f-4f90-448c-bba0-cc117d79f4a4",
                        "tarif_id": 48,
                        "name": "Initial Price",
                        "uj_towing": 2581300,
                        "uj_cdd": 1070667,
                        "uj_fuso": 4568916
                    }
                ]
            },
            {
                "id": 47,
                "uuid": "4f7be399-7ff7-4cd5-ac6b-46e3732198c4",
                "distance": 203,
                "inv_cdd": 3413970,
                "inv_fuso": 6194819,
                "is_active": 1,
                "created_at": "2026-10-16T03:23:10.000000Z",
                "updated_at": "2026-10-16T03:23:10.000000Z",
                "inv_towing": 2347678,
                "uj_towing": 2160022,
                "uj_cdd": 3091498,
                "uj_fuso": 1504774,
                "loading_in": "Padang",
                "loading_out": "Balikpapan",
                "tarif_price_versions": [
                    {
                        "id": 47,
                        "uuid": "751db260-17bf-4971-811b-c9ffee310f17",
                        "tarif_id": 47,
                        "name": "Initial Price",
                        "uj_towing": 2160022,
                        "uj_cdd": 3091498,
                        "uj_fuso": 1504774
                    }
                ]
            },
            {
                "id": 46,
                "uuid": "07b7101a-88c4-4069-82ef-271416b925a9",
                "distance": 223,
                "inv_cdd": 2233928,
                "inv_fuso": 7761448,
                "is_active": 1,
                "created_at": "2026-10-16T03:23:10.000000Z",
                "updated_at": "2026-10-16T03:23:10.000000Z",
                "inv_towing": 1186027,
                "uj_towing": 1576015,
                "uj_cdd": 2824379,
                "uj_fuso": 3622797,
                "loading_in": "Pekanbaru",
                "loading_out": "Manado",
                "tarif_price_versions": [
                    {
                        "id": 46,
                        "uuid": "bfabe5d0-2218-443a-8fea-56e78218cc59",
                        "tarif_id": 46,
                        "name": "Initial Price",
                        "uj_towing": 1576015,
                        "uj_cdd": 2824379,
                        "uj_fuso": 3622797
                    }
                ]
            },
            {
                "id": 45,
                "uuid": "a58a09af-5065-4483-b7ba-b0c3a749a668",
                "distance": 681,
                "inv_cdd": 2378678,
                "inv_fuso": 5715009,
                "is_active": 1,
                "created_at": "2026-10-16T03:23:10.000000Z",
                "updated_at": "2026-10-16T03:23:10.000000Z",
                "inv_towing": 2474986,
                "uj_towing": 2769738,
                "uj_cdd": 2165743,
                "uj_fuso": 7990361,
                "loading_in": "Solo",
                "loading_out": "Palembang",
                "tarif_price_versions": [
                    {
                        "id": 45,
                        "uuid": "9b4d1053-378f-451c-a68a-b157ae97faae",
                        "tarif_id": 45,
                        "name": "Initial Price",
                        "uj_towing": 2769738,
                        "uj_cdd": 2165743,
                        "uj_fuso": 7990361
                    }
                ]
            },
            {
                "id": 44,
                "uuid": "23493129-d66c-4577-859d-53e1f637088c",
                "distance": 286,
                "inv_cdd": 1234261,
                "inv_fuso": 5562449,
                "is_active": 1,
                "created_at": "2026-10-16T03:23:10.000000Z",
                "updated_at": "2026-10-16T03:23:10.000000Z",
                "inv_towing": 2298817,
                "uj_towing": 2056898,
                "uj_cdd": 2921286,
                "uj_fuso": 1590061,
                "loading_in": "Manado",
                "loading_out": "Serang",
                "tarif_price_versions": [
                    {
                        "id": 44,
                        "uuid": "a09eed7d-1abc-4902-be9f-0641447e90a0",
                        "tarif_id": 44,
                        "name": "Initial Price",
                        "uj_towing": 2056898,
                        "uj_cdd": 2921286,
                        "uj_fuso": 1590061
                    }
                ]
            },
            {
                "id": 43,
                "uuid": "54dbdd32-2505-4764-95b7-e4ea0978f8a2",
                "distance": 767,
                "inv_cdd": 2633960,
                "inv_fuso": 9668037,
                "is_active": 1,
                "created_at": "2026-10-16T03:23:10.000000Z",
                "updated_at": "2026-10-16T03:23:10.000000Z",
                "inv_towing": 1558515,
                "uj_towing": 2617982,
                "uj_cdd": 2733871,
                "uj_fuso": 7231503,
                "loading_in": "Ambon",
                "loading_out": "Makassar",
                "tarif_price_versions": [
                    {
                        "id": 43,
                        "uuid": "182662b2-9656-4722-8370-1d6a5fd0326d",
                        "tarif_id": 43,
                        "name": "Initial Price",
                        "uj_towing": 2617982,
                        "uj_cdd": 2733871,
                        "uj_fuso": 7231503
                    }
                ]
            },
            {
                "id": 42,
                "uuid": "8e641868-9e13-4317-9178-bcb1d1306a09",
                "distance": 749,
                "inv_cdd": 4104808,
                "inv_fuso": 3150050,
                "is_active": 1,
                "created_at": "2026-10-16T03:23:10.000000Z",
                "updated_at": "2026-10-16T03:23:10.000000Z",
                "inv_towing": 1418276,
                "uj_towing": 2712176,
                "uj_cdd": 1555396,
                "uj_fuso": 5449150,
                "loading_in": "Medan",
                "loading_out": "Denpasar",
                "tarif_price_versions": [
                    {
                        "id": 42,
                        "uuid": "be08c837-c715-48a9-afe0-f9ea227cad8a",
                        "tarif_id": 42,
                        "name": "Initial Price",
                        "uj_towing": 2712176,
                        "uj_cdd": 1555396,
                        "uj_fuso": 5449150
                    }
                ]
            }
        ],
        "first_page_url": "http://localhost:8000/wapi/master-data/tarif?page=1",
        "from": 1,
        "last_page": 6,
        "last_page_url": "http://localhost:8000/wapi/master-data/tarif?page=6",
        "links": [
            {
                "url": null,
                "label": "&laquo; Previous",
                "active": false
            },
            {
                "url": "http://localhost:8000/wapi/master-data/tarif?page=1",
                "label": "1",
                "active": true
            },
            {
                "url": "http://localhost:8000/wapi/master-data/tarif?page=2",
                "label": "2",
                "active": false
            },
            {
                "url": "http://localhost:8000/wapi/master-data/tarif?page=3",
                "label": "3",
                "active": false
            },
            {
                "url": "http://localhost:8000/wapi/master-data/tarif?page=4",
                "label": "4",
                "active": false
            },
            {
                "url": "http://localhost:8000/wapi/master-data/tarif?page=5",
                "label": "5",
                "active": false
            },
            {
                "url": "http://localhost:8000/wapi/master-data/tarif?page=6",
                "label": "6",
                "active": false
            },
            {
                "url": "http://localhost:8000/wapi/master-data/tarif?page=2",
                "label": "Next &raquo;",
                "active": false
            }
        ],
        "next_page_url": "http://localhost:8000/wapi/master-data/tarif?page=2",
        "path": "http://localhost:8000/wapi/master-data/tarif",
        "per_page": 10,
        "prev_page_url": null,
        "to": 10,
        "total": 51
    }
}
POST {{url}}/wapi/transaction/do-order-list
customer_id:4
company_id:4

POST {{url}}/wapi/transaction/do-order-list-tarif
do_orderlist_id:1
tarif_id:1
vehicle_type:fuso
delivery_destination:PT Arum Sekar
vehicle_id:1
driver_id:5

POST {{url}}/wapi/transaction/do-order-list-tarif-item
do_order_list_tarif_id:1
load_content:Vario 125
qty:10

GET {{url}}/wapi/transaction/do-order-list/:do_order_list_id
{
    "status": true,
    "message": "DO Order List details retrieved successfully",
    "errors": null,
    "data": {
        "id": 1,
        "uuid": "01229b5d-eece-46c1-b336-b21bb961c3d3",
        "code": "ORD-WJT/20261016-0001",
        "company_id": 4,
        "customer_id": 1,
        "description": "test",
        "is_has_invoice": false,
        "can_mark_done": false,
        "status": "draft",
        "created_at": "2026-10-16T06:41:13.000000Z",
        "updated_at": "2026-10-16T06:41:13.000000Z",
        "uj_driver": 5000000,
        "loading_in": null,
        "loading_out": null,
        "do_delivery_destination": "PT MENCARI CINTA SEJATI",
        "bill_invoice": 20000,
        "ppn": 220,
        "pph": 4000,
        "uj_towing": 5000000,
        "uj_cdd": null,
        "uj_fuso": null,
        "inv_towing": 20000,
        "inv_cdd": null,
        "inv_fuso": null,
        "driver": "Mansurin Camel",
        "customer": {
            "id": 1,
            "uuid": "7ed28bb0-2193-48fc-bd36-a2cb16afec7a",
            "company_id": 4,
            "code": "CUST-T/0001",
            "type": "customer",
            "name": "Rifqo Dwi Fahmi",
            "company_list": "PT Wajira Transindo",
            "company": {
                "id": 4,
                "uuid": "7c544d2f-edcd-4139-8df0-97200d644f2d",
                "slug": "wajira-transindo",
                "code": "4",
                "description": "PT Wajira Transindo",
                "type": "transport_office",
                "created_at": "2026-10-16T06:23:53.000000Z",
                "updated_at": "2026-10-16T06:23:53.000000Z",
                "name": "PT Wajira Transindo"
            }
        },
        "expeditions": [],
        "do_order_list_tarifs": [
            {
                "id": 1,
                "uuid": "93e8c3a8-8d78-4b65-a3a8-39b14de0db06",
                "do_orderlist_id": 1,
                "tarif_id": 51,
                "vehicle_type": "towing",
                "delivery_destination": "PT MENCARI CINTA SEJATI",
                "vehicle_id": 50,
                "driver_id": 2,
                "created_at": "2026-10-16T06:41:14.000000Z",
                "updated_at": "2026-10-16T06:41:14.000000Z",
                "tarif": {
                    "id": 51,
                    "uuid": "44f5bbce-c19d-4936-b4ba-fb8d02636647",
                    "distance": 340,
                    "inv_cdd": 10000,
                    "inv_fuso": 23999,
                    "is_active": 1,
                    "created_at": "2026-10-16T06:30:00.000000Z",
                    "updated_at": "2026-10-16T06:30:00.000000Z",
                    "inv_towing": 20000,
                    "uj_towing": 5000000,
                    "uj_cdd": 10100,
                    "uj_fuso": 10000,
                    "loading_in": null,
                    "loading_out": null
                },
                "vehicle": {
                    "id": 50,
                    "uuid": "9feba948-d497-48d7-91ad-bd6eaeda39d9",
                    "registration_number": "L 9796 QCR",
                    "type": "towing"
                },
                "driver": {
                    "id": 2,
                    "uuid": "5902ef7a-8f85-4f51-b4e9-46623bf7862a",
                    "name": "Mansurin Camel",
                    "company_list": "",
                    "company": null
                },
                "do_order_list_tarif_items": [
                    {
                        "id": 1,
                        "uuid": "96fea6db-3aad-40ea-b002-06258e420e27",
                        "do_order_list_tarif_id": 1,
                        "load_content": "KNLQE",
                        "qty": 1,
                        "created_at": "2026-10-16T06:41:14.000000Z",
                        "updated_at": "2026-10-16T06:41:14.000000Z"
                    }
                ]
            }
        ]
    }
}

GET {{url}}/wapi/transaction/do-order-list/:do_order_list_id
{
  "status": true,
  "message": "DO Order List details retrieved successfully",
  "errors": null,
  "data": {
    "id": 1,
    "uuid": "01229b5d-eece-46c1-b336-b21bb961c3d3",
    "code": "ORD-WJT/20261016-0001",
    "company_id": 4,
    "customer_id": 1,
    "description": "test",
    "is_has_invoice": false,
    "can_mark_done": false,
    "status": "draft",
    "created_at": "2026-10-16T06:41:13.000000Z",
    "updated_at": "2026-10-16T06:41:13.000000Z",
    "uj_driver": 5000000,
    "loading_in": "Pacitan,Serang,Serang",
    "loading_out": "Serang",
    "do_delivery_destination": "PT MENCARI CINTA SEJATI",
    "bill_invoice": 20000,
    "ppn": 220,
    "pph": 4000,
    "uj_towing": 5000000,
    "uj_cdd": null,
    "uj_fuso": null,
    "inv_towing": 20000,
    "inv_cdd": null,
    "inv_fuso": null,
    "driver": "Mansurin Camel",
    "customer": {
      "id": 1,
      "uuid": "7ed28bb0-2193-48fc-bd36-a2cb16afec7a",
      "company_id": 4,
      "code": "CUST-T/0001",
      "type": "customer",
      "name": "Rifqo Dwi Fahmi",
      "company_list": "PT Wajira Transindo",
      "company": {
        "id": 4,
        "uuid": "7c544d2f-edcd-4139-8df0-97200d644f2d",
        "slug": "wajira-transindo",
        "code": "4",
        "description": "PT Wajira Transindo",
        "type": "transport_office",
        "created_at": "2026-10-16T06:23:53.000000Z",
        "updated_at": "2026-10-16T06:23:53.000000Z",
        "name": "PT Wajira Transindo"
      }
    },
    "expeditions": [],
    "do_order_list_tarifs": [
      {
        "id": 1,
        "uuid": "93e8c3a8-8d78-4b65-a3a8-39b14de0db06",
        "do_orderlist_id": 1,
        "tarif_id": 51,
        "vehicle_type": "towing",
        "delivery_destination": "PT MENCARI CINTA SEJATI",
        "vehicle_id": 50,
        "driver_id": 2,
        "created_at": "2026-10-16T06:41:14.000000Z",
        "updated_at": "2026-10-16T06:41:14.000000Z",
        "tarif": {
          "id": 51,
          "uuid": "44f5bbce-c19d-4936-b4ba-fb8d02636647",
          "distance": 340,
          "inv_cdd": 10000,
          "inv_fuso": 23999,
          "is_active": 1,
          "created_at": "2026-10-16T06:30:00.000000Z",
          "updated_at": "2026-10-16T06:30:00.000000Z",
          "inv_towing": 20000,
          "uj_towing": 5000000,
          "uj_cdd": 10100,
          "uj_fuso": 10000,
          "loading_in": "Pacitan,Serang,Serang",
          "loading_out": "Serang",
          "routes": [
            {
              "id": 37,
              "name": "Pacitan",
              "address": "klodran no 15 jl pancawarna",
              "pivot": {
                "tarif_id": 51,
                "route_id": 37,
                "id": 101,
                "order": 1,
                "state_at": "loading_in",
                "created_at": "2026-10-16T06:30:00.000000Z",
                "updated_at": "2026-10-16T06:30:00.000000Z"
              }
            },
            {
              "id": 36,
              "name": "Serang",
              "address": "Pool / Area Serang",
              "pivot": {
                "tarif_id": 51,
                "route_id": 36,
                "id": 102,
                "order": 2,
                "state_at": "loading_in",
                "created_at": "2026-10-16T06:30:00.000000Z",
                "updated_at": "2026-10-16T06:30:00.000000Z"
              }
            },
            {
              "id": 36,
              "name": "Serang",
              "address": "Pool / Area Serang",
              "pivot": {
                "tarif_id": 51,
                "route_id": 36,
                "id": 103,
                "order": 3,
                "state_at": "loading_in",
                "created_at": "2026-10-16T06:30:00.000000Z",
                "updated_at": "2026-10-16T06:30:00.000000Z"
              }
            },
            {
              "id": 36,
              "name": "Serang",
              "address": "Pool / Area Serang",
              "pivot": {
                "tarif_id": 51,
                "route_id": 36,
                "id": 104,
                "order": 4,
                "state_at": "loading_out",
                "created_at": "2026-10-16T06:30:00.000000Z",
                "updated_at": "2026-10-16T06:30:00.000000Z"
              }
            }
          ]
        },
        "vehicle": {
          "id": 50,
          "uuid": "9feba948-d497-48d7-91ad-bd6eaeda39d9",
          "registration_number": "L 9796 QCR",
          "type": "towing"
        },
        "driver": {
          "id": 2,
          "uuid": "5902ef7a-8f85-4f51-b4e9-46623bf7862a",
          "name": "Mansurin Camel",
          "company_list": "",
          "company": null
        },
        "do_order_list_tarif_items": [
          {
            "id": 1,
            "uuid": "96fea6db-3aad-40ea-b002-06258e420e27",
            "do_order_list_tarif_id": 1,
            "load_content": "KNLQE",
            "qty": 1,
            "created_at": "2026-10-16T06:41:14.000000Z",
            "updated_at": "2026-10-16T06:41:14.000000Z"
          }
        ]
      }
    ]
  }
}