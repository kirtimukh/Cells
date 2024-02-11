import { useContext } from 'react';
import { useCookies } from 'react-cookie';

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { DialogDescription } from '@radix-ui/react-dialog'
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

import { postDeleteImage, postDeleteJigsaws, postDeleteShareables } from "@/requests"
import { authContext } from '@/hooks/authProvider';


const objType_actionMsg_Map = {
    'image': "All jigsaws and shareables created from this image will also be deleted.",
    'shareables': "This action cannot be reverted.",
    'jigsaws': "This action cannot be reverted.",
}


export default function ConfirmDelete({objIds, displayAlert, setDisplayAlert, objType}) {
    const { refreshCellLists } = useContext(authContext);
    const [cookies] = useCookies(['Authorization']);
    const { toast } = useToast()

    const cancelChange = () => {
        setDisplayAlert(false)
    }

    const continueChange = () => {
        let requestFunc;
        if (objType === 'image') { requestFunc = postDeleteImage }
        else if (objType === 'shareables') { requestFunc = postDeleteShareables }
        else if (objType === 'jigsaw') { requestFunc = postDeleteJigsaws }

        requestFunc(cookies.Authorization, objIds)
        .then(function (data) {
            if (!data.ok) { 
                // console.log('delete failed') 
            }
            else {
                refreshCellLists(['images', 'playables', 'shareables'])
                toast({description: 'Deleted'})
            }
            setDisplayAlert(false)
        })
        .catch(function (error) {
            console.error('Error:', error);
        });
    }

    return (
        <Dialog defaultOpen={false} open={displayAlert} onOpenChange={cancelChange}>
            <DialogContent className="sm:max-w-[425px]" id="loginForm">
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription className='text-red-600 text-sm'>
                        {objType_actionMsg_Map[objType]}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button variant="outline" onClick={cancelChange}>Cancel</Button>
                    <Button onClick={continueChange}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
