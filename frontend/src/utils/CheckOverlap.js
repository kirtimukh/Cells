const OLCOLOR = "rgb(180,180,0,0.5)";
const NOCOLOR = "transparent"


export const checkRectsOverlap = (thisRect, otherRect) => {
    // https://stackoverflow.com/questions/3269434/whats-the-most-efficient-way-to-test-if-two-ranges-overlap
    // x1 <= y2 && x2 >= y1

    const horizotalOverlap = thisRect.left <= otherRect.right && thisRect.right >= otherRect.left
    if (!horizotalOverlap) {
        return false
    }

    const verticalOverlap = thisRect.top <= otherRect.bottom && thisRect.bottom >= otherRect.top
    if (!verticalOverlap) {
        return false
    }

    return true
}


export const checkEdgeOverlap = (thisEdge, otherEdge) => {
    if (thisEdge === null || otherEdge === null) return false;
    if (checkRectsOverlap(thisEdge.getBoundingClientRect(), otherEdge.getBoundingClientRect())) {
        if (parseInt(thisEdge.getAttribute("pin")) + parseInt(otherEdge.getAttribute("pin")) === 0) {
            return true
        }
    }
    return false
}


export function colorTheEdge(cellEdge, indicatingcolor) {
    if (parseInt(cellEdge.getAttribute("pin")) == -1) {
        cellEdge.childNodes[0].style.backgroundColor = indicatingcolor
    } else if (parseInt(cellEdge.getAttribute("pin")) == 1) {
        cellEdge.style.backgroundColor = indicatingcolor
    }
}


function indicateManyOL(thisCell, allMatches, setMatches) {
    let newMatches = allMatches;

    const oldMatches = thisCell.getAttribute("data-matches").split(";")
    const noMatches = oldMatches.filter(item => !newMatches.includes(item)).filter(item => item !== "");

    noMatches.forEach((item) => {
        const oldMatch = item.split(":")[1]
        const [cid, edge] = oldMatch.split(",")
        const theEdge = document.querySelector(`[cid="${cid}"][edge="${edge}"]`)
        if (theEdge) {colorTheEdge(theEdge, NOCOLOR)}
    })

    newMatches = newMatches.join(";")
    setMatches(newMatches);
}


export const checkOverlap = (e, cId, thisRef, matchAttrRef) => {
    const thisCell = thisRef.current;
    if (thisCell==null) {return}
    const thisRect = thisCell.getBoundingClientRect();
    const otherCells = Array.from(thisRef.current.parentElement.children);

    let allMatches = []

    for (let i = 0; i < otherCells.length; i++) {
        let divId = otherCells[i].id;
        if (divId === cId) continue;

        let otherCell = otherCells[i];
        let otherRect = otherCell.getBoundingClientRect();

        const isRectsOverlap = checkRectsOverlap(thisRect, otherRect);

        if (isRectsOverlap) {
            const thisCellTopEdge = thisCell.querySelector(`[cid="${cId}"][edge="top"]`)
            const thisCellRightEdge = thisCell.querySelector(`[cid="${cId}"][edge="right"]`)
            const thisCellBottomEdge = thisCell.querySelector(`[cid="${cId}"][edge="bottom"]`)
            const thisCellLeftEdge = thisCell.querySelector(`[cid="${cId}"][edge="left"]`)

            const otherCellTopEdge = otherCell.querySelector(`[cid="${divId}"][edge="top"]`)
            const otherCellRightEdge = otherCell.querySelector(`[cid="${divId}"][edge="right"]`)
            const otherCellBottomEdge = otherCell.querySelector(`[cid="${divId}"][edge="bottom"]`)
            const otherCellLeftEdge = otherCell.querySelector(`[cid="${divId}"][edge="left"]`)

            const isTopOverlap = checkEdgeOverlap(thisCellTopEdge, otherCellBottomEdge);
            const isRightOverlap = checkEdgeOverlap(thisCellRightEdge, otherCellLeftEdge);
            const isBottomOverlap = checkEdgeOverlap(thisCellBottomEdge, otherCellTopEdge);
            const isLeftOverlap = checkEdgeOverlap(thisCellLeftEdge, otherCellRightEdge);

            let thisEdge = null;
            let otherEdge = null;
            if (isTopOverlap) {
                thisEdge = thisCellTopEdge
                otherEdge = otherCellBottomEdge
            } else if (isRightOverlap) {
                thisEdge = thisCellRightEdge
                otherEdge = otherCellLeftEdge
            } else if (isBottomOverlap) {
                thisEdge = thisCellBottomEdge
                otherEdge = otherCellTopEdge
            } else if (isLeftOverlap) {
                thisEdge = thisCellLeftEdge
                otherEdge = otherCellRightEdge
            }

            if (isTopOverlap || isRightOverlap || isBottomOverlap || isLeftOverlap) {
                colorTheEdge(otherEdge, OLCOLOR)

                let cid1 = thisEdge.getAttribute("cid")
                let edge1 = thisEdge.getAttribute("edge")
                let cid2 = otherEdge.getAttribute("cid")
                let edge2 = otherEdge.getAttribute("edge")
                const matchData = `${cid1},${edge1}:${cid2},${edge2}`

                allMatches.push(matchData)
            }
        }
    }

    indicateManyOL(thisCell, allMatches, matchAttrRef)

    return allMatches;
}
