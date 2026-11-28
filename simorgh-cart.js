(function () {
  if (window.__simorghStandardCartLoaded) return;
  window.__simorghStandardCartLoaded = true;

  var STORAGE_KEY = "simorgh_user_invoice_items_v2";
  var items = [];

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeUnit(u) {
    if (u === "کیلوگرم" || u === "بسته" || u === "گرم") return u;
    return "گرم";
  }

  function injectStyles() {
    if (document.getElementById("simorghStandardCartStyle")) return;
    var style = document.createElement("style");
    style.id = "simorghStandardCartStyle";
    style.textContent =
      ".fallback-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:none;align-items:center;justify-content:center;padding:14px}" +
      ".fallback-modal-backdrop.open{display:flex}" +
      ".fallback-modal-card{width:100%;max-width:440px;max-height:85vh;overflow-y:auto;background:#fffdf9;color:#26130a;border-radius:18px;padding:16px;direction:rtl;box-sizing:border-box;font-family:Tahoma,'IranSans',sans-serif}" +
      ".fallback-modal-head{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #ead9c1;padding-bottom:8px;margin-bottom:10px;font-weight:bold;font-size:14px}" +
      ".fallback-close-btn{border:0;background:#fee2e2;color:#991b1b;border-radius:8px;padding:4px 10px;font-weight:bold;cursor:pointer;font-family:Tahoma,sans-serif}" +
      ".fallback-empty{text-align:center;color:#6b5848;background:#faf4eb;border:1px dashed #e2ceb3;border-radius:12px;padding:16px 10px;margin-bottom:10px;font-size:12px}" +
      ".fallback-item-row{display:flex;justify-content:space-between;align-items:center;gap:8px;background:#faf4eb;border:1px solid #ead9c1;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:11.5px}" +
      ".item-meta-sub{display:block;font-size:10.5px;color:#6b5848;margin-top:2px}" +
      ".qty-controls{display:flex;align-items:center;gap:6px}" +
      ".qty-btn{width:24px;height:24px;border:1px solid #d7b285;background:#fff;color:#26130a;border-radius:6px;font-weight:bold;cursor:pointer}" +
      ".fallback-field{width:100%;border:1px solid #e2ceb3;background:#fff;border-radius:9px;padding:7px 10px;margin-bottom:8px;font-size:11.5px;font-family:Tahoma,sans-serif;color:#26130a;box-sizing:border-box}" +
      ".select-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-bottom:8px}" +
      ".select-grid-2 .fallback-field{margin-bottom:0}" +
      ".fallback-actions{display:grid;grid-template-columns:1fr 1fr auto;gap:6px;margin-top:10px}" +
      ".fallback-send-bale{text-align:center;text-decoration:none;background:#0284c7;color:#fff;padding:9px 10px;border-radius:10px;font-weight:bold;font-size:11.5px;display:flex;align-items:center;justify-content:center}" +
      ".fallback-copy-btn,.fallback-clear-btn{border:1px solid #d8c3a8;background:#faf4eb;color:#26130a;padding:9px 10px;border-radius:10px;font-weight:bold;font-size:11.5px;cursor:pointer;font-family:Tahoma,sans-serif}";
    document.head.appendChild(style);
  }

  function injectModalHtml() {
    if (document.getElementById("simorghFallbackModal")) return;
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div id="simorghFallbackModal" class="fallback-modal-backdrop" role="dialog" aria-modal="true">' +
      '  <div class="fallback-modal-card">' +
      '    <div class="fallback-modal-head">' +
      '      <span>فاکتور سفارش سیمرغ</span>' +
      '      <button type="button" id="fallbackCloseBtn" class="fallback-close-btn">بستن</button>' +
      '    </div>' +
      '    <div id="fallbackItemsList"></div>' +
      '    <div class="select-grid-2">' +
      '      <input type="number" id="invAmountNumber" class="fallback-field" min="1" step="1" placeholder="عدد / مقدار" aria-label="عدد یا مقدار" />' +
      '      <select id="invWeightUnit" class="fallback-field" aria-label="واحد مقدار">' +
      '        <option value="گرم">واحد: گرم</option>' +
      '        <option value="کیلوگرم">واحد: کیلوگرم</option>' +
      '        <option value="بسته">واحد: بسته</option>' +
      '      </select>' +
      '    </div>' +
      '    <div class="select-grid-2">' +
      '      <select id="invGrindType" class="fallback-field" aria-label="نوع آسیاب">' +
      '        <option value="">نوع آسیاب</option>' +
      '        <option value="دانه کامل">دانه کامل</option>' +
      '        <option value="اسپرسو">اسپرسو</option>' +
      '        <option value="موکاپات">موکاپات</option>' +
      '        <option value="فرانسه / دمی">فرانسه / دمی</option>' +
      '        <option value="ترک">ترک</option>' +
      '      </select>' +
      '      <select id="invDeliveryType" class="fallback-field" aria-label="نوع تحویل">' +
      '        <option value="">نوع تحویل</option>' +
      '        <option value="پیک">پیک</option>' +
      '        <option value="حضوری">حضوری</option>' +
      '      </select>' +
      '    </div>' +
      '    <input type="tel" id="invCustomerPhone" class="fallback-field" placeholder="شماره تماس (مثال: 0912...)" aria-label="شماره تماس" />' +
      '    <input type="text" id="invCustomerAddress" class="fallback-field" placeholder="آدرس تحویل (برای ارسال با پیک)" aria-label="آدرس تحویل" />' +
      '    <div class="fallback-actions">' +
      '      <a id="fallbackBaleLink" class="fallback-send-bale" href="https://ble.ir/simorgh_coffee" target="_blank" rel="noopener noreferrer">ارسال به بله</a>' +
      '      <button type="button" id="fallbackCopyBtn" class="fallback-copy-btn">کپی متن</button>' +
      '      <button type="button" id="fallbackClearBtn" class="fallback-clear-btn">پاک کردن</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(wrap.firstElementChild);
  }

  function loadItems() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .filter(function (x) { return x && x.name && (Number(x.qty) || 0) > 0; })
            .map(function (x) {
              return {
                id: x.id || "",
                name: String(x.name),
                qty: Number(x.qty) || 1,
                unit: normalizeUnit(x.unit)
              };
            });
        }
      }
    } catch (e) {}
    return [];
  }

  function init() {
    injectStyles();
    injectModalHtml();
    items = loadItems();

    var cntEl = document.getElementById("simorghCartCount");
    var modalEl = document.getElementById("simorghFallbackModal");
    var listEl = document.getElementById("fallbackItemsList");
    var closeBtn = document.getElementById("fallbackCloseBtn");
    var clearBtn = document.getElementById("fallbackClearBtn");
    var copyBtn = document.getElementById("fallbackCopyBtn");
    var baleLink = document.getElementById("fallbackBaleLink");
    var unitSelectEl = document.getElementById("invWeightUnit");
    var amountInputEl = document.getElementById("invAmountNumber");

    function getCurrentUnit() {
      return normalizeUnit(unitSelectEl ? unitSelectEl.value : "گرم");
    }

    function buildOrderText() {
      var lines = ["فاکتور سفارش کلبه چای و قهوه سیمرغ (تهرانپارس):"];
      if (!items.length) {
        lines.push("• هنوز موردی از منو به فاکتور اضافه نشده است.");
      } else {
        for (var i = 0; i < items.length; i++) {
          var q = Number(items[i].qty) || 0;
          var u = normalizeUnit(items[i].unit);
          lines.push("• " + items[i].name + " — مقدار: " + q + " " + u);
        }
      }
      var gt = (document.getElementById("invGrindType") && document.getElementById("invGrindType").value || "").trim();
      var dt = (document.getElementById("invDeliveryType") && document.getElementById("invDeliveryType").value || "").trim();
      var ph = (document.getElementById("invCustomerPhone") && document.getElementById("invCustomerPhone").value || "").trim();
      var ad = (document.getElementById("invCustomerAddress") && document.getElementById("invCustomerAddress").value || "").trim();
      if (gt) lines.push("نوع آسیاب: " + gt);
      if (dt) lines.push("نوع تحویل: " + dt);
      if (ph) lines.push("شماره تماس: " + ph);
      if (ad) lines.push("آدرس: " + ad);
      return lines.join("\n");
    }

    function updateBaleHref() {
      if (baleLink) {
        baleLink.href = "https://ble.ir/simorgh_coffee?text=" + encodeURIComponent(buildOrderText());
      }
    }

    function syncState() {
      items = items.filter(function (x) { return x && x.name && (Number(x.qty) || 0) > 0; });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (e) {}
      var total = 0;
      for (var i = 0; i < items.length; i++) {
        total += Number(items[i].qty) || 0;
      }
      if (cntEl) cntEl.textContent = String(total);
      updateBaleHref();
    }

    function renderList() {
      if (!listEl) return;
      if (!items.length) {
        listEl.innerHTML = '<div class="fallback-empty">فاکتور شما خالی است. موارد دلخواه را از دسته‌بندی‌ها یا دکمه «+ به فاکتور» اضافه کنید.</div>';
        updateBaleHref();
        return;
      }
      var html = "";
      for (var i = 0; i < items.length; i++) {
        var q = Number(items[i].qty) || 0;
        var u = normalizeUnit(items[i].unit);
        html += '<div class="fallback-item-row">' +
          '<div><strong>' + escapeHtml(items[i].name) + '</strong>' +
          '<span class="item-meta-sub">مقدار: ' + q + ' ' + escapeHtml(u) + '</span></div>' +
          '<div class="qty-controls">' +
          '<button type="button" class="qty-btn" data-idx="' + i + '" data-delta="-1">-</button>' +
          '<span>' + q + '</span>' +
          '<button type="button" class="qty-btn" data-idx="' + i + '" data-delta="1">+</button>' +
          '</div></div>';
      }
      listEl.innerHTML = html;

      var qtyButtons = listEl.querySelectorAll(".qty-btn");
      for (var k = 0; k < qtyButtons.length; k++) {
        qtyButtons[k].addEventListener("click", function () {
          var idx = Number(this.getAttribute("data-idx"));
          var delta = Number(this.getAttribute("data-delta"));
          if (!items[idx]) return;
          var nextQty = (Number(items[idx].qty) || 0) + delta;
          if (nextQty <= 0) items.splice(idx, 1);
          else items[idx].qty = nextQty;
          syncState();
          renderList();
        });
      }
      updateBaleHref();
    }

    function addToCart(name, id) {
      var cleanName = String(name || "").trim();
      if (!cleanName) return;
      var cleanId = String(id || "").trim();
      var activeUnit = getCurrentUnit();
      var enteredNum = amountInputEl && Number(amountInputEl.value) > 0 ? Number(amountInputEl.value) : 1;

      var found = null;
      for (var i = 0; i < items.length; i++) {
        var sameItem = (cleanId && items[i].id === cleanId) || items[i].name === cleanName;
        if (sameItem && normalizeUnit(items[i].unit) === activeUnit) {
          found = items[i];
          break;
        }
      }
      if (found) {
        found.qty = (Number(found.qty) || 0) + enteredNum;
      } else {
        items.push({
          id: cleanId || ("item-" + Date.now()),
          name: cleanName,
          qty: enteredNum,
          unit: activeUnit
        });
      }
      syncState();
      if (modalEl && modalEl.classList.contains("open")) {
        renderList();
      }
    }

    document.addEventListener("click", function (ev) {
      var openTrigger = ev.target.closest ? ev.target.closest("[data-open-invoice], #openInvoiceBarBtn") : null;
      if (openTrigger) {
        ev.preventDefault();
        renderList();
        if (modalEl) modalEl.classList.add("open");
        return;
      }

      var addTrigger = ev.target.closest ? ev.target.closest("[data-add-invoice], .q-add-btn") : null;
      if (addTrigger) {
        ev.preventDefault();
        var itemName = addTrigger.getAttribute("data-item-name") || addTrigger.getAttribute("data-name") || "محصول سیمرغ";
        var itemId = addTrigger.getAttribute("data-item-id") || addTrigger.getAttribute("data-id") || "";
        addToCart(itemName, itemId);

        var prevText = addTrigger.textContent;
        addTrigger.textContent = "اضافه شد ✓";
        addTrigger.classList.add("added");
        setTimeout(function () {
          addTrigger.textContent = prevText || "+ به فاکتور";
          addTrigger.classList.remove("added");
        }, 900);
      }
    });

    if (unitSelectEl) {
      unitSelectEl.addEventListener("change", function () {
        var chosenUnit = getCurrentUnit();
        for (var i = 0; i < items.length; i++) items[i].unit = chosenUnit;
        syncState();
        if (modalEl && modalEl.classList.contains("open")) renderList();
      });
    }

    if (amountInputEl) {
      amountInputEl.addEventListener("input", function () {
        var num = Number(this.value);
        if (num > 0 && items.length > 0) {
          items[items.length - 1].qty = num;
          syncState();
          if (modalEl && modalEl.classList.contains("open")) renderList();
        }
      });
    }

    if (closeBtn && modalEl) {
      closeBtn.addEventListener("click", function () { modalEl.classList.remove("open"); });
    }
    if (modalEl) {
      modalEl.addEventListener("click", function (ev) {
        if (ev.target === modalEl) modalEl.classList.remove("open");
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        items = [];
        if (amountInputEl) amountInputEl.value = "";
        syncState();
        renderList();
      });
    }
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var text = buildOrderText();
        try {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        } catch (e) {}
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(function () {});
        }
        copyBtn.textContent = "کپی شد ✓";
        setTimeout(function () { copyBtn.textContent = "کپی متن"; }, 1800);
      });
    }

    ["invGrindType", "invDeliveryType", "invCustomerPhone", "invCustomerAddress"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", updateBaleHref);
        el.addEventListener("change", updateBaleHref);
      }
    });

    syncState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
