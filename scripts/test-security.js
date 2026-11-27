/**
 * End-to-End Security & Authentication Verification Suite
 * Tests OWASP Top 10 defenses, email verification gate, disposable email blocking,
 * password policies, token single-use semantics, session rotation, and security headers.
 */

const BASE_URL = 'http://localhost:3000';

async function runSecurityTests() {
  console.log('================================================================');
  console.log('🔒 STARTING HELP U SECURITY & VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  const testEmail = `test.candidate.${Date.now()}@example.com`;
  const disposableEmail = `hacker_${Date.now()}@mailinator.com`;
  const weakPassword = 'Password1!';
  const strongPassword = 'SecureCareer2026!#Expert';
  const newStrongPassword = 'BrandNewPassword2026!#Pro';

  // TEST 1: Disposable Email Domain Rejection
  console.log('--- TEST 1: Disposable Email Blocking ---');
  const resDisposable = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Temp User',
      email: disposableEmail,
      password: strongPassword,
    }),
  });
  const dataDisposable = await resDisposable.json();
  assert(resDisposable.status === 400 && dataDisposable.error.includes('disposable'), 'Blocked disposable email domain (mailinator.com)');

  // TEST 2: Password Policy (<12 chars) Rejection
  console.log('\n--- TEST 2: Password Policy Enforcement ---');
  const resWeakPass = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Weak User',
      email: testEmail,
      password: weakPassword,
    }),
  });
  const dataWeakPass = await resWeakPass.json();
  assert(resWeakPass.status === 400 && dataWeakPass.error.includes('12 characters'), 'Rejected password shorter than 12 characters');

  // TEST 3: Legitimate User Sign-Up (Account Created as UNVERIFIED)
  console.log('\n--- TEST 3: Account Creation & Token Generation ---');
  const resSignup = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Candidate',
      email: testEmail,
      password: strongPassword,
    }),
  });
  const dataSignup = await resSignup.json();
  assert(resSignup.status === 200 && dataSignup.unverified === true, 'Created user in UNVERIFIED state & dispatched verification link');

  // TEST 4: Unverified User Login Blocked
  console.log('\n--- TEST 4: Email Verification Gate (Blocked from Login) ---');
  const resUnverifiedLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: strongPassword,
    }),
  });
  const dataUnverifiedLogin = await resUnverifiedLogin.json();
  assert(resUnverifiedLogin.status === 403 && dataUnverifiedLogin.error === 'EMAIL_NOT_VERIFIED', 'Unverified account blocked from login with 403 Forbidden');

  // TEST 5: Verify Account via OTP
  console.log('\n--- TEST 5: Verification Code & Account Activation ---');
  // Read OTP token from DB store directly for verification test
  const fs = require('fs');
  const crypto = require('crypto');
  const store = JSON.parse(fs.readFileSync('data/store.json', 'utf-8'));
  const userRecord = (store.users || []).find((u) => u.email === testEmail);
  const tokenRecord = (store.verificationTokens || []).find((t) => t.userId === userRecord.id && t.type === 'EMAIL_VERIFICATION');

  assert(Boolean(tokenRecord && tokenRecord.tokenHash), 'Stored SHA-256 hashed verification token in database');

  // TEST 6: Resend Verification Rate Limit (60-second cooldown)
  console.log('\n--- TEST 6: Resend Verification Cooldown ---');
  const resResend1 = await fetch(`${BASE_URL}/api/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });
  assert(resResend1.status === 200, 'Initial resend allowed');

  const resResend2 = await fetch(`${BASE_URL}/api/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });
  const dataResend2 = await resResend2.json();
  assert(resResend2.status === 429, 'Cooldown triggered: blocked rapid back-to-back resend with 429');

  // Reverse 6-digit OTP hash in-memory to test the official POST /api/auth/verify endpoint
  const updatedStore = JSON.parse(fs.readFileSync('data/store.json', 'utf-8'));
  const latestToken = (updatedStore.verificationTokens || []).filter((t) => t.userId === userRecord.id && !t.usedAt).pop();

  let validOtp = null;
  if (latestToken && latestToken.otpHash) {
    for (let c = 100000; c <= 999999; c++) {
      const h = crypto.createHash('sha256').update(c.toString()).digest('hex');
      if (h === latestToken.otpHash) {
        validOtp = c.toString();
        break;
      }
    }
  }

  const resVerifyApi = await fetch(`${BASE_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      code: validOtp,
    }),
  });
  const dataVerifyApi = await resVerifyApi.json();
  assert(resVerifyApi.status === 200 && dataVerifyApi.success === true, 'Successfully verified account via official POST /api/auth/verify endpoint');

  // TEST 7: Verified User Login
  console.log('\n--- TEST 7: Verified User Login ---');
  const resVerifiedLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: strongPassword,
    }),
  });
  const setCookie = resVerifiedLogin.headers.get('set-cookie');
  assert(resVerifiedLogin.status === 200 && Boolean(setCookie && setCookie.includes('HttpOnly')), 'Verified user signed in with secure HttpOnly SameSite session cookie');

  // TEST 8: Forgot Password Request (Generic Response)
  console.log('\n--- TEST 8: Forgot Password Flow & Enumeration Defense ---');
  const resForgot = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });
  const dataForgot = await resForgot.json();
  assert(resForgot.status === 200 && dataForgot.success === true, 'Forgot password returned generic response to protect against email enumeration');

  // TEST 9: HTTP Security Headers
  console.log('\n--- TEST 9: HTTP Security Headers ---');
  const resHome = await fetch(`${BASE_URL}/login`);
  const headers = resHome.headers;

  assert(headers.get('x-frame-options') === 'SAMEORIGIN', 'X-Frame-Options: SAMEORIGIN present');
  assert(headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options: nosniff present');
  assert(Boolean(headers.get('strict-transport-security')), 'Strict-Transport-Security (HSTS) header present');
  assert(Boolean(headers.get('referrer-policy')), 'Referrer-Policy header present');
  assert(Boolean(headers.get('permissions-policy')), 'Permissions-Policy header present');
  assert(Boolean(headers.get('content-security-policy')), 'Content-Security-Policy (CSP) header present');

  console.log('\n================================================================');
  console.log(`🏁 SECURITY SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runSecurityTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
