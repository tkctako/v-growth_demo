import { parseStringPromise } from 'xml2js';

// Lambda function configuration
const LAMBDA_FUNCTION_URL = 'https://sehin2d3nc.execute-api.us-east-1.amazonaws.com/prod';

export async function POST(req) {
  try {
    console.log('=== GMO LINKPAY API 開始 ===');
    console.log('請求時間:', new Date().toISOString());
    
    const data = await req.json();
    console.log('GMO LinkPay 請求數據:', data);

    // ユーザー情報を取得
    const info = data.customerInfo;
    console.log('客戶資訊:', info);

    // GMO/Epsilon Link Payment パラメータ
    const params = {
      contract_code: '74225830',
      classroom: data.classroom || '',
      order_number: data.orderId,
      item_code: data.products?.ids || '',
      item_name: data.products?.names || '',
      item_price: data.pricing?.total || 0,
      user_id: '1',
      user_name: info.name,
      orderer_name: info.name,
      mission_code: '1',
      process_code: '1',
      orderer_address: info.address,
      orderer_postal: info.postal.replace('-', ''), // ハイフンを除去
      orderer_tel: info.tel.replace(/-/g, ''),      // ハイフンを除去
      user_mail_add: info.email,
      st_code: '10000',
      return_url: 'https://www3.edu-cart.jp/shop/utransctionback',
      lang_id: 'ja',
      currency_id: 'JPY',
      xml: '1',
      version: '2',
      page_type: '2'
    };
    
    console.log('GMO に送信するパラメータ:', params);
    console.log('return_url 設定:', params.return_url);

    // x-www-form-urlencoded に変換
    const formBody = Object.entries(params)
      .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
      .join('&');

    console.log('GMO API に送信する form body:', formBody);
    console.log('GMO API URL: https://secure.epsilon.jp/cgi-bin/order/receive_order3.cgi');

    // GMO/Epsilon テスト API に直接 POST
    // 本番環境
    const gmoRes = await fetch('https://secure.epsilon.jp/cgi-bin/order/receive_order3.cgi', {
    // テスト環境
    // const gmoRes = await fetch('https://beta.epsilon.jp/cgi-bin/order/receive_order3.cgi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    });

    console.log('GMO API 回應狀態:', gmoRes.status);
    console.log('GMO API 回應 headers:', Object.fromEntries(gmoRes.headers.entries()));

    const text = await gmoRes.text();
    console.log('GMO からの XML レスポンス長度:', text.length);
    console.log('GMO からの XML レスポンス:', text);

    // XML を解析
    console.log('開始解析 GMO XML 回應...');
    const parsed = await parseStringPromise(text);
    console.log('解析後的 XML 結構:', JSON.stringify(parsed, null, 2));

    const redirectUrlEncoded = parsed?.Epsilon_result?.result?.find(
      r => r?.$?.redirect
    )?.$?.redirect;

    console.log('編碼的重定向 URL:', redirectUrlEncoded);

    const redirectUrl = redirectUrlEncoded ? decodeURIComponent(redirectUrlEncoded) : null;
    console.log('解碼後的重定向 URL:', redirectUrl);

    // 從重定向 URL 中提取 GMO 實際使用的 order_number
    let gmoOrderNumber = data.orderId; // 預設使用前端生成的 orderId
    if (redirectUrl) {
      try {
        const url = new URL(redirectUrl);
        const orderNumberFromUrl = url.searchParams.get('order_number');
        if (orderNumberFromUrl) {
          gmoOrderNumber = orderNumberFromUrl;
          console.log('從 GMO 重定向 URL 提取的 order_number:', gmoOrderNumber);
        }
      } catch (error) {
        console.error('解析重定向 URL 時發生錯誤:', error);
      }
    }

    // 如果 GMO 支付處理成功（有 redirectUrl），則保存訂單到資料庫
    if (redirectUrl) {
      try {
        console.log('GMO 支付處理成功，開始保存訂單到資料庫...');
        console.log('Lambda Function URL:', LAMBDA_FUNCTION_URL);
        
        // 準備訂單資料
        const orderData = {
          customer_id: data.customer_id || 1, // 從前端傳入的 customer_id
          order_status: 'pending', // 初始狀態為 pending
          order_data: {
            orderId: gmoOrderNumber, // 使用 GMO 實際使用的 order_number
            amount: data.pricing?.total || 0,
            classroom: data.classroom || '',
            customerInfo: {
              name: info.name,
              company_name: info.company_name,
              // guardian: info.guardian,
              postal: info.postal,
              prefecture: info.prefecture,
              address: info.address,
              tel: info.tel,
              email: info.email,
              remarks: info.remarks,
              payment_method: info.payment_method
            },
            products: {
              names: data.products?.names || '',
              ids: data.products?.ids || '',
              items: data.products?.items || [],
              productDetails: data.products?.productDetails || {}
            },
            pricing: {
              subtotal: data.pricing?.subtotal || 0,
              shipping: data.pricing?.shipping || 0,
              total: data.pricing?.total || 0
            },
            gmoData: {
              contract_code: params.contract_code,
              order_number: params.order_number,
              redirectUrl: redirectUrl
            }
          }
        };

        console.log('準備發送到 Lambda 的訂單資料:', JSON.stringify(orderData, null, 2));

        // 調用 Lambda 函數保存訂單
        console.log('調用 Lambda API:', `${LAMBDA_FUNCTION_URL}/orders`);
        const lambdaResponse = await fetch(`${LAMBDA_FUNCTION_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': 'ak_d98545386008dbcf1743337df60f038cdd336f270fa15bbd7e32cfa9d7ccee1f',
            'Origin': 'https://www3.edu-cart.jp'
          },
          body: JSON.stringify(orderData),
        });

        console.log('Lambda API 回應狀態:', lambdaResponse.status);
        console.log('Lambda API 回應 headers:', Object.fromEntries(lambdaResponse.headers.entries()));

        if (lambdaResponse.ok) {
          const savedOrder = await lambdaResponse.json();
          console.log('訂單已成功保存到資料庫:', savedOrder.order.order_id);
          console.log('完整的 Lambda 回應:', JSON.stringify(savedOrder, null, 2));
          
          // 在回應中包含訂單 ID
          return new Response(JSON.stringify({ 
            redirectUrl,
            orderId: savedOrder.order.order_id,
            orderInfoId: savedOrder.order.order_info_id,
            message: 'Order saved successfully'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          const errorText = await lambdaResponse.text();
          console.error('Lambda API 錯誤詳情:', {
            status: lambdaResponse.status,
            statusText: lambdaResponse.statusText,
            body: errorText
          });
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { error: errorText };
          }
          console.error('保存訂單失敗:', errorData);
          
          // 即使保存失敗，仍然返回 redirectUrl 讓用戶繼續支付流程
          return new Response(JSON.stringify({ 
            redirectUrl,
            warning: 'Payment processed but order not saved to database',
            error: errorData.error
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.error('=== 保存訂單時發生錯誤 ===');
        console.error('錯誤詳情:', error);
        console.error('錯誤訊息:', error.message);
        console.error('錯誤堆疊:', error.stack);
        
        // 即使發生錯誤，仍然返回 redirectUrl 讓用戶繼續支付流程
        return new Response(JSON.stringify({ 
          redirectUrl,
          warning: 'Payment processed but order save failed',
          error: error.message
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 如果沒有 redirectUrl，返回錯誤
    console.error('=== GMO 支付處理失敗 ===');
    console.error('沒有獲得重定向 URL，支付處理失敗');
    
    return new Response(JSON.stringify({ 
      error: 'Payment processing failed',
      redirectUrl: null 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('=== GMO LINKPAY API 發生未預期錯誤 ===');
    console.error('錯誤詳情:', error);
    console.error('錯誤訊息:', error.message);
    console.error('錯誤堆疊:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      detail: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}