'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '../components/Header';
import CartRelatedSwiper from '../components/CartRelatedSwiper';
import useCartStore from '../store/cartStore';

export default function CartPage() {
  const { cart, productDetailsCache, setProductDetail, updateCartQuantity, removeFromCart } = useCartStore();
  const [loading, setLoading] = useState(true);
  const [quantityInputs, setQuantityInputs] = useState({});

  // 初始化數量輸入框的本地狀態
  useEffect(() => {
    const inputs = {};
    cart.forEach(item => {
      inputs[item.product_id] = item.quantity;
    });
    setQuantityInputs(inputs);
  }, [cart]);

  useEffect(() => {
    async function fetchAllDetails() {
      console.log('cart', cart);
      for (const item of cart) {
        let detail = productDetailsCache[item.product_id];
        console.log('productDetailsCache', productDetailsCache, item.product_id, productDetailsCache[item.product_id]);
        if (!detail) {
          const res = await fetch(`/api/product-detail?product_id=${item.product_id}`);
          detail = await res.json();
          setProductDetail(item.product_id, detail);
        }
      }
      setLoading(false);
    }
    if (cart.length > 0) {
      setLoading(true);
      fetchAllDetails();
    } else {
      setLoading(false);
    }
  }, [cart]);

  const getSubtotal = (item) => {
    const product = productDetailsCache[item.product_id] || {};
    let base = product.price || 0;
    let extra = 0;
    return (base + extra) * item.quantity;
  };

  const subtotal = cart.reduce((sum, item) => sum + getSubtotal(item), 0);
  // const shipping = cart.length > 0 ? 1000 : 0;
  const shipping = 0;
  const total = subtotal + shipping;

  // 處理數量變更的函數
  const handleQuantityChange = useCallback((product_id, value) => {
    const newQuantity = Math.max(1, Number(value) || 1);
    setQuantityInputs(prev => ({
      ...prev,
      [product_id]: newQuantity
    }));
  }, []);

  // 處理數量輸入框失去焦點時更新購物車
  const handleQuantityBlur = useCallback((product_id) => {
    const newQuantity = quantityInputs[product_id];
    if (newQuantity && newQuantity !== cart.find(item => String(item.product_id) === String(product_id))?.quantity) {
      updateCartQuantity(product_id, newQuantity);
    }
  }, [quantityInputs, cart, updateCartQuantity]);

  return (
    <div className="is-cart">
      <Header />
      
      <ul className="is-cart_navi flex flerx-stretch">
        <li className="current">カート</li>
        <li>情報入力</li>
        <li>注文完了</li>
      </ul>

      <div className="is-cart-wrap">
        <div className="is-cart-wrap-flex flex-set">
          <main className="is-page-main is-cart-main">
            <form className="cart-form" action="" method="POST">
              <div className="is-cart-table">
                <table className="table_clm table_clm-cart">
                  <tbody>
                    <tr>
                      <th className="item">商品</th>
                      <th className="price">金額</th>
                      <th className="quantity">個数</th>
                      <th className="subtotal">小計</th>
                      <th className="delete"></th>
                    </tr>
                    {cart.length === 0 ? "" : (
                      cart.map((item, idx) => {
                        const product = productDetailsCache[item.product_id] || {};
                        return (
                          <tr key={idx}>
                            <td className="item">
                              <div className="thumb">
                                <i
                                  className="delete-ic"
                                  onClick={() => removeFromCart(item.product_id)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <img src="images/common/ic-cross.svg" alt="削除" />
                                </i>
                                <img src={product.product_img?.[0] || ''} alt="" /></div>
                              <span className="ttl">
                                <a href={`/products?product_id=${item.product_id}`}>
                                  {product.product_name || '---'}
                                </a>
                              </span>
                              {/* 暫時隱藏 - スタイラスペンと無線キーボード */}
                              {false && (
                                <div style={{fontSize:'12px',color:'#888'}}>
                                  {item.stylus ? 'スタイラスペンあり' : 'スタイラスペンなし'}／{item.keyboard ? '無線キーボードあり' : '無線キーボードなし'}
                                </div>
                              )}
                            </td>
                            <td className="price en">¥{product.price?.toLocaleString() || 0}</td>
                            <td className="quantity">
                              <input
                                type="number"
                                className="input-text qty text en"
                                name=""
                                value={quantityInputs[item.product_id] || item.quantity}
                                min={1}
                                onChange={e => {
                                  handleQuantityChange(item.product_id, e.target.value);
                                }}
                                onBlur={() => {
                                  handleQuantityBlur(item.product_id);
                                }}
                              />
                            </td>
                            <td className="subtotal en">¥{getSubtotal(item).toLocaleString()}</td>
                            <td className="delete"><a href="" onClick={(e) => { e.preventDefault(); removeFromCart(item.product_id); }}>削除</a></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="is-cart-btn">
                <ul className="is-cart-btn_lists flex-set">
                 
                  <li className="is-cart-btn_lists__item continue">
                    <a href="/">買い物を続ける</a>
                  </li>
                </ul>
              </div>
            </form>
          </main>
          
          <aside className="aside aside-cart aside-cart-item">
            <div className="aside-cart_box">
              <p className="ttl-main">お買い物カゴ</p>
              <form className="cart-form" action="/cart/payment" method="POST">
                <table className="table_clm table_clm-cart_side">
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={2}>金額計算中...</td></tr>
                    ) : (
                      <>
                        <tr>
                          <th>小計</th>
                          <td>¥{subtotal.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <th>送料</th>
                          <td>¥{shipping.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <th>合計</th>
                          <td>¥{total.toLocaleString()}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
                
                <button className="btn-cart" type="submit">
                  注文手続きに進む
                </button>
                <ul className="cart-nav">
                  <li><a href="/guidance/terms-of-service#shipping">送料について</a></li>
                  <li><a href="/guidance/terms-of-service#returns">返品・交換について</a></li>
                  <li><a href="https://www.v-growth.co.jp/policy/">プライバシーポリシー</a></li>
                </ul>
              </form>
            </div>
          </aside>
        </div>
        {/* 関連商品は現在非表示 */}
        {/* <CartRelatedSwiper /> */}
      </div>
    </div>
  );
}
