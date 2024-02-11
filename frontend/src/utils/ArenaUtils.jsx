const topIndex = 0;
const rightIndex = 1;
const bottomIndex = 2;
const leftIndex = 3;


export const getExtenders = (cPins, cId, cMeta, dockState) => {
    let extensions = [null, null, null, null]

    if (dockState[topIndex] === 0) {
        extensions[topIndex] = getUpperExt(cMeta, cPins, cId)
    }
    if (dockState[rightIndex] === 0) {
        extensions[rightIndex] = getRightExt(cMeta, cPins, cId)
    }
    if (dockState[bottomIndex] === 0) {
        extensions[bottomIndex] = getLowerExt(cMeta, cPins, cId)
    }
    if (dockState[leftIndex] === 0) {
        extensions[leftIndex] = getLeftExt(cMeta, cPins, cId)
    }

    return extensions
}


function getHollowBackground(cMeta, edge, cId) {
    let style;

    if (edge === "top" || edge === "bottom") {
        const left = cMeta.cw / 2 - cMeta.radius + "px"
        const right = cMeta.cw / 2 - cMeta.radius + "px"
        const height = cMeta.os + "px"
        const width = 2 * cMeta.radius + "px"

        style = {
            width, height, left, right, position: "absolute"
        }
    } else {
        const top = cMeta.ch / 2 - cMeta.radius + "px"
        const bottom = cMeta.ch / 2 - cMeta.radius + "px"
        const height = 2 * cMeta.radius + "px"
        const width = cMeta.os + "px"

        style = {
            width, height, top, bottom, position: "absolute"
        }
    }

    return <div style={style}></div>
}


export function getUpperExt(cMeta, cPins, cId) {
    if (cPins[topIndex] === 0) {
        return
    }
    let top = 0;
    let right = 0;
    let bottom = cMeta.ch - cMeta.os;
    let left = 0;
    let width = cMeta.cw + "px";
    let height = cMeta.os + "px";

    if (cPins[topIndex] === 1) { bottom = bottom + cMeta.os }
    if (cPins[rightIndex] === 1) { right = right + cMeta.os + "px" }
    if (cPins[bottomIndex] === 1) { bottom = bottom + cMeta.os }
    if (cPins[leftIndex] === 1) { left = left + cMeta.os + "px" }
    bottom = bottom + "px"

    const style = { top, right, bottom, left, width, height, position: "absolute" }

    let bgTop = "";
    if (cPins[topIndex] === -1) {
        bgTop = getHollowBackground(cMeta, "top")
    }

    return <div
        style={{ ...style }} cid={cId} pin={cPins[topIndex]} edge={"top"}
    >{bgTop}</div>
}


export function getRightExt(cMeta, cPins, cId) {
    if (cPins[rightIndex] === 0) {
        return
    }
    let top = 0;
    let right = 0;
    let bottom = 0;
    let left = cMeta.cw - cMeta.os;
    let width = cMeta.os + "px";
    let height = cMeta.ch + "px";

    if (cPins[topIndex] === 1) { top = cMeta.os + "px" }
    if (cPins[rightIndex] === 1) { left = left + cMeta.os }
    if (cPins[bottomIndex] === 1) { bottom = cMeta.os + "px" }
    if (cPins[leftIndex] === 1) { left = left + cMeta.os }
    left = left + "px"

    const style = { top, right, bottom, left, width, height, position: "absolute" }

    let bgRight = "";
    if (cPins[rightIndex] === -1) {
        bgRight = getHollowBackground(cMeta, "right")
    }

    return <div
        style={{ ...style }} cid={cId} pin={cPins[rightIndex]} edge={"right"}
    >{bgRight}</div>
}


export function getLowerExt(cMeta, cPins, cId) {
    if (cPins[bottomIndex] === 0) {
        return
    }
    let top = cMeta.ch - cMeta.os;
    let right = 0;
    let bottom = 0;
    let left = 0;
    let width = cMeta.cw + "px";
    let height = cMeta.os + "px";

    if (cPins[topIndex] === 1) { top = top + cMeta.os }
    if (cPins[rightIndex] === 1) { right = cMeta.os + "px" }
    if (cPins[bottomIndex] === 1) { top = top + cMeta.os }
    if (cPins[leftIndex] === 1) { left = cMeta.os + "px" }
    top = top + "px"

    const style = { top, right, bottom, left, width, height, position: "absolute" }

    let bgBottom = "";
    if (cPins[bottomIndex] === -1) {
        bgBottom = getHollowBackground(cMeta, "bottom")
    }

    return <div
        style={{ ...style }} cid={cId} pin={cPins[bottomIndex]} edge={"bottom"}
    >{bgBottom}</div>
}


