import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import Draggable from 'react-draggable';
import { debounce } from '../utils/GeneralUtils';
import { checkOverlap, colorTheEdge } from '../utils/CheckOverlap';
import useUnitedContext from '../hooks/UnityProvider'

import { useToast } from "@/hooks/use-toast";
import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
} from "@/components/ui/context-menu"
import CMItems from './nav/CMItems';

import {
    rotateHeads,
    rotateTransform,
    handleGattai,
    toggleQontext
} from '../utils/ArenaUtils';

import  { JCell, JSvg, csReducer, CSCacher } from '@/components/submodules/CellExtensions'


const debouncedCheckOverlap = debounce(checkOverlap, 200)


const JBlock = ({ blockProps, afterGlow }) => {
    const { toast } = useToast();
    const debouncedCacher = useMemo(() => debounce(CSCacher, 200), [])
    // ******* constants
    const {
        CellMan,
        Snapshot,
        ContextSR,
        Selection,
        UnionOfCells
    } = useUnitedContext();

    const cid = blockProps.cid;
    const ogHeads = structuredClone(blockProps.heads)
    const ogBlockDims = [blockProps.width, blockProps.height]

    // ******* refs
    const nodeRef = useRef(null);

    const mousePosition = useRef({ x: 0, y: 0 })
    const contextPosition = useRef({ x: 0, y: 0 })
    const contextState = useRef('closed')

    const firstRender = useRef(true);

    // ******* states
    const csInitialState = useMemo(() => {
        return {
            zIndex: blockProps.zIndex,
            position: {
                left: blockProps.left,
                top: blockProps.top
            },
            rnum: blockProps.rnum,
            heads: rotateHeads(blockProps.rnum, [...ogHeads]),
            transform: rotateTransform(blockProps.rnum, ogBlockDims),
        }
    }, [])
    const [CellState, csDispatch] = useReducer(csReducer, csInitialState);

    const setHeadsNTransform = (newHeads, newTransform) => {
        csDispatch({
            type: 'setHeadsNTransform',
            payload: { heads: newHeads, transform: newTransform }
        })
    }

    const [inFocus, setInFocus] = useState(false)
    const [isSelected, setSelection] = useState(false)
    const [matches, setMatches] = useState("")
    const [pinMatches, setPinMatches] = useState([])

    const [addToStore, setAddToStore] = useState(0)
    useEffect(() => {
        Snapshot.append(cid, 'states', {
            'zIndex': CellState.zIndex,
            'top': CellState.position.top,
            'left': CellState.position.left,
            'rnum': CellState.rnum
        })
    }, [addToStore])

    // ******* functions
    const handleCheckMatches = useCallback((event) => {
        if (event.code === 'Backquote') {
            rotateCW(event, -1)
        } else if (event.code === 'Digit1') {
            rotateCW(event, 1)
        } else if (event.code === 'Digit2') {
            rotateCW(event, 2)

        } else if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(event.code)) {
            let currentMatches = handleGattai(event, nodeRef);
            if (currentMatches.length === 0){ return }
            if (currentMatches.length === 1) {
                let res = CellMan.gattai(currentMatches[0]);
                if (!res) { toast({description: 'Invalid combination'}) }
            } else if (currentMatches.length > 1) {
                setPinMatches(currentMatches)
                toggleQontext(event, nodeRef, mousePosition, contextState, contextPosition)
            }

        } else if (event.code === 'Space') {
        }
        else if (event.code === 'KeyZ') {
            CellMan.bunshin(cid)
        }
    })

    // ******* initialise
    useEffect(() => {
        ContextSR.addManager(
            cid,
            csDispatch,
            setSelection,
        )
        ContextSR.addPosition(cid, csInitialState.position)
        Snapshot.append(cid, 'triggers', setAddToStore)

        const _cellData = {
            cid: blockProps.cid,
            filename: blockProps.filename,
            width: blockProps.width,
            height: blockProps.height,
            rnum: CellState.rnum,
            top: CellState.position.top,
            left: CellState.position.left,
            heads: blockProps.heads,
            zIndex: CellState.zIndex,
        }
        CSCacher(_cellData)
    }, [])

    // ******* z-index
    const updateZ = () => {
        CellMan.syncZIndex(cid, CellState.zIndex);
    }

    // ******* rotation
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return
        }
        const newHeads = rotateHeads(CellState.rnum, [...ogHeads])
        setHeadsNTransform(newHeads, rotateTransform(CellState.rnum, ogBlockDims))

        CellMan.reposition(cid, newHeads)
        CellMan.updateHead(cid, newHeads);
    }, [CellState.rnum])

    const rotateCW = useCallback((e, rotateBy) => {
        // 1. function is updated every time rnum changes
        // 2. function is called to rotate the cell
        // 3. each cell states are updated at individual level

        e.preventDefault() // prevent context menu closing
        CellMan.syncRotation(cid, rotateBy);
    }, [CellState.rnum])

    // ******* drag
    const handleDragStart = (e) => {
        updateZ();
        nodeRef.current.setAttribute('tabIndex', '0');
    }
    const handleDragStop = (e) => {
        nodeRef.current.setAttribute('tabIndex', '-1');
    }
    const handleOnDrag = (e, currentPosition) => {
        mousePosition.current = {
            clientX: e.clientX,
            clientY: e.clientY
        }
        CellMan.syncPosition(cid, {
            left: currentPosition.x,
            top: currentPosition.y
        });
        debouncedCheckOverlap(e, cid, nodeRef, setMatches);
    }

    // ******* selection
    const handleClick = (e) => {
        mousePosition.current = {
            clientX: e.clientX,
            clientY: e.clientY
        }
        const inSelection = isSelected;
        if (!e.shiftKey) { Selection.clear(); return }
        setSelection((prev) => {
            if (!inSelection) { Selection.add(cid) }
            else { Selection.remove(cid) }
            return !inSelection
        })
    }

    useEffect(() => {
        if (!inFocus) {
            const oldMatches = matches.split(";").filter(item => item !== "")

            oldMatches.forEach((item) => {
                const oldMatch = item.split(":")[1]
                const [cid, edge] = oldMatch.split(",")
                const theEdge = document.querySelector(`[cid="${cid}"][edge="${edge}"]`)

                if (theEdge) {colorTheEdge(theEdge, "transparent")}
            })

            setMatches("");
        }
        else {
            debouncedCheckOverlap(null, cid, nodeRef, setMatches);
        }
    }, [inFocus])

    // ******* context menu
    const onOpenChange = (isOpen) => {
        if (!isOpen) {
            contextState.current = 'closed'
            setPinMatches([])
        } else {
            contextState.current = 'open'
        }
    }

    const [cellAfterGlow, setCellAfterGlow] = useState(afterGlow)
    const handleOnFocus = (e) => {
        setInFocus(true)
        updateZ()
    }
    const handleOnBlur = (e) => {
        setInFocus(false)
    }
    useEffect(() => {
        if (inFocus) {debouncedCheckOverlap(null, cid, nodeRef, setMatches);}
    }, [CellState.rnum, CellState.position])

    useEffect(() => {
        if (isSelected) {
            setCellAfterGlow('styleOnSelected')
            return
        }
        setCellAfterGlow(afterGlow)
    }, [afterGlow, isSelected])

    useEffect(() => {
        const _cellData = {
            cid: blockProps.cid,
            filename: blockProps.filename,
            width: blockProps.width,
            height: blockProps.height,
            rnum: CellState.rnum,
            top: CellState.position.top,
            left: CellState.position.left,
            heads: blockProps.heads,
            zIndex: CellState.zIndex,
        }
        debouncedCacher(_cellData)
    }, [CellState])

    function onPointerDownOutside() {
        setInFocus(false);
    }

    if (UnionOfCells.isComplete && inFocus) {setInFocus(false)}

    if (!UnionOfCells.isComplete) {
        return (
            <>
                <Draggable
                    defaultClassNameDragging="isDragged"
                    bounds="parent"
                    nodeRef={nodeRef}
                    onStart={handleDragStart}
                    onDrag={handleOnDrag}
                    onStop={handleDragStop}
                    position={{
                        x: CellState.position.left,
                        y: CellState.position.top
                    }}
                >
                    <div
                        style={{
                            width: ogBlockDims[CellState.rnum % 2],
                            height: ogBlockDims[(CellState.rnum % 2 + 1) % 2],
                            zIndex: CellState.zIndex,
                        }}
                        className={`absolute focus:outline-none CellBlock ${cellAfterGlow}`}
                        ref={nodeRef}
                        id={cid}
                        data-matches={matches}
                        onClick={handleClick}
                        onKeyDown={handleCheckMatches}
                        onFocus={(e) => handleOnFocus(e)}
                        onBlur={(e) => handleOnBlur(e)}
                        tabIndex="-1"
                    >
                        <ContextMenu onOpenChange={onOpenChange}>
                            <ContextMenuTrigger>
                                <JCell
                                    cid={cid}
                                    filename={blockProps.filename}
                                    heads={CellState.heads}
                                    transform={CellState.transform}
                                    inFocus={inFocus}
                                />
                            </ContextMenuTrigger>
                            <ContextMenuContent className="w-44" onPointerDownOutside={onPointerDownOutside}>
                                <CMItems
                                    cid={cid} pinMatches={pinMatches} matches={matches} rotateCW={rotateCW}
                                    Gattai={{ gattai: CellMan.gattai, bunshin: CellMan.bunshin }}
                                />
                            </ContextMenuContent>
                        </ContextMenu>
                    </div>
                </Draggable >
            </>
        )
    } else {
        return (
            <JSvg cid={cid} heads={CellState.heads} style={{
                left: CellState.position.left,
                top: CellState.position.top,
                width: ogBlockDims[CellState.rnum % 2],
                height: ogBlockDims[(CellState.rnum % 2 + 1) % 2],
            }} />
        )
    }
}


export default JBlock
