/* eslint-disable no-console */
require("dotenv").config();

const API_BASE_URL = process.env.SMOKE_API_BASE_URL || "http://localhost:5000/api";
const ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const REQUIRED_CHECKS = [
  {
    name: "Health check",
    method: "GET",
    url: `${ROOT_URL}/`,
    expectedStatuses: [200],
  },
  {
    name: "Auth register validation",
    method: "POST",
    url: `${API_BASE_URL}/auth/register`,
    body: { name: "", email: "invalid", password: "123", confirmPassword: "456" },
    expectedStatuses: [400],
  },
  {
    name: "Auth login validation",
    method: "POST",
    url: `${API_BASE_URL}/auth/login`,
    body: { email: "", password: "" },
    expectedStatuses: [400],
  },
  {
    name: "Courts unauthorized",
    method: "GET",
    url: `${API_BASE_URL}/courts`,
    expectedStatuses: [401],
  },
  {
    name: "Bookings unauthorized",
    method: "GET",
    url: `${API_BASE_URL}/bookings/my`,
    expectedStatuses: [401],
  },
  {
    name: "Owner unauthorized",
    method: "GET",
    url: `${API_BASE_URL}/owner/dashboard`,
    expectedStatuses: [401],
  },
  {
    name: "Admin unauthorized",
    method: "GET",
    url: `${API_BASE_URL}/admin/reports/overview`,
    expectedStatuses: [401],
  },
];

function getOptionalChecks() {
  const checks = [];
  const playerToken = process.env.SMOKE_PLAYER_TOKEN || "";
  const ownerToken = process.env.SMOKE_OWNER_TOKEN || "";
  const adminToken = process.env.SMOKE_ADMIN_TOKEN || "";
  const courtId = process.env.SMOKE_COURT_ID || "";
  const slotId = process.env.SMOKE_SLOT_ID || "";
  const bookingId = process.env.SMOKE_BOOKING_ID || "";

  if (playerToken) {
    checks.push({
      name: "Player: list courts",
      method: "GET",
      url: `${API_BASE_URL}/courts`,
      expectedStatuses: [200],
      token: playerToken,
    });
  }

  if (playerToken && courtId) {
    checks.push({
      name: "Player: court detail",
      method: "GET",
      url: `${API_BASE_URL}/courts/${courtId}`,
      expectedStatuses: [200],
      token: playerToken,
    });
    checks.push({
      name: "Player: court slots",
      method: "GET",
      url: `${API_BASE_URL}/courts/${courtId}/slots`,
      expectedStatuses: [200],
      token: playerToken,
    });
  }

  if (playerToken && courtId && slotId) {
    checks.push({
      name: "Player: create booking",
      method: "POST",
      url: `${API_BASE_URL}/bookings`,
      expectedStatuses: [201, 400],
      token: playerToken,
      body: { courtId, slotId },
    });
  }

  if (playerToken) {
    checks.push({
      name: "Player: my bookings",
      method: "GET",
      url: `${API_BASE_URL}/bookings/my`,
      expectedStatuses: [200],
      token: playerToken,
    });
  }

  if (playerToken && bookingId) {
    checks.push({
      name: "Player: cancel booking",
      method: "PATCH",
      url: `${API_BASE_URL}/bookings/${bookingId}/cancel`,
      expectedStatuses: [200, 400, 403, 404],
      token: playerToken,
    });
  }

  if (ownerToken) {
    checks.push(
      {
        name: "Owner: dashboard",
        method: "GET",
        url: `${API_BASE_URL}/owner/dashboard`,
        expectedStatuses: [200],
        token: ownerToken,
      },
      {
        name: "Owner: courts",
        method: "GET",
        url: `${API_BASE_URL}/owner/courts`,
        expectedStatuses: [200],
        token: ownerToken,
      },
      {
        name: "Owner: bookings",
        method: "GET",
        url: `${API_BASE_URL}/owner/bookings`,
        expectedStatuses: [200],
        token: ownerToken,
      }
    );
  }

  if (adminToken) {
    checks.push(
      {
        name: "Admin: users",
        method: "GET",
        url: `${API_BASE_URL}/admin/users`,
        expectedStatuses: [200],
        token: adminToken,
      },
      {
        name: "Admin: courts",
        method: "GET",
        url: `${API_BASE_URL}/admin/courts`,
        expectedStatuses: [200],
        token: adminToken,
      },
      {
        name: "Admin: reports overview",
        method: "GET",
        url: `${API_BASE_URL}/admin/reports/overview`,
        expectedStatuses: [200],
        token: adminToken,
      },
      {
        name: "Admin: reports monthly",
        method: "GET",
        url: `${API_BASE_URL}/admin/reports/monthly?year=2026`,
        expectedStatuses: [200],
        token: adminToken,
      }
    );
  }

  return checks;
}

async function runCheck(check) {
  const headers = { "Content-Type": "application/json" };
  if (check.token) {
    headers.Authorization = `Bearer ${check.token}`;
  }

  const response = await fetch(check.url, {
    method: check.method,
    headers,
    body: check.body ? JSON.stringify(check.body) : undefined,
  });

  let payload = "";
  try {
    payload = await response.text();
  } catch {
    payload = "";
  }

  const passed = check.expectedStatuses.includes(response.status);
  const statusIcon = passed ? "PASS" : "FAIL";
  console.log(`[${statusIcon}] ${check.name} -> ${response.status}`);
  if (!passed) {
    console.log(`  URL: ${check.method} ${check.url}`);
    console.log(`  Expected: ${check.expectedStatuses.join(", ")}`);
    console.log(`  Body: ${payload.slice(0, 300)}`);
  }
  return passed;
}

async function main() {
  const checks = [...REQUIRED_CHECKS, ...getOptionalChecks()];
  console.log(`Running ${checks.length} smoke checks against ${API_BASE_URL}`);
  let passedCount = 0;

  for (const check of checks) {
    try {
      const passed = await runCheck(check);
      if (passed) {
        passedCount += 1;
      }
    } catch (error) {
      console.log(`[FAIL] ${check.name} -> request error: ${error.message}`);
    }
  }

  console.log(`\nSmoke result: ${passedCount}/${checks.length} checks passed.`);
  if (passedCount !== checks.length) {
    process.exitCode = 1;
  }
}

main();
