import { useContext, useEffect, useState } from 'react'
import { useCookies } from 'react-cookie';

import { authContext } from "@/hooks/authProvider";

import { apiUrl } from '@/constants';

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import apiClient from '@/interceptors'

import { Label } from "@/components/ui/label"
import { DialogDescription } from '@radix-ui/react-dialog'
import { useToast } from "@/hooks/use-toast"

import { cn } from "@/lib/utils"


function ProfileInfo({ showProfile, setShowProfile }) {
    const [cookies, setCookie] = useCookies(['Authorization']);
    const {toast} = useToast()
    const { JState, cProfile } = useContext(authContext)

    const onOpenChange = () => {
        setShowProfile(false)
    }

    const [message, setMessage] = useState('')

    const requestVerificationEmail = () => {
        apiClient.post(`${apiUrl}/auth/verify-me`, {}, {
            headers: { Authorization: cookies.Authorization }
        })
        .then(response => {
            const data = response.data
            toast({ description: data.message })
        })
        .catch((error) => { console.error('Error:', error); });
    }

    const [displayGetMore, setGetMoreDisplay] = useState(false)
    const [displayAck, setAckDisplay] = useState(false)

    const getMore = () => { setGetMoreDisplay(true) }

    const rowStyles = "grid grid-cols-12 items-center gap-2"
    const labelStyles = "text-right col-span-2"
    const dataStyles = "col-span-6 text-sm text-left"
    const badgeStyle = "text-xs text-center col-span-3 border rounded-sm"

    
    if (!JState.user) {
        return
    }
    return (<>
        <Dialog defaultOpen={false} open={showProfile} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]" id="loginForm">
                <DialogHeader>
                    <DialogTitle>Profile</DialogTitle>
                    <DialogDescription
                        className='text-red-600 text-sm'
                    >
                        {message}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className={rowStyles}>
                        <Label htmlFor="email" className={labelStyles}>
                            Email:
                        </Label>
                        <p className={dataStyles}>&nbsp;{JState.user.email}</p>
                        <span></span>
                        {
                            cProfile.is_verified
                            ?
                            <p className={badgeStyle}>Verified</p>
                            :
                            <p className={cn(badgeStyle, 'hover:bg-slate-300')} onClick={requestVerificationEmail}>Verify now</p>
                        }
                    </div>
                    <div className={rowStyles}>
                        <Label htmlFor="balance-credits" className={labelStyles}>
                        Credits:
                        </Label>
                        {/* <p className={dataStyles}>&nbsp;</p> */}
                        <p className={dataStyles}>&nbsp;{cProfile.credits}</p>
                        <span></span>
                        <p className={cn(badgeStyle, 'hover:bg-slate-300')} onClick={getMore}>Get more</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="submit" variant="ghost" onClick={onOpenChange}>Close</Button>
                    {/* <Button type="submit" onClick={(e) => console.log(e)}>Login</Button> */}
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <GetMore displayGetMore={displayGetMore} setGetMoreDisplay={setGetMoreDisplay} displayAck={displayAck} setAckDisplay={setAckDisplay} />
        </>
    )
}


function GetMore ({displayGetMore, setGetMoreDisplay, displayAck, setAckDisplay}) {
    const [cookies, setCookie] = useCookies(['Authorization']);

    async function postPaymentInterest(haveInterest) {
        return apiClient({
            method: 'post',
            url: `${apiUrl}/profile/buy-credits`,
            data: {haveInterest},
            headers: { 'Authorization': cookies.Authorization }
        })
            .then(response => { return response.data })
            .catch((error) => { console.error('Error:', error); });
    }

    function handleClickYes(e) {
        postPaymentInterest(true).then(() => {});
        setAckDisplay(true);
        setGetMoreDisplay(false);
    }
    function handleClickNo(e) {
        postPaymentInterest(false).then(() => {});
        setGetMoreDisplay(false);
    }

    return (
        <>
        <Dialog defaultOpen={false} open={displayGetMore} onOpenChange={setGetMoreDisplay}>
            <DialogContent className="sm:max-w-[425px]" id="paymentForm">
                <DialogHeader>
                    <DialogTitle>Buy more credits</DialogTitle>
                    <DialogDescription
                        className='text-red-600 text-sm'
                    >
                    </DialogDescription>
                </DialogHeader>
                <div className="text-sm">
                    Do you want to spend real money to use more of Cells?
                </div>

                <DialogFooter>
                    <Button type="submit" variant="ghost" onClick={handleClickNo}>No</Button>
                    <Button type="submit" variant="ghost" onClick={handleClickYes}>Yes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Acknowledgement displayAck={displayAck} setAckDisplay={setAckDisplay} />

        </>
    )
}


function Acknowledgement({displayAck, setAckDisplay}) {
    return (
        <Dialog defaultOpen={false} open={displayAck} onOpenChange={setAckDisplay}>
            <DialogContent className="sm:max-w-[425px]" id="paymentForm">
                <DialogHeader>
                    <DialogTitle>Glad to know!</DialogTitle>
                    <DialogDescription
                        className='text-red-600 text-sm'
                    >
                    </DialogDescription>
                </DialogHeader>
                <div className="text-sm">
                    Thank you for your interest. We will send a notification to you when the service is ready. 
                </div>

                <DialogFooter>
                    <Button type="submit" variant="ghost" onClick={() => setAckDisplay(false)}>Ok</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default ProfileInfo;
