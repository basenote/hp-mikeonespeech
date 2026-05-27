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
        background: rgba(4, 10, 20, 0.72);
        backdrop-filter: blur(8px);
      }
      .mikeone-popup-card {
        width: min(520px, 100%);
        border: 1px solid rgba(201, 162, 39, 0.35);
        border-radius: 12px;
        background: linear-gradient(145deg, #10223a, #07111f);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
        color: #f5f3ee;
        overflow: hidden;
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
        color: #e8c54a;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
      }
      .mikeone-popup-title {
        margin: 0;
        color: #f5f3ee;
        font-family: 'Noto Serif KR', serif;
        font-size: 24px;
        line-height: 1.35;
      }
      .mikeone-popup-close {
        appearance: none;
        border: 0;
        background: transparent;
        color: #8b9bb4;
        cursor: pointer;
        font-size: 28px;
        line-height: 1;
      }
      .mikeone-popup-close:hover { color: #e8c54a; }
      .mikeone-popup-body {
        padding: 8px 30px 28px;
        color: #cbd5e1;
        font-size: 15px;
        line-height: 1.85;
        white-space: pre-line;
      }
      .mikeone-popup-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        padding: 18px 30px 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      .mikeone-popup-dismiss {
        appearance: none;
        border: 0;
        background: transparent;
        color: #8b9bb4;
        cursor: pointer;
        font-size: 13px;
      }
      .mikeone-popup-dismiss:hover { color: #f5f3ee; }
      .mikeone-popup-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        padding: 0 20px;
        border-radius: 4px;
        background: #c9a227;
        color: #0c1b2e;
        font-size: 14px;
        font-weight: 800;
        text-decoration: none;
      }
      .mikeone-popup-link:hover { background: #e8c54a; }
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
      }
    `;
    document.head.appendChild(style);
  }

  function closePopup(backdrop, popup, shouldDismiss) {
    if (shouldDismiss) dismissToday(popup);
    backdrop.remove();
    document.body.style.overflow = "";
  }

  function showPopup(popup) {
    injectStyles();

    const backdrop = document.createElement("div");
    backdrop.className = "mikeone-popup-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");

    const buttonHtml = popup.buttonText && popup.buttonUrl
      ? `<a class="mikeone-popup-link" href="${escapeAttribute(popup.buttonUrl)}">${escapeHtml(popup.buttonText)}</a>`
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
          ${buttonHtml}
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.style.overflow = "hidden";

    backdrop.querySelector(".mikeone-popup-close").addEventListener("click", () => {
      closePopup(backdrop, popup, false);
    });
    backdrop.querySelector(".mikeone-popup-dismiss").addEventListener("click", () => {
      closePopup(backdrop, popup, true);
    });
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) closePopup(backdrop, popup, false);
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
      const popup = (data.popups || []).find((item) =>
        item.active && isInDateRange(item) && !isDismissed(item)
      );
      if (popup) showPopup(popup);
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
