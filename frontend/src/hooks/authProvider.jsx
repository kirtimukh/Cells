import { createContext, useEffect, useReducer, useState } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { useCookies } from 'react-cookie';

import { fetchUserCreds, fetchUserProfile, fetchJsList, fetchImageList, fetchShareablesList } from '@/requests';
import { getCachedArena, clearAllCaches } from '@/utils/CacheUtils';
import { apiUrl, wsUrl } from '@/constants';


export const authContext = createContext();

const ArenaPage = "/";
const ShareablesPage = "/shareables";


const jsDefaultState = {
    user: null,
    currentJid: null,
    chosenJid: null,
    showAlert: false,
    isSnapshot: false,
}

const jsDefaultCProfile = {credits: 0, images: 0, jigsaws: 0, shares: 0}

const noUser = {
    cprofile: {credits: 0, images: 0, jigsaws: 0, shares: 0},
    email: "placeholder@mail.com",
    id: "nothinghere",
    is_verified: false
}


const userUndefined = ['undefined', undefined]


const jsReducer = (state, action) => {
    switch (action.type) {
        case 'choseJigsaw':
            return { ...state, chosenJid: action.payload.jid, isSnapshot: false, showAlert: true }

        case 'setJigsaw':
            return {
                ...state,
                currentJid: action.payload.jid,
                isSnapshot: action.payload?.isSnapshot !== undefined ? action.payload.isSnapshot : false,
                showAlert: false
            }

        case 'setChosen':
            return { ...state, currentJid: state.chosenJid, chosenJid: null, showAlert: false }

        case 'setAlert':
            return { ...state, showAlert: action.payload }

        case 'setUser':
            return { ...state, user: action.payload }

        case 'setJState':
            return { ...state, ...action.payload }
        
        case 'setImagesList':
            return {...state, ...action.payload}

        default:
            return state;
    }
}


export const useAuthState = () => {
    const [cookies, removeCookie] = useCookies(['Authorization']);
    const [ws, setWs] = useState({ 'conn': null, 'count': 0 })
    const urLocation = useLocation();

    // Match against your route
    const match = matchPath("/shared/:sharedKey", urLocation.pathname);
    const sharedKey = match?.params?.sharedKey;

    const jsInitialState = {...jsDefaultState}
    const [JState, jsDispatch] = useReducer(jsReducer, jsInitialState);
    const [cProfile, setCProfile] = useState(jsDefaultCProfile)
    const [listOfPlayables, setListOfPlayables] = useState([])
    const [listOfImages, setListOfImages] = useState([])
    const [listOfShareables, setListOfShareables] = useState([])

    const createActionDispatcher = (type) => (data) => { jsDispatch({ type, payload: data }); };

    const setJigsaw = createActionDispatcher('setJigsaw');
    const choseJigsaw = createActionDispatcher('choseJigsaw');
    const setChosen = createActionDispatcher('setChosen');
    const setAlert = createActionDispatcher('setAlert');
    const setUser = createActionDispatcher('setUser');

    const [pageIsLoading, setPageIdLoading] = useState(true)

    function makeWsConn(toast) {
        if (!ws.conn) {
            const socket = new WebSocket(`${wsUrl}/ws/${JState.user.id}`);
            socket.onopen = () => {
            };
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data)
                refreshCellLists(['playables', 'images', 'shareables']);
                toast({description: 'New items are ready'})
                if (ws.count > 1) {
                    setWs(prev => ({ ...prev, count: prev.count - 1 }));
                } else {
                    socket.close();
                }
            };
            socket.onerror = (error) => {
            };
            socket.onclose = () => {
                setWs({ 'conn': null, 'count': 0 })
            };
            setWs({ conn: socket, count: 1 });
        } else {
            ws.conn.onmessage = (event) => {
                const data = JSON.parse(event.data)
                refreshCellLists(['playables', 'images', 'shareables']);
                toast({description: 'New items are ready'})
                if (ws.count > 1) {
                    setWs(prev => ({ ...prev, count: prev.count - 1 }));
                } else {
                    ws.conn.close();
                }
            };
            setWs(prev => ({ conn: ws.conn, count: prev.count + 1 }));
        }
    }

    function refreshCellLists(listToRefresh) {
        if (listToRefresh.includes("images")) {
            fetchImageList(cookies.Authorization, true).then((data) => {
                setListOfImages(data)
            })
        }
        if (listToRefresh.includes("playables")) {
            fetchJsList(cookies.Authorization, true).then((data) => {
                setListOfPlayables(data)
            })
        }
        if (listToRefresh.includes("shareables")) {
            fetchShareablesList(cookies.Authorization, true).then((data) => {
                setListOfShareables(data)
            })
        }
        fetchUserProfile(cookies.Authorization, removeCookie).then(
            data => setCProfile(data)
        )
        
    }

    async function setJState() {
        if (sharedKey) return
        const user = !userUndefined.includes(cookies.Authorization)
        ? await fetchUserCreds(cookies.Authorization, removeCookie)
        : null

        const cpdata = await fetchUserProfile(cookies.Authorization, removeCookie)
        setCProfile(cpdata)

        const jsList = await fetchJsList(cookies.Authorization)
        setListOfPlayables(jsList)

        if (user) {
            const imagesList = await fetchImageList(cookies.Authorization)
            setListOfImages(imagesList)
            const shareablesList = await fetchShareablesList(cookies.Authorization)
            setListOfShareables(shareablesList)
        }

        let currentJid = jsList.length > 0 ? jsList[0].id : null
        const cachedData = getCachedArena();
        if (cachedData) {
            currentJid = cachedData.jigsawId
        }

        jsDispatch({ type: 'setJState', payload: { user, currentJid } })
        setPageIdLoading(false)
    }

    function logoutProcessor() {
        fetch(`${apiUrl}/auth/jwt/logout`, {
            method: 'POST',
            headers: { 'Authorization': cookies.Authorization }
        })
        .then(data => {
            setUser(null)
            removeCookie('Authorization')
            setCProfile(jsDefaultCProfile)
            clearAllCaches()
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    useEffect(() => { setJState() }, [cookies.Authorization])

    function updateShareablesMessage(sid, message_of_completion) {
        setListOfShareables(prev =>
          prev.map(obj =>
            obj.id === sid ? { ...obj, message_of_completion } : obj
          )
        );
        const cacheKey = "all-shareables";
        const cachedData = JSON.parse(localStorage.getItem(cacheKey));
        const newData = cachedData.map(obj =>
            obj.id === sid ? { ...obj, message_of_completion } : obj
        )
        localStorage.setItem(cacheKey, JSON.stringify(newData));
      }

    return {
        makeWsConn, cProfile, setCProfile,
        JState, setJigsaw, choseJigsaw, setChosen, setAlert,
        setUser, listOfPlayables, listOfImages,
        listOfShareables, refreshCellLists, updateShareablesMessage,
        pageIsLoading, logoutProcessor
    };
};


export const AuthProvider = ({ children }) => {
    const contextHandlers = useAuthState();

    return (
        <authContext.Provider value={{ ...contextHandlers }}>
            {children}
        </authContext.Provider>
    );
};
