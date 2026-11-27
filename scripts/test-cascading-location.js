const assert = require('assert');
const { Country, State, City } = require('country-state-city');

// Test country-state-city
console.log('--- 1. Testing country-state-city datasets ---');
const us = Country.getCountryByCode('US');
assert(us && us.name === 'United States', 'US country lookup failed');
console.log('✓ Country lookup US:', us.name);

const states = State.getStatesOfCountry('IN');
const tn = states.find(s => s.isoCode === 'TN');
assert(tn && tn.name === 'Tamil Nadu', 'TN state lookup failed');
console.log('✓ State lookup TN:', tn.name);

const cities = City.getCitiesOfState('IN', 'TN');
const cbe = cities.find(c => c.name.toLowerCase().includes('coimbatore'));
assert(cbe, 'Coimbatore city lookup failed');
console.log('✓ City lookup Coimbatore:', cbe.name, cbe.latitude, cbe.longitude);

// Test Haversine formula
console.log('--- 2. Testing Haversine distance formula ---');
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Coimbatore coords: ~11.0168, 76.9558
// Bengaluru coords: ~12.9716, 77.5946
const dist = calculateDistanceKm(11.0168, 76.9558, 12.9716, 77.5946);
console.log('✓ Distance Coimbatore to Bengaluru:', dist, 'km (expected ~220-240 km)');
assert(dist >= 210 && dist <= 250, 'Distance calculation inaccurate');

console.log('All location math tests passed successfully!');
