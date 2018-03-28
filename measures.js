export const $ = (s, parent = document) => parent.querySelector(s);
export const $$ = (s) => [...document.querySelectorAll(s)].filter(Boolean);

const floorPlanSource = $('#floorplan');
const floorImageSize = floorPlanSource.getBoundingClientRect();

const stage = $('#stage');
stage.width = floorImageSize.width;
stage.height = floorImageSize.height;

const bounds = stage.getBoundingClientRect();

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


/**
 *
 * @param {Array<number>} startPoint
 * @param {Array<number>} endPoint
 * @return {number} - in degrees
 */
export function getAngle(startPoint, endPoint) {
    const smallestX = Math.min(
        x(startPoint),
        x(endPoint)
    );

    const largestX = Math.max(
        x(startPoint),
        x(endPoint)
    );

    const smallestY = Math.min(
        y(startPoint),
        y(endPoint)
    );

    const largestY = Math.max(
        y(startPoint),
        y(endPoint)
    );

    return Math.atan2(
        // largestY - smallestY, largestX - smallestX
        y(endPoint) - y(startPoint), x(endPoint) - y(startPoint)
    ) * 180 / Math.PI;
}

// according to Math.atan2, 0 degrees is east. We want 0 degrees to be North on the circle
export function realAngle(x) {
    let rotated = x + 90;
    if (rotated >= 360) {
        return rotated - 360;
    }

    return rotated;
}

/**
 * Math.tan is not in degrees
 * @param deg
 */
export function tanDeg(deg) {
    const rad = deg * Math.PI/180;
    return Math.tan(rad);
}