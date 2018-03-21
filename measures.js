const bounds = document.getElementById('stage').getBoundingClientRect();

/**
 * @param {number} percent
 * @returns {number}
 */
export function xpx(percent) {
    return (bounds.width / 100) * percent;
}

/**
 * @param {number} percent
 * @returns {number}
 */
export function ypx(percent) {
    return (bounds.height / 100) * percent;
}

/**
 * @param {number} pixels
 * @returns {number}
 */
export function xpc(pixels) {
    return (pixels / bounds.width) * 100;
}

/**
 * @param {number} pixels
 * @returns {number}
 */
export function ypc(pixels) {
    return (pixels / bounds.height) * 100;
}

/**
 * @param {Array<number>} tuple
 * @return {number}
 */
export function x(tuple) {
    return tuple[0];
}

/**
 *
 * @param {Array<number>} tuple
 * @return {number}
 */
export function y(tuple) {
    return tuple[1];
}

/**
 *
 * @param {number} howManyPercent
 * @param {number} ofThis
 * @return {number}
 */
export function pc(howManyPercent, ofThis) {
    return (ofThis / 100) * howManyPercent;
}