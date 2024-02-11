import { useContext, useEffect, useReducer, useRef, useState } from 'react'
import { useCookies } from 'react-cookie';

import { authContext } from "@/hooks/authProvider";
import { postNewImage, postNewJigsaw } from "@/requests"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input, EncasedTextInput } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogDescription } from '@radix-ui/react-dialog'

import { cn } from "@/lib/utils"
import { wsUrl, minNumRows, maxNumRows, minTargetHt, btn_outline } from '@/constants';

import {evaluateFile, getImageFieldDisplayText} from '@/utils/ImageFileUtils'

import {
    verifyTitleUtil,
    initialJsState,
    newJsReducer,
    defaultImageFieldText
} from "@/components/forms/newJsFormUtils"

import { useToast } from "@/hooks/use-toast"


const minTitleLength = 5
const maxTitleLength = 12
const heightUsageInfos = [
    <>This is the height of the generated puzzle</>,
    <>Click on <strong>Target height</strong> to use current browser height</>,
    <>Width and height of the image should be <strong>AT LEAST</strong> this</>,
    <>Images will be resized to fit <strong>Target height</strong></>,
]


function getCurrentVPHeight() {
    const navbar = document.getElementById('navbar')
    const appContainer = document.getElementById('appContainer')
    const navbarRect = navbar.getBoundingClientRect()
    const appContainerRect = appContainer.getBoundingClientRect()
    return appContainerRect.height - navbarRect.height
}

const imageFieldStyleDefault = "flex items-center justify-center text-slate-500 font-normal rounded-md border border-slate-200 px-3 py-2 col-span-3"
const textFieldStyle = "flex h-10 w-full rounded-md border border-slate-200 bg-white"


