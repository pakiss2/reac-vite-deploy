const DEFAULT_RATES = {
    residential: {
        minConsumption: 15,
        minRate: 30,
        tier1Rate: 2.5,
        tier1Limit: 25,
        tier2Rate: 3
    },
    commercial: {
        minConsumption: 15,
        minRate: 40,
        tier1Rate: 5,
        tier1Limit: 25,
        tier2Rate: 6
    }
};

const DEFAULT_PENALTY_SETTINGS = {
    ratePerMonth: 0.02,
    maxRate: 0.36,
    maxMonths: 18
};

export function calculateBillAmount(type, consumption, rates = DEFAULT_RATES) {
    if (!rates || !rates[type.toLowerCase()]) {
        // Fallback to default if specific type not found
        const fallbackRates = DEFAULT_RATES[type.toLowerCase()] || DEFAULT_RATES.residential;
        return calculateWithRates(consumption, fallbackRates);
    }
    return calculateWithRates(consumption, rates[type.toLowerCase()]);
}

function calculateWithRates(consumption, tierRates) {
    if (consumption <= tierRates.minConsumption) {
        return tierRates.minRate;
    }

    let amount = tierRates.minRate;

    // Tier 1 (e.g., 16 - 25)
    if (consumption <= tierRates.tier1Limit) {
        const tier1Consumption = consumption - tierRates.minConsumption;
        amount += tier1Consumption * tierRates.tier1Rate;
    } else {
        // Full Tier 1
        const tier1Consumption = tierRates.tier1Limit - tierRates.minConsumption;
        amount += tier1Consumption * tierRates.tier1Rate;

        // Tier 2 (> 25)
        const tier2Consumption = consumption - tierRates.tier1Limit;
        amount += tier2Consumption * tierRates.tier2Rate;
    }

    return amount;
}

export function calculatePenalty(billAmount, dueDate, penaltySettings = DEFAULT_PENALTY_SETTINGS, paymentDate = new Date()) {
    const due = new Date(dueDate);
    const pay = new Date(paymentDate);

    const settings = penaltySettings || DEFAULT_PENALTY_SETTINGS;

    if (pay <= due || !settings) return 0;

    // Calculate full calendar months overdue
    // Example: Due Dec 15, Pay Jan 16 = 1 month overdue = 2% penalty
    //          Due Dec 15, Pay Feb 16 = 2 months overdue = 4% penalty
    const monthsOverdue = (pay.getFullYear() - due.getFullYear()) * 12 + (pay.getMonth() - due.getMonth());

    // Apply minimum of 1 month penalty if payment is late (even by 1 day in same month)
    const penaltyMonths = Math.max(1, Math.min(monthsOverdue, settings.maxMonths));
    const penaltyRate = Math.min(penaltyMonths * settings.ratePerMonth, settings.maxRate);

    return billAmount * penaltyRate;
}

export function calculateConsumptionFromAmount(type, amount, rates = DEFAULT_RATES) {
    const tierRates = (rates && rates[type.toLowerCase()]) ? rates[type.toLowerCase()] : DEFAULT_RATES[type.toLowerCase()] || DEFAULT_RATES.residential;

    if (amount <= tierRates.minRate) {
        return tierRates.minConsumption;
    }

    let remainingAmount = amount - tierRates.minRate;
    let consumption = tierRates.minConsumption;

    // Tier 1
    const tier1MaxCost = (tierRates.tier1Limit - tierRates.minConsumption) * tierRates.tier1Rate;
    if (remainingAmount <= tier1MaxCost) {
        consumption += remainingAmount / tierRates.tier1Rate;
        return consumption;
    }

    // Full Tier 1
    consumption += (tierRates.tier1Limit - tierRates.minConsumption);
    remainingAmount -= tier1MaxCost;

    // Tier 2
    consumption += remainingAmount / tierRates.tier2Rate;

    return consumption;
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(amount);
}

export function numberToWords(amount) {
    if (amount === 0) return "Zero Pesos Only";

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    function convertGroup(n) {
        let str = '';
        if (n >= 100) {
            str += ones[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
        }
        if (n >= 20) {
            str += tens[Math.floor(n / 10)] + ' ';
            n %= 10;
        }
        if (n >= 10) {
            str += teens[n - 10] + ' ';
            return str;
        }
        if (n > 0) {
            str += ones[n] + ' ';
        }
        return str;
    }

    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);

    let words = '';

    if (integerPart >= 1000) {
        words += convertGroup(Math.floor(integerPart / 1000)) + 'Thousand ';
        words += convertGroup(integerPart % 1000);
    } else {
        words += convertGroup(integerPart);
    }

    words += 'Pesos';

    if (decimalPart > 0) {
        words += ' and ' + convertGroup(decimalPart).trim() + '/100';
    } else {
        words += ' Only';
    }

    return words.replace(/\s+/g, ' ').trim();
}
