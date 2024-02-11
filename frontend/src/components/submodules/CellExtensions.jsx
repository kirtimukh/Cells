import { memo, useEffect, useMemo, useState } from 'react'

import useUnitedContext from '@/hooks/UnityProvider'

import { fetchCellImage } from '@/requests'

import { getExtenders } from '@/utils/ArenaUtils';
import { getSvgPath, svgColors } from '@/utils/SVGUtils'


const CSCacher = (_cellData) => {
    sessionStorage.setItem(`cachedCell_`+_cellData.cid, JSON.stringify(_cellData))
}

const getRandomColor = () => {
    return Math.floor(Math.random() * svgColors.length)
}


const csReducer = (state, action) => {
    switch (action.type) {
        case 'setZIndex':
            return { ...state, zIndex: action.payload }
        case 'setPosition':
            return { ...state, position: action.payload }
        case 'updateRnum':
            const rotateBy = action.payload
            return { ...state, rnum: (state.rnum + rotateBy + 4) % 4 }
        case 'setHeadsNTransform':
            return { ...state, heads: action.payload.heads, transform: action.payload.transform }
        default:
            return state
    }
}


const JCell = memo(({ cid, filename, heads, transform, inFocus }) => {
    const { cMeta, s3Path, Dock } = useUnitedContext();
    const [dockState, setDockState] = useState(Dock.getDockState(cid))
    useEffect(() => {
        Dock.addSetter(cid, setDockState);
        fetchCellImage(s3Path, filename).then(data => setCellImage(data));
    }, [])
    const extenders = useMemo(() => getExtenders(heads, cid, cMeta, dockState), [heads, dockState])

    const [cellImage, setCellImage] = useState('')

    return (
        cellImage
        ?
        <>
            <img
                src={cellImage}
                draggable="false"
                alt={cid}
                id={filename}
                className={`absolute origin-top-left hover:border hover:border-dashed hover:border-black ${inFocus? 'border border-dashed border-black' : ''}`}
                style={{
                    zIndex: 1,
                    transform: transform,
                }}
            />
            {extenders[0]}
            {extenders[1]}
            {extenders[2]}
            {extenders[3]}
        </>
        :
        null
    )
})


const JSvg = ({ heads, style }) => {
    const maxFlickerCount = 10
    
    const [flickerState, setFlickerState] = useState({
        colorIndex: getRandomColor(),
        count: 0
    })

    const { cMeta, resetCompletion } = useUnitedContext();

    const svgPath = useMemo(() => getSvgPath(heads, cMeta), [])

    useEffect(() => {
        if (flickerState.count < maxFlickerCount) {
            const timer = setTimeout(() => {
                setFlickerState((prevState) => ({
                    colorIndex: getRandomColor(),
                    count: prevState.count + 1
                }))
            }, 80)
            return () => clearTimeout(timer);

        } else if (flickerState.count >= maxFlickerCount) {
            resetCompletion();
        }

    }, [flickerState.count])

    return (
        <>
            <div style={{
                ...style,
                position: 'absolute',
            }}>
                <svg width={style.width} height={style.height}>
                    <path d={svgPath} fill={svgColors[flickerState.colorIndex]} fillOpacity="1" />
                </svg>

            </div >

        </>
    )
}


export { JCell, JSvg, csReducer, CSCacher };
