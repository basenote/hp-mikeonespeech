import crypto from "node:crypto";

const TOKEN_TTL_SECONDS = 60 * 60 * 8;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function sign(payload, secret) {
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminToken(token, secret) {
  if (!token || !secret || !token.includes(".")) return false;

  const [encodedPayload, signature] = token.split(".");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

  if (Buffer.byteLength(signature) !== Buffer.byteLength(expected)) {
    return false;
  }

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    )
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload.replaceAll("-", "+").replaceAll("_", "/"), "base64").toString("utf8"),
    );
    return payload.role === "popup-admin" && Date.now() < payload.exp;
  } catch {
    return false;
  }
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const tokenSecret = process.env.ADMIN_TOKEN_SECRET;

  if (!adminPassword || !tokenSecret) {
    return json(500, {
      error: "missing_admin_env",
      message: "Set ADMIN_PASSWORD and ADMIN_TOKEN_SECRET in Netlify environment variables.",
    });
  }

  let password = "";
  try {
    password = JSON.parse(event.body || "{}").password || "";
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const isMatch =
    Buffer.byteLength(password) === Buffer.byteLength(adminPassword) &&
    crypto.timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword));

  if (!isMatch) {
    return json(401, { error: "invalid_password" });
  }

  const token = sign(
    {
      role: "popup-admin",
      iat: Date.now(),
      exp: Date.now() + TOKEN_TTL_SECONDS * 1000,
    },
    tokenSecret,
  );

  return json(200, { token, expiresIn: TOKEN_TTL_SECONDS });
}
