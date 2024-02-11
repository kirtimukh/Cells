import apiClient from '@/interceptors';
import { apiUrl, s3Url } from '@/constants';

import { getRandomPosition } from '@/utils/GeneralUtils'
import { CacheStorage, getCachedArena, setCachedArena, removeCachedThumbnail } from '@/utils/CacheUtils'

const valUndefined = ['undefined', undefined]


async function fetchUserCreds(authCookie, removeCookie, refresh=false) {
    if (!authCookie || valUndefined.includes(authCookie)) return;
    const cacheKey = "users/me";
    const cachedData = localStorage.getItem(cacheKey)

    return (cachedData && !refresh)
    ?
    JSON.parse(cachedData)
    :
    apiClient.get(`${apiUrl}/auth/me`, {
        headers: { Authorization: authCookie }
    })
        .then(function (response) {
            localStorage.setItem(cacheKey, JSON.stringify(response.data));
            return response.data
        })
        .catch(function (error) {
            removeCookie('Authorization')
            return null
        });
}


async function fetchUserProfile(authCookie, removeCookie, refresh=false) {
    if (!authCookie || valUndefined.includes(authCookie)) return;
    return apiClient.get(`${apiUrl}/profile/`, {
        headers: { Authorization: authCookie }
    })
    .then(response => response.data)
    .catch(error => { removeCookie('Authorization'); });
}


async function fetchJsList(authCookie, refresh=false) {
    const cacheKey = "all-jigsaws";
    const cachedData = localStorage.getItem(cacheKey)

    if (cachedData && refresh) {
        localStorage.removeItem(cacheKey);
    }

    return (cachedData && !refresh)
    ?
    JSON.parse(cachedData)
    :
    apiClient.get(`${apiUrl}/jigsaw/all`, {
        headers: {
            Authorization: authCookie
        }
    }).then(function (response) {
        localStorage.setItem(cacheKey, JSON.stringify(response.data));
        return response.data
    }).catch(function (error) {
        console.error('Error:', error);
        return []
    });
}


async function fetchImageList(authCookie, refresh=false) {
    if (!authCookie || valUndefined.includes(authCookie)) { return [] }
    const cacheKey = "all-images";
    const cachedData = localStorage.getItem(cacheKey)

    if (cachedData && refresh) {
        localStorage.removeItem(cacheKey);
    }

    return (cachedData && !refresh)
    ?
    JSON.parse(cachedData)
    :
    apiClient.get(`${apiUrl}/images/all`, {
        headers: { Authorization: authCookie }
    }).then(function (response) {
        localStorage.setItem(cacheKey, JSON.stringify(response.data));
        return response.data
    }).catch(function (error) {
        console.error('Error:', error);
        return []
    });
}


async function fetchShareablesList(authCookie, refresh=false) {
    if (!authCookie || valUndefined.includes(authCookie)) {return []}
    const cacheKey = "all-shareables";
    const cachedData = localStorage.getItem(cacheKey)

    if (cachedData && refresh) {
        localStorage.removeItem(cacheKey);
    }

    return (cachedData && !refresh)
    ?
    JSON.parse(cachedData)
    :
    apiClient.get(`${apiUrl}/shareables/all`, {
        headers: {
            Authorization: authCookie
        }
    }).then(function (response) {
        localStorage.setItem(cacheKey, JSON.stringify(response.data));
        return response.data
    }).catch(function (error) {
        console.error('Error:', error);
        return []
    });
}


const fetchThumbnailImage = async (url, imageid) => {
    const cachedData = await CacheStorage.getThumbnailImg(imageid)

    return (cachedData)
    ?
    cachedData
    :
    apiClient.get(url, {
        responseType: "arraybuffer", // Ensure binary data is returned
    })
    .then(response => {
        const binary = new Uint8Array(response.data).reduce((acc, byte) => acc + String.fromCharCode(byte), "");
        const base64String = btoa(binary);  // Encode binary string to base64

        const mimeType = response.headers["content-type"];  // Get MIME type from headers and build Data URI
        const dataUri = `data:${mimeType};base64,${base64String}`;

        CacheStorage.setThumbnailImg(imageid, dataUri);
        return dataUri;
    })
    .catch(error => {
    console.error("Error fetching or encoding the image:", error);
    throw error;
    });
};


const fetchCellImage = async (s3Path, filename) => {
    const jid = s3Path.split('/')[5]
    const url = `${s3Path}/cells/${filename}`
    const cachedData = await CacheStorage.getCellImg(jid, filename)

    return (cachedData)
    ?
    cachedData
    :
    apiClient.get(url, {
        responseType: "arraybuffer", // Ensure binary data is returned
    })
    .then(response => {
        const binary = new Uint8Array(response.data).reduce((acc, byte) => acc + String.fromCharCode(byte), "");
        const base64String = btoa(binary);  // Encode binary string to base64

        const mimeType = response.headers["content-type"];  // Get MIME type from headers and build Data URI
        const dataUri = `data:${mimeType};base64,${base64String}`;

        CacheStorage.setCellImg(jid, filename, dataUri)
        return dataUri;
    })
    .catch(error => {
    console.error("Error fetching or encoding the image:", error);
    throw error;
    });
};


