import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // 從 header 中獲取 customer_id
    const customerIdHeader = request.headers.get('customer_id');
    const apiKey = process.env.EDU_CART_API_KEY;
    
    if (!customerIdHeader) {
      return NextResponse.json({ error: '缺少 customer_id header' }, { status: 400 });
    }

    const customer_id = customerIdHeader;
    
    if (!apiKey) {
      return NextResponse.json({ error: '缺少 API 金鑰' }, { status: 500 });
    }

    // 調用外部 Logo API
    const logoUrl = `https://api.edu-cart.jp/customers/logo/${customer_id}`;
    console.log('Calling logo API:', logoUrl, 'customer_id:', customer_id);
    
    const logoRes = await fetch(logoUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });

    if (!logoRes.ok) {
      const errorText = await logoRes.text();
      console.error('Logo API 調用失敗:', logoRes.status, errorText);
      return NextResponse.json(
        { error: 'Logo API 調用失敗', status: logoRes.status, detail: errorText },
        { status: logoRes.status }
      );
    }

    const data = await logoRes.json();
    console.log('Logo API 返回數據:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Logo:', error);
    return NextResponse.json({ error: '查詢失敗', detail: error.message }, { status: 500 });
  }
}

