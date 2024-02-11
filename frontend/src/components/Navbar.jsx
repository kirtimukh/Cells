import { useContext } from 'react'
import { useNavigate, useLocation, matchPath } from 'react-router-dom';

import { authContext } from "@/hooks/authProvider";

import ProfileMenu from '@/components/nav/ProfileMenu'
import PlayList from '@/components/nav/PlayList'


const ArenaPage = "/";
const ImagesPage = "/images"
const ShareablesPage = "/shareables";


const Navbar = ({ showCells }) => {
    const { JState } = useContext(authContext);
    const urLocation = useLocation();

    const isSharedPage = matchPath("/shared/:sharedKey", urLocation.pathname);

    const routeNavigator = useNavigate()

    const handleClick = (newPage) => {
        // setCurrentPage({currentPage: newPage});
        routeNavigator(newPage)
    }

    const activePageUnderline = "underline decoration-2 decoration-green-500"

    return (

    <nav className="flex items-center justify-between py-2 px-6 w-full flex-none" id='navbar'>

    <div className="flex items-center basis-full">
        <div className="text-slate-900 font-semibold text-lg py-2">Cells</div>
        <span className="w-2"></span>
        <div className='w-0'>
        {urLocation.pathname === ArenaPage ? <PlayList showCells={showCells} /> : null}
        </div>
    </div>

    {
        isSharedPage
        ?
        null
        :
        <div className="flex justify-center basis-full">
            
            {JState.user && <div className="text-slate-900 text-md" onClick={() => {
                handleClick(ImagesPage)
            }}>
                <p className={urLocation.pathname === ImagesPage ? activePageUnderline : ""}>Images</p>
            </div>}

            <span className="w-5"></span>

            {JState.user && <div className="text-slate-900 text-md" onClick={() => {
            handleClick(ArenaPage)
            }}>
                <p className={urLocation.pathname === ArenaPage ? activePageUnderline : ""}>Arena</p>
            </div>}

            <span className="w-5"></span>

            {JState.user && <div className="text-slate-900 text-md" onClick={() => {
                handleClick(ShareablesPage)
            }}>
                <p className={urLocation.pathname === ShareablesPage ? activePageUnderline : ""}>Shares</p>
            </div>
            }
        </div>
    }

    {
        isSharedPage
        ?
        <div className="basis-full justify-end flex">press [Q] for quick guide</div> 
        :
        <div className="basis-full justify-end flex">
            <ProfileMenu />
        </div> 
    }

    </nav>

    );
};

export default Navbar;
