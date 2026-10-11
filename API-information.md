POSTT {{url}}/wapi/finance/cash-flow
request body:
{                                                    
      "company_id": 1,                                   
      "date": "2026-10-10",                              
      "note": "Kas harian pembayaran operasional kantor",
      "cash_flow_cashes": [                              
        {                                                
          "cash_id": 1,                                  
          "amount": 1500000.00,                          
          "amount_original": 1500000.00,                 
          "type": "debet"                                
        },                                               
        {                                                
          "cash_id": 2,                                  
          "amount": 500000.00,                           
          "amount_original": 500000.00,                  
          "type": "credit"                               
        }                                                
      ]                                                  
    }      

PUT {{url}}/wapi/finance/cash-flow/:cash_flow_id
request body:
{                                                    
      "company_id": 1,                                   
      "date": "2026-10-10",                              
      "note": "Kas harian pembayaran operasional kantor saja",
      "cash_flow_cashes": [                              
        {                                                
          "cash_id": 1,                                  
          "amount": 300000.00,                          
          "amount_original": 1500000.00,                 
          "type": "debet"                                
        },                                               
        {                                                
          "cash_id": 2,                                  
          "amount": 400.00,                           
          "amount_original": 500000.00,                  
          "type": "credit"                               
        },
        {                                                
          "cash_id": 1,                                  
          "amount": 300000.00,                          
          "amount_original": 1500000.00,                 
          "type": "debet"                                
        }                                                
      ]                                                  
    }      