function NewJigsawForm({ formFor, showJForm, setShowJForm }) {
    const [cookies] = useCookies(['Authorization']);
    const {toast} = useToast();
    const { listOfImages, refreshCellLists, makeWsConn } = useContext(authContext)

    const fileInputRef = useRef(null);

    const [message, setMessage] = useState('')

    const [newJigsaw, newJsDispatch] = useReducer(newJsReducer, initialJsState);
    const createActionDispatcher = (type) => (data) => {
        newJsDispatch({ type, payload: data });
    };
    const setNumRows = createActionDispatcher('setNumRows');
    const setNumCols = createActionDispatcher('setNumCols');
    const setTargetHt = createActionDispatcher('setTargetHt');
    const setTitle = createActionDispatcher('setTitle');
    const setImageInfo = createActionDispatcher('setImageInfo');
    const resetJForm = createActionDispatcher('resetState');

    const onOpenChange = () => {if (showJForm) {setShowJForm(false)}}

    useEffect(() => {return () => resetJForm()}, [])

    // title field & jojo text
    const [titleIsValid, setTitleIsValid] = useState(false)

    const handleTitleChange = (e) => {
        const textValue = e.target.value
        const isValid = verifyTitleUtil(textValue, setTitleIsValid)
        if (textValue.length <= maxTitleLength) {
            setTitle(e.target.value)
        }
    }

    // height-usage-infos[index]
    const [huiIndex, setHuiIndex] = useState(0)
    const slideLeft = (e) => setHuiIndex((prev) => prev - 1 < 0 ? heightUsageInfos.length - 1 : prev - 1)
    const slideRight = (e) => setHuiIndex((prev) => prev + 1 >= heightUsageInfos.length ? 0 : prev + 1)

    // target height field
    const setTargetHtDefault = (e) => setTargetHt(getCurrentVPHeight())
    const handleTargetHtChange = (e) => setTargetHt(e.target.value)

    // rows and cols fields
    const handleNumRowsChange = (e) => setNumRows(e.target.value)
    const handleNumColsChange = (e) => setNumCols(e.target.value)

    // upload button
    const createNewJigsaw = (e) => {
        const isFormValid = titleIsValid
            && newJigsaw.imageInfo.isValid
            && newJigsaw.targetInfo.isValid
            && newJigsaw.gridInfo.isValid

        if (!isFormValid) {
            // console.log('Fill all fields')
            return
        }

        if (imgFile) {
            makeWsConn(toast);
            postNewImage(newJigsaw, imgFile, cookies.Authorization)
            .then(data => {
                if (data.status === 204) {
                    toast({description: 'Uploaded, building the puzzle now ...'})
                    setShowJForm(false)
                }
                else if (!data.ok) {setMessage(data.message)}
                else {setMessage("Building the puzzle now.")}
            })
        } else { 
            makeWsConn(toast);
            const imageid = newJigsaw.imageInfo.imageid;
            const newJsData = {
                title: newJigsaw.imageTitle,
                targetHt: newJigsaw.targetInfo.targetHt,
                numRows: newJigsaw.gridInfo.numRows,
                numCols: newJigsaw.gridInfo.numCols,
            };
            postNewJigsaw(imageid, newJsData, cookies.Authorization, formFor)
            .then(data => { 
                if (!data.ok) {setMessage(data.message)}
                else {
                    toast({description: 'Building the puzzle now ...'})
                    setShowJForm(false)
                }
             })
        }
    }

    // *** Image field ***
    const [selectValueText, setSelectValueText] = useState(defaultImageFieldText)
    const [imgFile, setImgFile] = useState(null)

    const [uploadVal, setUploadVal] = useState(0)
    const openFileExplorer = () => {setUploadVal(prev => prev + 1); fileInputRef.current.click();}

    function selectImage(imageid){
        if (imageid.startsWith('<upload-')) {
            // setUploadVal(prev => prev + 1);
            openFileExplorer();
        }
        else {
            fileInputRef.current.value = ''; setImgFile();
            const imageInfo = listOfImages.filter(obj => obj.imageid === imageid)[0];
            const theText = imageInfo.visibility==="open"?`\u2606 `:"" + `${imageInfo.title}; ${imageInfo.imgWidth}x${imageInfo.imgHeight}`;
            setSelectValueText(theText);
            imageInfo.isValid = true;
            setImageInfo(imageInfo);
        }
    }

    const handleFileAdd = e => {
        if (e.target.files.length < 1) { return; }
        const file = e.target.files[0];
        evaluateFile(file, newJigsaw.targetInfo.targetHt, setImageState)
    }

    const setImageState = (result, imageFile) => {
        const theText = getImageFieldDisplayText(result);
        setSelectValueText(theText);
        setImageInfo(result);
        if (result.isValid && imageFile) { setImgFile(imageFile) }
    }

    const jsTitleContainerStyle = cn(
        `${textFieldStyle} col-span-3 grid grid-cols-16`,
        newJigsaw.imageTitle && !titleIsValid && 'border-red-500'
    );
    const jsTitleProps = {
        id: 'title',
        placeholder: `${minTitleLength}-${maxTitleLength} letters|numbers`,
        className: "col-span-9 focus-visible:outline-none",
        minLength: `${minTitleLength}`,
        value: newJigsaw.imageTitle,
        onChange: handleTitleChange,
    }
    const jsTargetHtProps = {
        id: "screen-height",
        placeholder: `>${minTargetHt}`,
        value: newJigsaw.targetInfo.targetHt,
        onChange: handleTargetHtChange,
        className: cn(
            "col-span-3 focus-visible:ring-transparent",
            newJigsaw.targetInfo.targetHt && !newJigsaw.targetInfo.isValid && 'border-red-500'
        ),
    }
    const imageFieldStyle = cn(
        imageFieldStyleDefault,
        newJigsaw.imageInfo.imgWidth && !newJigsaw.imageInfo.isValid && 'border-red-500'
    )
    const jsNumrowsProps = {
        id: "numrows",
        type: "text",
        className: "col-span-1 focus-visible:ring-transparent",
        placeholder: `[${minNumRows}-${maxNumRows}]`,
        value: newJigsaw.gridInfo.numRows,
        onChange: handleNumRowsChange,
    }
    const jsNumcolsProps = {
        id: "numcols",
        type: "text",
        className: "col-span-1 focus-visible:ring-transparent",
        placeholder: `[${newJigsaw.gridInfo.minNumCols}-${newJigsaw.gridInfo.maxNumCols}]`,
        value: newJigsaw.gridInfo.numCols,
        onChange: handleNumColsChange,
    }


    return (
        <Dialog defaultOpen={false} open={showJForm} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]" id="uploadForm">
                <DialogHeader>
                    <DialogTitle>Build a new jigsaw</DialogTitle>
                    <DialogDescription
                        className='text-red-600 text-sm'
                    >
                        {message}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                            Title
                        </Label>
                        <div className={jsTitleContainerStyle} >
                            <EncasedTextInput {...jsTitleProps} />
                            <div className='col-span-7 content-center text-right whitespace-nowrap overflow-hidden'>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="screen-width" className="text-right" onClick={setTargetHtDefault}>
                            Target height:
                        </Label>
                        <div className="grid col-span-3 grid-cols-4 items-center gap-4">
                            <div className="grid col-span-4 grid-cols-11 items-center text-center">
                                <Input {...jsTargetHtProps}/>

                                <div className='col-span-8 h-full flex relative'>
                                    <div className='w-full h-full z-0'>
                                        <p
                                            className='absolute text-xs text-slate-500 w-full verticalCenter'
                                        >
                                            {heightUsageInfos[huiIndex]}
                                        </p>
                                    </div>
                                    <div className='z-10 absolute w-full h-full'>
                                        <button
                                            className='scroll-left w-2/4 h-full'
                                            onClick={slideLeft}
                                        ></button>
                                        <button
                                            className='scroll-right w-2/4 h-full'
                                            onClick={slideRight}
                                        ></button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="picture" className="text-right">Select image:</Label>
                        <Input id="picture" type="file" ref={fileInputRef} className="hidden" onChange={handleFileAdd} />
                        <Select  onValueChange={(val) => selectImage(val)} >
                            <SelectTrigger className={imageFieldStyle}>
                                <SelectValue placeholder={newJigsaw.imageFieldText}>{selectValueText}</SelectValue>
                            </SelectTrigger>
                            <SelectContent><SelectGroup>
                                {
                                    listOfImages.map((image) => (
                                        <SelectItem
                                            className='hover:bg-slate-200 w-full'
                                            key={image.imageid}
                                            value={image.imageid}
                                            disabled={!(image.imgWidth >= newJigsaw.targetInfo.targetHt && image.imgHeight >= newJigsaw.targetInfo.targetHt)}
                                        >
                                            {image.visibility==="open"?`\u2606 `:""}{image.title}&nbsp;{image.imgWidth}x{image.imgHeight}
                                        </SelectItem>
                                    ))
                                }
                                {/* <Button variant='outline' className='w-full' onClick={openFileExplorer}>Upload</Button> */}
                                {formFor === 'shareables' ? null : <SelectItem className={btn_outline} key='upload' value={`<upload-${uploadVal}>`}>Upload</SelectItem>}
                                
                            </SelectGroup></SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="numrows" className="text-right">
                            Number of rows:
                        </Label>
                        <Input {...jsNumrowsProps} />
                        <Label htmlFor="numcols" className="text-right">
                            Number of columns:
                        </Label>
                        <Input {...jsNumcolsProps} />
                    </div>

                </div>
                <DialogFooter>
                    <Button type="submit" variant="ghost" onClick={onOpenChange}>Cancel</Button>
                    <Button type="submit" onClick={createNewJigsaw}>Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default NewJigsawForm;