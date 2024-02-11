import { useRef } from "react"
import { toast, useToast } from "@/hooks/use-toast"
import {
    ContextMenuItem,
    ContextMenuShortcut,
    ContextMenuGroup,
    ContextMenuLabel,
    ContextMenuSeparator,

    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent,
} from "@/components/ui/context-menu"

import { wkey, akey, skey, dkey, zkey } from '../../assets/images'

import useUnitedContext from '@/hooks/UnityProvider'


const CMItems = ({ cid, pinMatches, matches, Gattai, rotateCW }) => {
    const { zStateRef } = useUnitedContext()
    const { tempZMax } = useRef(zStateRef.current.max)
    const allMatches = matches.split(';')
    if (pinMatches.length <= 1)
        return (<>
            <ContextMenuGroup>
                <ContextMenuLabel>Rotate</ContextMenuLabel>
                <ContextMenuItem onSelect={(e) => rotateCW(e, -1)}>
                    &nbsp; &#8634;
                    <ContextMenuShortcut><strong>`</strong></ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onSelect={(e) => rotateCW(e, 1)}>
                    &nbsp; &#8635;
                    <ContextMenuShortcut>1</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onSelect={(e) => rotateCW(e, 2)}>
                    &nbsp; &#8635; x2
                    <ContextMenuShortcut>2</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuGroup>
            <ContextMenuSeparator />

            <ContextMenuSub>
                <ContextMenuSubTrigger className="text-sm font-semibold text-slate-950" >Merge</ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-44">
                    {allMatches.map((match, index) => {
                        if (match === "") { return }
                        const [thisData, matchData] = match.split(':')
                        const [matchCid, matchEdge] = matchData.split(',')
                        const edgediv = document.querySelector(`[cid="${matchCid}"][edge="${matchEdge}"]`)
                        return (
                            <ContextMenuItem
                                key={match}
                                onSelect={(e) => {
                                    let res = Gattai.gattai(match);
                                    if (!res) { toast({ description: 'Invalid combination' }) }
                                }}
                                onMouseOver={(e) => showSelection(edgediv, true, tempZMax)}
                                onMouseOut={(e) => showSelection(edgediv, false, tempZMax)}
                            >
                                <div className='h-full w-full'>Match {index + 1}</div>
                            </ContextMenuItem>
                        )
                    })}
                </ContextMenuSubContent>
            </ContextMenuSub>

            {/* <ContextMenuItem onSelect={(e) => e.preventDefault()}>
                <p className='text-sm font-semibold text-slate-950'>Merge</p>
                <ContextMenuShortcut className='flex'>
                    <img style={{ width: '17px', height: '17px' }} src={wkey} alt="w" />
                    <img style={{ width: '17px', height: '17px' }} src={akey} alt="a" />
                    <img style={{ width: '17px', height: '17px' }} src={skey} alt="s" />
                    <img style={{ width: '17px', height: '17px' }} src={dkey} alt="d" />
                </ContextMenuShortcut>
            </ContextMenuItem> */}
            <ContextMenuItem onSelect={(e) => Gattai.bunshin(cid)}>
                <p className='text-sm font-semibold text-slate-950'>Split</p>
                <ContextMenuShortcut>
                    <img style={{ width: '17px', height: '17px' }} src={zkey} alt="d" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        </>)

    else return (
        pinMatches.map((match, index) => {
            if (match === "") { return }
            const [thisData, matchData] = match.split(':')
            const [matchCid, matchEdge] = matchData.split(',')
            const edgediv = document.querySelector(`[cid="${matchCid}"][edge="${matchEdge}"]`)
            return (
                <ContextMenuItem
                    key={match}
                    onSelect={(e) => {
                        let res = Gattai.gattai(match);
                        if (!res) { toast({ description: 'Invalid combination' }) }
                    }}
                    onMouseOver={(e) => showSelection(edgediv, true, tempZMax)}
                    onMouseOut={(e) => showSelection(edgediv, false, tempZMax)}
                >
                    <div className='h-full w-full'>Match {index + 1}</div>
                </ContextMenuItem>
            )
        })
    )
}

function showSelection(edgediv, highlight, tempZMax) {
    let color, zIndex;
    if (highlight) {
        color = "rgb(100,255,100,0.5)"
        zIndex = tempZMax + 1;
    } else {
        color = "rgb(180,180,0,0.5)"
        zIndex = 0;
    }

    if (parseInt(edgediv.getAttribute("pin")) == -1) {
        edgediv.childNodes[0].style.backgroundColor = color
        edgediv.childNodes[0].style.zIndex = zIndex
    } else if (parseInt(edgediv.getAttribute("pin")) == 1) {
        edgediv.style.backgroundColor = color
        edgediv.style.zIndex = zIndex
    }
}

export default CMItems
