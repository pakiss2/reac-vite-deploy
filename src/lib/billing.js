export const RATES = {
    residential: {
        minConsumption: 15,
        minRate: 30, // 0-15
        tier1Rate: 2.50, // 16-25
        tier1Limit: 25,
        tier2Rate: 3.00, // >25
    },
    commercial: {
        minConsumption: 15, // Assumed equal to residential
        minRate: 40,
        tier1Rate: 5.00,
        tier1Limit: 25,
        tier2Rate: 6.00,
    }
};

export const PENALTY = {
    ratePerMonth: 0.02,
    maxRate: 0.36,
};

export function calculateBillAmount(type, consumption) {
    const rates = RATES[type.toLowerCase()];
    if (!rates) throw new Error("Invalid client type");

    let amount = 0;

    // Minimum Tier
    if (consumption <= rates.minConsumption) {
        return rates.minRate;
    }
    amount += rates.minRate;

    // Tier 1 (16 - 25)
    const tier1Consumption = Math.min(consumption, rates.tier1Limit) - rates.minConsumption;
    if (tier1Consumption > 0) {
        amount += tier1Consumption * rates.tier1Rate;
    }

    // Tier 2 (> 25)
    if (consumption > rates.tier1Limit) {
        const tier2Consumption = consumption - rates.tier1Limit;
        amount += tier2Consumption * rates.tier2Rate;
    }

    return amount;
}

export function calculatePenalty(billAmount, dueDate, paymentDate = new Date()) {
    const due = new Date(dueDate);
    const pay = new Date(paymentDate);

    // If paid on or before due date, no penalty
    if (pay <= due) return 0;

    // Calculate months overdue
    // Difference in months
    let monthsOverdue = (pay.getFullYear() - due.getFullYear()) * 12 + (pay.getMonth() - due.getMonth());

    // If we are past the due day in the current month, add another month?
    // Usually penalties are monthly blocks. Let's assume strict month difference + 1 if started.
    // "0.02 in the first month" -> effectively 1 month overdue = 0.02

    if (monthsOverdue < 1) monthsOverdue = 1; // Minimum 1 month penalty if overdue

    const penaltyRate = Math.min(monthsOverdue * PENALTY.ratePerMonth, PENALTY.maxRate);

    return billAmount * penaltyRate;
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(amount);
}
