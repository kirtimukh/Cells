import { start, loadsaved, save, skey } from '../assets/images'


const startjsx = () => <img style={{ width: '17px', height: '17px' }} src={start} alt="start" />
const floppyjsx = () => <img style={{ width: '17px', height: '17px' }} src={save} alt="save" />
const loadsavedjsx = () => <img style={{ width: '17px', height: '17px' }} src={loadsaved} alt="loadsaved" />
const savejsx = () => <div className="ml-auto text-xs tracking-widest text-slate-500 flex">Cmd+<img style={{ width: '17px', height: '17px' }} src={skey} alt="loadsaved" /></div>

const contextShortcuts = {
    loadCells: startjsx(),
    loadSaved: loadsavedjsx(),
    takeSnapshot: floppyjsx(),
    setAfterGlow: '',
    checkCompletion: '',
    resetArena: ''
}

const dumbOptionHandler = (optionId) => () => console.log(`handler for ${optionId}`)


const optionLoadCells = (loadCells) => {
    return {
        id: 'loadCells',
        text: 'Load new',
        onclick: loadCells,
        shortcut: startjsx(),
        type: 'menu'
    }
}
const optionLoadSaved = (loadSaved) => {
    return {
        id: 'loadSaved',
        text: 'Load saved',
        onclick: loadSaved,
        shortcut: loadsavedjsx(),
        type: 'menu'
    }
}
const optionStoreSnapshot = (takeSnapshot) => {
    return {
        id: 'takeSnapshot',
        text: 'Save',
        onclick: takeSnapshot,
        shortcut: savejsx(),
        type: 'menu'
    }
}
const optionMakeShareable = (makeShareable) => {
    return {
        id: 'makeShareable',
        text: 'Make Shareable',
        onclick: makeShareable,
        shortcut: floppyjsx(),
        type: 'menu'
    }
}
const optionSetAfterGlow = (setAfterGlow) => {
    return {
        id: 'setAfterGlow',
        text: 'Set AfterGlow',
        onclick: setAfterGlow,
        shortcut: '',
        type: 'submenu'
    }
}
const optionCheckCompletion = (checkCompletion) => {
    return {
        id: 'checkCompletion',
        text: 'Check Completion',
        onclick: checkCompletion,
        shortcut: '',
        type: 'menu'
    }
}
const optionResetArena = (resetArena) => {
    return {
        id: 'resetArena',
        text: 'Reset Playground',
        onclick: resetArena,
        shortcut: '',
        type: 'menu'
    }

}

const CMOIds = {
    loadCells: 'loadCells',
    loadSaved: 'loadSaved',
    takeSnapshot: 'takeSnapshot',
    makeShareable: 'makeShareable',
    setAfterGlow: 'setAfterGlow',
    checkCompletion: 'checkCompletion',
    resetArena: 'resetArena'
}

const getContextOptions = (reqdOptions, optionHandlers) => {
    let contextOptions = []
    reqdOptions.forEach(optionId => {
        contextOptions.push(contextOptionsMapping[optionId](optionHandlers[optionId] || dumbOptionHandler(optionId)))
    })

    return contextOptions
}

const getOneContextOption = (optionId, optionHandler) => {
    return contextOptionsMapping[optionId](optionHandler)
}

const contextOptionsMapping = {
    loadCells: optionLoadCells,
    loadSaved: optionLoadSaved,
    takeSnapshot: optionStoreSnapshot,
    makeShareable: optionMakeShareable,
    setAfterGlow: optionSetAfterGlow,
    checkCompletion: optionCheckCompletion,
    resetArena: optionResetArena
}

export { CMOIds, getContextOptions, getOneContextOption }