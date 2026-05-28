(function () {
  const API_URL = "/.netlify/functions/popups";
  const DISMISS_PREFIX = "mikeone-popup-dismissed:";

  function todayString() {
    return new Date().toISOString().slice(0, 10);
  }

  function isInDateRange(popup) {
    const today = todayString();
    if (popup.startDate && popup.startDate > today) return false;
    if (popup.endDate && popup.endDate < today) return false;
    return true;
  }

  function isDismissed(popup) {
    const dismissedUntil = localStorage.getItem(`${DISMISS_PREFIX}${popup.id}`);
    return dismissedUntil && dismissedUntil >= todayString();
  }

  function dismissToday(popup) {
    localStorage.setItem(`${DISMISS_PREFIX}${popup.id}`, todayString());
  }

  function injectStyles() {
    if (document.getElementById("mikeone-popup-style")) return;

    const style = document.createElement("style");
    style.id = "mikeone-popup-style";
    style.textContent = `
      .mikeone-popup-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1200;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: color-mix(in srgb, var(--navy, #0c1b2e) 72%, rgba(0, 0, 0, 0.72));
        backdrop-filter: blur(8px);
      }
      .mikeone-popup-card {
        position: relative;
        width: min(520px, 100%);
        border: 1px solid color-mix(in srgb, var(--gold, #c9a227) 38%, transparent);
        border-radius: 12px;
        background:
          linear-gradient(145deg,
            color-mix(in srgb, var(--navy, #0c1b2e) 92%, var(--gold-pale, #f5e9c0) 8%),
            color-mix(in srgb, var(--navy-mid, #122540) 94%, #000 6%));
        box-shadow: 0 24px 80px color-mix(in srgb, var(--navy, #0c1b2e) 50%, rgba(0, 0, 0, 0.45));
        color: var(--white, #f5f3ee);
        overflow: hidden;
      }
      .mikeone-popup-card::before {
        content: "";
        position: absolute;
        inset: 0 0 auto;
        height: 4px;
        background: linear-gradient(90deg, var(--gold, #c9a227), var(--gold-light, #e8c54a));
      }
      .mikeone-popup-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        padding: 28px 30px 10px;
      }
      .mikeone-popup-kicker {
        margin-bottom: 8px;
        color: var(--gold, #c9a227);
        font-family: 'Nanum Gothic', 'Noto Sans KR', sans-serif;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
      }
      .mikeone-popup-title {
        margin: 0;
        color: var(--white, #f5f3ee);
        font-family: 'Nanum Myeongjo', 'Noto Serif KR', serif;
        font-size: 24px;
        line-height: 1.35;
      }
      .mikeone-popup-close {
        appearance: none;
        border: 0;
        background: transparent;
        color: var(--gray, #8b9bb4);
        cursor: pointer;
        font-size: 28px;
        line-height: 1;
      }
      .mikeone-popup-close:hover { color: var(--gold, #c9a227); }
      .mikeone-popup-body {
        padding: 8px 30px 28px;
        color: var(--gray-light, #cbd5e1);
        font-family: 'Nanum Myeongjo', 'Noto Serif KR', serif;
        font-size: 16px;
        line-height: 1.9;
        white-space: pre-line;
      }
      .mikeone-popup-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        padding: 18px 30px 24px;
        border-top: 1px solid color-mix(in srgb, var(--gold, #c9a227) 18%, transparent);
      }
      .mikeone-popup-dismiss {
        appearance: none;
        border: 0;
        background: transparent;
        color: var(--gray, #8b9bb4);
        cursor: pointer;
        font-size: 13px;
      }
      .mikeone-popup-dismiss:hover { color: var(--white, #f5f3ee); }
      .mikeone-popup-pager {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 42px;
        padding: 0 4px;
        color: var(--gold, #c9a227);
        font-family: 'Nanum Gothic', 'Noto Sans KR', sans-serif;
      }
      .mikeone-popup-pager-button {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border: 1px solid color-mix(in srgb, var(--gold, #c9a227) 28%, transparent);
        border-radius: 999px;
        background: color-mix(in srgb, var(--gold, #c9a227) 8%, transparent);
        color: var(--gold, #c9a227);
        cursor: pointer;
        font-size: 24px;
        line-height: 1;
      }
      .mikeone-popup-pager-button:hover:not(:disabled) {
        border-color: var(--gold, #c9a227);
        background: var(--gold, #c9a227);
        color: var(--navy, #0c1b2e);
      }
      .mikeone-popup-pager-button:disabled {
        cursor: default;
        opacity: 0.34;
      }
      .mikeone-popup-count {
        min-width: 38px;
        color: var(--gray-light, #cbd5e1);
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0;
        text-align: center;
      }
      .mikeone-popup-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        padding: 0 20px;
        border-radius: 4px;
        background: var(--gold, #c9a227);
        color: var(--navy, #0c1b2e);
        font-family: 'Nanum Gothic', 'Noto Sans KR', sans-serif;
        font-size: 14px;
        font-weight: 800;
        text-decoration: none;
      }
      .mikeone-popup-link:hover { background: var(--gold-light, #e8c54a); }
      .mikeone-popup-primary-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        flex-wrap: wrap;
      }
      .mikeone-popup-zone {
        width: min(980px, 100%);
      }
      .mikeone-popup-zone .mikeone-popup-head {
        align-items: center;
        padding-bottom: 18px;
      }
      .mikeone-popup-zone-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        padding: 0 30px 28px;
      }
      .mikeone-popup-zone-item {
        display: flex;
        flex-direction: column;
        min-height: 310px;
        border: 1px solid color-mix(in srgb, var(--gold, #c9a227) 18%, transparent);
        border-radius: 10px;
        background: color-mix(in srgb, var(--white, #f5f3ee) 7%, transparent);
        overflow: hidden;
      }
      .mikeone-popup-zone-image {
        display: block;
        width: 100%;
        aspect-ratio: 16 / 10;
        object-fit: cover;
        background:
          linear-gradient(135deg,
            color-mix(in srgb, var(--gold, #c9a227) 28%, transparent),
            color-mix(in srgb, var(--navy-mid, #122540) 80%, transparent));
      }
      .mikeone-popup-zone-content {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 12px;
        padding: 18px;
      }
      .mikeone-popup-zone-title {
        margin: 0;
        color: var(--white, #f5f3ee);
        font-family: 'Nanum Myeongjo', 'Noto Serif KR', serif;
        font-size: 19px;
        line-height: 1.35;
      }
      .mikeone-popup-zone-body {
        flex: 1;
        color: var(--gray-light, #cbd5e1);
        font-family: 'Nanum Myeongjo', 'Noto Serif KR', serif;
        font-size: 14px;
        line-height: 1.65;
        white-space: pre-line;
      }
      .mikeone-popup-zone-link {
        align-self: flex-start;
        min-height: 36px;
        padding: 0 14px;
        font-size: 13px;
      }
      [data-theme="4"] .mikeone-popup-backdrop {
        background: rgba(54, 54, 54, 0.52);
      }
      [data-theme="4"] .mikeone-popup-card {
        background: linear-gradient(145deg, #ffffff, #faf7ef);
        box-shadow: 0 24px 80px rgba(54, 54, 54, 0.24);
      }
      [data-theme="4"] .mikeone-popup-link {
        background: #363636;
        color: #ffffff;
      }
      [data-theme="4"] .mikeone-popup-link:hover {
        background: var(--gold, #d6b07a);
        color: #212121;
      }
      [data-theme="4"] .mikeone-popup-zone-item {
        background: rgba(255, 255, 255, 0.74);
        border-color: rgba(214, 176, 122, 0.3);
      }
      @media (max-width: 560px) {
        .mikeone-popup-backdrop { padding: 16px; align-items: flex-end; }
        .mikeone-popup-head { padding: 24px 22px 8px; }
        .mikeone-popup-title { font-size: 21px; }
        .mikeone-popup-body { padding: 8px 22px 24px; font-size: 14px; }
        .mikeone-popup-actions {
          flex-direction: column-reverse;
          align-items: stretch;
          padding: 16px 22px 22px;
        }
        .mikeone-popup-primary-actions {
          width: 100%;
          flex-direction: column-reverse;
          align-items: stretch;
        }
        .mikeone-popup-pager {
          justify-content: center;
        }
        .mikeone-popup-link {
          width: 100%;
        }
        .mikeone-popup-zone-grid {
          grid-template-columns: 1fr;
          max-height: 56vh;
          overflow: auto;
          padding: 0 22px 22px;
        }
        .mikeone-popup-zone-item {
          min-height: 0;
        }
        .mikeone-popup-zone .mikeone-popup-head {
          padding-bottom: 14px;
        }
      }
      @media (min-width: 561px) and (max-width: 900px) {
        .mikeone-popup-zone-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `;
    document.head.appendChild(style);
  }

  function closePopup(backdrop, popup, shouldDismiss) {
    if (shouldDismiss) dismissToday(popup);
    backdrop.remove();
    document.body.style.overflow = "";
  }

  function showPopupQueue(popups) {
    if (!popups.length) return;
    const zonePopups = popups.filter((popup) => popup.displayMode === "zone");
    if (zonePopups.length) {
      showPopupZone(zonePopups, 0);
      return;
    }
    showPopup(popups, 0);
  }

  function bindPopupLink(backdrop, link) {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href") || "";
      if (href.startsWith("#")) {
        event.preventDefault();
        backdrop.remove();
        document.body.style.overflow = "";
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
        history.pushState(null, "", href);
      } else {
        backdrop.remove();
        document.body.style.overflow = "";
      }
    });
  }

  function showPopupZone(popups, page) {
    injectStyles();

    const pageSize = window.matchMedia("(max-width: 560px)").matches ? 1 : 3;
    const pageCount = Math.ceil(popups.length / pageSize);
    const safePage = Math.min(Math.max(page, 0), pageCount - 1);
    const visiblePopups = popups.slice(safePage * pageSize, safePage * pageSize + pageSize);
    const hasPrevious = safePage > 0;
    const hasNext = safePage < pageCount - 1;

    const backdrop = document.createElement("div");
    backdrop.className = "mikeone-popup-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");

    const pagerHtml = pageCount > 1
      ? `
        <div class="mikeone-popup-pager" aria-label="공지 이동">
          <button class="mikeone-popup-pager-button mikeone-popup-prev" type="button" aria-label="이전 공지" ${hasPrevious ? "" : "disabled"}>‹</button>
          <span class="mikeone-popup-count" aria-live="polite">${safePage + 1}/${pageCount}</span>
          <button class="mikeone-popup-pager-button mikeone-popup-next" type="button" aria-label="다음 공지" ${hasNext ? "" : "disabled"}>›</button>
        </div>
      `
      : "";

    const cardsHtml = visiblePopups.map((popup) => {
      const imageHtml = popup.imageUrl
        ? `<img class="mikeone-popup-zone-image" src="${escapeAttribute(popup.imageUrl)}" alt="">`
        : `<div class="mikeone-popup-zone-image" aria-hidden="true"></div>`;
      const linkHtml = popup.buttonText && popup.buttonUrl
        ? `<a class="mikeone-popup-link mikeone-popup-zone-link" href="${escapeAttribute(popup.buttonUrl)}">${escapeHtml(popup.buttonText)}</a>`
        : "";

      return `
        <article class="mikeone-popup-zone-item">
          ${imageHtml}
          <div class="mikeone-popup-zone-content">
            <h3 class="mikeone-popup-zone-title">${escapeHtml(popup.title)}</h3>
            <div class="mikeone-popup-zone-body">${escapeHtml(popup.body)}</div>
            ${linkHtml}
          </div>
        </article>
      `;
    }).join("");

    backdrop.innerHTML = `
      <div class="mikeone-popup-card mikeone-popup-zone">
        <div class="mikeone-popup-head">
          <div>
            <div class="mikeone-popup-kicker">MIKEONE NOTICE</div>
            <h2 class="mikeone-popup-title">마이크온 팝업존</h2>
          </div>
          <button class="mikeone-popup-close" type="button" aria-label="팝업 닫기">×</button>
        </div>
        <div class="mikeone-popup-zone-grid">${cardsHtml}</div>
        <div class="mikeone-popup-actions">
          <button class="mikeone-popup-dismiss" type="button">오늘 하루 보지 않기</button>
          <div class="mikeone-popup-primary-actions">${pagerHtml}</div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.style.overflow = "hidden";

    function showPage(nextPage) {
      backdrop.remove();
      document.body.style.overflow = "";
      showPopupZone(popups, nextPage);
    }

    backdrop.querySelector(".mikeone-popup-close").addEventListener("click", () => {
      backdrop.remove();
      document.body.style.overflow = "";
    });
    backdrop.querySelector(".mikeone-popup-dismiss").addEventListener("click", () => {
      popups.forEach(dismissToday);
      backdrop.remove();
      document.body.style.overflow = "";
    });
    backdrop.querySelector(".mikeone-popup-prev")?.addEventListener("click", () => {
      if (hasPrevious) showPage(safePage - 1);
    });
    backdrop.querySelector(".mikeone-popup-next")?.addEventListener("click", () => {
      if (hasNext) showPage(safePage + 1);
    });
    backdrop.querySelectorAll(".mikeone-popup-link").forEach((link) => bindPopupLink(backdrop, link));
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        backdrop.remove();
        document.body.style.overflow = "";
      }
    });
  }

  function showPopup(popups, index) {
    injectStyles();

    const popup = popups[index];
    const backdrop = document.createElement("div");
    backdrop.className = "mikeone-popup-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");

    const buttonHtml = popup.buttonText && popup.buttonUrl
      ? `<a class="mikeone-popup-link" href="${escapeAttribute(popup.buttonUrl)}">${escapeHtml(popup.buttonText)}</a>`
      : "";
    const hasPrevious = index > 0;
    const hasNext = index < popups.length - 1;
    const pagerHtml = popups.length > 1
      ? `
        <div class="mikeone-popup-pager" aria-label="공지 이동">
          <button class="mikeone-popup-pager-button mikeone-popup-prev" type="button" aria-label="이전 공지" ${hasPrevious ? "" : "disabled"}>‹</button>
          <span class="mikeone-popup-count" aria-live="polite">${index + 1}/${popups.length}</span>
          <button class="mikeone-popup-pager-button mikeone-popup-next" type="button" aria-label="다음 공지" ${hasNext ? "" : "disabled"}>›</button>
        </div>
      `
      : "";

    backdrop.innerHTML = `
      <div class="mikeone-popup-card">
        <div class="mikeone-popup-head">
          <div>
            <div class="mikeone-popup-kicker">MIKEONE NOTICE</div>
            <h2 class="mikeone-popup-title">${escapeHtml(popup.title)}</h2>
          </div>
          <button class="mikeone-popup-close" type="button" aria-label="팝업 닫기">×</button>
        </div>
        <div class="mikeone-popup-body">${escapeHtml(popup.body)}</div>
        <div class="mikeone-popup-actions">
          <button class="mikeone-popup-dismiss" type="button">오늘 하루 보지 않기</button>
          <div class="mikeone-popup-primary-actions">
            ${pagerHtml}
            ${buttonHtml}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.style.overflow = "hidden";

    function showNext(shouldDismiss) {
      if (shouldDismiss) dismissToday(popup);
      backdrop.remove();
      document.body.style.overflow = "";
      if (hasNext) {
        showPopup(popups, index + 1);
      }
    }

    function showPrevious() {
      backdrop.remove();
      document.body.style.overflow = "";
      if (hasPrevious) {
        showPopup(popups, index - 1);
      }
    }

    backdrop.querySelector(".mikeone-popup-close").addEventListener("click", () => {
      showNext(false);
    });
    backdrop.querySelector(".mikeone-popup-dismiss").addEventListener("click", () => {
      showNext(true);
    });
    backdrop.querySelector(".mikeone-popup-prev")?.addEventListener("click", () => {
      showPrevious();
    });
    backdrop.querySelector(".mikeone-popup-next")?.addEventListener("click", () => {
      showNext(false);
    });
    const link = backdrop.querySelector(".mikeone-popup-link");
    if (link) {
      bindPopupLink(backdrop, link);
    }
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) showNext(false);
    });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
  }

  async function init() {
    try {
      const response = await fetch(API_URL, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const popups = (data.popups || []).filter((item) =>
        item.active && isInDateRange(item) && !isDismissed(item)
      );
      showPopupQueue(popups);
    } catch {
      // Popup notices are non-critical. Keep the homepage usable if the API is unavailable.
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
