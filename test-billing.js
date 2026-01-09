import { calculateBillAmount, calculatePenalty } from './src/lib/billing.js';

console.log('--- Residential Tests ---');
console.log('10m3 (Min 30):', calculateBillAmount('residential', 10)); // Expect 30
console.log('20m3 (30 + 5*2.5 = 42.5):', calculateBillAmount('residential', 20)); // Expect 42.5
console.log('30m3 (30 + 10*2.5 + 5*3 = 30+25+15 = 70):', calculateBillAmount('residential', 30)); // Expect 70

console.log('\n--- Commercial Tests ---');
console.log('10m3 (Min 40):', calculateBillAmount('commercial', 10)); // Expect 40
console.log('20m3 (40 + 5*5 = 65):', calculateBillAmount('commercial', 20)); // Expect 65
console.log('30m3 (40 + 10*5 + 5*6 = 40+50+30 = 120):', calculateBillAmount('commercial', 30)); // Expect 120

console.log('\n--- Penalty Tests ---');
const billAmount = 100;
const today = new Date('2026-06-01'); // Payment Date
// 1 month overdue (Due May 1)
console.log('1 Month Overdue (Exp 2.00):', calculatePenalty(billAmount, '2026-05-01', today));
// 5 months overdue (Due Jan 1) -> 5 * 0.02 = 0.10
console.log('5 Months Overdue (Exp 10.00):', calculatePenalty(billAmount, '2026-01-01', today));
// 20 months overdue (Capped at 18 * 0.02 = 0.36) -> 36.00
console.log('20 Months Overdue (Exp 36.00):', calculatePenalty(billAmount, '2024-10-01', today));
