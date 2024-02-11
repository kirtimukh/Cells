import { useContext } from 'react'

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { DialogDescription } from '@radix-ui/react-dialog'
import { Button } from "@/components/ui/button"

import { authContext } from "@/hooks/authProvider";


export default function ChangeImage({routeNavigator}) {
    const { JState, setChosen, setAlert } = useContext(authContext);

    const cancelChange = () => {
        setAlert(false)
    }
    const continueChange = () => {
        if (JState.chosenJid) {
            setChosen()
        } else {
            routeNavigator("/shareables")
        }
        setAlert(false)
    }
    return (
        <Dialog defaultOpen={false} open={JState.showAlert} onOpenChange={cancelChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription className='text-red-600 text-sm'>
                        Your current progress will be lost if it is not saved.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={cancelChange}>Cancel</Button>
                    <Button onClick={continueChange}>Continue</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
