import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Outlet } from 'react-router-dom';

import './App.css'
import Navbar from "./components/Navbar";
import Arena from "./components/Arena";
import Listing from "@/components/Listing"
import Footer from "@/components/Footer"

import { AuthProvider } from '@/hooks/authProvider'
import { UnityProvider } from './hooks/UnityProvider';
// import { GeneralProvider } from './hooks/GeneralProvider';

import ChangeImage from "@/components/alert/ChangeImage";

import { Toaster } from "@/components/ui/toaster"


function Layout({ navbarProps }) {
  return (<><Navbar {...navbarProps} /><Outlet/><Toaster /><Footer /></>);
}

function ArenaPage({homeProps}) {
  return (<><UnityProvider><Arena {...homeProps} /></UnityProvider><ChangeImage /></>)
}

function ListingPage({listMode}) {
  return (<Listing mode={listMode}/>)
}

function SharedPage({homeProps}) {
  return (<UnityProvider><Arena {...homeProps} /></UnityProvider>)
}


function SlashCleaner() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { pathname, search, hash } = location;
    if (pathname !== "/" && pathname.endsWith("/")) {
      navigate(pathname.slice(0, -1) + search + hash, { replace: true });
    }
  }, [location]);

  return null;
}


function App() {
  const [showCells, setShowCells] = useState(false)

  const showCellProps =  { showCells, setShowCells }
  const navbarProps = { showCells }

  const handleKeyDown = ((event) => {
    if (event.code === "Tab") {
      event.preventDefault();
    }
  })

  const [windowOkay, setWindowOkay] = useState(false)
  if (!windowOkay && window.innerHeight >= 500 && window.innerWidth >= 500) {
    setWindowOkay(true)
  }


  return (
    <>
      {!windowOkay && (
        <div className="flex justify-center items-center h-screen w-screen">
          <h1 className="text-2xl">Please resize the window to at least 500x500</h1>
        </div>
      )}
      {windowOkay && (
        <div className="flex flex-col h-screen w-screen" id="appContainer" onKeyDown={handleKeyDown}>
          <BrowserRouter>
          <SlashCleaner />
          <AuthProvider>
            <Routes>
              <Route element={<Layout navbarProps={navbarProps}/>}>
                <Route path="/" element={<ArenaPage homeProps={showCellProps}/>} />
                <Route path="/images" element={<ListingPage listMode={"images"}/>} />
                <Route path="/shareables" element={<ListingPage listMode={"shareables"} />} />
                <Route path="/shared/:sharedKey" element={<SharedPage homeProps={showCellProps} />} />
              </Route>
            </Routes>
          </AuthProvider>
          </BrowserRouter>
        </div>
      )}
    </>
  )
}

export default App