export function getLeftExt(cMeta, cPins, cId) {
    if (cPins[leftIndex] === 0) {
        return
    }
    let top = 0;
    let right = cMeta.cw - cMeta.os;
    let bottom = 0;
    let left = 0;
    let width = cMeta.os + "px";
    let height = cMeta.ch + "px";

    if (cPins[topIndex] === 1) {
        top = cMeta.os + "px"
    }
    if (cPins[rightIndex] === 1) {
        right = right + cMeta.os
    }
    if (cPins[bottomIndex] === 1) {
        bottom = cMeta.os + "px"
    }
    if (cPins[leftIndex] === 1) {
        right = right + cMeta.os
    }
    right = right + "px"

    const style = { top, right, bottom, left, width, height, position: "absolute" }

    let bgLeft = "";
    if (cPins[leftIndex] === -1) {
        bgLeft = getHollowBackground(cMeta, "left")
    }

    return <div
        style={{ ...style }} cid={cId} pin={cPins[leftIndex]} edge={"left"}
    >{bgLeft}</div>
}


export const calculateTranslation = (rotationNum, ogBlockDims) => {
    const [blockWidth, blockHeight] = ogBlockDims;
    let [translateX, translateY] = [0, 0];

    if (rotationNum === 1) {
        translateX = blockHeight;
    } else if (rotationNum === 2) {
        translateX = blockWidth;
        translateY = blockHeight;
    } else if (rotationNum === 3) {
        translateY = blockWidth;
    }

    return [translateX, translateY]
}


export const rotateHeads = (rotateBy, Heads) => {
    // const rotateBy = (rotateBy - ogNum + 4) % 4;
    if (rotateBy === -1) Heads.push(...Heads.splice(0, 1))
    if (rotateBy > 0) Heads.unshift(...Heads.splice(-1 * rotateBy))
    return Heads
}


export const rotateTransform = (rnum, ogBlockDims) => {
    if (rnum === 0) return `scale(1)`

    const [blockWidth, blockHeight] = ogBlockDims;

    let scale = 1;
    if (blockWidth > blockHeight && rnum % 2 === 1) {
        scale = blockWidth / blockHeight;
    }

    const [translateX, translateY] = calculateTranslation(rnum, ogBlockDims)
    const transform = `translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotate(${rnum * 90}deg)`;

    return transform
}


export const handleGattai = (event, nodeRef, matches=[]) => {
    if (matches.length==0) {
        matches = nodeRef.current.getAttribute('data-matches').split(';')
    }

    const keyToEdgeMap = {
        'KeyW': 'top',
        'KeyA': 'left',
        'KeyS': 'bottom',
        'KeyD': 'right',
        'ArrowUp':'top', 'ArrowLeft':'left', 'ArrowDown':'bottom', 'ArrowRight':'right'
    }

    let matchesList = []
    if (event == null) {return matches}
    for (let match of matches) {
        const [thisCell, matchCell] = match.split(':')
        const [thisCid, thisEdge] = thisCell.split(',')
        if (keyToEdgeMap[event.code] === thisEdge) {
            matchesList.push(match)
        }
    }

    if (matchesList.length === 1) {
        return [matchesList[0]]
    }

    return matchesList
}


export const openQontext = (nodeRef, mousePosition, contextPosition, contextState) => {
    const target = nodeRef.current.childNodes[0].querySelector('img')
    const event = new PointerEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 2,
        buttons: 2,
        ...mousePosition.current
    });
    target.dispatchEvent(event);
    contextPosition.current = { ...mousePosition.current }
}


export const toggleQontext = (event, nodeRef, mousePosition, contextState, contextPosition) => {
    if (contextState.current === "open") {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))

        let reopenContext = false;

        const cPos = contextPosition.current
        const mPos = mousePosition.current
        const posDiff = Math.sqrt(Math.pow(cPos.clientX - mPos.clientX, 2) + Math.pow(cPos.clientY - mPos.clientY, 2))
        reopenContext = posDiff > 80

        if (reopenContext) {
            openQontext(nodeRef, mousePosition, contextPosition, contextState)
        }
    } else {
        openQontext(nodeRef, mousePosition, contextPosition, contextState)
    }
}