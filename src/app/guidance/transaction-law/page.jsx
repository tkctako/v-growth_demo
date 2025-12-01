'use client';

import Header from '../../components/Header';

export default function TransactionLawPage() {
  return (
    <>
      <Header />
      
      <div className="is-guidance-wrap">
        <main className="is-page-main is-guidance-main">
          <section className="is-kv is-kv-lower is-kv-lower-guidance">
            <div className="ttl-primary">
              <h2>
                <span className="jp">特定商取引法に基づく表記</span>
                <span className="en"><i>TRANSACTION LAW</i></span>
              </h2>
            </div>
          </section>
          
          <section className="is-guidance-inner">
            <div className="is-guidance-box">
              <h3>法人名</h3>
              <p>株式会社V-Growth</p>
            </div>

            <div className="is-guidance-box">
              <h3>所在地</h3>
              <p>〒105-0011 東京都港区芝公園2-10-1 住友不動産芝園ビル 8F</p>
            </div>

            <div className="is-guidance-box">
              <h3>電話番号</h3>
              <p>
              03-6777-5120
              </p>
            </div>

            <div className="is-guidance-box">
              <h3>メールアドレス</h3>
              <p>
              edu-ict@v-growth.co.jp
              </p>
            </div>

            <div className="is-guidance-box">
              <h3>販売価格</h3>
              <p>
                販売価格は、各商品ページに記載されています。<br />
                ※表示価格はすべて税込み価格です。
              </p>
            </div>

            <div className="is-guidance-box">
              <h3>送料について</h3>
              <p>
                送料は、購入金額や配送地域によって異なります。<br />
                詳細は[配送方法]ページをご確認ください。
              </p>
            </div>

            <div className="is-guidance-box">
              <h3>代金の支払方法</h3>
              <ul className="bullets">
                <li className="bullets_item">クレジットカード決済</li>
                <li className="bullets_item">銀行振込（前払い）</li>
                {/* <li className="bullets_item">代金引換（代引き）</li> */}
              </ul>
            </div>

            <div className="is-guidance-box">
              <h3>商品の引渡し時期</h3>
              <ul className="bullets">
                <li className="bullets_item">クレジットカード決済の場合：注文確認後、通常[出荷日数]営業日以内に発送します。</li>
                <li className="bullets_item">銀行振込の場合：ご入金確認後、通常[出荷日数]営業日以内に発送します。</li>
                {/* <li className="bullets_item">代金引換の場合：注文確認後、通常[出荷日数]営業日以内に発送します。</li> */}
              </ul>
            </div>

            <div className="is-guidance-box">
              <h3>返品・交換について</h3>
              <ul className="bullets">
                <li className="bullets_item">商品に不備があった場合、または注文と異なる商品が届いた場合には、商品到着後[返品可能期間]以内にご連絡ください。返品・交換を承ります。</li>
                <li className="bullets_item">商品に問題がない場合や、お客様の都合による返品は原則としてお受けできません。予めご了承ください。</li>
                <li className="bullets_item">返品にかかる送料は、当社負担とさせていただきます。ただし、返品条件が満たされていない場合はお客様負担となります。</li>
              </ul>
            </div>

            <div className="is-guidance-box">
              <h3>解約の条件</h3>
              <p>サービスや定期購入において、解約をご希望の場合は、次回の請求日前に[解約受付期間]以内にご連絡ください。</p>
            </div>

            <div className="is-guidance-box">
              <h3>商品以外の必要費用</h3>
              <p>商品代金以外にかかる費用として、以下が発生する場合があります：</p>
              <ul className="bullets">
                <li className="bullets_item">送料</li>
                <li className="bullets_item">振込手数料（銀行振込を選択された場合）</li>
                {/* <li className="bullets_item">代金引換手数料（代金引換を選択された場合）</li> */}
              </ul>
            </div>

            <div className="is-guidance-box">
              <h3>販売数量の制限</h3>
              <p>一部の商品には、販売数量の制限があります。商品ページに記載された制限に従ってご購入ください。</p>
            </div>

            <div className="is-guidance-box">
              <h3>商品の価格変更について</h3>
              <p>販売価格や送料は予告なく変更される場合があります。最新の情報は、商品ページに記載された価格を基準とさせていただきます。</p>
            </div>

            <div className="is-guidance-box">
              <h3>その他</h3>
              <ul className="bullets">
                <li className="bullets_item">販売数量制限：一部の商品に販売数量制限がありますので、商品ページに記載の制限をご確認ください。</li>
                <li className="bullets_item">保証について：製品に保証がある場合、保証内容については製品の説明書に記載されています。</li>
              </ul>
            </div>

            <div className="is-guidance-box">
              <h3>プライバシーポリシー</h3>
              <p>お客様の個人情報は、当社のプライバシーポリシーに従って適切に管理いたします。詳細については、[プライバシーポリシーリンク]をご確認ください。</p>
            </div>

            <div className="is-guidance-box">
              <h3>提供するサービスや商品の表示</h3>
              <p>本ショップで販売する商品について、詳細な情報やサービス内容は各商品ページに記載されています。</p>
            </div>

            <div className="is-guidance-box">
              <h3>お問い合わせ</h3>
              <p>
                本規約に関するご質問やご不明点がある場合は、以下の連絡先までご連絡ください。<br />
                法人名: 株式会社V-Growth<br />
                所在地: 〒105-0011 東京都港区芝公園2-10-1 住友不動産芝園ビル 8F<br />
                電話番号: 03-6777-5120<br />
                メールアドレス: edu-ict@v-growth.co.jp
              </p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
