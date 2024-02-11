class GattaiTools {
    static getGroupsToCombine(gattaiRef, thisCid, matchCid) {
        let c2g = gattaiRef.current.c2g;
        let g2c = gattaiRef.current.g2c;

        const thisGroupID = c2g[thisCid];
        const matchGroupID = c2g[matchCid];

        const gid = matchGroupID;
        const matchGroup = g2c[matchGroupID];
        const thisGroup = g2c[thisGroupID];

        if (thisGroupID === matchGroupID) {
            return [false, false, false]
        }

        return [gid, matchGroup, thisGroup];
    }

    static combineMatrices(matrixA, matrixB, posA, posB, direction) {
        // Function to get the dimensions of the combined matrix
        function getCombinedDimensions([numRowsA, numColsA], [numRowsB, numColsB], posA, posB, direction) {
            const [rowsAboveA, colsLeftA] = posA;
            const [rowsAboveB, colsLeftB] = posB;

            const rowsBelowA = numRowsA - rowsAboveA - 1;
            const colsRightA = numColsA - colsLeftA - 1;

            const rowsBelowB = numRowsB - rowsAboveB - 1;
            const colsRightB = numColsB - colsLeftB - 1;

            let newNumRows, newNumCols;
            
            if (direction === "right") {
                newNumCols = Math.max(colsRightB, colsRightA-1) + Math.max(colsLeftA, colsLeftB-1) + 2;
                newNumRows = Math.max(rowsAboveA, rowsAboveB) + Math.max(rowsBelowA, rowsBelowB) + 1;
            } 
            else if (direction === "left") {
                newNumCols = Math.max(colsLeftB, colsLeftA-1) + Math.max(colsRightA, colsRightB-1) + 2;
                newNumRows = Math.max(rowsAboveA, rowsAboveB) + Math.max(rowsBelowA, rowsBelowB) + 1;
            }
            else if (direction === "top") {
                newNumRows = Math.max(rowsAboveB, rowsAboveA-1) + Math.max(rowsBelowA, rowsBelowB-1) + 2;
                newNumCols = Math.max(colsLeftA, colsLeftB) + Math.max(colsRightA, colsRightB) + 1;
            }
            else if (direction === "bottom") {
                newNumRows = Math.max(rowsBelowB, rowsBelowA-1) + Math.max(rowsAboveA, rowsAboveB-1) + 2;
                newNumCols = Math.max(colsLeftA, colsLeftB) + Math.max(colsRightA, colsRightB) + 1;
            }

            return [newNumRows, newNumCols]
        }

        function getAStartIndices(posA, posB, [numRowsB, numColsB], direction) {
            const [rowsAboveA, colsLeftA] = posA;
            const [rowsAboveB, colsLeftB] = posB;

            let [AStartRow, AStartCol] = [0, 0];

            if ((direction === "right") || (direction === "left")) {
                if (rowsAboveA < rowsAboveB) {
                    AStartRow = rowsAboveB - rowsAboveA;
                }
                AStartCol = colsLeftB - colsLeftA;

                if (direction === "left") {
                    AStartCol = AStartCol + 1
                } else if (direction === "right") {
                    AStartCol = AStartCol - 1;
                }

            } else if ((direction === "top") || (direction === "bottom")) {
                if (colsLeftA < colsLeftB) {
                    AStartCol = colsLeftB - colsLeftA;
                }
                AStartRow = rowsAboveB - rowsAboveA;

                if (direction === "top") {
                    AStartRow += 1
                } else if (direction === "bottom") {
                    AStartRow -= 1
                }
            }

            AStartCol = Math.max(0, AStartCol)
            AStartRow = Math.max(0, AStartRow)

            return [AStartRow, AStartCol];
        }

        function getBStartIndices(AStartRow, AStartCol, posA, posB, direction) {
            const [AJoinRow, AJoinCol] = [AStartRow + posA[0], AStartCol + posA[1]];
            let [BJoinRow, BJoinCol] = [AJoinRow, AJoinCol];

            if (direction === "right") BJoinCol = AJoinCol + 1
            else if (direction === "top") BJoinRow = AJoinRow - 1;
            else if (direction === "left") BJoinCol = AJoinCol - 1;
            else if (direction === "bottom") BJoinRow = AJoinRow + 1;

            const [BStartRow, BStartCol] = [BJoinRow - posB[0], BJoinCol - posB[1]];

            return [BStartRow, BStartCol];
        }

        // Function to combine the matrices
        function combine(matrixA, matrixB, posA, posB, direction) {
            const [numRowsA, numColsA] = [matrixA.length, matrixA[0].length];
            const [numRowsB, numColsB] = [matrixB.length, matrixB[0].length];

            const [rows, cols] = getCombinedDimensions(
                [numRowsA, numColsA],
                [numRowsB, numColsB],
                posA, posB, direction
            );
            const [AStartRow, AStartCol] = getAStartIndices(posA, posB, [numRowsB, numColsB], direction);
            const [BStartRow, BStartCol] = getBStartIndices(AStartRow, AStartCol, posA, posB, direction);

            let combinedMatrix = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
            for (let i = 0; i < matrixA.length; i++) {
                for (let j = 0; j < matrixA[0].length; j++) {
                    combinedMatrix[i + AStartRow][j + AStartCol] = matrixA[i][j];
                }
            }
            for (let i = 0; i < matrixB.length; i++) {
                for (let j = 0; j < matrixB[0].length; j++) {
                    if (matrixB[i][j] === null) continue;
                    if (combinedMatrix[i + BStartRow][j + BStartCol] !== null) {
                        console.log("Invalid combination: cells overlap");
                        return;
                    }
                    combinedMatrix[i + BStartRow][j + BStartCol] = matrixB[i][j];
                }
            }
            return combinedMatrix;
        }

        return combine(matrixA, matrixB, posA, posB, direction);
    }

    static isGroupingValid(combinedGroup, cellHeads) {

        for (let cellRow = 0; cellRow < combinedGroup.length; cellRow++) {
            for (let cellCol = 0; cellCol < combinedGroup[0].length; cellCol++) {
                const thisCid = combinedGroup[cellRow][cellCol];
                if (thisCid === null) continue;
                const thisCellHeads = cellHeads[thisCid]

                if (cellCol + 1 < combinedGroup[0].length) {
                    const rightCid = combinedGroup[cellRow][cellCol + 1];
                    if (rightCid) {
                        if (thisCellHeads[1] === 0) {
                            return false;
                        }
                        const rightCellHeads = cellHeads[rightCid]
                        if (thisCellHeads[1] + rightCellHeads[3] !== 0) {
                            return false;
                        }
                    }
                }

                if (cellRow + 1 < combinedGroup.length) {
                    const bottomCid = combinedGroup[cellRow + 1][cellCol];
                    if (bottomCid) {
                        if (thisCellHeads[2] === 0) return false;
                        const bottomCellHeads = cellHeads[bottomCid]
                        if (thisCellHeads[2] + bottomCellHeads[0] !== 0) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }

    static setMergedGroup(combinedGroup, matchGroup, thisGid, matchGid, gattaiRef) {
        const c2g = gattaiRef.current.c2g;

        // remove matchGroup from mappings as it is now part of matchGroup
        for (let i = 0; i < matchGroup.length; i++) {
            for (let j = 0; j < matchGroup[0].length; j++) {
                const cid = matchGroup[i][j];
                if (cid === null) continue;
                c2g[cid] = thisGid;
            }
        }
        const g2c = gattaiRef.current.g2c;
        delete g2c[matchGid];
        g2c[thisGid] = combinedGroup;

        gattaiRef.current.g2c = g2c;

        sessionStorage.setItem("cachedGroups", JSON.stringify({g2c, c2g}))
    }

    static getPivotIndices(matchEdge, thisRow, thisCol) {
        // the relative difference of index numbers on merging thisCell to matchCell from top, right, bottom, left
        const thisIndexShift = {
            top: [-1, 0],
            right: [0, 1],
            bottom: [1, 0],
            left: [0, -1]
        };
        const [rowIndexChange, colIndexChange] = thisIndexShift[matchEdge];
        return [thisRow - rowIndexChange, thisCol - colIndexChange];
    }
}

export default GattaiTools;