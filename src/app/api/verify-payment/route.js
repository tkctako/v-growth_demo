import { NextResponse } from 'next/server';

// Lambda function configuration
const LAMBDA_FUNCTION_URL = 'https://sehin2d3nc.execute-api.us-east-1.amazonaws.com/prod';

export async function POST(request) {
  try {
    console.log('=== VERIFY PAYMENT API 開始 ===');
    console.log('請求時間:', new Date().toISOString());
    
    const requestBody = await request.json();
    console.log('請求內容:', requestBody);
    
    const { order_number, contract_code = '74225830', order_id, order_info_id } = requestBody;

    if (!order_number) {
      console.error('缺少 order_number 參數');
      return NextResponse.json({ 
        error: 'order_number is required' 
      }, { status: 400 });
    }

    console.log('開始付款驗證流程:', { order_number, order_id, order_info_id });

    // Step 1: 查詢 GMO 付款狀態
    console.log('Step 1: 查詢 GMO 付款狀態...');
    
    const gmoParams = {
      contract_code,
      order_number
    };

    console.log('GMO API 請求參數:', gmoParams);

    const formBody = Object.entries(gmoParams)
      .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
      .join('&');

    console.log('GMO API 請求 body:', formBody);
    console.log('GMO API URL: https://secure.epsilon.jp/cgi-bin/order/getsales2.cgi');

    const gmoRes = await fetch('https://secure.epsilon.jp/cgi-bin/order/getsales2.cgi', {
    // const gmoRes = await fetch('https://beta.epsilon.jp/cgi-bin/order/getsales2.cgi', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; OrderStatusChecker/1.0)'
      },
      body: formBody,
    });

    console.log('GMO API 回應狀態:', gmoRes.status);
    console.log('GMO API 回應 headers:', Object.fromEntries(gmoRes.headers.entries()));

    if (!gmoRes.ok) {
      console.error('GMO API 回應錯誤:', gmoRes.status);
      const errorText = await gmoRes.text();
      console.error('GMO API 錯誤內容:', errorText);
      return NextResponse.json({ 
        error: 'GMO API request failed',
        status: gmoRes.status,
        detail: errorText
      }, { status: 500 });
    }

    const responseText = await gmoRes.text();
    console.log('GMO API 原始回應長度:', responseText.length);
    console.log('GMO API 原始回應:', responseText);

    // 解析 GMO 回應 - 處理 XML 和 key=value 格式
    let gmoData = {};
    
    // 檢查是否為 XML 格式
    if (responseText.includes('<?xml') || responseText.includes('<Epsilon_result>')) {
      console.log('檢測到 XML 格式回應');
      
      // 如果是 XML 且為空結果，表示訂單不存在或未找到
      if (responseText.includes('<Epsilon_result></Epsilon_result>') || 
          responseText.includes('<Epsilon_result>\n</Epsilon_result>')) {
        gmoData = {
          order_number: order_number,
          state: '0', // 未找到訂單，視為未付款
          trans_code: null
        };
      } else {
        // 解析 XML 內容
        try {
          const parseStringPromise = require('xml2js').parseStringPromise;
          const parsed = await parseStringPromise(responseText);
          console.log('解析後的 XML 結構:', JSON.stringify(parsed, null, 2));
          
          // 從 XML 中提取數據
          const results = parsed?.Epsilon_result?.result || [];
          gmoData = {
            order_number: order_number,
            state: '0', // 默認值
            trans_code: null,
            xml_response: responseText
          };
          
          // 遍歷所有 result 元素來提取數據
          results.forEach(result => {
            if (result.$) {
              Object.keys(result.$).forEach(key => {
                gmoData[key] = result.$[key];
              });
            }
          });
          
          console.log('從 XML 提取的數據:', gmoData);
        } catch (error) {
          console.error('XML 解析失敗:', error);
          gmoData = {
            order_number: order_number,
            state: '0',
            trans_code: null,
            xml_response: responseText
          };
        }
      }
    } else {
      // 解析 key=value 格式
      responseText.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
          gmoData[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });
    }

    const state = gmoData.state;
    let paymentStatus = 'unknown';
    let isPaid = false;

    switch (state) {
      case '1':
        paymentStatus = 'paid';
        isPaid = true;
        break;
      case '0':
        paymentStatus = 'unpaid';
        isPaid = false;
        break;
      case '5':
        paymentStatus = 'authorized';
        isPaid = false;
        break;
      case '9':
        paymentStatus = 'cancelled';
        isPaid = false;
        break;
      case '21':
        paymentStatus = 'processing';
        isPaid = false;
        break;
      default:
        paymentStatus = 'unknown';
        isPaid = false;
    }

    console.log('GMO 付款狀態:', { state, paymentStatus, isPaid });

    // Step 2: 如果付款完成，更新訂單狀態
    let orderUpdateResult = null;
    
    if (isPaid) {
      console.log('Step 2: 付款完成，更新訂單狀態...');
      
      // 如果沒有提供 order_id 或 order_info_id，先根據 order_number 查找訂單
      let targetOrderId = order_id || order_info_id;
      
      if (!targetOrderId) {
        console.log('沒有提供 order_id，嘗試根據 order_number 查找訂單...');
        try {
          const searchResponse = await fetch(`${LAMBDA_FUNCTION_URL}/orders`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': process.env.LAMBDA_API_KEY || 'ak_d98545386008dbcf1743337df60f038cdd336f270fa15bbd7e32cfa9d7ccee1f',
              'Origin': process.env.ALLOWED_ORIGIN || 'https://www3.edu-cart.jp'
            },
          });
          
          if (searchResponse.ok) {
            const response = await searchResponse.json();
            console.log('所有訂單:', response);
            
            // 處理 Lambda 返回的數據結構
            const orders = response.orders || response;
            console.log('訂單數組:', orders);
            
            // 根據 order_number 查找對應的訂單
            const matchingOrder = orders.find(order => {
              const orderData = typeof order.order_data === 'string' 
                ? JSON.parse(order.order_data) 
                : order.order_data;
              // 比較時轉換為字符串，確保類型一致
              return String(orderData?.orderId) === String(order_number);
            });
            
            if (matchingOrder) {
              targetOrderId = matchingOrder.order_id;
              console.log('找到匹配的訂單:', matchingOrder.order_id);
            } else {
              console.log('未找到匹配的訂單');
            }
          }
        } catch (error) {
          console.error('查找訂單時發生錯誤:', error);
        }
      }
      
      if (targetOrderId) {
        const updateData = {
          order_status: 'paid'
        };

        const lambdaUrl = `${LAMBDA_FUNCTION_URL}/orders/${targetOrderId}`;

        try {
          const lambdaResponse = await fetch(lambdaUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': process.env.LAMBDA_API_KEY || 'ak_d98545386008dbcf1743337df60f038cdd336f270fa15bbd7e32cfa9d7ccee1f',
              'Origin': process.env.ALLOWED_ORIGIN || 'https://www3.edu-cart.jp'
            },
            body: JSON.stringify(updateData),
          });

          if (lambdaResponse.ok) {
            orderUpdateResult = await lambdaResponse.json();
            console.log('訂單狀態更新成功:', orderUpdateResult);
          } else {
            const errorData = await lambdaResponse.json();
            console.error('訂單狀態更新失敗:', errorData);
          }
        } catch (error) {
          console.error('更新訂單狀態時發生錯誤:', error);
        }
      }
    }

    // 返回綜合結果
    const result = {
      order_number: gmoData.order_number || order_number,
      trans_code: gmoData.trans_code,
      state: state,
      payment_status: paymentStatus,
      is_paid: isPaid,
      order_update: orderUpdateResult,
      gmo_response: gmoData
    };

    console.log('付款驗證完成:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('付款驗證時發生錯誤:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      detail: error.message 
    }, { status: 500 });
  }
}
