'use client';

import { useEffect, useState, Suspense } from 'react';
import Header from '../components/Header';
import { useSearchParams } from 'next/navigation';
import Swiper from 'swiper';
import { Navigation, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import useCartStore from '../store/cartStore';

// useSearchParams を使用したコンポーネントを作成
function ProductDetailContent() {
  const searchParams = useSearchParams();
  const product_id = searchParams.get('product_id');
  const { getProductDetail, setProductDetail } = useCartStore();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const { addToCart } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [stylus, setStylus] = useState(true);
  const [keyboard, setKeyboard] = useState(true);
  const [bannerData, setBannerData] = useState(null);

  useEffect(() => {
    if (!product_id) {
      setError('product_id 不存在');
      setIsDataLoaded(true);
      return;
    }
    let detail = getProductDetail(product_id);
    if (detail) {
      setProduct(detail);
      setIsDataLoaded(true);
    } else {
      fetch(`/api/product-detail?product_id=${product_id}`)
        .then(res => res.json())
        .then(data => {
          if (data.product_id) {
            setProduct(data);
            setProductDetail(product_id, data); // 存入暫存
          } else {
            setError('查無商品資料');
          }
        })
        .catch(() => setError('API 連線失敗'))
        .finally(() => {
          setIsDataLoaded(true);
        });
    }
  }, [product_id, getProductDetail, setProductDetail]);

  useEffect(() => {
    // データが読み込まれて商品データが存在する場合にのみ Swiper を初期化
    if (isDataLoaded && product && Array.isArray(product.product_img)) {
      // Swiper を初期化
      const thumbsSwiper = new Swiper('#thumbnail', {
        modules: [Navigation],
        spaceBetween: 10,
        slidesPerView: 4,
        freeMode: true,
        watchSlidesProgress: true,
      });

      new Swiper('#slide', {
        modules: [Navigation, Thumbs],
        spaceBetween: 10,
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
        thumbs: {
          swiper: thumbsSwiper,
        },
      });
    }
  }, [isDataLoaded, product]);

  // Banner API 取得
  useEffect(() => {
    fetch('/api/check-auth')
      .then(res => res.json())
      .then(auth => {
        if (auth.customer_id && typeof auth.customer_id === 'number' && auth.customer_id !== -1) {
          // Banner API を取得
          return fetch(`/api/banner?customer_id=${auth.customer_id}`);
        } else {
          throw new Error('認証されていません');
        }
      })
      .then(res => res.json())
      .then(data => {
        setBannerData(data.banners);
        console.log('Banner data received:', data);
      })
      .catch(() => console.error('Banner API 接続エラー'));
  }, []);

  return (
    <div className="is-single-wrap flex-set">
      <main className="is-page-main is-single-main">
        {error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : !product ? (
          <div>読み込み中...</div>
        ) : (
          <>
            <div className="is-single-hdr flex-set">
              <div className="thumb">
                <div id="slide" className="swiper-single slider-main">
                  <div className="swiper-wrapper">
                    {Array.isArray(product.product_img) && product.product_img.map((img, idx) => (
                      <div className="swiper-slide" key={idx}>
                        <img src={img} alt={product.product_name} />
                      </div>
                    ))}
                  </div>
                </div>
                <div id="thumbnail" className="swiper-single slider-thumbnail">
                  <div className="swiper-wrapper">
                    {Array.isArray(product.product_img) && product.product_img.map((img, idx) => (
                      <div className="swiper-slide" key={idx}>
                        <img src={img} alt={product.product_name + ' 縮圖'} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="introduction">
                <h3 className="ttl-post">{product.product_name}</h3>
                <ul className="excerpt">
                  <li>{product.description}</li>
                </ul>
                <p className="price en">¥{product.price?.toLocaleString()}<small>(税込)</small></p>
                {/* <p className="campaign">【まとめ買い】5点以上まとめ買いで5%OFF</p> */}
              </div>
            </div>

            <div className="is-single-body">
              <div className="is-single-body-txt_box is-single-txt_box-detail">
                <h3>商品詳細</h3>
                <p>{product.description}</p>
              </div>

              <div className="is-single-body-txt_box">
                <p><small>※詳細はFAQでもご確認いただけます。</small></p>
                <h3>保守内容</h3>
                <ul>
                  <li>自然故障とアクシデント物損(落下・破損・水没など)を含む保守サービスです。</li>
                  <li>障害ごとの追加請求や上限金額、回数制限などは一切ありません。</li>
                  <li>センドバック方式となりますので、故障機を送付頂き、修理機をご指定場所へ送付致します。</li>
                </ul>
              </div>

              <div className="is-single-body-txt_box">
                <h3>対象範囲外</h3>
                <ul>
                  <li>火災・落雷・地震・天災・盗難・紛失は、保守の対象外となります。</li>
                  <li>付属品のUSBケーブルは対象外です。</li>
                  <li>MDM登録に関するサポートは対象外となります。</li>
                  <li>海外での利用でも保守対象となりますが、修理品・代替機器の送付は国内とさせて頂きます。差額お客様負担の場合は対応させて頂きます。</li>
                  <li>サービスは「機器シリアル番号」と「お客様名」によって契約・管理されます。持ち主の変更などの場合は対象とされません。</li>
                  <li>弊社、及び 弊社指定業者以外の者による修理・改造による故障は範囲外とさせて頂きます。</li>
                  <li>内蔵バッテリーの経年劣化は範囲外になります。</li>
                  <li>ウィルス感染、ソフトウェアに起因する故障は対象外になります。</li>
                  <li>お客様の故意・重大な過失により生じた故障は範囲外となります。</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </main>

      <aside className="aside aside-cart">
        <div className="aside-cart_box">
          <p className="ttl-product">{product ? product.product_name : ''}</p>
          <p className="price en">
            {product ? `¥${product.price?.toLocaleString()}` : ''}
            <small>(税込)</small>
          </p>
          <form className="cart-form" onSubmit={e => {
            e.preventDefault();
            if (product) {
              addToCart(product, { quantity: Number(quantity), stylus, keyboard });
              window.location.href = '/cart';
            }
          }}>
            <div className="form-group">
              <label htmlFor="quantity">個数を選択してご注文にお進みください。</label>
              <div className="select-wrapper">
                <select name="quantity" id="quantity" className="form-control" value={quantity} onChange={e => setQuantity(e.target.value)}>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
            </div>
            {/* 一時的に非表示 - スタイラスペン */}
            {false && (
              <div className="form-group">
                <label htmlFor="option1">スタイラスペン</label>
                <div className="select-wrapper">
                  <select name="option1" id="option1" className="form-control" value={stylus ? 'with_stylus' : 'without_stylus'} onChange={e => setStylus(e.target.value === 'with_stylus')}>
                    <option value="with_stylus">あり</option>
                    <option value="without_stylus">なし</option>
                  </select>
                </div>
              </div>
            )}
            {/* 一時的に非表示 - 無線キーボード */}
            {false && (
              <div className="form-group">
                <label htmlFor="option2">無線キーボード</label>
                <div className="select-wrapper">
                  <select name="option2" id="option2" className="form-control" value={keyboard ? 'with_keyboard' : 'without_keyboard'} onChange={e => setKeyboard(e.target.value === 'with_keyboard')}>
                    <option value="with_keyboard">あり</option>
                    <option value="without_keyboard">なし</option>
                  </select>
                </div>
              </div>
            )}
            <button type="submit" className="btn-cart ">カートに入れる</button>
          </form>
        </div>
        <div className="aside-bnr">
          <ul className="aside-bnr_lsts">
            {bannerData && Array.isArray(bannerData) ? (
              <>
                {bannerData
                  .filter(b => b.banner_type && b.banner_type.startsWith('product-'))
                  .map((banner, index) => (
                    <li key={banner.banner_type || index} className="aside-bnr_lists__item">
                      <a href="">
                        <img src={banner.banner_url || `/images/common/bnr-${index + 1}.png`} alt="" />
                      </a>
                    </li>
                  ))}
              </>
            ) : (
              // バナーデータがない場合はデフォルト画像を表示
              <>
                {/* <li className="aside-bnr_lists__item">
                  <a href=""><img src="/images/common/bnr-1.png" alt="" /></a>
                </li>
                <li className="aside-bnr_lists__item">
                  <a href=""><img src="/images/common/bnr-2.png" alt="" /></a>
                </li> */}
              </>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}

// 加載狀態組件
function ProductDetailLoading() {
  return (
    <div className="is-single-wrap flex-set">
      <main className="is-page-main is-single-main">
        <div>読み込み中...</div>
      </main>
    </div>
  );
}

export default function ProductDetail() {
  const { cart, getCartCount } = useCartStore();

  // 仮に商品リストがあるとします
  const products = [
    { product_id: 1, name: '商品A' },
    { product_id: 2, name: '商品B' },
    { product_id: 3, name: '商品C' },
  ];

  return (
    <>
      <Header cartCount={getCartCount()} />
      <Suspense fallback={<ProductDetailLoading />}>
        <ProductDetailContent />
      </Suspense>
    </>
  );
}