async function GetCells(jigsawId, authCookie, additionalContext={}) {
    const cachedData = await CacheStorage.getCellBlocks(jigsawId)

    return (cachedData)
    ?
    {fetchedData: cachedData, ...additionalContext}
    :
    apiClient.get(`${apiUrl}/jigsaw/${jigsawId}/cells`, {
        headers: {
            Authorization: authCookie
        }
    })
    .then(function(response) {
        CacheStorage.setCellBlocks(jigsawId, response.data)
        return {fetchedData: response.data, ...additionalContext}
    })
}


function prepareCellblocksForArena(fetchedData) {
    let data = { ok: true }

    const arenaWidth = document.getElementById('DnDSpace').offsetWidth;
    const arenaHeight = document.getElementById('DnDSpace').offsetHeight;
    data.jigsawId = fetchedData.jigsawId

    data.cmeta = fetchedData.cmeta
    data.cellCount = fetchedData.cellblocks.length
    data.s3Path = s3Url + '/' + fetchedData.s3dir

    const cellBlocks = fetchedData.cellblocks
    cellBlocks.map((obj, index) => {
        const { top, left } = getRandomPosition(arenaWidth, arenaHeight, obj.width, obj.height)
        obj.top = top
        obj.left = left
        obj.rnum = 0
        obj.zIndex = index
    })
    data.cellBlocks = cellBlocks

    const groupData = cellBlocks.reduce((result, obj) => {
        result.c2g[obj.cid] = obj.cid
        result.g2c[obj.cid] = [[obj.cid]]
        return result
    }, { c2g: {}, g2c: {} })

    data.cellGroups = groupData
    data.isSnapshot = false;

    return data
}


async function getCellblocks(jigsawId, authCookie) {
    return GetCells(jigsawId, authCookie)
    .then(function ({fetchedData}) {
        fetchedData.jigsawId = jigsawId
        const arrangedArena = prepareCellblocksForArena(fetchedData) 
        setCachedArena({...arrangedArena})
        return arrangedArena
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}


function prepareSnapshotForArena(snapshotData, fetchedData) {
    let data = { ok: true, jigsawId: snapshotData.jigsaw_id }

    const savedStates = snapshotData.states
    const sortedKeys = Object.keys(savedStates).sort((a, b) => {
        return savedStates[a].zIndex - savedStates[b].zIndex;
    });
    sortedKeys.forEach((cid, normalizedZIndex) => {
        savedStates[cid].zIndex = normalizedZIndex;
    });

    data.cmeta = fetchedData.cmeta
    data.cellCount = fetchedData.cellblocks.length
    data.s3Path = s3Url + '/' + fetchedData.s3dir

    const cellBlocks = fetchedData.cellblocks

    cellBlocks.map((obj, index) => {
        obj.top = savedStates[obj.cid].top
        obj.left = savedStates[obj.cid].left
        obj.rnum = savedStates[obj.cid].rnum
        obj.zIndex = savedStates[obj.cid].zIndex
    })

    data.cellBlocks = cellBlocks
    data.cellGroups = snapshotData.groups;
    data.isSnapshot = true;

    return data
}


async function getSnapshot(authCookie, snapshotId = "last") {
    return apiClient.get(`${apiUrl}/jigsaw/snapshot/${snapshotId}`, {
        headers: { Authorization: authCookie }
    })
    .then(function (response) {
        if (!response.data.ok) {
            throw {
                message: "You donot have any saved Snapshot",
                code: 'NO_SNAPSHOT'
            };
        }
        const snapshotData = response.data
        return GetCells(snapshotData.jigsaw_id, authCookie, {snapshotData})
    })
    .then(({fetchedData, snapshotData}) => {
        const arrangedArena = prepareSnapshotForArena(snapshotData, fetchedData)
        setCachedArena({...arrangedArena})
        return arrangedArena
    })
    .catch(function (error) {
        return {
            ok: false,
            message: error.message,
        }
    });
}


async function getShareable(authCookie, shareableId) {
    const cachedArena = getCachedArena()
    if (cachedArena && cachedArena.shareableId === shareableId) {
        return cachedArena
    }
    return apiClient.get(`${apiUrl}/shareables/${shareableId}`, {
        headers: { Authorization: authCookie }
    })
    .then(function (response) {
        const shareableData = response.data

        if (shareableData.ok) {
            return GetCells(shareableData.jigsaw_id, authCookie, {shareableData})
        } else if (shareableData.jigsaw_id) {
            return GetCells(shareableData.jigsaw_id, authCookie, {})
        } else {
            throw {
                message: "No shareables found",
                jigsawId: shareableData.data.jigsaw_id,
                code: 'NO_SNAPSHOT'
            };
        }
    })
    .then(({fetchedData, shareableData}) => {
        let arrangedArena;
        if (typeof(shareableData) === 'undefined' || shareableData === undefined) {
            arrangedArena = prepareCellblocksForArena(fetchedData)
        } else {
            arrangedArena = prepareSnapshotForArena(shareableData, fetchedData)
        }
        arrangedArena.shareableId = shareableId
        setCachedArena({...arrangedArena})
        return arrangedArena
    })
    .catch(function (error) {
        return {
            ok: false,
            message: error.message,
        }
    });
}


async function postSnapshot(jigsawId, arena, authCookie, snapType="snapshot") {
    return apiClient.post(`${apiUrl}/jigsaw/${jigsawId}/${snapType}`, {
        ...arena,
    }, {
        headers: { Authorization: authCookie }
    })
    .then(function (response) {
        return response.data
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}


async function postNewClonedShareable(jigsawId, authCookie) {
    return apiClient.post(`${apiUrl}/jigsaw/${jigsawId}/make-shareable`, {
    }, {
        headers: {
            Authorization: authCookie
        }
    })
        .then(function (response) {
            return response.data;
        })
        .catch(function (error) {
            console.error('Error:', error);
        });
}


async function VerifySolution(instanceId, arena, authCookie, isShared) {

    const rnums = Object.entries(arena.states).reduce((acc, [cid, state]) => {
        acc[cid] = state.rnum
        return acc
    }, {});

    const group = Object.values(arena.groups.g2c)[0]

    const evaluation = group.reduce((acc, row) => {
        const rowEval = row.reduce((rowAcc, cid) => {
            rowAcc.push({
                cid,
                rnum: rnums[cid]
            })
            return rowAcc
        }, []);
        acc.push(rowEval);
        return acc
    }, []);

    const jType = isShared ? "shareables" : 'jigsaw'

    return apiClient.post(`${apiUrl}/${jType}/${instanceId}/verify`, { evaluation }, {
        headers: {
            Authorization: authCookie
        }
    })
        .then(function (response) {
            return response.data
        })
        .catch(function (error) {
            console.error('Error:', error);
        });
}


const requestVerifyUC = (jigsawId, arena, authCookie, isShared) => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                const result = await VerifySolution(jigsawId, arena, authCookie, isShared);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }, 100);
    });
};


