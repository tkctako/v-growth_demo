$(function() {
  // --------------------
  // スクロールナビゲーション
  // --------------------
  var startPos = 0, winScrollTop = 0;
  $(window).on('scroll', function(){
    winScrollTop = $(this).scrollTop();
    if (winScrollTop >= startPos) {
      $('.header').removeClass('scroll');
    } else {
      $('.header').removeClass('hide').addClass('scroll');
    }
    startPos = winScrollTop;
  });

  // --------------------
  // スクロール変更
  // --------------------
  function initScrollChange() {
    var px_change = 80;
    var px_change2 = 1500;
    $(window).on('scroll', function(){
      var scrollTop = $(this).scrollTop();
      if (scrollTop > px_change) {
        $(".header").addClass("action");
      } else if ($(".header").hasClass("action")) {
        $(".header").removeClass("action");
      } else if ($(".header").hasClass("header")) {
        $('.header').removeClass('scroll');
      }
      if (scrollTop > px_change2) {
        $(".video").addClass("visual");
      } else if ($(".video").hasClass("visual")) {
        $('.video').removeClass('visual');
      }
    });
  }

  // --------------------
  // Accrordion
  // --------------------
  // $(function(){
  //   $(".acMenu dt").on("click", function() {
  //     $(this).next().slideToggle();
  //     $(this).toggleClass("active");
  //   });
  //   $(".ac_lists").on("click", function() {
  //     $(this).toggleClass("open");
  //   });
  // });
  $(function(){
    // PC用のホバーイベント
    $(".acMenu").on("mouseenter", function() {
      if (!isMobile()) {
        $(this).find("dd").stop(true, true).slideDown();
        $(this).find("dt").addClass("active");
      }
    }).on("mouseleave", function() {
      if (!isMobile()) {
        $(this).find("dd").stop(true, true).slideUp();
        $(this).find("dt").removeClass("active");
      }
    });

    // スマホ用のタップイベント
    $(".acMenu dt").on("click", function() {
      if (isMobile()) {
        const dd = $(this).next("dd");
        dd.stop(true, true).slideToggle();
        $(this).toggleClass("active");
      }
    });

    $(".ac_lists").on("mouseenter", function() {
      $(this).addClass("open");
    }).on("mouseleave", function() {
      $(this).removeClass("open");
    });

    // デバイスがモバイルかどうかを判定する関数
    function isMobile() {
      return /Mobi|Android/i.test(navigator.userAgent);
    }
  });

  // --------------------
  // モーダル
  // --------------------
  $(".js-btn-link").on("click", function() {
    $(this).prev().slideToggle();
    $(this).toggleClass("active");
  });

  $('.js-modal-open').each(function(){
    $(this).on('click', function(){
      var target = $(this).data('target');
      var modal = document.getElementById(target);
      $(modal).fadeIn();
      return false;
    });
  });

  $('.js-modal-close').on('click', function(){
    $('.js-modal').fadeOut();
    return false;
  });

  const allRadioButtons = document.querySelectorAll('input[type="radio"]');
  allRadioButtons.forEach(radio => {
    radio.addEventListener('change', function() {
      // 同じname属性を持つラジオボタンを取得
      const name = this.name;
      const radioButtons = document.querySelectorAll(`input[name="${name}"]`);

      // すべてのラベルからactiveクラスを削除
      radioButtons.forEach(r => {
        const label = document.querySelector(`label[for="${r.id}"]`);
        if (label) {
          label.classList.remove('active');
        }
      });

      // 選択されたラジオボタンのラベルにactiveクラスを追加
      const activeLabel = document.querySelector(`label[for="${this.id}"]`);
      if (activeLabel) {
        activeLabel.classList.add('active');
      }
    });
  });

  // クリックアコーディオン
  $(function() {
    $('.more').on('click', function() {
      const reasonBox = $(this).closest('.reason-box');
      const content = reasonBox.find('.reason-box-content');
      const title = reasonBox.find('.reason-box-ttl');

      content.slideToggle(500);
      content.toggleClass('open');
      title.toggleClass('active');
    });

    $('.reason-box-content .close').on('click', function() {
      const content = $(this).closest('.reason-box-content');
      const reasonBox = content.closest('.reason-box');
      const title = reasonBox.find('.reason-box-ttl');

      content.slideToggle(500);
      content.removeClass('open');
      title.removeClass('active');
    });
  });

  // --------------------
  // 注文確認画面の承認チェックボックス
  // --------------------
  $(function() {
    const approvalChecks = $('.js-approval-check');
    const submitBtn = $('#btn-cart-submit');

    if (approvalChecks.length && submitBtn.length) {
      const updateSubmitState = () => {
        const allChecked = approvalChecks.filter(':checked').length === approvalChecks.length;
        if (allChecked) {
          submitBtn.prop('disabled', false).removeClass('is-disabled');
        } else {
          submitBtn.prop('disabled', true).addClass('is-disabled');
        }
      };

      // 初期状態
      updateSubmitState();

      // チェックボックスの状態変更時にボタンの有効/無効を切り替え
      approvalChecks.on('change', updateSubmitState);
    }
  });
});