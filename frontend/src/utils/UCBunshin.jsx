class BunshinTools {
    static split(exitCids, targetGroupId, gattaiRef) {
        const g2c = gattaiRef.current.g2c;
        const c2g = gattaiRef.current.c2g;

        const targetGroup = g2c[targetGroupId];
        delete g2c[targetGroupId];
        const [numRows, numCols] = [targetGroup.length, targetGroup[0].length];
        let exitGroup = Array.from({ length: numRows }, () => Array.from({ length: numCols }, () => null));

        for (let cellRow = 0; cellRow < targetGroup.length; cellRow++) {
            for (let cellCol = 0; cellCol < targetGroup[0].length; cellCol++) {
                const cid = targetGroup[cellRow][cellCol];
                if (cid === null) continue;
                if (exitCids.includes(cid)) {
                    exitGroup[cellRow][cellCol] = cid;
                    targetGroup[cellRow][cellCol] = null;
                }
            }
        }

        const stayGroups = this.reshape(targetGroup, numRows, numCols)
        const exitGroups = this.reshape(exitGroup, numRows, numCols)

        let gid, group;
        stayGroups.forEach(subgroup => {
            gid = subgroup.gid;
            group = subgroup.items;

            for (let cellRow = 0; cellRow < group.length; cellRow++) {
                for (let cellCol = 0; cellCol < group[0].length; cellCol++) {
                    if (group[cellRow][cellCol] === null) continue;
                    c2g[group[cellRow][cellCol]] = gid;
                }
            }

            g2c[gid] = group;
        })

        exitGroups.forEach(subgroup => {
            gid = subgroup.gid;
            group = subgroup.items;

            for (let cellRow = 0; cellRow < group.length; cellRow++) {
                for (let cellCol = 0; cellCol < group[0].length; cellCol++) {
                    if (group[cellRow][cellCol] === null) continue;
                    c2g[group[cellRow][cellCol]] = gid;
                }
            }

            g2c[gid] = group;
        })

        gattaiRef.current.g2c = g2c;
        gattaiRef.current.c2g = c2g;
        sessionStorage.setItem("cachedGroups", JSON.stringify({g2c, c2g}))

        return [...stayGroups, ...exitGroups]
    }
    static check(selectedCids, targetGroupId, c2g) {
        const equalValuesKeys = [];
        const notEqualValuesKeys = [];

        selectedCids.forEach(key => {
            if (c2g[key] === targetGroupId) {
                equalValuesKeys.push(key);
            } else {
                notEqualValuesKeys.push(key);
            }
        });

        return equalValuesKeys;
    }
    static reshape(group) {
        let subgroups = [];
        let toVisit = [];
        let newGid, subgroup;

        while (group[0].length > 0) {
            for (let cellRow = 0; cellRow < group.length; cellRow++) {
                for (let cellCol = 0; cellCol < group[0].length; cellCol++) {
                    if (group[cellRow][cellCol] === null) {
                        continue;
                    }
                    newGid = group[cellRow][cellCol];
                    subgroup = this.getSubGroup(group, group.length, group[0].length, [[cellRow, cellCol]]);
                    subgroups.push({ gid: newGid, items: subgroup });
                    break;
                }
                if (toVisit) break;
            }
            group = this.reduceArray(group);
        }

        return subgroups;
    }
    static getSubGroup(group, numRows, numCols, toVisit) {
        let visited = [];
        let top, right, bottom, left, cellRow, cellCol, cid;
        let subgroup = Array.from({ length: numRows }, () => Array.from({ length: numCols }, () => null));

        let cidToVisit = [group[toVisit[0][0]][toVisit[0][1]]]

        while (toVisit.length > 0) {
            [cellRow, cellCol] = toVisit.pop();
            cid = group[cellRow][cellCol];
            visited.push(cid);
            group[cellRow][cellCol] = null;
            subgroup[cellRow][cellCol] = cid;

            if (cellRow != 0) {
                top = [cellRow - 1, cellCol];
                cid = group[top[0]][top[1]];

                if (cid && !visited.includes(cid) && !cidToVisit.includes(cid)) {
                    toVisit.push(top);
                    cidToVisit.push(cid);
                }
            }
            if (cellCol != numCols - 1) {
                right = [cellRow, cellCol + 1];
                cid = group[right[0]][right[1]];

                if (cid && !visited.includes(cid) && !cidToVisit.includes(cid)) {
                    toVisit.push(right);
                    cidToVisit.push(cid);
                }
            }
            if (cellRow != numRows - 1) {
                bottom = [cellRow + 1, cellCol];
                cid = group[bottom[0]][bottom[1]];

                if (cid && !visited.includes(cid) && !cidToVisit.includes(cid)) {
                    toVisit.push(bottom);
                    cidToVisit.push(cid);
                }
            }
            if (cellCol != 0) {
                left = [cellRow, cellCol - 1];
                cid = group[left[0]][left[1]];

                if (cid && !visited.includes(cid) && !cidToVisit.includes(cid)) {
                    toVisit.push(left);
                    cidToVisit.push(cid);
                }
            }
        }
        subgroup = this.reduceArray(subgroup);
        return subgroup;
    }
    static reduceArray(array) {
        array = array.filter(row => row.some(x => x !== null));
        if (array.length === 0) return [[]];
        const transposedArray = array[0].map((_, colIndex) => array.map(row => row[colIndex]));
        const reducedTransposedArray = transposedArray.filter(column => column.some(x => x !== null));
        const reducedArray = reducedTransposedArray[0].map((_, rowIndex) => reducedTransposedArray.map(column => column[rowIndex]));
        return reducedArray;
    }
}

export default BunshinTools;
