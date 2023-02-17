export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const img = (function (type) {
    return (path) => type + "/" + path;
})("images");

export function range(start, end, step = 1) {
    if (arguments.length === 1) {
        end = start;
        start = 0;
        step = 1;
    }

    const result = [];
    for (let i = start; i < end; i += step) {
        result.push(i);
    }

    return result;
}