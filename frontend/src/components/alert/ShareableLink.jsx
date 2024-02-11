import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { DialogDescription } from '@radix-ui/react-dialog'
import { Button } from "@/components/ui/button"

import { uiUrl } from '@/constants';


export default function ShareableLinkDialog({shareableInfo, setShareableInfo}) {
    const cancelChange = () => {
        setShareableInfo({open: false})
    }
    const continueChange = () => {
        
    }
    return (
        <Dialog defaultOpen={false} open={shareableInfo.open} onOpenChange={cancelChange}>
            <DialogContent className="sm:max-w-[425px]" id="loginForm" onPointerDownOutside={(event)=>event.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Done !</DialogTitle>
                    <DialogDescription className='text-black-600 text-sm'>
                        Here's the link:
                        <br /><a href={`${uiUrl}/shared/${shareableInfo.id}`} target="_blank" className="text-blue-600 hover:text-blue-800 underline">{`${uiUrl}/shared/${shareableInfo.id}`}</a>
                        <br />You can also view it in the <a href="/shareables" className="text-blue-600 hover:text-blue-800 underline">Shares</a> tab.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button variant="outline" onClick={() => navigator.clipboard.writeText(`${uiUrl}/shared/${shareableInfo.id}`)}>Copy link</Button>
                    <Button onClick={cancelChange}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
