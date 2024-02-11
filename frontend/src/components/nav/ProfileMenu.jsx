import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useContext, useState } from 'react';
import { authContext } from "@/hooks/authProvider";

import LoginForm from '@/components/forms/Login';
import RegistrationForm from '@/components/forms/Register';
import ProfileInfo from '@/components/alert/ProfileInfo';


const ProfileMenu = ({ }) => {
    const { JState, logoutProcessor } = useContext(authContext);
    const userIn = !!JState.user

    const [showLForm, setShowLForm] = useState(false)
    const [showRForm, setShowRForm] = useState(false)
    const [showProfile, setShowProfile] = useState(false)

    const showProfileInfo = () => { setShowProfile(true) }
    const logout = () => { logoutProcessor() }

    return (<>
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger>{userIn ? JState.user.email : 'Profile'}</DropdownMenuTrigger>
            <DropdownMenuContent>
                {userIn && <DropdownMenuItem onSelect={showProfileInfo}>Profile</DropdownMenuItem>}
                {userIn && <DropdownMenuItem onSelect={logout}>Logout</DropdownMenuItem>}
                {!userIn && <DropdownMenuItem onSelect={() => setShowLForm(true)}>Login</DropdownMenuItem>}
                {!userIn && <DropdownMenuItem onSelect={() => setShowRForm(true)}>Register</DropdownMenuItem>}
            </DropdownMenuContent>
        </DropdownMenu>

        <LoginForm showLForm={showLForm} setShowLForm={setShowLForm} setShowRForm={setShowRForm} />
        <RegistrationForm showRForm={showRForm} setShowRForm={setShowRForm} setShowLForm={setShowLForm} />
        {showProfile && <ProfileInfo showProfile={showProfile} setShowProfile={setShowProfile} />}
    </>)
}

export default ProfileMenu;
