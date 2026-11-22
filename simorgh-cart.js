(function () {
  var STORAGE_KEY = 'simorgh_invoice_v1';
  var BALE_URL = 'https://ble.ir/simorgh_coffee';

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
    var totalQty = 0;
    for (var i = 0; i < items.length; i++) {
      totalQty += (items[i].qty || 1);
    }
    var badge = document.getElementById('simorghCartCount');
    if (badge) badge.textContent = String(totalQty);
  }

  function buildInvoiceText() {
    var items = safeGetCart();
    var deliveryEl = document.getElementById('simorghDeliveryType');
    var noteEl = document.getElementById('simorghOrderNote');
    var delivery = deliveryEl ? deliveryEl.value : 'تحویل حضوری در فروشگاه (تهرانپارس)';
    var note = noteEl ? noteEl.value.trim() : '';

    var lines = [
      'سلام، سفارش / فاکتور از کلبه چای و قهوه سیمرغ:',
      '--------------------------------'
    ];
    for (var i = 0; i < items.length; i++) {
      lines.push('• ' + items[i].name + ' — تعداد: ' + (items[i].qty || 1));
    }
    lines.push('--------------------------------');
    lines.push('روش تحویل: ' + delivery);
    if (note) {
      lines.push('توضیحات (آسیاب / وزن / هماهنگی): ' + note);
    }
    lines.push('آدرس: تهران، تهرانپارس، خیابان جشنواره، روبروی بهزیستی، پلاک ۴۸');
    return lines.join('\n');
  }

  function refreshPreviewText() {
    var preview = document.getElementById('simorghInvoicePreview');
    if (!preview) return;
    var items = safeGetCart();
    preview.value = items.length ? buildInvoiceText() : '';
  }

  function renderModalContent() {
    var listEl = document.getElementById('simorghCartItems');
    if (!listEl) return;
    var items = safeGetCart();
    if (!items.length) {
      listEl.innerHTML = '<div style="text-align:center;color:#6b625a;font-size:13px;padding:16px 8px;">هنوز موردی به فاکتور اضافه نشده است.</div>';
      refreshPreviewText();
      return;
    }
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      html += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:#fcf7f0;border:1px solid #e7d6c0;border-radius:10px;padding:9px 10px;margin-bottom:8px;">' +
        '<div style="font-size:12.5px;font-weight:bold;color:#26130a;flex:1;text-align:right;">' + escapeHtml(it.name) + '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<button type="button" onclick="SimorghCart.changeQty(' + i + ',-1)" style="width:26px;height:26px;border-radius:7px;border:1px solid #d8c3a8;background:#fff;font-weight:bold;cursor:pointer;">-</button>' +
          '<span style="min-width:20px;text-align:center;font-weight:bold;font-size:13px;">' + (it.qty || 1) + '</span>' +
          '<button type="button" onclick="SimorghCart.changeQty(' + i + ',1)" style="width:26px;height:26px;border-radius:7px;border:1px solid #d8c3a8;background:#fff;font-weight:bold;cursor:pointer;">+</button>' +
          '<button type="button" onclick="SimorghCart.removeItem(' + i + ')" style="border:none;background:#fee2e2;color:#991b1b;border-radius:7px;padding:4px 8px;font-size:11px;font-weight:bold;cursor:pointer;">حذف</button>' +
        '</div>' +
      '</div>';
    }
    listEl.innerHTML = html;
    refreshPreviewText();
  }

  function copyTextNow(text) {
    var ok = false;
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      ok = document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) {}

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
    }
    return ok;
  }

  function openBaleDirect() {
    try {
      var a = document.createElement('a');
      a.href = BALE_URL;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      try {
        window.location.href = BALE_URL;
      } catch (err) {}
    }
  }

  function copyOnly() {
    var items = safeGetCart();
    if (!items.length) {
      notify('ابتدا حداقل یک مورد به فاکتور اضافه کنید');
      return;
    }
    var text = buildInvoiceText();
    var preview = document.getElementById('simorghInvoicePreview');
    if (preview) preview.value = text;
    copyTextNow(text);
    notify('متن فاکتور کپی شد؛ در بله پیست کنید');
  }

  function copyAndOpenBale() {
    var items = safeGetCart();
    if (!items.length) {
      notify('ابتدا حداقل یک مورد به فاکتور اضافه کنید');
      return;
    }
    var text = buildInvoiceText();
    var preview = document.getElementById('simorghInvoicePreview');
    if (preview) preview.value = text;
    copyTextNow(text);
    notify('کپی شد! در بله وارد کادر پیام شوید و پیست کنید');
    setTimeout(openBaleDirect, 250);
  }

  function injectUI() {
    if (document.getElementById('simorghInvoiceModal')) return;

    var modal = document.createElement('div');
    modal.id = 'simorghInvoiceModal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(20,10,5,.55);z-index:1500;padding:14px;align-items:center;justify-content:center;direction:rtl;font-family:Tahoma,sans-serif;';
    modal.innerHTML =
      '<div style="background:#fff;max-width:470px;width:100%;border-radius:18px;padding:16px;box-shadow:0 16px 36px rgba(0,0,0,.25);border:1px solid #ead8c0;max-height:90vh;overflow-y:auto;text-align:right;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
          '<strong style="font-size:14px;color:#26130a;">🧾 فاکتور انتخابی شما</strong>' +
          '<button type="button" onclick="SimorghCart.closeModal()" style="border:none;background:#f4ece0;color:#3d2314;border-radius:8px;padding:4px 10px;font-weight:bold;cursor:pointer;font-family:Tahoma,sans-serif;">بستن</button>' +
        '</div>' +
        '<div id="simorghCartItems"></div>' +
        '<div style="margin-top:8px;">' +
          '<label style="display:block;font-size:12px;font-weight:bold;color:#3d2314;margin-bottom:4px;">نحوه دریافت سفارش:</label>' +
          '<select id="simorghDeliveryType" onchange="SimorghCart.refreshPreview()" style="width:100%;padding:8px 10px;border-radius:9px;border:1px solid #dfcbb0;background:#fcf7f0;font-family:Tahoma,sans-serif;font-size:12px;font-weight:bold;">' +
            '<option value="تحویل حضوری در فروشگاه (تهرانپارس)">تحویل حضوری در فروشگاه (تهرانپارس)</option>' +
            '<option value="ارسال پیکی در تهرانپارس و اطراف">ارسال پیکی در تهرانپارس و اطراف</option>' +
          '</select>' +
        '</div>' +
        '<div style="margin-top:8px;">' +
          '<label style="display:block;font-size:12px;font-weight:bold;color:#3d2314;margin-bottom:4px;">توضیحات (درجه آسیاب، وزن یا هماهنگی):</label>' +
          '<input id="simorghOrderNote" oninput="SimorghCart.refreshPreview()" type="text" placeholder="مثال: آسیاب اسپرسو، ۲۵۰ گرم..." style="width:100%;padding:8px 10px;border-radius:9px;border:1px solid #dfcbb0;font-family:Tahoma,sans-serif;font-size:12px;">' +
        '</div>' +
        '<div style="margin-top:10px;">' +
          '<label style="display:block;font-size:11.5px;font-weight:bold;color:#5c534b;margin-bottom:4px;">پیش‌نمایش متن فاکتور (در بله پیست و ارسال کنید):</label>' +
          '<textarea id="simorghInvoicePreview" readonly rows="5" style="width:100%;padding:8px;border-radius:9px;border:1px solid #e7d6c0;background:#fcf7f0;font-family:Tahoma,sans-serif;font-size:11.5px;line-height:1.55;color:#231e1a;resize:vertical;"></textarea>' +
        '</div>' +
        '<div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap;">' +
          '<button type="button" onclick="SimorghCart.sendToBale()" style="flex:1.5;min-width:140px;border:none;background:#00779b;color:#fff;padding:10px;border-radius:10px;font-weight:bold;font-size:12.5px;cursor:pointer;font-family:Tahoma,sans-serif;">کپی و باز کردن بله</button>' +
          '<button type="button" onclick="SimorghCart.copyOnly()" style="flex:1;min-width:90px;border:1px solid #d8c3a8;background:#fcf7f0;color:#26130a;padding:10px;border-radius:10px;font-weight:bold;font-size:12px;cursor:pointer;font-family:Tahoma,sans-serif;">فقط کپی متن</button>' +
          '<button type="button" onclick="SimorghCart.clearCart()" style="border:1px solid #e5c9c9;background:#fff5f5;color:#991b1b;padding:10px;border-radius:10px;font-weight:bold;font-size:11.5px;cursor:pointer;font-family:Tahoma,sans-serif;">خالی کردن</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  window.SimorghCart = {
    add: function (itemName) {
      if (!itemName) return;
      var items = safeGetCart();
      var found = false;
      for (var i = 0; i < items.length; i++) {
        if (items[i].name === itemName) {
          items[i].qty = (items[i].qty || 1) + 1;
          found = true;
          break;
        }
      }
      if (!found) {
        items.push({ name: String(itemName), qty: 1 });
      }
      safeSaveCart(items);
      renderBadge();
      renderModalContent();
      notify('«' + itemName + '» به فاکتور اضافه شد');
    },
    changeQty: function (index, delta) {
      var items = safeGetCart();
      if (!items[index]) return;
      var nextQty = (items[index].qty || 1) + delta;
      if (nextQty <= 0) {
        items.splice(index, 1);
      } else {
        items[index].qty = nextQty;
      }
      safeSaveCart(items);
      renderBadge();
      renderModalContent();
    },
    removeItem: function (index) {
      var items = safeGetCart();
      if (!items[index]) return;
      items.splice(index, 1);
      safeSaveCart(items);
      renderBadge();
      renderModalContent();
    },
    clearCart: function () {
      safeSaveCart([]);
      renderBadge();
      renderModalContent();
      notify('فاکتور خالی شد');
    },
    refreshPreview: function () {
      refreshPreviewText();
    },
    copyOnly: function () {
      copyOnly();
    },
    openModal: function () {
      injectUI();
      renderModalContent();
      var modal = document.getElementById('simorghInvoiceModal');
      if (modal) modal.style.display = 'flex';
    },
    closeModal: function () {
      var modal = document.getElementById('simorghInvoiceModal');
      if (modal) modal.style.display = 'none';
    },
    sendToBale: function () {
      copyAndOpenBale();
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    injectUI();
    renderBadge();
  });
})();
