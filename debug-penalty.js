// Debug script to understand penalty calculation

// Test case: Due Dec 15, Paid Jan 16
// Expected: 1 month overdue = 2%

const dueDate = new Date('2025-12-15');
const payDate = new Date('2026-01-16');

const monthsOverdue = (payDate.getFullYear() - dueDate.getFullYear()) * 12 + (payDate.getMonth() - dueDate.getMonth());

console.log('Due:', dueDate.toDateString());
console.log('Pay:', payDate.toDateString());
console.log('Months difference:', monthsOverdue);
console.log('Pay date:', payDate.getDate());
console.log('Due date:', dueDate.getDate());
console.log('Pay date >= due date?:', payDate.getDate() >= dueDate.getDate());

// Current logic:
const current = monthsOverdue + (monthsOverdue === 0 && payDate.getDate() > dueDate.getDate() ? 1 : (monthsOverdue > 0 && payDate.getDate() >= dueDate.getDate() ? 1 : 0));
console.log('\nCurrent calculation penalty months:', current);
console.log('Current penalty:', current * 0.02 * 100, '%');

// monthsOverdue = 1 (Dec to Jan)
// payDate.getDate() = 16
// dueDate.getDate() = 15
// payDate.getDate() >= dueDate.getDate() = true
// So we add 1, making it 2 months = 4%

// What we want: 1 month overdue should equal 1 penalty month (2%)

// The issue: Due Dec 15, Pay Jan 16
// - Months difference: 1
// - Since Jan 16 >= Dec 15, we add 1
// - Total: 2 months (wrong!)

// Correct logic: If due is Dec 15 and we pay Jan 16, that's barely into the second month.
// But by Nagcarlan rules, we're in the 1st penalty month.

// The penalty should start counting from the day after the due date:
// - Dec 16 - Jan 15: 1st month (2%)
// - Jan 16 - Feb 15: 2nd month (4%)

console.log('\n--- Correct Logic ---');
console.log('Due Dec 15, Pay before/on Jan 15 = 1 month (2%)');
console.log('Due Dec 15, Pay after Jan 15 = 2 months (4%)');
console.log('Current pay date Jan 16, so should be: depends on interpretation');
console.log('\nIf we count partial months strictly: Jan 16 is the start of 2nd penalty month');
console.log('If we count by calendar month: Jan 1-31 is all the 1st penalty month');
