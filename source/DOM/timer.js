/**
 * @return {Promise<Number>} https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp
 */
export function nextTick() {
    return new Promise(resolve => self.requestAnimationFrame(resolve));
}

/**
 * @param {Number} [seconds=0.25]
 *
 * @return {Promise} Wait seconds in Macro tasks
 */
export function delay(seconds = 0.25) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

/**
 * @param {Function} origin
 * @param {Number}   [interval=0.25] - Seconds
 *
 * @return {Function}
 */
export function debounce(origin, interval = 0.25) {
    var timer;

    return function() {
        clearTimeout(timer);

        timer = setTimeout(
            origin.bind.apply(origin, [].concat.apply([this], arguments)),
            interval * 1000
        );
    };
}

/**
 * @param {Function} origin
 * @param {Number}   [interval=0.25] - Seconds
 *
 * @return {Function} Wrapped function with Result cache
 */
export function throttle(origin, interval = 0.25) {
    var lastTime, lastValue;

    return function() {
        const now = Date.now();

        if (lastTime && lastTime + interval * 1000 > now) return lastValue;

        lastTime = now;

        return (lastValue = origin.apply(this, arguments));
    };
}
