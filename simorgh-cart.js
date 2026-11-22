(function () {
  var STORAGE_KEY = 'simorgh_invoice_v2';
  var BALE_URL = 'https://ble.ir/simorgh_coffee';
  var STORE_NAME = 'کلبه چای و قهوه سیمرغ';
  var STORE_ADDRESS = 'تهران، تهرانپارس، خیابان جشنواره، روبروی بهزیستی، پلاک ۴۸';
  var STORE_PHONES = '۰۲۱-۷۷۳۴۱۳۱۲ | ۰۹۱۲-۵۱۸۳۱۴۲';
  var currentInvoiceId = null;
  var toastTimeout = null;

  function safeGetCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (item) {
        return item && typeof item.name === 'string' && item.name.trim().length > 0;
      });
    } catch (e) {
      return [];
    }
  }

  function safeSaveCart(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {}
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pad2(n) {
    n = Number(n) || 0;
    return n < 10 ? '0' + n : String(n);
  }

  function generateInvoiceId() {
    var now = new Date();
    var y = String(now.getFullYear()).slice(-2);
    var m = pad2(now.getMonth() + 1);
    var d = pad2(now.getDate());
    var h = pad2(now.getHours());
    var min = pad2(now.getMinutes());
    var s = pad2(now.getSeconds());
    return 'SMG-' + y + m + d + '-' + h + min + s;
  }

  function getNowLabel() {
    try {
      return new Date().toLocaleString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return new Date().toISOString().slice(0, 16).replace('T', ' ');
    }
  }

  function getTotalQty(items) {
    var sum = 0;
    for (var i = 0; i < items.length; i++) {
      var q = parseInt(items[i].qty, 10);
      sum += (!isNaN(q) && q > 0) ? q : 1;
    }
    return sum;
  }

  function showCartToast(msg) {
    try {
      var box = document.getElementById('simorghCartToastBox');
      if (!box) {
        box = document.createElement('div');
        box.id = 'simorghCartToastBox';
        box.style.cssText =
          'position:fixed;top:16px;left:50%;transform:translateX(-50%);' +
          'background:#26130a;color:#fff;padding:10px 16px;border-radius:22px;' +
          'font-size:12px;font-weight:bold;z-index:3000;max-width:92vw;' +
          'text-align:center;box-shadow:0 8px 22px rgba(0,0,0,.25);' +
          'font-family:Tahoma,sans-serif;line-height:1.45;';
        document.body.appendChild(box);
      }
      box.textContent = msg;
      box.style.display = 'block';
      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(function () {
        if (box) box.style.display = 'none';
      }, 2800);
    } catch (e) {}
  }

  function updateBadge() {
    var items = safeGetCart();
    var total = getTotalQty(items);
    var badges = document.querySelectorAll('#simorghCartCount, .simorgh-cart-count');
    for (var i = 0; i < badges.length; i++) {
      badges[i].textContent = String(total);
    }
  }

  function getInvoiceText() {
    var items = safeGetCart();
    if (!items.length) return '';
    if (!currentInvoiceId) {
      currentInvoiceId = generateInvoiceId();
    }

    var customerEl = document.getElementById('simorghCustomerName');
    var deliveryEl = document.getElementById('simorghDeliveryType');
    var noteEl = document.getElementById('simorghOrderNote');

    var customer = customerEl ? customerEl.value.trim() : '';
    var delivery = deliveryEl ? deliveryEl.value : 'تحویل حضوری در فروشگاه (تهرانپارس)';
    var note = noteEl ? noteEl.value.trim() : '';

    var lines = [
      '🧾 فاکتور دیجیتال — ' + STORE_NAME,
      'شماره فاکتور: ' + currentInvoiceId,
      'تاریخ ثبت: ' + getNowLabel(),
      '--------------------------------'
    ];

    if (customer) {
      lines.push('نام سفارش‌دهنده: ' + customer);
    }

    lines.push('اقلام انتخابی:');
    for (var i = 0; i < items.length; i++) {
      var q = parseInt(items[i].qty, 10);
      q = (!isNaN(q) && q > 0) ? q : 1;
      lines.push((i + 1) + '. ' + items[i].name + ' — تعداد: ' + q);
    }

    lines.push('--------------------------------');
    lines.push('جمع تعداد اقلام: ' + getTotalQty(items) + ' عدد');
    lines.push('روش تحویل: ' + delivery);
    if (note) {
      lines.push('توضیحات: ' + note);
    }
    lines.push('--------------------------------');
    lines.push('نشانی: ' + STORE_ADDRESS);
    lines.push('تلفن: ' + STORE_PHONES);

    return lines.join('\n');
  }

  function refreshInvoiceView() {
    var sheetEl = document.getElementById('simorghDigitalInvoiceSheet');
    var textEl = document.getElementById('simorghInvoicePreview');
    var items = safeGetCart();

    if (!items.length) {
      currentInvoiceId = null;
      if (sheetEl) {
        sheetEl.innerHTML =
          '<div style="text-align:center;color:#6b625a;font-size:12px;padding:12px 6px;">' +
          'هنوز کالایی به فاکتور اضافه نشده است.' +
          '</div>';
      }
      if (textEl) textEl.value = '';
      return;
    }

    if (!currentInvoiceId) {
      currentInvoiceId = generateInvoiceId();
    }

    var customerEl = document.getElementById('simorghCustomerName');
    var deliveryEl = document.getElementById('simorghDeliveryType');
    var noteEl = document.getElementById('simorghOrderNote');
    var customer = customerEl ? customerEl.value.trim() : '';
    var delivery = deliveryEl ? deliveryEl.value : 'تحویل حضوری در فروشگاه (تهرانپارس)';
    var note = noteEl ? noteEl.value.trim() : '';

    var rows = '';
    for (var i = 0; i < items.length; i++) {
      var q = parseInt(items[i].qty, 10);
      q = (!isNaN(q) && q > 0) ? q : 1;
      rows +=
        '<tr>' +
          '<td style="padding:6px;border-bottom:1px solid #efe3d4;font-weight:bold;color:#26130a;">' + escapeHtml(items[i].name) + '</td>' +
          '<td style="padding:6px;border-bottom:1px solid #efe3d4;text-align:center;font-weight:bold;color:#b45d0b;">' + q + '</td>' +
        '</tr>';
    }

    if (sheetEl) {
      sheetEl.innerHTML =
        '<div style="background:#fffefa;border:1.5px solid #e2cbb0;border-radius:12px;padding:10px;margin-top:8px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px dashed #dfcbb0;padding-bottom:6px;margin-bottom:7px;font-size:11.5px;">' +
            '<strong style="color:#26130a;">' + STORE_NAME + '</strong>' +
            '<span style="color:#b45d0b;font-weight:bold;direction:ltr;">#' + escapeHtml(currentInvoiceId) + '</span>' +
          '</div>' +
          (customer ? '<div style="font-size:11.5px;color:#3d2314;margin-bottom:5px;">سفارش‌دهنده: <strong>' + escapeHtml(customer) + '</strong></div>' : '') +
          '<table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-bottom:7px;">' +
            '<thead>' +
              '<tr style="background:#fcf7f0;color:#5c534b;font-size:11px;">' +
                '<th style="text-align:right;padding:5px 6px;border-bottom:1px solid #e7d6c0;">شرح قلم</th>' +
                '<th style="text-align:center;padding:5px 6px;border-bottom:1px solid #e7d6c0;width:60px;">تعداد</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
          '<div style="font-size:11.5px;color:#3d2314;line-height:1.6;">' +
            '<div>جمع اقلام: <strong>' + getTotalQty(items) + ' عدد</strong></div>' +
            '<div>تحویل: <strong>' + escapeHtml(delivery) + '</strong></div>' +
            (note ? '<div>توضیحات: <strong>' + escapeHtml(note) + '</strong></div>' : '') +
          '</div>' +
        '</div>';
    }

    if (textEl) {
      textEl.value = getInvoiceText();
    }
  }

  function renderCartList() {
    var listEl = document.getElementById('simorghCartItems');
    if (!listEl) return;
    var items = safeGetCart();

    if (!items.length) {
      listEl.innerHTML =
        '<div style="text-align:center;color:#6b625a;font-size:12.5px;padding:12px 6px;">' +
        'هنوز موردی به فاکتور اضافه نشده است.' +
        '</div>';
      refreshInvoiceView();
      return;
    }

    var html = '';
    for (var i = 0; i < items.length; i++) {
      var q = parseInt(items[i].qty, 10);
      q = (!isNaN(q) && q > 0) ? q : 1;
      html +=
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:#fcf7f0;border:1px solid #e7d6c0;border-radius:10px;padding:8px 10px;margin-bottom:7px;">' +
          '<div style="font-size:12px;font-weight:bold;color:#26130a;flex:1;text-align:right;">' + escapeHtml(items[i].name) + '</div>' +
          '<div style="display:flex;align-items:center;gap:5px;">' +
            '<button type="button" onclick="SimorghCart.changeQty(' + i + ',-1)" style="width:26px;height:26px;border-radius:7px;border:1px solid #d8c3a8;background:#fff;font-weight:bold;cursor:pointer;">-</button>' +
            '<span style="min-width:20px;text-align:center;font-weight:bold;font-size:12.5px;">' + q + '</span>' +
            '<button type="button" onclick="SimorghCart.changeQty(' + i + ',1)" style="width:26px;height:26px;border-radius:7px;border:1px solid #d8c3a8;background:#fff;font-weight:bold;cursor:pointer;">+</button>' +
            '<button type="button" onclick="SimorghCart.removeItem(' + i + ')" style="border:none;background:#fee2e2;color:#991b1b;border-radius:7px;padding:4px 8px;font-size:11px;font-weight:bold;cursor:pointer;">حذف</button>' +
          '</div>' +
        '</div>';
    }
    listEl.innerHTML = html;
    refreshInvoiceView();
  }

  function copyInvoiceString(text) {
    var copied = false;
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0.01';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      copied = document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) {}

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(function () {
        copied = true;
      }).catch(function () {});
    }
    return copied;
  }

  function triggerBaleNavigation() {
    try {
      var link = document.createElement('a');
      link.href = BALE_URL;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      try {
        window.location.href = BALE_URL;
      } catch (err) {}
    }
  }

  function sendInvoiceToBale() {
    var items = safeGetCart();
    if (!items.length) {
      showCartToast('ابتدا حداقل یک قلم به فاکتور اضافه کنید');
      return;
    }
    refreshInvoiceView();
    var text = getInvoiceText();
    copyInvoiceString(text);
    showCartToast('فاکتور کپی شد؛ در بله جایگذاری و ارسال کنید');
    triggerBaleNavigation();
  }

  function shareInvoiceNative() {
    var items = safeGetCart();
    if (!items.length) {
      showCartToast('ابتدا حداقل یک قلم به فاکتور اضافه کنید');
      return;
    }
    refreshInvoiceView();
    var text = getInvoiceText();
    copyInvoiceString(text);

    if (navigator.share) {
      navigator.share({
        title: 'فاکتور دیجیتال ' + STORE_NAME,
        text: text
      }).catch(function () {
        showCartToast('متن فاکتور کپی شد');
      });
    } else {
      showCartToast('متن فاکتور کپی شد؛ در بله پیست کنید');
      triggerBaleNavigation();
    }
  }

  function printInvoice() {
    var items = safeGetCart();
    if (!items.length) {
      showCartToast('ابتدا حداقل یک قلم به فاکتور اضافه کنید');
      return;
    }
    refreshInvoiceView();
    var text = getInvoiceText();
    var win = window.open('', '_blank', 'width=420,height=640');
    if (!win) {
      showCartToast('پنجره چاپ باز نشد؛ از باکس متن فاکتور استفاده کنید');
      return;
    }
    win.document.write(
      '<html lang="fa" dir="rtl"><head><title>فاکتور دیجیتال سیمرغ</title>' +
      '<style>body{font-family:Tahoma,sans-serif;padding:20px;line-height:1.8;color:#222;}pre{white-space:pre-wrap;background:#faf6f0;padding:14px;border:1px solid #ddd;border-radius:8px;font-family:Tahoma,sans-serif;font-size:13px;}</style></head>' +
      '<body><pre>' + escapeHtml(text) + '</pre><script>window.print();<\/script></body></html>'
    );
    win.document.close();
  }

  function createModalIfMissing() {
    if (document.getElementById('simorghInvoiceModal')) return;
    var modal = document.createElement('div');
    modal.id = 'simorghInvoiceModal';
    modal.style.cssText =
      'display:none;position:fixed;inset:0;background:rgba(20,10,5,.58);' +
      'z-index:2500;padding:12px;align-items:center;justify-content:center;' +
      'direction:rtl;font-family:Tahoma,sans-serif;';
    modal.innerHTML =
      '<div style="background:#fff;max-width:480px;width:100%;border-radius:18px;padding:16px;box-shadow:0 16px 36px rgba(0,0,0,.28);border:1px solid #ead8c0;max-height:92vh;overflow-y:auto;text-align:right;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
          '<strong style="font-size:14px;color:#26130a;">🧾 فاکتور دیجیتال سفارش</strong>' +
          '<button type="button" onclick="SimorghCart.closeModal()" style="border:none;background:#f4ece0;color:#3d2314;border-radius:8px;padding:4px 10px;font-weight:bold;cursor:pointer;font-family:Tahoma,sans-serif;">بستن</button>' +
        '</div>' +
        '<div id="simorghCartItems"></div>' +
        '<div style="margin-top:8px;">' +
          '<label style="display:block;font-size:11.5px;font-weight:bold;color:#3d2314;margin-bottom:3px;">نام سفارش‌دهنده (اختیاری):</label>' +
          '<input id="simorghCustomerName" oninput="SimorghCart.refreshPreview()" type="text" placeholder="نام و نام خانوادگی" style="width:100%;padding:8px 10px;border-radius:9px;border:1px solid #dfcbb0;font-family:Tahoma,sans-serif;font-size:12px;">' +
        '</div>' +
        '<div style="margin-top:8px;">' +
          '<label style="display:block;font-size:11.5px;font-weight:bold;color:#3d2314;margin-bottom:3px;">نحوه دریافت سفارش:</label>' +
          '<select id="simorghDeliveryType" onchange="SimorghCart.refreshPreview()" style="width:100%;padding:8px 10px;border-radius:9px;border:1px solid #dfcbb0;background:#fcf7f0;font-family:Tahoma,sans-serif;font-size:12px;font-weight:bold;">' +
            '<option value="تحویل حضوری در فروشگاه (تهرانپارس)">تحویل حضوری در فروشگاه (تهرانپارس)</option>' +
            '<option value="ارسال پیکی در تهرانپارس و اطراف">ارسال پیکی در تهرانپارس و اطراف</option>' +
          '</select>' +
        '</div>' +
        '<div style="margin-top:8px;">' +
          '<label style="display:block;font-size:11.5px;font-weight:bold;color:#3d2314;margin-bottom:3px;">توض
