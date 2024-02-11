import { useContext, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom';

import JBlock from './JCell'

import { authContext } from "@/hooks/authProvider";
import useUnitedContext from '@/hooks/UnityProvider'

import { useCookies } from 'react-cookie';

import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent,
} from "@/components/ui/context-menu"
// import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

import { AfterGlows } from '@/constants';

import { getCellblocks, getSnapshot, getShareable, postSnapshot, requestVerifyUC } from '@/requests'
import { CMOIds, getContextOptions, getOneContextOption } from '@/utils/ContextOptions'
import { clearCachedArena, getCachedArena, setCachedArena } from '@/utils/CacheUtils'

import Usage from './Usage';
import ShareableLinkDialog from '@/components/alert/ShareableLink'

import { useDrawer, toggleDrawer } from '@/hooks/use-drawer'


const pageText = <>
    <div className="text-center leading-snug">Hit spacebar to start<br/>Press [Q] for quick guide</div>
</>


const Arena = ({ showCells, setShowCells }) => {
    const { sharedKey } = useParams();
    const isShared = sharedKey !== undefined;
    const snapshotKey = isShared ? 'isShareable' : 'snapshot'

    const { toast } = useToast();
    // const {toggleDrawer} = useDrawer()

    const [cookies] = useCookies(['Authorization']);

    const [blankPageMessage, setBlankPageMessage] = useState('')
    const [cellData, setCellData] = useState([]);
    const [afterGlow, setAfterGlow] = useState("")

    const { JState, setJigsaw, refreshCellLists } = useContext(authContext);

    const jigsawIdRef = useRef(JState.currentJid)
    const showCellsRef = useRef(showCells)

    const {
        ContextSR,
        Gattai,
        Selection,
        Snapshot,
        UnionOfCells,
        triggerCompletionCheck
    } = useUnitedContext();

    useEffect(() => { if (!cookies.Authorization) {resetArena(); setShowUsage(false)}; }, [cookies.Authorization])
    useEffect(() => {
        // console.log('checkCount', UnionOfCells.checkCount);
        if (!UnionOfCells.checkCount) {return;}
        ContextSR.checkCompletion()
        .then(result => {
            if (result.ok) {
                ContextSR.setUCComplete(true, { uprightNum: result.uprightNum });
                setAfterGlow('');
                toast({
                    title: "Congratulations !",
                    description: result.sharedMessage,
                })
            } else {
                toast({
                    title: "Yelp !",
                    description: "The current matchup is not quite right",
                })
            }
        })
    }, [UnionOfCells.checkCount])

    useEffect(() => {
        // clears arena when the id of jigsaw changes. when press Spacebar the new jigsaw is loaded
        if (jigsawIdRef.current && jigsawIdRef.current != JState.currentJid && showCells && !JState.isSnapshot) { resetArena(); }
        jigsawIdRef.current = JState.currentJid
    }, [JState.currentJid])


    const [showUsage, setShowUsage] = useState(false)

    // to load cells on spacebar press
    const handleKeyDown = (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            takeSnapshot(snapshotKey)
        }
        else if (event.code === 'Space' && !showCellsRef.current) {
            loadCells();
        }
        else if (event.code === 'Tab') {
            handleTab(event);
        }
        else if (event.code === 'KeyQ') {
            setShowUsage(prev => !prev)
        }
        // else if (event.code === 'KeyM') {
        //     toggleDrawer(true)
        // }
    };

    // to save cells on ctrl+s || cmd+s
    const handleSaveShortcut = (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            takeSnapshot(snapshotKey)
        }
        else if (event.code === 'KeyQ') {
            setShowUsage(prev => !prev)
        }
    };

    useEffect(() => {
        const cachedAfterGlow = localStorage.getItem('afterGlow')
        if (!cachedAfterGlow) { setAfterGlow('') }
        else {setAfterGlow(cachedAfterGlow)}
        if (isShared) {
            loadShared();
            window.addEventListener('keydown', handleSaveShortcut);
            return () => {
                window.removeEventListener('keydown', handleSaveShortcut);
                resetArena('', {clearCache: false});
            }
        }

        else {
            const cachedData = getCachedArena();
            if (cachedData) { setFetchedData(cachedData) }
            else (
                setBlankPageMessage(pageText)
            )

            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                resetArena('', {clearCache: false});
            }
        }
    }, []);

    // to fetch cell information from backend
    const setFetchedData = (fetchedData) => {
        setJigsaw({
            jid: fetchedData.jigsawId,
            isSnapshot: fetchedData.isSnapshot
        })
        // console.log('fd' ,fetchedData)
        ContextSR.init(
            fetchedData.cmeta,
            fetchedData.s3Path,
            fetchedData.cellGroups,
            fetchedData.cellCount,
            fetchedData.shareableId? fetchedData.shareableId : fetchedData.jigsawId,
            isShared
        )

        let cellBlocks = fetchedData.cellBlocks;
        cellBlocks = cellBlocks.sort(function(a,b){
            return a.zIndex - b.zIndex;
        })
        cellBlocks.map((obj, index) => {
            obj.zIndex = index;
        })
        setCellData(cellBlocks)
        setShowCells(true)
    };

    // actions
    function loadCells() {
        if (showCells) return;
        clearCachedArena()

        getCellblocks(jigsawIdRef.current, cookies.Authorization)
        .then((fetchedData) => {
            setFetchedData(fetchedData)
        })
        .catch((error) => {
            console.log('Error:', error.message);
        })
    }

    function loadSaved(event) {
        if (showCells) return;
        clearCachedArena();

        getSnapshot(cookies.Authorization)
        .then((fetchedData) => {
            if (fetchedData.ok) { setFetchedData(fetchedData); }
            else { toast({description: 'No saved data'}) }
        })
        .catch((error) => {
            console.log('Error:', error.message);
        })
    }

    function loadShared(event) {
        if (showCells) return;

        getShareable(cookies.Authorization, sharedKey)
        .then((fetchedData) => {
            if (fetchedData.shareableId) { setFetchedData(fetchedData); }
            else {
                toast({description: 'This link is not active'});
                setBlankPageMessage('This link is not active')
            }
        })
        .catch((error) => {
            console.log('Error:', error.message);
        })
    }

    const [shareableInfo, setShareableInfo] = useState({open: false})
    function postSnapshotPlus(idToMatch, arena, authCookie, snapType) {
        postSnapshot(idToMatch, arena, authCookie, snapType)
        .then(data => {
            if (data.ok && snapType=='makeShareable') {
                refreshCellLists('shareables')
                setShareableInfo({id: data.shareableId, open: true})
            }
            if (data.ok) {
                toast({description: 'Saved'})
            }
            if (!data.ok) {
                toast({description: data.message});
            }
        })
    }

    function takeSnapshot(snapType) {
        const arena = Snapshot.collect()
        const idToMatch = snapType === 'isShareable' ? sharedKey : jigsawIdRef.current
        setTimeout(() => {
            postSnapshotPlus(idToMatch, arena, cookies.Authorization, snapType)
        }, 100)
    }

    function checkCompletion() { triggerCompletionCheck(); }

    const resetArena = (e, resetOptions={clearCache: true}) => {
        setShowCells(false)
        setBlankPageMessage(pageText)

        if (resetOptions.clearCache) {
            clearCachedArena()
        }

        setCellData([])
        setAfterGlow("")

        Selection.clear()
        ContextSR.reset()
    }
    // actions

    // ***menu options
    const optionHandlersMapping = {
        loadCells,
        loadSaved,
        takeSnapshot: () => takeSnapshot(snapshotKey),
        makeShareable: () => takeSnapshot('makeShareable'),
        setAfterGlow: (val) => {setAfterGlow(val); localStorage.setItem('afterGlow', val)},
        checkCompletion,
        resetArena
    }

    const [contextOptions, setContextOptions] = useState([]);
    useEffect(() => {
        let options = [];
        if (!showCells) { options.push(CMOIds.loadCells) }
        if (JState.user && !isShared && !showCells) options.push(CMOIds.loadSaved)
        if (showCells && (JState.user || isShared)) options.push(CMOIds.takeSnapshot)
        if (showCells && JState.user && !isShared) options.push(CMOIds.makeShareable)
        if (showCells) options.push(CMOIds.setAfterGlow)
        if (showCells && !isShared) options.push(CMOIds.resetArena)

        setContextOptions(getContextOptions(options, optionHandlersMapping))

        showCellsRef.current = showCells;

    }, [showCells]);

    function checkGroupCount(isOpen) {
        if (!isOpen) return

        if (Gattai.getGroupCount() === 1) {
            if (!contextOptions.some(obj => obj.id === CMOIds.checkCompletion)) {
                const optionCheckCompletion = getOneContextOption(
                    CMOIds.checkCompletion,
                    optionHandlersMapping[CMOIds.checkCompletion]
                )
                setContextOptions((presentOptions) => [...presentOptions, optionCheckCompletion])
            }
        } else {
            setContextOptions(presentOptions => presentOptions.filter(option => option.id !== CMOIds.checkCompletion))
        }
    }
    // ***menu options

    // *** tab focus
    const focusRef = useRef(null);
    const handleTab = (event) => {
        Selection.clear()
        event.preventDefault()

        let nextFocusIndex = 0;
        const singleCells = Gattai.getSingles();
        if (singleCells.length === 0) {
            return;
        }
        if (focusRef.current && singleCells.includes(focusRef.current)) {
            nextFocusIndex = nextFocusIndex + singleCells.indexOf(focusRef.current) + 1;
        }
        const nextFocusCid = singleCells[nextFocusIndex % singleCells.length];
        document.getElementById(nextFocusCid).focus();
        focusRef.current = nextFocusCid;
    }
    // *** tab focus

    const clearselection = (e) => { Selection.clear() }

    const oMD = (e) => { if (e.target.closest('.CellBlock')==null) { Selection.clear() } }

    return (
        <>
            {/* DndSpace: required for Draggable to work - position (relative or absolute), width, and height */}
            <div
                className='w-full grow relative z-10'
                id='DnDSpace'
                onMouseDown={oMD}
                onKeyDown={(e) => (!e.shiftKey) ? clearselection : null}
                onContextMenu={oMD}
            >
                <ContextMenu onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        return
                    }
                    checkGroupCount(isOpen)
                }}>
                    <ContextMenuTrigger>
                        <div className='w-full h-full grow relative z-10'>
                            <Usage showUsage={showUsage}/>
                            {!showCells
                            ?
                            <div className='w-full h-full grid justify-items-center items-center text-5xl text-slate-400'>{blankPageMessage}</div>
                            :null
                            }
                            {showCells && cellData.map((cellUnit) => (
                                <JBlock key={cellUnit.cid}
                                    blockProps={cellUnit}
                                    afterGlow={afterGlow}
                                />
                            ))}
                        </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-44">
                        {contextOptions.map(option => {
                            if (option.type === 'submenu') {
                                return (
                                    <ContextMenuSub key={option.id}>
                                        <ContextMenuSubTrigger>{option.text}</ContextMenuSubTrigger>
                                        <ContextMenuSubContent>
                                            {
                                                AfterGlows.map((glow, index) => {
                                                    const borderStyle = glow.label === 'None'? '' : '1px solid black'
                                                    return (
                                                    <ContextMenuItem key={glow.id} onSelect={() => option.onclick(glow.cName)}>
                                                        {glow.label}<ContextMenuShortcut><div style={{ width: '15px', height: '15px', backgroundColor: glow.bgColor, border: borderStyle }}></div></ContextMenuShortcut>
                                                    </ContextMenuItem>
                                                )})
                                            }
                                        </ContextMenuSubContent>
                                    </ContextMenuSub>
                                )
                            }
                            return (
                                <ContextMenuItem key={option.id} onSelect={option.onclick}>
                                    {option.text}
                                    <ContextMenuShortcut>{option.shortcut}</ContextMenuShortcut>
                                </ContextMenuItem>
                            )
                        })}
                    </ContextMenuContent>
                </ContextMenu>
            </div >
            {/* <ChangeImage /> */}
            <ShareableLinkDialog shareableInfo={shareableInfo} setShareableInfo={setShareableInfo}/>
        </>
    )
}

export default Arena