export const safeDiv = (a, b) => b === 0 ? 0 : a / b;

export const formatRate = (rate, leadingZero = false) => {
    if (typeof rate !== 'number' || isNaN(rate)) return rate;
    const formatted = rate.toFixed(3);
    return leadingZero ? formatted : formatted.replace(/^0/, '');
};
