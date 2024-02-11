import { createContext, useContext, useReducer, useRef, useState } from 'react';
import {
    getLocalIndices,
    setGroupPosition,
    rotateGroup,
    positionCellInGroup,
    updateSingleCells
} from '../utils/UCUtils';
import GattaiTools from '../utils/UCGattai';
import BunshinTools from '../utils/UCBunshin';
import { rotateHeads } from '@/utils/ArenaUtils';

import { useCookies } from 'react-cookie';
import { requestVerifyUC } from '@/requests';

const UnitedContext = createContext();


const ucInitialState = {
    isComplete: false,
    checkCount: 0,
    absolutePos: { top: 0, left: 0 },
    // flickerCount: 0,
}

const ucReducer = (state, action) => {
    switch (action.type) {
        case 'setComplete':
            return { ...action.payload }
        case 'checkCompletion':
            return { ...state, checkCount: state.checkCount + 1}
        case 'resetComplete':
            return { ...state, isComplete: false}
        default:
            return state
    }
}

const initialGattai = {
    c2g: {}, // cells to groups mapping
    g2c: {},  // groups to cells mapping
    singleCells: []
}

const initialZ = {
    changeCount: 0,
    currentMax: 1,
}

const initialSS = {
    triggers: {},
    states: {},
    groups: {},
}