const UploadFile = (imageFile, imageName, presignedS3Url) => {
    const formData = new FormData();

    Object.entries(presignedS3Url.fields).forEach(([key, val]) => {
        formData.append(key, val);
    });
    formData.append('file', imageFile);

    const postConfig = {}

    return apiClient.post(presignedS3Url.url, formData, postConfig)
}


async function postNewImage(uploadedInfo, imgFile, authCookie) {
    return apiClient.post(`${apiUrl}/images/new-image`, {
        title: uploadedInfo.imageTitle,
        imgWidth: uploadedInfo.imageInfo.imgWidth,
        imgHeight: uploadedInfo.imageInfo.imgHeight,
        targetHt: uploadedInfo.targetInfo.targetHt,
        numRows: uploadedInfo.gridInfo.numRows,
        numCols: uploadedInfo.gridInfo.numCols,
    }, {
        headers: {
            Authorization: authCookie
        }
    })
    .then(response => {
        if (!response.data.ok) { return response.data }
        const presignedS3Url = response.data.presignedS3Url
        return UploadFile(imgFile, uploadedInfo.imageTitle, presignedS3Url)
    })
    .catch(error => {
        console.log(error)
    })
}


async function postDeleteImage(authCookie, ids) {
    const imageId = ids[0]
    return apiClient.post(`${apiUrl}/images/${imageId}/delete`, {},{
        headers: { Authorization: authCookie }
    })
    .then(response => {
        if (response.data.ok) {removeCachedThumbnail(`/${imageId}`)}
        return response.data
    })
}


async function postDeleteShareables(authCookie, ids) {
    return apiClient.post(`${apiUrl}/shareables/delete`, {ids}, {
        headers: { Authorization: authCookie }
    }).then(response => response.data)
}


async function postDeleteJigsaws(authCookie, ids) {
    return apiClient.post(`${apiUrl}/jigsaw/delete`, {ids},  {
        headers: { Authorization: authCookie }
    }).then(response => response.data)
}


async function postNewJigsaw(imageid, jigsawData, authCookie, jType) {
    return apiClient.post(`${apiUrl}/images/new-${jType}/${imageid}`,
        {...jigsawData},
        {
        headers: { Authorization: authCookie }
    })
        .then(function (response) {
            const data = response.data
            if (!data.ok) { console.log(data) }
            return data
        }
    )
}


async function postMessageOfCompletion(shareableId, payload, authCookie) {
    return apiClient.post(`${apiUrl}/shareables/${shareableId}/change`, {
        ...payload,
    }, { headers: { Authorization: authCookie } })
    .then(response => response.data)
    .catch(function (error) {
        console.error('Error:', error);
    });
}


export {
    fetchUserCreds,
    fetchUserProfile,
    fetchImageList,
    fetchJsList,
    fetchShareablesList,

    fetchThumbnailImage,
    fetchCellImage,

    getCellblocks,
    getSnapshot,
    getShareable,
    postSnapshot,
    requestVerifyUC,

    postNewClonedShareable,
    postDeleteShareables,
    postNewImage,
    postDeleteImage,
    postNewJigsaw,

    postDeleteJigsaws,

    postMessageOfCompletion
}
