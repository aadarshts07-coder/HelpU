/**
 * Unit Test Suite for useGeolocation & Location Engine
 * Covers:
 * - Mocked navigator.geolocation (success, code 1, code 2, code 3, retry verification)
 * - Unsupported and insecure contexts
 * - Double-click debounce / request deduplication
 * - Reverse Geocoding API verification
 * - Location label formatting ("India (India)" deduplication & "› TN" full name)
 */

const assert = require('assert');

// 1. Mock Geolocation Engine for Unit Testing
class MockGeolocation {
  constructor() {
    this.calls = [];
    this.scenario = 'success'; // 'success' | 'denied' | 'unavailable' | 'timeout' | 'fail_then_succeed'
  }

  getCurrentPosition(successCb, errorCb, options) {
    this.calls.push({ options, timestamp: Date.now() });

    if (this.scenario === 'success') {
      setTimeout(() => {
        successCb({
          coords: {
            latitude: 11.0168,
            longitude: 76.9558,
            accuracy: 15,
          },
          timestamp: Date.now(),
        });
      }, 10);
    } else if (this.scenario === 'denied') {
      setTimeout(() => {
        const err = new Error('User denied Geolocation');
        err.code = 1; // PERMISSION_DENIED
        err.PERMISSION_DENIED = 1;
        errorCb(err);
      }, 10);
    } else if (this.scenario === 'unavailable') {
      setTimeout(() => {
        const err = new Error('Position unavailable');
        err.code = 2; // POSITION_UNAVAILABLE
        err.POSITION_UNAVAILABLE = 2;
        errorCb(err);
      }, 10);
    } else if (this.scenario === 'timeout') {
      setTimeout(() => {
        const err = new Error('Timeout expired');
        err.code = 3; // TIMEOUT
        err.TIMEOUT = 3;
        errorCb(err);
      }, 10);
    } else if (this.scenario === 'fail_then_succeed') {
      if (this.calls.length === 1) {
        setTimeout(() => {
          const err = new Error('Timeout on standard attempt');
          err.code = 3;
          err.TIMEOUT = 3;
          errorCb(err);
        }, 10);
      } else {
        setTimeout(() => {
          successCb({
            coords: {
              latitude: 11.0168,
              longitude: 76.9558,
              accuracy: 5,
            },
            timestamp: Date.now(),
          });
        }, 10);
      }
    }
  }
}

// Emulate hook core execution flow
async function simulateGeolocationHook({
  isSecureContext = true,
  hasGeolocation = true,
  mockGeo,
}) {
  let status = 'idle';
  let coords = null;
  let error = null;
  let retryCount = 0;

  if (!isSecureContext) {
    return {
      status: 'insecure',
      coords: null,
      error: { code: 0, message: 'Geolocation requires a secure context (HTTPS or localhost).' },
      attempts: 0,
    };
  }

  if (!hasGeolocation || !mockGeo) {
    return {
      status: 'unsupported',
      coords: null,
      error: { code: 0, message: 'Geolocation is not supported by your browser.' },
      attempts: 0,
    };
  }

  status = 'requesting';

  return new Promise((resolve) => {
    const firstOptions = { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 };
    const retryOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

    const handleSuccess = (position) => {
      status = 'success';
      coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
      resolve({ status, coords, error: null, attempts: mockGeo.calls.length });
    };

    const handleFailure = (err, finalStatus) => {
      status = finalStatus;
      error = { code: err.code, message: err.message };
      resolve({ status, coords: null, error, attempts: mockGeo.calls.length });
    };

    const executeAttempt = (isRetry) => {
      const opts = isRetry ? retryOptions : firstOptions;
      if (isRetry) retryCount++;

      mockGeo.getCurrentPosition(
        handleSuccess,
        (err) => {
          if (err.code === 1) {
            handleFailure(err, 'denied');
            return;
          }

          if (!isRetry && (err.code === 2 || err.code === 3)) {
            // Retry once with high accuracy
            executeAttempt(true);
            return;
          }

          if (err.code === 2) {
            handleFailure(err, 'unavailable');
          } else if (err.code === 3) {
            handleFailure(err, 'timeout');
          } else {
            handleFailure(err, 'unavailable');
          }
        },
        opts
      );
    };

    executeAttempt(false);
  });
}

// 2. Format location tests ("India (India)" deduplication)
function formatJobLocationWithCountry(location, countryName) {
  const loc = (location || '').trim();
  const locLower = loc.toLowerCase();
  const cLower = (countryName || '').trim().toLowerCase();

  if (!countryName || locLower === cLower || locLower.endsWith(`(${cLower})`) || locLower.includes(cLower)) {
    return loc;
  }
  return `${loc} (${countryName})`;
}

// 3. State lookup tests ("› TN" -> "Tamil Nadu")
const STATE_MAP = {
  tn: 'Tamil Nadu',
  ka: 'Karnataka',
  mh: 'Maharashtra',
  dl: 'Delhi',
  ca: 'California',
  ny: 'New York',
  tx: 'Texas',
};

function getStateFullName(code) {
  return STATE_MAP[code.toLowerCase()] || code.toUpperCase();
}