const UnityHandlers = () => {
    const [cookies] = useCookies(['Authorization']);

    const gattaiRef = useRef(initialGattai);

    const stateSetters = useRef({});
    const positionsRef = useRef({});
    const headsRef = useRef({});
    const selections = useRef([]);

    const zStateRef = useRef(initialZ);

    const pivotRef = useRef({});

    const SSStates = useRef(initialSS);

    const [cMeta, setCMeta] = useState({})
    const [s3Path, setS3Path] = useState("")
    const setGroups = (groupMaps) => {
        gattaiRef.current = groupMaps;
        updateSingleCells(gattaiRef);
    }

    const instanceRef = useRef({})


    const [UnionOfCells, ucDispatch] = useReducer(ucReducer, ucInitialState);
    const getAbsolutePos = () => {
        const DndSpace = document.getElementById('DnDSpace');
        const [arenaWidth, arenaHeight] = [DndSpace.offsetWidth, DndSpace.offsetHeight]
        const [jsWidth, jsHeight] = [cMeta.cw * cMeta.numcols, cMeta.ch * cMeta.numrows]
        return {
            top: (arenaHeight - jsHeight) / 2,
            left: (arenaWidth - jsWidth) / 2
        }
    }


    class ContextSR {  // context set/reset
        static init = (cMeta, s3Path, startingGroups, cellCount, instanceId, isShared) => {
            // console.log(94, instanceId, isShared)
            setCMeta(cMeta)
            setS3Path(s3Path)
            setGroups(startingGroups)
            zStateRef.current.currentMax = cellCount - 1;
            instanceRef.current = {instanceId, isShared}
        }

        static reset = () => {
            setCMeta({})
            setS3Path("")
            gattaiRef.current = initialGattai;
            SSStates.current = initialSS;
            zStateRef.current.currentMax = {
                changeCount: 0,
                currentMax: 1,
            };
            pivotRef.current = {}
            ContextSR.setUCComplete(false);
        }

        static addManager = (
            cid,
            csDispatch,
            setSelection,
        ) => {
            stateSetters.current[cid] = {
                csDispatch, setSelection
            }
        }

        static addPosition = (cid, position) => {
            positionsRef.current[cid] = position;
        }

        static setUCComplete = (isComplete, options = { uprightNum: 0 }) => {
            let absolutePos = { top: 0, left: 0 }
            if (isComplete) {
                absolutePos = getAbsolutePos();
                if (options.uprightNum === 0) {
                    const gid = Object.keys(gattaiRef.current.g2c)[0]
                    Position.moveGroup(gid, absolutePos)
                } else {
                    Rotation.sync(null, options.uprightNum)
                }
            }
            ucDispatch({
                type: 'setComplete', payload: {
                    isComplete: isComplete, absolutePos: absolutePos, checkCount: UnionOfCells.checkCount
                }
            });
        }

        static async checkCompletion() {
            const arena = Snapshot.collect()
            const instanceId = instanceRef.current.instanceId;
            const isShared = instanceRef.current.isShared;
            return requestVerifyUC(instanceId, arena, cookies.Authorization, isShared)
            .then(result => {
                if (result.ok) {
                    // ContextSR.setUCComplete(true, { uprightNum: result.uprightNum })
                }
                return result
            }).catch((error) => {
                console.error("Error:", error);
            });
        }
    }


    const setZIndex = (cid, newZIndex) => {
        const csDispatch = stateSetters.current[cid].csDispatch;
        csDispatch({ type: 'setZIndex', payload: newZIndex });
    };
    const setPosition = (cid, newPosition) => {
        const csDispatch = stateSetters.current[cid].csDispatch;
        csDispatch({ type: 'setPosition', payload: newPosition });
        positionsRef.current[cid] = newPosition;
    };
    const updateRnum = (cid, newRnum) => {
        const csDispatch = stateSetters.current[cid].csDispatch;
        csDispatch({ type: 'updateRnum', payload: newRnum });
    }

    const dockSetters = useRef({});

    class Dock {
        // if 2 or more cells are grouped then block the pins
        static getDockState = (cid) => {
            const gid = gattaiRef.current.c2g[cid];
            const group = gattaiRef.current.g2c[gid];
            const [row, col] = getLocalIndices(cid, group);

            let pinGattai = [1, 1, 1, 1];

            if (row === 0) pinGattai[0] = 0;
            else if (group[row - 1][col] === null) pinGattai[0] = 0;
            if (col === group[0].length - 1) pinGattai[1] = 0;
            else if (group[row][col + 1] === null) pinGattai[1] = 0;
            if (row === group.length - 1) pinGattai[2] = 0;
            else if (group[row + 1][col] === null) pinGattai[2] = 0;
            if (col === 0) pinGattai[3] = 0;
            else if (group[row][col - 1] === null) pinGattai[3] = 0;

            return pinGattai
        }

        static addSetter = (cid, setDockState) => {
            dockSetters.current[cid] = setDockState;
        }

        static refresh = (gid) => {
            const group = gattaiRef.current.g2c[gid];
            for (let i = 0; i < group.length; i++) {
                for (let j = 0; j < group[0].length; j++) {
                    const cid = group[i][j];
                    if (cid === null) continue;
                    const dockState = Dock.getDockState(cid);
                    dockSetters.current[cid](dockState);
                }
            }
        }
    }

    class Gattai {
        static gattai = (matchingPair) => {
            const [thisCell, matchCell] = matchingPair.split(':')
            const [thisCid, thisEdge] = thisCell.split(',')
            const [matchCid, matchEdge] = matchCell.split(',')

            let c2g = gattaiRef.current.c2g;
            let g2c = gattaiRef.current.g2c;

            const thisGroupID = c2g[thisCid];
            const matchGroupID = c2g[matchCid];

            if (thisGroupID === matchGroupID) {
                // console.log('Same group');
                return;
            }

            const matchGroup = g2c[matchGroupID];
            const thisGroup = g2c[thisGroupID];

            const [matchRow, matchCol] = getLocalIndices(matchCid, matchGroup);
            const [thisRow, thisCol] = getLocalIndices(thisCid, thisGroup);

            const combinedGroup = GattaiTools.combineMatrices(
                matchGroup, thisGroup,
                [matchRow, matchCol],
                [thisRow, thisCol],
                matchEdge
            );

            if (!GattaiTools.isGroupingValid(combinedGroup, headsRef.current)) {
                // console.log('Invalid grouping');
                return false;
            }
            GattaiTools.setMergedGroup(
                combinedGroup, matchGroup,
                thisGroupID, matchGroupID, gattaiRef
            );

            const [pivotRow, pivotCol] = GattaiTools.getPivotIndices(matchEdge, thisRow, thisCol);
            const pivot = {
                pins: headsRef.current[matchCid],
                position: positionsRef.current[matchCid],
                row: pivotRow,
                col: pivotCol
            }

            setGroupPosition(
                thisGroup,
                pivot, cMeta,
                setPosition,
                headsRef.current
            );
            const largestZIndex = zStateRef.current.currentMax;
            ZIndex.syncGroup(thisGroupID, largestZIndex);

            updateSingleCells(gattaiRef);

            Dock.refresh(thisGroupID);

            if (Gattai.getGroupCount() === 1) {
                triggerCompletionCheck();
            }

            return true;
        };

        static bunshin = (targetCid) => {
            const selectedCids = selections.current;
            const c2g = gattaiRef.current.c2g;

            const targetGroupId = c2g[targetCid];

            let splitGroups = [];

            if (targetGroupId === undefined) {
                return;
            } else if (selectedCids.length <= 1) {
                splitGroups = BunshinTools.split([targetCid], targetGroupId, gattaiRef)
            } else {
                const targetCids = BunshinTools.check(selectedCids, targetGroupId, c2g);
                splitGroups = BunshinTools.split(targetCids, targetGroupId, gattaiRef);
            }

            let largestZIndex = zStateRef.current.currentMax;
            splitGroups.forEach((group, index) => {
                ZIndex.syncGroup(group.gid, largestZIndex);
                Dock.refresh(group.gid);
                largestZIndex = largestZIndex + 1;
            });
            zStateRef.current.currentMax = largestZIndex - 1;
            zStateRef.current.changeCount += splitGroups.length - 1;
            updateSingleCells(gattaiRef);
        }

        static getSingles = () => {
            return [...gattaiRef.current.singleCells];
        }

        static getGroupCount = () => {
            return Object.keys(gattaiRef.current.g2c).length;
        }
    }

    class Position {
        static sync = (movingCid, movingPosition) => {
            const gid = gattaiRef.current.c2g[movingCid];

            const cellIndices = gattaiRef.current.g2c[gid];
            const [pivotRow, pivotCol] = getLocalIndices(movingCid, cellIndices);
            const movingCPins = headsRef.current[movingCid];

            const pivot = {
                pins: movingCPins,
                position: movingPosition,
                row: pivotRow,
                col: pivotCol
            }
            setGroupPosition(
                cellIndices,
                pivot, cMeta,
                setPosition,
                headsRef.current
            );
        };

        static reposition = (thisCid, thisPins) => {
            if (pivotRef.current.cid === thisCid && !UnionOfCells.isComplete) return;
            const gid = gattaiRef.current.c2g[thisCid];

            // reposition is only applied to other cells in the same group
            // reposition() of pivot cell has no impact on its position state
            if (!gattaiRef.current.g2c[gid].length > 1) return;
            const group = gattaiRef.current.g2c[gid];

            // pivot values
            let pivotCid, pivotPins, pivotPosition;

            if (UnionOfCells.isComplete) {
                // on completion, group is moved to absolute position
                // [0][0] is the pivot cell of the group
                // when group is complete, the top and left pins of [0][0] cell will always be 0
                pivotCid = gattaiRef.current.g2c[gid][0][0];
                pivotPins = [0, null, null, 0]
                pivotPosition = UnionOfCells.absolutePos;
            } else {
                pivotCid = pivotRef.current.cid;
                pivotPins = pivotRef.current.heads;
                if (typeof pivotCid === 'undefined') {
                    return;
                }
                pivotPosition = positionsRef.current[pivotCid];
            }

            const [pivotRow, pivotCol] = getLocalIndices(pivotCid, group);
            const [thisRow, thisCol] = getLocalIndices(thisCid, group);
            const [relRow, relCol] = [thisRow - pivotRow, thisCol - pivotCol];

            setPosition(thisCid, positionCellInGroup(
                pivotPins,
                thisPins,
                [relRow, relCol],
                pivotPosition,
                cMeta
            ))
        }

        static moveGroup = (gid, newPosition) => {
            const group = gattaiRef.current.g2c[gid];
            const pivotCid = gattaiRef.current.g2c[gid][0][0];
            const pivotPins = headsRef.current[pivotCid];

            const pivot = {
                pins: pivotPins,
                position: newPosition,
                row: 0,
                col: 0
            }

            setGroupPosition(
                group,
                pivot, cMeta,
                setPosition,
                headsRef.current
            );
        }
    }

    class Rotation {
        static sync = (sourceCid, rotateBy) => {
            let gid;
            if (!sourceCid) {
                // Auto rotate when completion is confirmed.
                gid = Object.keys(gattaiRef.current.g2c)[0]
                sourceCid = gattaiRef.current.g2c[gid][0][0];
            } else {
                gid = gattaiRef.current.c2g[sourceCid];
            }
            const sourceHeads = rotateHeads(rotateBy, headsRef.current[sourceCid])

            pivotRef.current = {
                cid: sourceCid,
                heads: sourceHeads
            }

            const targetGroup = gattaiRef.current.g2c[gid];
            rotateGroup(targetGroup, rotateBy, gattaiRef, gid, updateRnum);
            Dock.refresh(gid);
        }

        static updateHead = (cid, rotation) => {
            headsRef.current[cid] = rotation;
        }
    }

    class Selection {
        static add = (cid) => {
            selections.current.push(cid);
        }
        static remove = (cid) => {
            selections.current = selections.current.filter((c) => c !== cid);
        }
        static clear = () => {
            selections.current.forEach((cid) => {
                const setSelection = stateSetters.current[cid].setSelection;
                setSelection(false);
            });
            selections.current = [];
        }
        static list = () => {
            return selections.current;
        }
    }

    class Snapshot {
        static collect = () => {
            const allTriggers = SSStates.current.triggers;
            for (const cid in allTriggers) {
                const trigger = allTriggers[cid]
                trigger((prev) => prev + 1);
            }
            return {
                states: SSStates.current.states,
                groups: gattaiRef.current
            }
        }

        static append = (cid, key, value) => {
            SSStates.current[key][cid] = value;
        }
    }

    class ZIndex {
        static sync = (currentCid, currentZ) => {
            const currentMaxZ = zStateRef.current.currentMax;
            if (currentZ === currentMaxZ && currentZ !== 1) {
                return;
            }

            const newZIndex = currentMaxZ + 1;
            zStateRef.current.currentMax = newZIndex;
            zStateRef.current.changeCount += 1;

            const gid = gattaiRef.current.c2g[currentCid];
            const cellIndices = gattaiRef.current.g2c[gid];

            for (let i = 0; i < cellIndices.length; i++) {
                for (let j = 0; j < cellIndices[0].length; j++) {
                    const cid = cellIndices[i][j];
                    if (cid === null) continue;
                    setZIndex(cid, newZIndex);
                };
            };
        };

        static syncGroup = (gid, newZIndex) => {
            const cellIndices = gattaiRef.current.g2c[gid];

            for (let i = 0; i < cellIndices.length; i++) {
                for (let j = 0; j < cellIndices[0].length; j++) {
                    const cid = cellIndices[i][j];
                    if (cid === null) continue;
                    setZIndex(cid, newZIndex);
                };
            };
        };
    }

    class CellMan {
        static gattai = Gattai.gattai;
        static bunshin = Gattai.bunshin;
        static syncPosition = Position.sync;
        static reposition = Position.reposition;
        static syncRotation = Rotation.sync;
        static updateHead = Rotation.updateHead;
        static syncZIndex = ZIndex.sync;
    }


    class ArenaMan {
        static clearSelection = Selection.clear;
        static collectSnapshot = Snapshot.collect;
        static getSingleCells = Gattai.getSingles;
        static getGroupCount = Gattai.getGroupCount;
    }

    const triggerCompletionCheck = () => {
        ucDispatch({
            type: 'checkCompletion', payload: {}
        });
    }

    const resetCompletion = () => {
        ucDispatch({
            type: 'resetComplete', payload: {}
        });
    }


    return {
        CellMan,
        ContextSR,
        cMeta, s3Path,
        Gattai,
        Selection,
        Snapshot,
        Dock,
        UnionOfCells,
        triggerCompletionCheck,
        resetCompletion,

        zStateRef
    };
};


export const UnityProvider = ({ children }) => {
    const handlers = UnityHandlers();
    return (
        <UnitedContext.Provider value={{ ...handlers }}>
            {children}
        </UnitedContext.Provider>
    );
};


const useUnitedContext = () => {
    const UnityHandlers = useContext(UnitedContext);
    if (!UnityHandlers) {
        throw new Error('UnitedContext must be used within a UnityProvider');
    }
    return UnityHandlers;
};


export default useUnitedContext;
