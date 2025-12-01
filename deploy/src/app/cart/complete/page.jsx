'use client';

import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import useCartStore from '../../store/cartStore';

export default function CartCompletePage() {
  const clearCart = useCartStore(state => state.clearCart);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [paymentType, setPaymentType] = useState(null); // 支払い方法を追跡

  useEffect(() => {
    console.log('=== CART COMPLETE ページ読み込み ===');
    console.log('現在の URL:', window.location.href);
    console.log('現在の search:', window.location.search);
    
    // ネイティブJavaScriptでURLパラメータを取得
    const urlParams = new URLSearchParams(window.location.search);
    const allParams = {};
    for (const [key, value] of urlParams.entries()) {
      allParams[key] = value;
    }
    
    console.log('すべての URL パラメータ:', allParams);
    
    const result = urlParams.get('result');
    const orderNumber = urlParams.get('order_number');
    const transCode = urlParams.get('trans_code');
    const userId = urlParams.get('user_id');
    const orderId = urlParams.get('orderId');

    console.log('解析された URL パラメータ:', { result, orderNumber, transCode, userId, orderId });

    // 支払い方法を判定
    if (orderId) {
      // orderIdがある = 銀行振込
      console.log('銀行振込の注文を検出');
      setPaymentType('banking');
      setPaymentStatus({ is_paid: true }); // 銀行振込は既に完了している
      clearCart();
      console.log('注文成功、カートをクリアしました', { orderId });
    } else if (orderNumber) {
      // order_numberがある = GMO決済
      console.log('GMO決済の注文を検出');
      setPaymentType('gmo');
      if (result === '1') {
        clearCart();
      }
      // GMO決済の場合は verifyPayment は呼び出さない（APIがないため）
      console.log('order_numberを検出しましたが、verifyPayment APIは未実装のためスキップ');
      // 将来 verifyPayment API が実装されたら、ここでコメントアウトを外す
      // verifyPayment(orderNumber);
    } else if (result === '1') {
      // result=1 がある場合も成功として扱う
      console.log('result=1を検出、注文成功');
      setPaymentStatus({ is_paid: true });
      clearCart();
    }
  }, [clearCart]);

  const verifyPayment = async (orderNumber) => {
    console.log('=== 支払い検証フロー開始 ===');
    console.log('注文番号:', orderNumber);
    
    setIsVerifying(true);
    setVerificationError(null);

    try {
      console.log('/api/verify-payment API を呼び出し準備');
      console.log('リクエストパラメータ:', {
        order_number: orderNumber,
        contract_code: '74225830'
      });

      // 支払い検証 API を呼び出し
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_number: orderNumber,
          contract_code: '74225830' // 契約番号を使用
        }),
      });

      console.log('API レスポンスステータス:', response.status);
      console.log('API レスポンス OK:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API レスポンスエラー詳細:', errorText);
        throw new Error(`API レスポンスエラー: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('支払い検証 API 完全レスポンス:', result);

      setPaymentStatus(result);

      // 支払いが成功した場合、カートをクリア
      if (result.is_paid) {
        console.log('支払い検証成功、カートをクリア');
        clearCart();
        console.log('カートがクリアされました');
      } else {
        console.log('支払い検証で未払いが表示、カート状態を維持');
      }

    } catch (error) {
      console.error('=== 支払い検証失敗 ===');
      console.error('エラー詳細:', error);
      console.error('エラーメッセージ:', error.message);
      console.error('エラースタック:', error.stack);
      setVerificationError(error.message);
    } finally {
      console.log('支払い検証フロー終了');
      setIsVerifying(false);
    }
  };

  return (
    <>
      <Header />
      
      <ul className="is-cart_navi flex flerx-stretch">
        <li>カート</li>
        <li>情報入力</li>
        <li className="current">注文完了</li>
      </ul>

      <div className="is-cart-wrap">
        <main className="is-page-main is-cart-main is-complete-main">
          <h3 className="ttl">注文完了</h3>
          
          {/* 支払い検証状態表示 */}
          {isVerifying && (
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f0f8ff', 
              border: '1px solid #007bff', 
              borderRadius: '4px',
              marginBottom: '20px'
            }}>
              <p>🔍 支払い状態を確認中...</p>
            </div>
          )}

          {verificationError && (
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffc107', 
              borderRadius: '4px',
              marginBottom: '20px'
            }}>
              <p>⚠️ 支払い検証に失敗しました: {verificationError}</p>
              <p>カスタマーサービスにお問い合わせください</p>
            </div>
          )}


          {paymentStatus && !paymentStatus.is_paid ? (
            <div>
              <p className="lead">
                支払いが完了していないか、処理中です。<br />
                しばらくお待ちください。またはカスタマーサービスにお問い合わせください。
              </p>
              <p className="btn-more">
                <button onClick={() => window.location.reload()}>再確認</button>
              </p>
              <p className="btn-more"><a href="/">トップページ</a></p>
            </div>
          ) : (
            <div>
              <p className="lead">
                お買い上げありがとうございました。<br />
                {paymentType === 'banking' ? (
                  <>
                    銀行振込でのご注文をお受けいたしました。<br />
                    ご入金確認後、商品発送準備をいたします。
                  </>
                ) : (
                  '商品発送準備が完了次第、発送いたします。'
                )}
              </p>
              <p className="btn-more"><a href="/">トップページ</a></p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
