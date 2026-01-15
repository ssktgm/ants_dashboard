export const safeDiv = (a, b) => b === 0 ? 0 : a / b;

/**
 * 野球の打率、出塁率、長打率などをフォーマットします。
 * 例: 0.345 -> .345
 * @param {number} rate - フォーマットする率。
 * @returns {string} フォーマットされた文字列。
 */
export const formatBattingRate = (rate) => {
    if (typeof rate !== 'number' || isNaN(rate)) return '.---';
    const formatted = rate.toFixed(3);
    return formatted.replace(/^0/, '');
};

/**
 * OPSなどの小数点数をフォーマットします。
 * 例: 1.523
 * @param {number} value - フォーマットする数値。
 * @returns {string} フォーマットされた文字列。
 */
export const formatOps = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '----';
    return value.toFixed(3);
}

/**
 * K/7, BB/7, 防御率, WHIPなどをフォーマットします。
 * 例: 2.00
 * @param {number} value - フォーマットする数値。
 * @returns {string} フォーマットされた文字列。
 */
export const formatPitchingStat = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '-.--';
    return value.toFixed(2);
}

/**
 * パーセンテージをフォーマットします。
 * 例: 0.777 -> 77.7%
 * @param {number} value - フォーマットする数値 (0から1の範囲)。
 * @returns {string} フォーマットされたパーセンテージ文字列。
 */
export const formatPercentage = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '--.-%';
    return `${(value * 100).toFixed(1)}%`;
}
