import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

export const endpointDuration = new Trend('endpoint_duration', true);
export const endpointFailures = new Rate('endpoint_failures');
export const endpointRequests = new Counter('endpoint_requests');

const localFrontend = 'http://localhost:5173';
const localBackend = 'http://127.0.0.1:8000';

function cleanBase(value) {
  return String(value || '').replace(/\/$/, '');
}

function isProductionHost(value) {
  const lower = String(value).toLowerCase();
  return lower.includes('soc5outboundops.app') || lower.includes('production');
}

export function getTargetConfig() {
  const frontend = cleanBase(__ENV.K6_BASE_URL || localFrontend);
  const backend = cleanBase(__ENV.K6_BACKEND_BASE_URL || localBackend);
  const api = cleanBase(__ENV.K6_API_BASE_URL || `${frontend}/api/v1`);
  const targets = [frontend, backend, api];

  if (targets.some(isProductionHost) && __ENV.K6_ALLOW_PRODUCTION !== 'true') {
    fail('Refusing a production-looking target. Set K6_ALLOW_PRODUCTION=true only after explicit approval.');
  }

  if (!targets.every((target) => /^https?:\/\//i.test(target))) {
    fail('K6_BASE_URL, K6_BACKEND_BASE_URL, and K6_API_BASE_URL must be absolute http(s) URLs.');
  }

  return { frontend, backend, api };
}

export function thresholds() {
  return {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    checks: ['rate>0.98'],
    endpoint_duration: ['p(95)<1000', 'p(99)<2000'],
    endpoint_failures: ['rate<0.02'],
  };
}

export function buildOptions(overrides = {}) {
  return {
    thresholds: thresholds(),
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
    ...overrides,
  };
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function recentDateIso(daysAgo = 30) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function record(endpoint, response) {
  endpointRequests.add(1, { endpoint });
  endpointDuration.add(response.timings.duration, { endpoint });
  endpointFailures.add(response.status < 200 || response.status >= 400, { endpoint });
}

export function request(target, endpoint, method = 'GET', body = null, params = {}) {
  const headers = {
    Accept: 'application/json',
    ...(params.headers || {}),
  };
  if (body !== null && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

  const response = http.request(method, `${cleanBase(target)}/${endpoint.replace(/^\//, '')}`, body, {
    ...params,
    headers,
    tags: { endpoint, ...(params.tags || {}) },
  });
  record(endpoint, response);
  return response;
}

export function checkResponse(response, endpoint, expectedStatuses = [200]) {
  return check(response, {
    [`${endpoint} returned an expected status`]: (value) => expectedStatuses.includes(value.status),
    [`${endpoint} returned a response body`]: (value) => value.body !== undefined,
  });
}

export function readOnlyRequest(target, endpoint, params = {}, expectedStatuses = [200]) {
  const response = request(target, endpoint, 'GET', null, params);
  checkResponse(response, endpoint, expectedStatuses);
  return response;
}

export function randomPause(minSeconds = 1, maxSeconds = 3) {
  sleep(minSeconds + Math.random() * (maxSeconds - minSeconds));
}

export function setupAuth({ required = false } = {}) {
  const token = String(__ENV.K6_AUTH_TOKEN || '').trim();
  if (token) return { token, source: 'K6_AUTH_TOKEN' };

  const opsId = String(__ENV.K6_BACKROOM_OPS_ID || '').trim();
  const password = String(__ENV.K6_BACKROOM_PASSWORD || '');
  if (!opsId && !password) {
    if (required) {
      fail('Authenticated API testing requires K6_AUTH_TOKEN, or K6_BACKROOM_OPS_ID and K6_BACKROOM_PASSWORD.');
    }
    return { token: '', source: 'none' };
  }
  if (!opsId || !password) {
    fail('Set both K6_BACKROOM_OPS_ID and K6_BACKROOM_PASSWORD, or use K6_AUTH_TOKEN.');
  }

  const { api } = getTargetConfig();
  const response = request(api, 'auth/backroom/login', 'POST', JSON.stringify({ ops_id: opsId, password }), {
    tags: { auth_flow: 'single_setup_login' },
  });
  const ok = check(response, {
    'one-time Backroom setup login succeeded': (value) => value.status === 200 && Boolean(value.json('access_token')),
  });
  if (!ok) fail(`Backroom setup login failed with HTTP ${response.status}.`);
  return { token: response.json('access_token'), source: 'one-time-backroom-login' };
}

export function requireAuth(auth) {
  if (!auth || !auth.token) fail('This scenario requires reusable authentication. Set K6_AUTH_TOKEN or Backroom credentials.');
  return authHeaders(auth.token);
}

export function apiRead(auth, endpoint, query = '') {
  const { api } = getTargetConfig();
  return readOnlyRequest(api, `${endpoint}${query}`, { headers: requireAuth(auth) });
}

export function publicApiRead(endpoint, query = '') {
  const { api } = getTargetConfig();
  return readOnlyRequest(api, `${endpoint}${query}`);
}
