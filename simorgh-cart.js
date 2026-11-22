(function () {
  var STORAGE_KEY = 'simorgh_invoice_v1';
  var BALE_URL = 'https://ble.ir/simorgh_coffee';
  var STORE_NAME = 'کلبه چای و قهوه سیمرغ';
  var STORE_ADDRESS = 'تهران، تهرانپارس، خیابان جشنواره، روبروی بهزیستی، پلاک ۴۸';
  var STORE_PHONES = '۰۲۱-۷۷۳۴۱۳۱۲ | ۰۹۱۲-۵۱۸۳۱۴۲';

  function safeGetCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
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
    return n < 10 ? '0' + n : String(n);
  }

  function generateInvoiceNumber() {
    var d = new Date();
    var y = String(d.getFullYear()).slice(-2);
    var m = pad2(d.getMonth() + 1);
    var day = pad2(d.getDate());
    var h = pad2(d.getHours());
    var min = pad2(d.getMinutes());
    var sec = pad2(d.getSeconds());
    return 'SMG-' + y + m + day + '-' + h + min + sec;
  }

  function getFormattedDateTime() {
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

  function getTotalCount(items) {
    var total = 0;
    for (var i = 0; i < items.length; i++) {
      total += (items[i].qty || 1);
    }
    return total;
  }

  function notify(msg) {
    try {
      if (typeof window.showToast === 'function') {
        window.showToast(msg);
        return;
      }
    } catch (e) {}
    try {
      var box = document.getElementById('simorghCartToast');
      if (!box) {
        box = document.createElement('div');
        box.id = 'simorghCartToast';
        box.style.cssText = 'position:fixed;top:18px;left:50%;transform:translateX(-50%);background:#26130a;color:#fff;padding:10px 18px;border-radius:24px;font-size:12px;font-weight:bold;z-index:2000;box-shadow:0 8px 20px rgba(0,0,0,.22);font-family:Tahoma,sans-serif;max-width:92vw;text-align:center;';
        document.body.appendChild(box);
      }
      box.textContent = msg;
      box.style.display = 'block';
      clearTimeout(window.__simorghCartToastTimer);
      window.__simorghCartToastTimer = setTimeout(function () {
        if (box) box.style.display = 'none';
      }, 2600);
    } catch (e) {}
  }

  function renderBadge() {
    var items = safeGetCart();
    var totalQty = getTotalCount(items);
    var badge = document.getElementById('simorghCartCount');
    if (badge) badge.textContent = String(totalQty);
  }

  function buildDigitalInvoiceText(invNo) {
    var items = safeGetCart();
    var deliveryEl = document.getElementById('simorghDeliveryType');
    var noteEl = document.getElementById('simorghOrderNote
