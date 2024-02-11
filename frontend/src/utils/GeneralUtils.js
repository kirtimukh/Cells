export const debounce = (func, delay = 1000) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...args)
        }, delay)
    }
}


export function debounceAsync(func, delay=1000, immediate=false) {
    let timeout
    return function (...args) {
        return new Promise((resolve) => {
            clearTimeout(timeout)
            timeout = setTimeout(() => {
                timeout = null
                if (!immediate) {
                Promise.resolve(func.apply(this, [...args])).then(resolve)
                }
            }, delay)
            if (immediate && !timeout) {
                Promise.resolve(func.apply(this, [...args])).then(resolve)
            }
        })
    }
}


export const getRandomPosition = (arenaWidth, arenaHeight, cellWidth, cellHeight) => {
    const left = Math.floor(Math.random() * (arenaWidth - cellWidth));
    const top = Math.floor(Math.random() * (arenaHeight - cellHeight));
    return { top, left }
}
