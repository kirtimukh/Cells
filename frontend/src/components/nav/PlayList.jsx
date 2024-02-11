import { useContext, useState } from 'react'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { Provider } from "react-redux"
import { uploadImageStore } from '@/store/ImageSlice'
import { authContext } from "@/hooks/authProvider";

import UploadImage from "../forms/UploadImage";


const PlayList = ({ showCells }) => {
    const { JState, choseJigsaw, setJigsaw, listOfPlayables } = useContext(authContext);

    const [showUForm, setShowUForm] = useState(false)
    const reservedNumbers = ["0", "-1"]

    const getUserConfirmation = (jid) => {
        if (jid === "0") {
            setShowUForm(true)
        }
        else if (showCells) {
            choseJigsaw({jid})
        }
        else if (!reservedNumbers.includes(jid)){
            setJigsaw({jid})
        }
        else {
        }
    }

    return (
        <>
            <Select value={JState.currentJid} onValueChange={(val) => getUserConfirmation(val)} >
                <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select Image" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {
                            listOfPlayables.map((jigsaw) => (
                                <SelectItem
                                    key={jigsaw.id}
                                    value={jigsaw.id}
                                    className='hover:bg-slate-200'
                                >
                                    {jigsaw.visibility==="open"?`\u2606 `:""}{jigsaw.title}
                                </SelectItem>
                            ))
                        }
                        {JState.user && <SelectItem value="0" className='hover:bg-slate-200'><b>Add a new image</b></SelectItem>}
                    </SelectGroup>
                </SelectContent>
            </Select>
            {JState.user && <Provider store={uploadImageStore}>
                <UploadImage
                    showUForm={showUForm}
                    setShowUForm={setShowUForm}
                />
            </Provider>}
        </>
    )
}

export default PlayList;