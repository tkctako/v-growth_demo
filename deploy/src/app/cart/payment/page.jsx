'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import useCartStore from '../../store/cartStore';

export default function PaymentPage() {
  const [formData, setFormData] = useState({
    // classroom: '',
    name: '',
    company_name: '',
    // guardian: '',
    postal: '',
    prefecture: '',
    address: '',
    tel: '',
    email: '',
    remarks: '',
    payment_method: 'creditcard' // 更新預設值
  });

  const [errors, setErrors] = useState({});
  const [customerId, setCustomerId] = useState(null);
  const [orderFormData, setOrderFormData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [orderFormLoading, setOrderFormLoading] = useState(false);

  const { cart, setProductDetail, getProductDetail } = useCartStore();
  const [productDetails, setProductDetailsState] = useState({});
  const [loading, setLoading] = useState(true);

  // 認証チェックとcustomer_id取得
  useEffect(() => {
    async function checkAuth() {
      try {
        setAuthLoading(true);
        const authRes = await fetch('/api/check-auth');
        const authData = await authRes.json();
        
        if (authData.customer_id && typeof authData.customer_id === 'number' && authData.customer_id !== -1) {
          setCustomerId(authData.customer_id);
          console.log('Customer ID obtained:', authData.customer_id);
          
          // order-form APIを呼び出し
          setOrderFormLoading(true);
          const orderFormRes = await fetch(`/api/order-form?customer_id=${authData.customer_id}`);
          const orderFormData = await orderFormRes.json();
          setOrderFormData(orderFormData);
          console.log('Order form data:', orderFormData);
          
          // 自動選擇第一個可用的付款方式
          if (orderFormData?.payments?.length > 0) {
            setFormData(prev => ({
              ...prev,
              payment_method: orderFormData.payments[0]
            }));
          }
        } else {
          console.log('Not authenticated or invalid customer_id');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setAuthLoading(false);
        setOrderFormLoading(false);
      }
    }
    
    checkAuth();
  }, []);

  useEffect(() => {
    async function fetchAllDetails() {
      const details = {};
      for (const item of cart) {
        let detail = useCartStore.getState().productDetailsCache[item.product_id];
        console.log('productDetailsCache', useCartStore.getState().productDetailsCache, item.product_id, useCartStore.getState().productDetailsCache[item.product_id]);
        if (!detail) {
          const res = await fetch(`/api/product-detail?product_id=${item.product_id}`);
          detail = await res.json();
          setProductDetail(item.product_id, detail);
        }
        details[item.product_id] = detail;
      }
      setProductDetailsState(details);
      setLoading(false);
    }
    if (cart.length > 0) {
      setLoading(true);
      fetchAllDetails();
    } else {
      setProductDetailsState({});
      setLoading(false);
    }
  }, [cart]);

  const getSubtotal = (item) => {
    const product = productDetails[item.product_id] || {};
    let base = product.price || 0;
    let extra = 0;
    // if (item.stylus) extra += 3000;
    // if (item.keyboard) extra += 5000;
    return (base + extra) * item.quantity;
  };
  const subtotal = cart.reduce((sum, item) => sum + getSubtotal(item), 0);
  // const shipping = cart.length > 0 ? 1000 : 0;
  const shipping = 0;
  const total = subtotal + shipping;

  // 字段名称映射到 orderFormData.field 中的 field_name
  const fieldNameMap = {
    company_name: '法人名',
    name: 'お名前',
    postal: '郵便番号',
    prefecture: '都道府県',
    address: '住所',
    tel: '電話番号',
    email: 'メールアドレス',
    remarks: '備考'
  };

  // 获取字段的 required 状态
  const getFieldRequired = (fieldId) => {
    if (!orderFormData?.field) return false;
    const fieldName = fieldNameMap[fieldId];
    const field = orderFormData.field.find(f => f.field_name === fieldName);
    return field?.required === true;
  };

  // 获取字段的 label
  const getFieldLabel = (fieldId) => {
    if (!orderFormData?.field) {
      // 如果没有 orderFormData，使用默认标签
      const defaultLabels = {
        company_name: '法人名',
        name: 'お名前',
        postal: '郵便番号',
        prefecture: '都道府県',
        address: '住所',
        tel: '電話番号',
        email: 'メールアドレス',
        remarks: '備考'
      };
      return defaultLabels[fieldId] || fieldId;
    }
    const fieldName = fieldNameMap[fieldId];
    const field = orderFormData.field.find(f => f.field_name === fieldName);
    return field?.field_name || fieldNameMap[fieldId] || fieldId;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // 只验证 required 的字段
    const fieldsToValidate = Object.keys(fieldNameMap);
    for (const fieldId of fieldsToValidate) {
      const isRequired = getFieldRequired(fieldId);
      if (isRequired) {
        const label = getFieldLabel(fieldId);
        const value = formData[fieldId];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          newErrors[fieldId] = `${label}を入力してください`;
        }
      }
    }

    // 郵便番号の形式チェック
    if (formData.postal) {
      const postalPattern = /^\d{3}-?\d{4}$/;
      if (!postalPattern.test(formData.postal)) {
        newErrors.postal = '郵便番号は正しい形式で入力してください（例：123-4567）';
      }
    }

    // 電話番号の形式チェック
    if (formData.tel) {
      const telPattern = /^\d{2,4}-?\d{2,4}-?\d{3,4}$/;
      if (!telPattern.test(formData.tel)) {
        newErrors.tel = '電話番号は正しい形式で入力してください（例：03-1234-5678）';
      }
    }

    // メールアドレスの形式チェック
    if (formData.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.email)) {
        newErrors.email = 'メールアドレスは正しい形式で入力してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit', e);
    if (validateForm()) {
      const orderId = Date.now();
      const amount = total;
      
      // 商品情報を準備 - 数量を考慮してグループ化
      const productGroups = {};
      
      // 商品をグループ化
      console.log('cart', cart);
      cart.forEach(item => {
        // cartStoreのgetProductDetailを使用して商品詳細を取得
        const productDetail = getProductDetail(item.product_id);
        console.log('productDetail', productDetail);
        const productName = productDetail.product_name;
        const productId = item.product_id;
        
        if (!productGroups[productId]) {
          productGroups[productId] = {
            name: productName,
            id: productId,
            quantity: 0
          };
        }
        productGroups[productId].quantity += item.quantity;
      });
      
      // フォーマットされた文字列を生成
      const productNames = Object.values(productGroups)
        .map(group => `${group.name}x${group.quantity}`)
        .join('/');
      
      const productIds = Object.values(productGroups)
        .map(group => `${group.id}x${group.quantity}`)
        .join('/');
      
      // 完全な注文データを準備
      const orderData = {
        orderId,
        amount,
        // classroom: formData.classroom,
        userName: formData.name,
        email: formData.email,
        customer_id: customerId, // 添加 customer_id
        // ユーザー入力データ
        customerInfo: {
          name: formData.name,
          company_name: formData.company_name,
          // guardian: formData.guardian,
          postal: formData.postal,
          prefecture: formData.prefecture,
          address: formData.address,
          tel: formData.tel,
          email: formData.email,
          remarks: formData.remarks,
          payment_method: formData.payment_method
        },
        // 商品情報
        products: {
          names: productNames,
          ids: productIds,
          items: cart,
          productDetails: productDetails
        },
        // 金額情報
        pricing: {
          subtotal,
          shipping,
          total
        }
      };
      console.log('orderData', orderData);
      
      // 根據付款方式選擇不同的 API
      let apiEndpoint;
      if (formData.payment_method === 'banking') {
        apiEndpoint = '/api/banking-pay';
      } else {
        apiEndpoint = '/api/gmo-linkpay';
      }
      
      console.log('使用 API:', apiEndpoint, '付款方式:', formData.payment_method);
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      
      console.log('res', res);
      const data = await res.json();
      console.log('data', data);
      
      // 處理 GMO 信用卡付款的重定向
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.success && formData.payment_method === 'banking') {
        // 銀行振込成功，跳轉到完成頁面
        window.location.href = `/cart/complete?orderId=${data.orderId}`;
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };



  return (
    <>
      <Header />
      
      <ul className="is-cart_navi flex flerx-stretch">
        <li>カート</li>
        <li className="current">情報入力</li>
        <li>注文完了</li>
      </ul>

      <div className="is-cart-wrap is-payment">
        <div className="is-cart-wrap-flex flex-set">
        <main className="is-page-main is-cart-main">
  <form className="cart-form" onSubmit={handleSubmit} noValidate>
    {/* <div className="form-group">
      <label htmlFor="classroom">教室名<span className="required">必須</span></label>
      <div className="select-wrapper">
        <select 
          id="classroom" 
          name="classroom" 
          value={formData.classroom}
          onChange={handleChange}
          required
        >
          <option value="">選択してください</option>
          {orderFormData?.field?.[0]?.menu?.map((classroom, index) => (
            <option key={index} value={classroom}>
              {classroom}
            </option>
          ))}
        </select>
      </div>
      {errors.classroom && <span className="error-message">{errors.classroom}</span>}
    </div> */}
    <div className="form-group">
      <label htmlFor="company_name">
        {getFieldLabel('company_name')}
        {getFieldRequired('company_name') && <span className="required">必須</span>}
      </label>
      <input
        type="text"
        id="company_name"
        name="company_name"
        value={formData.company_name}
        onChange={handleChange}
        required={getFieldRequired('company_name')}
      />
      {errors.company_name && <span className="error-message">{errors.company_name}</span>}
    </div>
    <div className="form-group">
      <label htmlFor="name">
        {getFieldLabel('name')}
        {getFieldRequired('name') && <span className="required">必須</span>}
      </label>
      <input
        type="text"
        id="name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required={getFieldRequired('name')}
      />
      {errors.name && <span className="error-message">{errors.name}</span>}
    </div>
    {/* <div className="form-group">
      <label htmlFor="guardian">保護者名<span className="required">必須</span></label>
      <input
        type="text"
        id="guardian"
        name="guardian"
        value={formData.guardian}
        onChange={handleChange}
        required
      />
      {errors.guardian && <span className="error-message">{errors.guardian}</span>}
    </div> */}
    <div className="form-group">
      <label htmlFor="postal">
        {getFieldLabel('postal')}
        {getFieldRequired('postal') && <span className="required">必須</span>}
      </label>
      <input
        type="text"
        id="postal"
        name="postal"
        value={formData.postal}
        onChange={handleChange}
        pattern="\d{3}-?\d{4}"
        placeholder="例：123-4567"
        required={getFieldRequired('postal')}
      />
      {errors.postal && <span className="error-message">{errors.postal}</span>}
    </div>
    <div className="form-group">
      <label htmlFor="prefecture">
        {getFieldLabel('prefecture')}
        {getFieldRequired('prefecture') && <span className="required">必須</span>}
      </label>
      <div className="select-wrapper">
        <select
          id="prefecture"
          name="prefecture"
          value={formData.prefecture}
          onChange={handleChange}
          required={getFieldRequired('prefecture')}
        >
          <option value="">選択してください</option>
          {orderFormData?.field?.find(f => f.field_name === '都道府県')?.menu?.map((prefecture, index) => (
            <option key={index} value={prefecture}>
              {prefecture}
            </option>
          ))}
        </select>
      </div>
      {errors.prefecture && <span className="error-message">{errors.prefecture}</span>}
    </div>
    <div className="form-group">
      <label htmlFor="address">
        {getFieldLabel('address')}
        {getFieldRequired('address') && <span className="required">必須</span>}
      </label>
      <input
        type="text"
        id="address"
        name="address"
        value={formData.address}
        onChange={handleChange}
        required={getFieldRequired('address')}
      />
      {errors.address && <span className="error-message">{errors.address}</span>}
    </div>
    <div className="form-group">
      <label htmlFor="tel">
        {getFieldLabel('tel')}
        {getFieldRequired('tel') && <span className="required">必須</span>}
      </label>
      <input
        type="tel"
        id="tel"
        name="tel"
        value={formData.tel}
        onChange={handleChange}
        pattern="\d{2,4}-?\d{2,4}-?\d{3,4}"
        placeholder="例：03-1234-5678"
        required={getFieldRequired('tel')}
      />
      {errors.tel && <span className="error-message">{errors.tel}</span>}
    </div>
    <div className="form-group">
      <label htmlFor="email">
        {getFieldLabel('email')}
        {getFieldRequired('email') && <span className="required">必須</span>}
      </label>
      <input
        type="email"
        id="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        required={getFieldRequired('email')}
      />
      {errors.email && <span className="error-message">{errors.email}</span>}
    </div>
    <div className="form-group">
      <label htmlFor="remarks">
        {getFieldLabel('remarks')}
        {getFieldRequired('remarks') && <span className="required">必須</span>}
      </label>
      <input
        type="text"
        id="remarks"
        name="remarks"
        value={formData.remarks}
        onChange={handleChange}
        rows={4}
        required={getFieldRequired('remarks')}
      />
      {errors.remarks && <span className="error-message">{errors.remarks}</span>}
    </div>
    <button type="submit"  style={{display: 'none'}} className="btn-cart">決済する</button>
  </form>
</main>

          <aside className="aside aside-cart aside-cart-peyment">
            <div className="aside-cart_box">
              <p className="ttl-main">お買い物カゴ</p>
              <form className="cart-form" onSubmit={handleSubmit}>
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

                <div className="howto_payment">
                  <p className="ttl-main">決済方法</p>
                  <div className="payment-options">
                    {orderFormData?.payments?.includes('creditcard') && (
                      <label className="payment-options_item">
                        <input
                          type="radio"
                          name="payment_method"
                          value="creditcard"
                          checked={formData.payment_method === 'creditcard'}
                          onChange={handleChange}
                        />
                        <span>クレジットカード決済</span>
                      </label>
                    )}
                    {orderFormData?.payments?.includes('banking') && (
                      <label className="payment-options_item">
                        <input
                          type="radio"
                          name="payment_method"
                          value="banking"
                          checked={formData.payment_method === 'banking'}
                          onChange={handleChange}
                        />
                        <span>銀行振込</span>
                      </label>
                    )}
                    {/* 代金引換は現在無効 */}
                    {/* {orderFormData?.payments?.includes('apply') && (
                      <label className="payment-options_item">
                        <input
                          type="radio"
                          name="payment_method"
                          value="apply"
                          checked={formData.payment_method === 'apply'}
                          onChange={handleChange}
                        />
                        <span>代金引換</span>
                      </label>
                    )} */}
                  </div>
                </div>
                <button type="submit" className="btn-cart">決済する</button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
