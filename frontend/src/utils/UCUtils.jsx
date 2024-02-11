export const getLocalIndices = (cid, group) => {
    for (let i = 0; i < group.length; i++) {
        let row = group[i];
        if (row.includes(cid)) {
            return [i, row.indexOf(cid)];
        }
    }
}

export const positionCellInGroup = (
    pivotPins, cellPins, [relRow, relCol], pivotPosition, cMeta
) => {
    // xCalibration: calibrating for x or left
    let xCal = 0;
    if (pivotPins[3] === 1) xCal = xCal + 1;
    if (cellPins[3] === 1) xCal = xCal - 1;

    // yCalibration: calibrating for y or top
    let yCal = 0;
    if (pivotPins[0] === 1) yCal = yCal + 1;
    if (cellPins[0] === 1) yCal = yCal - 1;

    const newThisX = pivotPosition.left + relCol * cMeta.cw + xCal * cMeta.os;
    const newThisY = pivotPosition.top + relRow * cMeta.ch + yCal * cMeta.os;

    return { top: newThisY, left: newThisX };
};


export const setGroupPosition = (
    cellIndices, pivot, cMeta, setPosition, cellHeads
) => {
    for (let cellRow = 0; cellRow < cellIndices.length; cellRow++) {
        for (let cellCol = 0; cellCol < cellIndices[0].length; cellCol++) {
            const thisCid = cellIndices[cellRow][cellCol];
            if (thisCid === null) continue;

            const [relRow, relCol] = [cellRow - pivot.row, cellCol - pivot.col];
            const newPos = positionCellInGroup(
                pivot.pins,
                cellHeads[thisCid],
                [relRow, relCol],
                pivot.position,
                cMeta
            )
            setPosition(thisCid, newPos)
        }
    }
}


export const rotateGroup = (targetGroup, rotateBy, gattaiRef, gid, updateRnum) => {
    if (rotateBy === 3) rotateBy = -1;
    let rotatedGroup;
    if (rotateBy === 1) {
        rotatedGroup = targetGroup[0].map((val, index) => targetGroup.map(row => row[index]).reverse());
    } else if (rotateBy === 2) {
        rotatedGroup = targetGroup.map((row, index) => row.reverse()).reverse();
    } else if (rotateBy === -1) {
        rotatedGroup = targetGroup[0].map((val, index) => targetGroup.map(row => row[row.length - 1 - index]));
    } else {
        rotatedGroup = structuredClone(targetGroup);
    }
    gattaiRef.current.g2c[gid] = rotatedGroup;
    sessionStorage.setItem("cachedGroups", JSON.stringify({g2c:gattaiRef.current.g2c, c2g:gattaiRef.current.c2g}))

    for (let i = 0; i < rotatedGroup.length; i++) {
        for (let j = 0; j < rotatedGroup[0].length; j++) {
            const cid = rotatedGroup[i][j];
            if (cid === null) continue;
            updateRnum(cid, rotateBy);
        }
    }
}


export const updateSingleCells = (gattaiRef) => {
    const g2c = gattaiRef.current.g2c;
    const soloGroups = Object.keys(g2c).filter(gid => {
        const numOfCells = g2c[gid].reduce((acc, row) => acc + row.filter(cell => cell !== null).length, 0)
        return numOfCells === 1
    })

    let singleCells = []

    soloGroups.forEach(gid => {
        const cId = g2c[gid][0][0]
        singleCells.push(cId)
    })

    gattaiRef.current.singleCells = singleCells
}
