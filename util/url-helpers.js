/**
 * Checks if a given URL belongs to the domain `cdn.discordapp.com`.
 * @param {string} url - The URL to be checked.
 * @returns {boolean} - Returns true if the URL is from `cdn.discordapp.com`, false otherwise.
 */
function isDiscordCDN(url) {
    try {
        return new URL(url).hostname === 'cdn.discordapp.com';
    } catch {
        return false;
    }
}

/**
 * Extracts the value of a specific query parameter from a given URL.
 * @param {string} url - The URL to be checked.
 * @param {string} key - The query parameter key to retrieve.
 * @returns {string|null} - Returns the value of the specified parameter if it exists, or null if it does not.
 */
function getQueryParamValue(url, key) {
    try {
        const params = new URL(url).searchParams;
        return params.has(key) ? params.get(key) : null;
    } catch {
        return null;
    }
}

/**
 * Converts a hexadecimal value to its decimal equivalent.
 * @param {string} hexValue - The hexadecimal value to convert.
 * @returns {number|null} - Returns the decimal equivalent, or null if the input is invalid.
 */
function hexToDecimal(hexValue) {
    try {
        return parseInt(hexValue, 16);
    } catch {
        return null;
    }
}

module.exports = {
    isDiscordCDN,
    getQueryParamValue,
    hexToDecimal,
};