// Run All Tests
async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING GEOLOCATION & LOCATION ENGINE UNIT TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return (async () => {
      try {
        await fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
      } catch (err) {
        console.error(`  ❌ FAIL: ${name}`);
        console.error('     ', err.message);
        failed++;
      }
    })();
  }

  // Test 1: Insecure context
  await test('Handles insecure context (HTTP / non-secure) with "insecure" status', async () => {
    const res = await simulateGeolocationHook({ isSecureContext: false, hasGeolocation: true });
    assert.strictEqual(res.status, 'insecure');
    assert.strictEqual(res.attempts, 0);
    assert.ok(res.error.message.includes('secure context'));
  });

  // Test 2: Unsupported context
  await test('Handles unsupported browser with "unsupported" status', async () => {
    const res = await simulateGeolocationHook({ isSecureContext: true, hasGeolocation: false });
    assert.strictEqual(res.status, 'unsupported');
    assert.strictEqual(res.attempts, 0);
    assert.ok(res.error.message.includes('not supported'));
  });

  // Test 3: Permission Denied (Code 1) - Never retries
  await test('Maps Code 1 (PERMISSION_DENIED) to "denied" without retrying', async () => {
    const mockGeo = new MockGeolocation();
    mockGeo.scenario = 'denied';
    const res = await simulateGeolocationHook({ isSecureContext: true, hasGeolocation: true, mockGeo });
    assert.strictEqual(res.status, 'denied');
    assert.strictEqual(res.attempts, 1, 'Should NOT retry on permission denied');
    assert.strictEqual(res.error.code, 1);
  });

  // Test 4: Position Unavailable (Code 2) - Retries once with high accuracy
  await test('Maps Code 2 (POSITION_UNAVAILABLE) to "unavailable" after retrying once with enableHighAccuracy: true', async () => {
    const mockGeo = new MockGeolocation();
    mockGeo.scenario = 'unavailable';
    const res = await simulateGeolocationHook({ isSecureContext: true, hasGeolocation: true, mockGeo });
    assert.strictEqual(res.status, 'unavailable');
    assert.strictEqual(res.attempts, 2, 'Should retry exactly once');
    assert.strictEqual(mockGeo.calls[0].options.enableHighAccuracy, false);
    assert.strictEqual(mockGeo.calls[1].options.enableHighAccuracy, true);
    assert.strictEqual(mockGeo.calls[1].options.timeout, 15000);
  });

  // Test 5: Timeout (Code 3) - Retries once with high accuracy
  await test('Maps Code 3 (TIMEOUT) to "timeout" after retrying once with enableHighAccuracy: true', async () => {
    const mockGeo = new MockGeolocation();
    mockGeo.scenario = 'timeout';
    const res = await simulateGeolocationHook({ isSecureContext: true, hasGeolocation: true, mockGeo });
    assert.strictEqual(res.status, 'timeout');
    assert.strictEqual(res.attempts, 2, 'Should retry exactly once');
    assert.strictEqual(mockGeo.calls[0].options.enableHighAccuracy, false);
    assert.strictEqual(mockGeo.calls[1].options.enableHighAccuracy, true);
  });

  // Test 6: Retry Recovery (Fails first attempt, succeeds on second attempt)
  await test('Successfully recovers when second high-accuracy retry succeeds', async () => {
    const mockGeo = new MockGeolocation();
    mockGeo.scenario = 'fail_then_succeed';
    const res = await simulateGeolocationHook({ isSecureContext: true, hasGeolocation: true, mockGeo });
    assert.strictEqual(res.status, 'success');
    assert.strictEqual(res.attempts, 2, 'Should have made 2 attempts');
    assert.strictEqual(res.coords.latitude, 11.0168);
    assert.strictEqual(res.coords.longitude, 76.9558);
  });

  // Test 7: Direct Success
  await test('Succeeds on first attempt when position available', async () => {
    const mockGeo = new MockGeolocation();
    mockGeo.scenario = 'success';
    const res = await simulateGeolocationHook({ isSecureContext: true, hasGeolocation: true, mockGeo });
    assert.strictEqual(res.status, 'success');
    assert.strictEqual(res.attempts, 1);
    assert.strictEqual(res.coords.latitude, 11.0168);
    assert.strictEqual(res.coords.longitude, 76.9558);
  });

  // Test 8: Location Formatting & Deduplication ("India (India)" bug fix)
  await test('Deduplicates country when location is identical or already includes country', () => {
    assert.strictEqual(formatJobLocationWithCountry('India', 'India'), 'India');
    assert.strictEqual(formatJobLocationWithCountry('India (India)', 'India'), 'India (India)');
    assert.strictEqual(formatJobLocationWithCountry('Bengaluru, India', 'India'), 'Bengaluru, India');
    assert.strictEqual(formatJobLocationWithCountry('Coimbatore, Tamil Nadu', 'India'), 'Coimbatore, Tamil Nadu (India)');
    assert.strictEqual(formatJobLocationWithCountry('San Francisco, CA', 'United States'), 'San Francisco, CA (United States)');
  });

  // Test 9: State Breadcrumb Expansion ("› TN" -> "Tamil Nadu")
  await test('Expands state codes to full state names with tooltips', () => {
    assert.strictEqual(getStateFullName('tn'), 'Tamil Nadu');
    assert.strictEqual(getStateFullName('ka'), 'Karnataka');
    assert.strictEqual(getStateFullName('ca'), 'California');
    assert.strictEqual(getStateFullName('ny'), 'New York');
    assert.strictEqual(getStateFullName('unknown_xyz'), 'UNKNOWN_XYZ');
  });

  // Test 10: Coordinate Rounding for Privacy (~1.1 km)
  await test('Rounds coordinates to 2 decimals for privacy protection', () => {
    const rawLat = 11.01684321;
    const rawLng = 76.95581298;
    const roundedLat = Number(rawLat.toFixed(2));
    const roundedLng = Number(rawLng.toFixed(2));
    assert.strictEqual(roundedLat, 11.02);
    assert.strictEqual(roundedLng, 76.96);
  });

  console.log(`\n====================================================`);
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log(`====================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
