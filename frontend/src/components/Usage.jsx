import {useRef, useState} from 'react'
import Draggable from 'react-draggable'
import { wkey, akey, skey, dkey, zkey, cursor, num1key, num2key, rightclick, qkey } from '@/assets/images'


const Usage = ({showUsage}) => {
    const nodeRef = useRef(null);

    const styleT = "absolute min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md w-44 outline-none"
    const styleA = "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none"
    const styleB = "ml-auto text-xs tracking-widest text-slate-500 flex"

    const [xyPos, setXyPos] = useState({x:700, y:0})
    const handleOnDrag = (e, cp) => setXyPos({x: cp.x, y: cp.y})

    return (<>
    <Draggable
        defaultClassNameDragging="isDragged"
        bounds="parent"
        nodeRef={nodeRef}
        onDrag={handleOnDrag}
        position={xyPos}
    >
        <div ref={nodeRef} className={styleT} style={{zIndex: 999, display: showUsage?'block':'none'}}>

            <div className={styleA} tabIndex="-1">
                <p className="text-sm font-semibold text-slate-950">Rotate</p>
                <span className={styleB}>
                    [`]
                    <img src={num1key} alt="1" style={{width: "17px", height: "17px"}} />
                    <img src={num2key} alt="2" style={{width: "17px", height: "17px"}} />
                </span>
            </div>

            <div className={styleA} tabIndex="-1">
                <p className="text-sm font-semibold text-slate-950">Merge</p>
                <span className={styleB}>
                    <img src={wkey} alt="w" style={{width: "17px", height: "17px"}} />
                    <img src={akey} alt="a" style={{width: "17px", height: "17px"}} />
                    <img src={skey} alt="s" style={{width: "17px", height: "17px"}} />
                    <img src={dkey} alt="d" style={{width: "17px", height: "17px"}} />
                </span>
            </div>
            <div className={styleA} tabIndex="-1">
                <p className="text-sm font-semibold text-slate-950">Split</p>
                <span className={styleB}>
                    <img src={zkey} alt="d" style={{width: "17px", height: "17px"}} />
                </span>
            </div>

            <div role="separator" aria-orientation="horizontal" className="-mx-1 my-1 h-px bg-slate-200 dark:bg-slate-800"></div>

            <div className={styleA} tabIndex="-1">
                <p className="text-sm font-semibold text-slate-950">Multi-select</p>
                <span className={styleB}>
                    Shift+<img src={cursor} alt="d" style={{width: "17px", height: "17px"}} />
                </span>
            </div>

            <div className={styleA} tabIndex="-1">
                <p className="text-sm font-semibold text-slate-950">Save</p>
                <span className={styleB}>
                    Cmd+<img src={skey} alt="d" style={{width: "17px", height: "17px"}} />
                </span>
            </div>

            <div role="separator" aria-orientation="horizontal" className="-mx-1 my-1 h-px bg-slate-200 dark:bg-slate-800"></div>

            <div className={styleA} tabIndex="-1">
                <p className="text-sm font-semibold text-slate-950">More</p>
                <span className={styleB}>
                    <img src={rightclick} alt="d" style={{width: "17px", height: "17px"}} />
                </span>
            </div>

            <div className={styleA} tabIndex="-1">
                <p className="text-sm font-semibold text-slate-950">Quick guide</p>
                <span className={styleB}>
                    <img src={qkey} alt="d" style={{width: "17px", height: "17px"}} />
                </span>
            </div>

        </div>
        </Draggable>
    </>)
}

export default Usage;
