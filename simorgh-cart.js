(function () {
  'use strict';

  var STORAGE_KEY = 'simorgh_invoice_cart_v1';
  var BALE_URL = 'https://ble.ir/simorgh_coffee';
  var STORE_NAME = 'کلبه چای و قهوه سیمرغ';
  var STORE_ADDRESS = 'تهران، تهرانپارس، خیابان جشنواره، روبروی بهزیستی، پلاک ۴۸';
  var STORE_PHONES = '۰۲۱-۷۷۳۴۱۳۱۲ | ۰۹۱۲-۵۱۸۳۱۴۲';

  var activeInvoiceId = null;
  var toastTimer = null;

  function loadItems() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data.filter(function (row) {
        return row && typeof row.name === 'string' && row.name.trim().length > 0;
      }).map(function (row) {
        var q = parseInt(row.qty, 10);
        return {
          name: row.name.trim(),
          qty: (!isNaN(q) && q > 0) ? q : 1
        };
      });
    } catch (err) {
      return [];
    }
  }

  function saveItems(items) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {}
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pad2(num) {
    var n = parseInt(num, 10) || 0;
    return n < 10 ? '0' + n : String(n);
  }

  function createInvoiceId() {
    var now = new Date();
    return (
      'SMG-' +
      String(now.getFullYear()).slice(-2) +
      pad2(now.getMonth() + 1) +
      pad2(now.getDate()) +
      '-' +
      pad2(now.getHours()) +
      pad2(now.getMinutes()) +
      pad2(now.getSeconds())
    );
  }

  function getFormattedDate() {
    try {
      return new Date().toLocaleString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return '';
    }
  }

  function totalQuantity(items) {
    var sum = 0;
    for (var i = 0; i < items.length; i++) {
      sum += (parseInt(items[i].qty, 10) || 1);
    }
    return sum;
  }

  function showToast(message) {
    try {
      var toast = document.getElementById('simorghToastBanner');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'simorghToastBanner';
        toast.style.cssText =
          'position:fixed;top:16px;left:50%;transform:translateX(-50%);' +
          'background:#26130a;color:#fff;padding:10px 16px;border-radius:22px;' +
          'font-size:12px;font-weight:bold;z-index:10000;max-width:92vw;' +
          'text-align:center;box-shadow:0 8px 22px rgba(0,0,0,.28);' +
          'font-family:Tahoma,sans-serif;line-height:1.5;display:none;';
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.style.display = 'block';
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        if (toast) toast.style.display = 'none';
      }, 2800);
    } catch (err) {}
  }

  function updateAllBadges() {
    var count = totalQuantity(loadItems());
    var badgeIds = ['simorghCartCount', 'footerInvoiceCount', 'invoiceBadgeCount'];
    for (var i = 0; i < badgeIds.length; i++) {
      var el = document.getElementById(badgeIds[i]);
      if (el) el.textContent = String(count);
    }
    var classBadges = document.querySelectorAll('.simorgh-cart-count, .invoice-count');
    for (var j = 0; j < classBadges.length; j++) {
      classBadges[j].textContent = String(count);
    }
  }

  function buildInvoiceText() {
    var items = loadItems();
    if (!items.length) return '';
    if (!activeInvoiceId) activeInvoiceId = createInvoiceId();

    var customerInput = document.getElementById('simorghCustomerName');
    var deliverySelect = document.getElementById('simorghDeliveryType');
    var noteInput = document.getElementById('simorghOrderNote');

    var customer = customerInput ? customerInput.value.trim() : '';
    var delivery = deliverySelect ? deliverySelect.value : 'تحویل حضوری در فروشگاه (تهرانپارس)';
    var note = noteInput ? noteInput.value.trim() : '';

    var lines = [
      '🧾 فاکتور دیجیتال — ' + STORE_NAME,
      'شماره فاکتور: ' + activeInvoiceId,
      'تاریخ ثبت: ' + getFormattedDate(),
      '--------------------------------'
    ];

    if (customer) {
      lines.push('نام سفارش‌دهنده: ' + customer);
    }

    lines.push('اقلام سفارش:');
    for (var i = 0; i < items.length; i++) {
      lines.push((i + 1) + '. ' + items[i].name + ' — تعداد: ' + items[i].qty);
    }

    lines.push('--------------------------------');
    lines.push('جمع کل اقلام: ' + totalQuantity(items) + ' عدد');
    lines.push('نحوه تحویل: ' + delivery);

    if (note) {
      lines.push('توضیحات: ' + note);
    }

    lines.push('--------------------------------');
    lines.push('نشانی: ' + STORE_ADDRESS);
    lines.push('تلفن: ' + STORE_PHONES);

    return lines.join('\n');
  }

  function renderDigitalInvoiceCard() {
    var cardBox = document.getElementById('simorghDigitalInvoiceCard');
    var textBox = document.getElementById('simorghInvoiceTextBox');
    var items = loadItems();

    if (!items.length) {
      activeInvoiceId = null;
      if (cardBox) {
        cardBox.innerHTML =
          '<div style="text-align:center;color:#6b625a;font-size:12px;padding:12px 6px;">' +
          'پس از افزودن کالا، فاکتور دیجیتال در این قسمت صادر می‌شود.' +
          '</div>';
      }
      if (textBox) textBox.value = '';
      return;
    }

    if (!activeInvoiceId) activeInvoiceId = createInvoiceId();

    var customerInput = document.getElementById('simorghCustomerName');
    var deliverySelect = document.getElementById('simorghDeliveryType');
    var noteInput = document.getElementById('simorghOrderNote');

    var customer = customerInput ? customerInput.value.trim() : '';
    var delivery = deliverySelect ? deliverySelect.value : 'تحویل حضوری در فروشگاه (تهرانپارس)';
    var note = noteInput ? noteInput.value.trim() : '';

    var rowsHtml = '';
    for (var i = 0; i < items.length; i++) {
      rowsHtml +=
        '<tr>' +
          '<td style="padding:6px;border-bottom:1px solid #efe3d4;font-weight:bold;color:#26130a;">' + escapeHtml(items[i].name) + '</td>' +
          '<td style="padding:6px;border-bottom:1px solid #efe3d4;text-align:center;font-weight:bold;color:#b45d0b;">' + items[i].qty + '</td>' +
        '</tr>';
    }

    if (cardBox) {
      cardBox.innerHTML =
        '<div style="background:#fffefa;border:1.5px solid #e2cbb0;border-radius:12px;padding:10px;margin-top:8px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px dashed #dfcbb0;padding-bottom:6px;margin-bottom:7px;font-size:11.5px;">' +
            '<strong style="color:#26130a;">' + STORE_NAME + '</strong>' +
            '<span style="color:#b45d0b;font-weight:bold;direction:ltr;">#' + escapeHtml(activeInvoiceId) + '</span>' +
          '</div>' +
          (customer ? '<div style="font-size:11.5px;color:#3d2314;margin-bottom:5px;">سفارش‌دهنده: <strong>' + escapeHtml(customer) + '</strong></div>' : '') +
          '<table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-bottom:7px;">' +
            '<thead>' +
              '<tr style="background:#fcf7f0;color:#5c534b;font-size:11px;">' +
                '<th style="text-align:right;padding:5px 6px;">شرح قلم</th>' +
                '<th style="text-align:center;padding:5px 6px;width:62px;">تعداد</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' + rowsHtml + '</tbody>' +
          '</table>' +
          '<div style="font-size:11.5px;color:#3d2314;line-height:1.65;">' +
            '<div>جمع کل اقلام: <strong>' + totalQuantity(items) + ' عدد</strong></div>' +
            '<div>تحویل: <strong>' + escapeHtml(delivery) + '</strong></div>' +
            (note ? '<div>توضیحات: <strong>' + escapeHtml(note) + '</strong></div>' : '') +
          '</div>' +
        '</div>';
    }

    if (textBox) {
      textBox.value = buildInvoiceText();
    }
  }

  function renderCartItems() {
    var listEl = document.getElementById('simorghCartList');
    if (!listEl) return;
    var items = loadItems();

    if (!items.length) {
      listEl.innerHTML =
        '<div style="text-align:center;color:#6b625a;font-size:12px;padding:12px 6px;">' +
        'هنوز موردی به فاکتور اضافه نشده است.' +
        '</div>';
      renderDigitalInvoiceCard();
      return;
    }

    var html = '';
    for (var i = 0; i < items.length; i++) {
      html +=
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:#fcf7f0;border:1px solid #e7d6c0;border-radius:10px;padding:8px 10px;margin-bottom:7px;">' +
          '<div style="font-size:12px;font-weight:bold;color:#26130a;flex:1;text-align:right;">' + escapeHtml(items[i].name) + '</div>' +
          '<div style="display:flex;align-items:center;gap:5px;">' +
            '<button type="button" data-cart-action="dec" data-cart-index="' + i + '" style="width:26px;height:26px;border-radius:7px;border:1px solid #d8c3a8;background:#fff;font-weight:bold;cursor:pointer;">-</button>' +
            '<span style="min-width:20px;text-align:center;font-weight:bold;font-size:12.5px;">' + items[i].qty + '</span>' +
            '<button type="button" data-cart-action="inc" data-cart-index="' + i + '" style="width:26px;height:26px;border-radius:7px;border:1px solid #d8c3a8;background:#fff;font-weight:bold;cursor:pointer;">+</button>' +
            '<button type="button" data-cart-action="del" data-cart-index="' + i + '" style="border:none;background:#fee2e2;color:#991b1b;border-radius:7px;padding:4px 8px;font-size:11px;font-weight:bold;cursor:pointer;">حذف</button>' +
          '</div>' +
        '</div>';
    }
    listEl.innerHTML = html;
    renderDigitalInvoiceCard();
  }

  function copyToClipboard(text) {
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
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (err) {}

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).catch(function () {});
    }
  }

  function openBaleTarget() {
    try {
      var a = document.createElement('a');
      a.href = BALE_URL;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      window.location.href = BALE_URL;
    }
  }

  function handleSendInvoice() {
    var items = loadItems();
    if (!items.length) {
      showToast('ابتدا حداقل یک مورد به فاکتور اضافه کنید');
      return;
    }
    renderDigitalInvoiceCard();
    var text = buildInvoiceText();
    copyToClipboard(text);
    showToast('فاکتور کپی شد؛ در بله جایگذاری و ارسال کنید');
    openBaleTarget();
  }

  function handlePrintInvoice() {
    var items = loadItems();
    if (!items.length) {
      showToast('ابتدا حداقل یک مورد به فاکتور اضافه کنید');
      return;
    }
    renderDigitalInvoiceCard();
    var text = buildInvoiceText();
    var win = window.open('', '_blank', 'width=420,height=640');
    if (!win) {
      showToast('پنجره چاپ باز نشد؛ از باکس متن فاکتور استفاده کنید');
      return;
    }
    win.document.write(
      '<html lang="fa" dir="rtl"><head><title>فاکتور دیجیتال سیمرغ</title>' +
      '<style>body{font-family:Tahoma,sans-serif;padding:20px;line-height:1.8;color:#222;}pre{white-space:pre-wrap;background:#faf6f0;padding:14px;border:1px solid #ddd;border-radius:8px;font-family:Tahoma,sans-serif;font-size:13px;}</style></head>' +
      '<body><pre>' + escapeHtml(text) + '</pre><script>window.print();<\/script></body></html>'
    );
    win.document.close();
  }

  function ensureModal() {
    var modal = document.getElementById('simorghInvoiceModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'simorghInvoiceModal';
    modal.style.cssText =
      'display:none;position:fixed;inset:0;background:rgba(20,10,5,.6);' +
      'z-index:9500;padding:12px;align-items:center;justify-content:center;' +
      'direction:rtl;font-family:Tahoma,sans-serif;';

    modal.innerHTML =
      '<div style="background:#fff;max-width:480px;width:100%;border-radius:18px;padding:16px;box-shadow:0 16px 36px rgba(0,0,0,.3);border:1px solid #ead8c0;max-height:92vh;overflow-y:auto;text-align:right;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
          '<strong style="font-size:14px;color:#26130a;">🧾 فاکتور دیجیتال سفارش</strong>' +
          '<button type="button" id="simorghCloseModalBtn" style="border:none;background:#f4ece0;color:#3d2314;border-radius:8px;padding:5px 11px;font-weight:bold;cursor:pointer;font-family:Tahoma,sans-serif;">بستن</button>' +
        '</div>' +
        '<div id="simorghCartList"></div>' +
        '<div style="margin-top:8px;">' +
          '<label style="display:block;font-size:11.5px;font-weight:bold;color:#3d2314;margin-bottom:3px;">نام سفارش‌دهنده (اختیاری):</label>' +
          '<input id="simorghCustomerName" type="text" placeholder="نام و نام خانوادگی" style="width:100%;padding:8px 10px;border-radius:9px;border:1px solid #dfcbb0;font-family:Tahoma,sans-serif;font-size:12px;">' +
        '</div>' +
        '<div style="margin-top:8px;">' +
          '<label style="display:block;font-size:11.5px;font-weight:bold;color:#3d2314;margin-bottom:3px;">نحوه دریافت سفارش:</label>' +
          '<select id="simorghDeliveryType" style="width:100%;padding:8px 10px;border-radius:9px;border:1px solid #dfcbb0;background:#fcf7f0;font-family:Tahoma,sans-serif;font-size:12px;font-weight:bold;">' +
            '<option value="تحویل حضوری در فروشگاه (تهرانپارس)">تحویل حضوری در فروشگاه (تهرانپارس)</option>' +
            '<option value="ارسال پیکی در تهرانپارس و اطراف">ارسال پیکی در تهرانپارس و اطراف</option>' +
          '</select>' +
        '</div>' +
        '<div style="margin-top:8px;">' +
          '<label style="display:block;font-size:11.5px;font-weight:bold;color:#3d2314;margin-bottom:3px;">توضیحات (درجه آسیاب، وزن یا هماهنگی):</label>' +
          '<input id="simorghOrderNote" type="text" placeholder="مثال: آسیاب اسپرسو، ۲۵۰ گرم..." style="width:100%;padding:8px 10px;border-radius:9px;border:1px solid #dfcbb0;font-family:Tahoma,sans-serif;font-size:12px;">' +
        '</div>' +
        '<div id="simorghDigitalInvoiceCard"></div>' +
        '<div style="margin-top:8px;">' +
          '<label style="display:block;font-size:11px;font-weight:bold;color:#5c534b;margin-bottom:3px;">متن فاکتور جهت ارسال در بله:</label>' +
          '<textarea id="simorghInvoiceTextBox" readonly rows="5" style="width:100%;padding:8px;border-radius:9px;border:1px solid #e7d6c0;background:#fcf7f0;font-family:Tahoma,sans-serif;font-size:11px;line-height:1.55;color:#231e1a;resize:vertical;"></textarea>' +
        '</div>' +
        '<div style="display:flex;gap:7px;margin-top:12px;align-items:center;flex-wrap:wrap;">' +
          '<button type="button" id="simorghSendBaleBtn" style="flex:1.6;min-width:140px;border:none;background:#00779b;color:#fff;padding:11px;border-radius:10px;font-weight:bold;font-size:12.5px;cursor:pointer;font-family:Tahoma,sans-serif;">ارسال به بله</button>' +
          '<a href="' + BALE_URL + '" target="_blank" rel="noopener noreferrer" style="padding:11px 12px;border-radius:10px;background:#e6f4f8;color:#005b77;font-weight:bold;font-size:11.5px;text-decoration:none;border:1px solid #9ad0e0;">باز کردن بله</a>' +
          '<button type="button" id="simorghPrintBtn" style="border:1px solid #d8c3a8;background:#fcf7f0;color:#26130a;padding:11px;border-radius:10px;font-weight:bold;font-size:11.5px;cursor:pointer;font-family:Tahoma,sans-serif;">چاپ</button>' +
          '<button type="button" id="simorghClearBtn" style="border:1px solid #e5c9c9;background:#fff5f5;color:#991b1b;padding:11px;border-radius:10px;font-weight:bold;font-size:11px;cursor:pointer;font-family:Tahoma,sans-serif;">خالی کردن</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    modal.addEventListener('click', function (ev) {
      if (ev.target === modal) modal.style.display = 'none';
    });

    document.getElementById('simorghClose
