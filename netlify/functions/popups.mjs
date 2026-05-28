import { getStore } from "@netlify/blobs";
import { verifyAdminToken } from "./auth.mjs";

const STORE_NAME = "mikeone-popup-admin";
const POPUPS_KEY = "popups";

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}

function getBearerToken(event) {
  const header = event.headers.authorization || event.headers.Authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function isAuthorized(event) {
  return verifyAdminToken(getBearerToken(event), process.env.ADMIN_TOKEN_SECRET);
}

function normalizePopup(input) {
  const id = String(input.id || `popup-${Date.now()}`).trim();
  const title = String(input.title || "").trim();
  const body = String(input.body || "").trim();

  if (!id || !title || !body) {
    throw new Error("id_title_body_required");
  }

  return {
    id,
    title,
    body,
    displayMode: input.displayMode === "zone" ? "zone" : "modal",
    imageUrl: String(input.imageUrl || "").trim(),
    buttonText: String(input.buttonText || "").trim(),
    buttonUrl: String(input.buttonUrl || "").trim(),
    active: Boolean(input.active),
    startDate: String(input.startDate || "").trim(),
    endDate: String(input.endDate || "").trim(),
    priority: Number.isFinite(Number(input.priority)) ? Number(input.priority) : 0,
    updatedAt: new Date().toISOString(),
  };
}

async function readPopups() {
  try {
    const store = getStore(STORE_NAME);
    const popups = await store.get(POPUPS_KEY, { type: "json" });
    return Array.isArray(popups) ? popups : [];
  } catch (error) {
    if (error.message?.includes("Netlify Blobs")) {
      globalThis.__mikeonePopups ||= [];
      return globalThis.__mikeonePopups;
    }
    throw error;
  }
}

async function writePopups(popups) {
  try {
    const store = getStore(STORE_NAME);
    await store.setJSON(POPUPS_KEY, popups);
  } catch (error) {
    if (error.message?.includes("Netlify Blobs")) {
      globalThis.__mikeonePopups = popups;
      return;
    }
    throw error;
  }
}

export async function handler(event) {
  if (event.httpMethod === "GET") {
    const popups = await readPopups();
    return json(200, {
      popups: popups
        .filter((popup) => popup && popup.active)
        .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0)),
    });
  }

  if (!isAuthorized(event)) {
    return json(401, { error: "unauthorized" });
  }

  if (event.httpMethod === "POST") {
    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "invalid_json" });
    }

    if (payload.action === "list") {
      return json(200, { popups: await readPopups() });
    }

    if (payload.action === "delete") {
      const id = String(payload.id || "").trim();
      const nextPopups = (await readPopups()).filter((popup) => popup.id !== id);
      await writePopups(nextPopups);
      return json(200, { popups: nextPopups });
    }

    if (payload.action === "save") {
      let popup;
      try {
        popup = normalizePopup(payload.popup || {});
      } catch (error) {
        return json(400, { error: error.message });
      }

      const popups = await readPopups();
      const existingIndex = popups.findIndex((item) => item.id === popup.id);

      if (existingIndex >= 0) {
        popups[existingIndex] = popup;
      } else {
        popups.push(popup);
      }

      const nextPopups = popups.sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
      await writePopups(nextPopups);
      return json(200, { popups: nextPopups });
    }

    return json(400, { error: "unknown_action" });
  }

  return json(405, { error: "method_not_allowed" });
}
