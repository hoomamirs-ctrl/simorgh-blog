(function () {
  var STORAGE_KEY = 'simorgh_invoice_v3';
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
      return parsed.filter(function (x) {
        return x && typeof x.name === 'string' && x.name.trim().length > 0;
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

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function p2(n) {
    n = parseInt(n, 10) || 0;
    return n < 10 ? '0' + n : String(n);
  }

  function makeInvoiceId() {
    var d = new Date();
    return (
      'SMG-' +
      String(d.getFullYear()).slice(-2) +
      p2(d.getMonth() + 1) +
      p2(d.getDate()) +
      '-' +
      p2(d.getHours()) +
      p2(d.getMinutes()) +
      p2(d.getSeconds())
    );
  }

  function nowText() {
    try {
      return new Date().toLocaleString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  }

  function sumQty(items) {
    var total = 0;
    for (var i = 0; i < items.length; i++) {
      var q = parseInt(items[i].qty, 10);
      total += (!isNaN(q) && q > 0) ? q : 1;
    }
    return total;
  }

  function toast(msg) {
    try {
      var el = document.getElementById('simorghCartToast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'simorghCartToast';
        el.style.cssText =
          'position:fixed;top:16px;left:50%;transform:translateX(-50%);' +
          'background:#26130a;color:#fff;padding:10px 16px;border-radius:22px;' +
          'font-size:12px;font-weight:bold;z-index:9999;max-width:92vw;' +
          'text-align:center;box-shadow:0 8px 22px rgba(0,0,0,.25);' +
          'font-family:Tahoma,sans-serif;';
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.style.display = 'block';
      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(function () {
        if (el) el.style.display = 'none';
      }, 2600);
    } catch (e) {}
  }

  function updateBadge() {
    var total = sumQty(safeGetCart());
    var els = document.querySelectorAll('#simorghCartCount, .simorgh-cart-count');
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = String(total);
    }
  }

  function buildInvoiceText() {
    var items = safeGetCart();
    if (!items.length) return '';
    if (!currentInvoiceId) currentInvoiceId = makeInvoiceId();

    var custEl = document.getElementById('simorghCustomerName');
    var delEl = document.getElementById('simorghDeliveryType');
    var noteEl = document.getElementById('simorghOrderNote');

    var cust = custEl ? custEl.value.trim() : '';
    var del = delEl ? delEl.value : 'تحویل حضوری در فروشگاه (تهرانپارس)';
    var note = noteEl ? noteEl.value.trim() : '';

    var lines = [
      '🧾 فاکتور دیجیتال — ' + STORE_NAME,
      'شماره فاکتور: ' + currentInvoiceId,
      'تاریخ: ' + nowText(),
      '--------------------------------'
    ];
    if (cust) lines.push('سفارش‌دهنده: ' + cust);
    lines.push('اقلام:');
    for (var i = 0; i < items.length; i++) {
      var q = parseInt(items[i].qty, 10);
      q = (!isNaN(q) && q > 0) ? q : 1;
      lines.push((i + 1) + '. ' + items[i].name + ' (' + q + ' عدد)');
    }
    lines.push('--------------------------------');
    lines.push('جمع کل اقلام: ' + sumQty(items) + ' عدد');
    lines.push('تحویل: ' + del);
    if (note) lines.push('توضیحات: ' + note);
    lines.push('--------------------------------');
    lines.push('آدرس: ' + STORE_ADDRESS);
    lines.push('تماس: ' + STORE_PHONES);
    return lines.join('\n');
  }

  function updateSheetAndPreview() {
    var sheet = document.getElementById('simorghDigitalInvoiceSheet');
    var preview = document.getElementById('simorghInvoicePreview');
    var items = safeGetCart();

    if (!items.length) {
      currentInvoiceId = null;
      if (sheet) {
        sheet.innerHTML = '<div style="text-align:center;color:#6b625a;font-size:12px;padding:10px;">هنوز موردی به فاکتور اضافه نشده است.</div>';
      }
      if (preview) preview.value = '';
      return;
    }

    if (!currentInvoiceId) currentInvoiceId = makeInvoiceId();

    var custEl = document.getElementById('simorghCustomerName');
    var delEl = document.getElementById('simorghDeliveryType');
    var noteEl = document.getElementById('simorghOrderNote');
    var cust = custEl ? custEl.value.trim() : '';
    var del = delEl ? delEl.value : 'تحویل حضوری در فروشگاه (تهرانپارس)';
    var note = noteEl ? noteEl.value.trim() : '';

    var trs = '';
    for (var i = 0; i < items.length; i++) {
      var q = parseInt(items[i].qty, 10);
      q = (!isNaN(q) && q > 0) ? q : 1;
      trs +=
        '<tr>' +
          '<td style="padding:6px;border-bottom:1px solid #efe3d4;font-weight:bold;color:#26130a;">' + esc(items[i].name) + '</td>' +
          '<td style="padding:6px;border-bottom:1px solid #efe3d4;text-align:center;font-weight:bold;color:#b45d0b;">' + q + '</td>' +
        '</tr>';
    }

    if (sheet) {
      sheet.innerHTML =
        '<div style="background:#fffefa;border:1.5px solid #e2cbb0;border-radius:12px;padding:10px;margin-top:8px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px dashed #dfcbb0;padding-bottom:6px;margin-bottom:7px;font-size:11.5px;">' +
            '<strong style="color:#26130a;">' + STORE_NAME + '</strong>' +
            '<span style="color:#b45d0b;font-weight:bold;direction:ltr;">#' + esc(currentInvoiceId) + '</span>' +
          '</div>' +
          (cust ? '<div style="font-size:11.5px;color:#3d2314;margin-bottom:5px;">سفارش‌دهنده: <strong>' + esc(cust) + '</strong></div>' : '') +
          '<table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-bottom:7px;">' +
