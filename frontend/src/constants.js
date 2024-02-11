const apiUrl = import.meta.env.VITE_API_URL;
const wsUrl = import.meta.env.VITE_WS_URL;
const uiUrl = import.meta.env.VITE_UI_URL;
const s3Url = import.meta.env.VITE_S3_URL;
const minViewHt = 600
const minImageHt = 300
const minTargetHt = 300
const minNumRows = 2
const maxNumRows = 5
const imageMaxMB = 5

const DefaultJigsaws = [
    { jid: 'sp', jname: 'Treasure \u2606\u2606' },
    { jid: 'wm', jname: 'World Map' },
    { jid: 'dio', jname: 'The World \u2606\u2606' },
    { jid: 'gl', jname: 'Langur' },
]

const AfterGlows = [
    {
        id: 'red',
        cName: "afterGlowRed",
        label: "Red",
        bgColor: "#CB4335",
    },
    {
        id: 'blue',
        cName: "afterGlowBlue",
        label: "Blue",
        bgColor: "#2E86C1",
    },
    {
        id: 'green',
        cName: "afterGlowGreen",
        label: "Green",
        bgColor: "#28B463",
    },
    {
        id: 'slate',
        cName: "afterGlowSlate",
        label: "Slate",
        bgColor: "#2E4053",
    },
    {
        id: 'white',
        cName: "afterGlowWhite",
        label: "White",
        bgColor: "#FFFFFF",
    },
    {
        id: 'none',
        cName: "",
        label: "None",
        bgColor: "rgba(255, 255, 255, 0)",
    }
]

const center = "justify-self-center justify-center justify-items-center content-center items-center"
const btn_outline = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 \
            border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50 \
            h-10 px-4 py-2"


export {
    apiUrl, wsUrl, uiUrl, s3Url,
    DefaultJigsaws, AfterGlows,
    minViewHt,
    minNumRows, maxNumRows,
    minImageHt,
    minTargetHt,
    imageMaxMB,
    btn_outline
}
