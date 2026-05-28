import { verifyAdminToken } from "./auth.mjs";

const FORM_NAME = "consultation";

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

function normalizeSubmission(submission) {
  const data = submission.data || {};
  const fields = submission.human_fields || {};

  return {
    id: submission.id || "",
    createdAt: submission.created_at || "",
    name: data.name || fields["이름"] || "",
    phone: data.phone || fields["연락처"] || "",
    course: data.course || fields["관심 프로그램"] || "",
    message: data.message || fields["상담 내용"] || "",
    privacyAgree: data.privacy_agree || fields["Privacy Agree"] || "",
  };
}

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "method_not_allowed" });
  }

  if (!isAuthorized(event)) {
    return json(401, { error: "unauthorized" });
  }

  const netlifyToken = process.env.NETLIFY_AUTH_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || "66ef04e2-b1fb-46be-933a-27f9651b5511";

  if (!netlifyToken) {
    return json(500, {
      error: "missing_netlify_token",
      message: "Set NETLIFY_AUTH_TOKEN in Netlify environment variables.",
    });
  }

  const url = new URL(`https://api.netlify.com/api/v1/sites/${siteId}/submissions`);
  url.searchParams.set("per_page", "100");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${netlifyToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return json(response.status, {
      error: "netlify_api_error",
      message: "Failed to load form submissions from Netlify.",
    });
  }

  const submissions = await response.json();
  const consultationSubmissions = (Array.isArray(submissions) ? submissions : [])
    .filter((submission) => submission.form_name === FORM_NAME)
    .map(normalizeSubmission)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  return json(200, { submissions: consultationSubmissions });
}
