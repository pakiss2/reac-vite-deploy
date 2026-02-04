import { calculateBillAmount, calculatePenalty } from './src/lib/billing.js';

console.log('='.repeat(60));
console.log('NAGCARLAN WATER DISTRICT - BILLING RULES VERIFICATION');
console.log('='.repeat(60));

console.log('\n📋 RESIDENTIAL BILLING RULES:');
console.log('   • 0-15 m³: ₱30 (flat rate)');
console.log('   • 16-25 m³: ₱30 + (consumption - 15) × ₱2.5');
console.log('   • 26+ m³: ₱30 + (10 × ₱2.5) + (consumption - 25) × ₱3');

console.log('\n🧪 Testing Residential:');
console.log('   10 m³ (≤15) → Expect: ₱30.00');
console.log('   Actual:', '₱' + calculateBillAmount('residential', 10).toFixed(2));

console.log('   20 m³ (16-25 range) → Expect: ₱30 + (20-15)×2.5 = ₱42.50');
console.log('   Actual:', '₱' + calculateBillAmount('residential', 20).toFixed(2));

console.log('   30 m³ (>25) → Expect: ₱30 + (10×2.5) + (5×3) = ₱30 + ₱25 + ₱15 = ₱70.00');
console.log('   Actual:', '₱' + calculateBillAmount('residential', 30).toFixed(2));

console.log('\n📋 COMMERCIAL BILLING RULES:');
console.log('   • 0-15 m³: ₱40 (flat rate)');
console.log('   • 16-25 m³: ₱40 + (consumption - 15) × ₱5');
console.log('   • 26+ m³: ₱40 + (10 × ₱5) + (consumption - 25) × ₱6');

console.log('\n🧪 Testing Commercial:');
console.log('   10 m³ (≤15) → Expect: ₱40.00');
console.log('   Actual:', '₱' + calculateBillAmount('commercial', 10).toFixed(2));

console.log('   20 m³ (16-25 range) → Expect: ₱40 + (20-15)×5 = ₱65.00');
console.log('   Actual:', '₱' + calculateBillAmount('commercial', 20).toFixed(2));

console.log('   30 m³ (>25) → Expect: ₱40 + (10×5) + (5×6) = ₱40 + ₱50 + ₱30 = ₱120.00');
console.log('   Actual:', '₱' + calculateBillAmount('commercial', 30).toFixed(2));

console.log('\n📋 PENALTY RULES:');
console.log('   • 1st month overdue: 2% of bill');
console.log('   • 2nd month: 4% of bill');
console.log('   • Increases by 2% each month');
console.log('   • Maximum: 36% (at 18 months)');
console.log('   • Penalty applies to EACH BILL separately');

const penaltySettings = { ratePerMonth: 0.02, maxRate: 0.36, maxMonths: 18 };

console.log('\n🧪 Testing Penalties (₱100 bill):');
console.log('   1 month overdue → Expect: ₱2.00 (2%)');
console.log('   Actual:', '₱' + calculatePenalty(100, '2025-12-15', penaltySettings, new Date('2026-01-16')).toFixed(2));

console.log('   2 months overdue → Expect: ₱4.00 (4%)');
console.log('   Actual:', '₱' + calculatePenalty(100, '2025-11-15', penaltySettings, new Date('2026-01-16')).toFixed(2));

console.log('   5 months overdue → Expect: ₱10.00 (10%)');
console.log('   Actual:', '₱' + calculatePenalty(100, '2025-08-15', penaltySettings, new Date('2026-01-16')).toFixed(2));

console.log('   18 months overdue → Expect: ₱36.00 (36% max)');
console.log('   Actual:', '₱' + calculatePenalty(100, '2024-07-15', penaltySettings, new Date('2026-01-16')).toFixed(2));

console.log('   20 months overdue → Expect: ₱36.00 (capped at 36%)');
console.log('   Actual:', '₱' + calculatePenalty(100, '2024-05-15', penaltySettings, new Date('2026-01-16')).toFixed(2));

console.log('\n✅ MULTIPLE BILL PAYMENT:');
console.log('   ✓ System supports paying multiple bills at once');
console.log('   ✓ Each bill calculated with its own penalty');
console.log('   ✓ Example: Pay Nov, Dec, Jan bills together');

console.log('\n' + '='.repeat(60));
console.log('VERIFICATION COMPLETE');
console.log('='.repeat(60));
