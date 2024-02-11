function getCachedCellKeys() {
    // gets all keys for individual cell states
    const pattern = /^cachedCell_/;
    const matchingKeys = Object.keys(sessionStorage).filter((key) => pattern.test(key));
    return matchingKeys;
}


function setCachedArena(fetchedData) {
    const dataToCache = {
        jigsawId: fetchedData.jigsawId,
        isSnapshot: fetchedData.isSnapshot,
        cmeta: fetchedData.cmeta,
        s3Path: fetchedData.s3Path,
        cellCount: fetchedData.cellCount
    }
    if (fetchedData.isSnapshot) {dataToCache.shareableId = fetchedData.shareableId}
    sessionStorage.setItem('cachedArena', JSON.stringify(dataToCache));
    sessionStorage.setItem('cachedGroups', JSON.stringify({...fetchedData.cellGroups}));
}


function getCachedArena() {
    const cachedArena = JSON.parse(sessionStorage.getItem('cachedArena'));
    const cachedGroups = JSON.parse(sessionStorage.getItem('cachedGroups'));

    if (!cachedArena) return
    if (!cachedGroups) return

    const cachedCellKeys = getCachedCellKeys();
    let cachedCells = [];

    cachedCellKeys.forEach((cachedCellKey) => {
        cachedCells.push(JSON.parse(sessionStorage.getItem(cachedCellKey)))
    })

    if (cachedArena.cellCount !== cachedCells.length) {
        return
    }

    cachedArena.cellGroups = cachedGroups;
    cachedArena.cellBlocks = cachedCells;

    return cachedArena
}


function clearCachedArena() {
    const cachedCellKeys = getCachedCellKeys()
    cachedCellKeys.forEach((cachedCellKey) => {
        sessionStorage.removeItem(cachedCellKey)
    })
    sessionStorage.removeItem('cachedArena')
    sessionStorage.removeItem('cachedGroups')
}


async function getCachedCellImg(jigsawId, fname) {
    const cache = await caches.open(`jid_${jigsawId}`);
    const response = await cache.match(`/img_${fname}`);
    const img = response ? await response.text() : null;
    return img
}


async function removeCachedThumbnail(imageId) {
    const cache = await caches.open(`thumbnails`);
    await cache.delete(imageId);
}


async function setCachedCellImg(jigsawId, fname, data) {
    const cache = await caches.open(`jid_${jigsawId}`);
    await cache.put(`img_${fname}`, new Response(data));
}


async function getCachedCellBlocks(jigsawId) {
    const cache = await caches.open(`jid_${jigsawId}`);
    const response = await cache.match(`/cells`);
    const img = response ? await response.json() : null;
    return img
}


async function setCachedCellBlocks(jigsawId, data) {
    const cache = await caches.open(`jid_${jigsawId}`);
    await cache.put(`cells`, new Response(JSON.stringify(data)));
}


async function setCachedThumbnailImg(imageId, dataUri) {
    const cache = await caches.open(`thumbnails`);
    await cache.put(imageId, new Response(dataUri));
}


async function getCachedThumbnailImg(imageId) {
    const cache = await caches.open(`thumbnails`);
    const response = await cache.match(imageId);
    const img = response ? await response.text() : null;
    return img
}


async function clearAllCaches() {
    localStorage.clear()
    sessionStorage.clear()

    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
}


class CacheStorage {
    static getCellImg = getCachedCellImg;
    static setCellImg = setCachedCellImg;
    static getCellBlocks = getCachedCellBlocks;
    static setCellBlocks = setCachedCellBlocks;
    static getThumbnailImg = getCachedThumbnailImg;
    static setThumbnailImg = setCachedThumbnailImg;
}


export {
    clearCachedArena,
    getCachedArena,
    setCachedArena,
    clearAllCaches,
    removeCachedThumbnail,
    CacheStorage
}