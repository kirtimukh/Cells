import { useContext, useEffect, useState } from 'react'
import { useCookies } from 'react-cookie';

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input, EncasedTextInput } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogDescription } from '@radix-ui/react-dialog'

import { cn } from "@/lib/utils"
import { evaluateFile } from '@/utils/ImageFileUtils'
import { minNumRows, maxNumRows, minTargetHt } from '@/constants';

import { postNewImage } from '@/requests'

import { authContext } from '@/hooks/authProvider';

import { useDispatch, useSelector } from 'react-redux'
import { setTitle, setImageInfo, setTargetHt, setNumRows, setNumCols, resetState } from '@/store/ImageSlice'
import { useToast } from "@/hooks/use-toast"


const minTitleLength = 5
const maxTitleLength = 12
const dialogSuffixChoices = ['!', '!!', '!', '!!', '!', '!!', '.!', '.!!']
const dialogSpacerChoices = ['', '', ' ', ' ']
const jojoOra = 'Ora'
const jojoMuda = 'Muda'

const heightUsageInfos = [
    <>This is the height of the generated puzzle</>,
    <>Click on <strong>Target height</strong> to use current browser height</>,
    <>Width and height of the image should be <strong>AT LEAST</strong> this</>,
    <>Images will be resized to fit <strong>Target height</strong></>,
]


function UploadImage({ showUForm, setShowUForm }) {
    const [cookies] = useCookies(['Authorization']);
    const {toast} = useToast();

    const { refreshCellLists, makeWsConn } = useContext(authContext);

    const [message, setMessage] = useState('')

    const uploadedImage = useSelector((state) => state.uploadedImage)
    const dispatch = useDispatch()

    const onOpenChange = () => {if (showUForm) {dispatch(resetState()); setShowUForm(false)}}

    // title field & jojo text
    const [jojoText, setJojoText] = useState('')
    const [titleIsValid, setTitleIsValid] = useState(true)
    const verifyTitle = (title) => {
        let isValid = true
        if (title.length < minTitleLength && title.length > 0) {
            isValid = false
        } else if (title.length > maxTitleLength) {
            isValid = false
        } else if (!/^[a-zA-Z0-9]*$/.test(title)) {
            isValid = false
        }
        setTitleIsValid(isValid)
        return isValid
    }

    const handleTitleFieldFocus = (e) => {
        setJojoText('')
    }
    const handleTitleFieldBlur = (e) => {
        if (!titleIsValid) {
            const randomSuffix = dialogSuffixChoices[Math.floor(Math.random() * dialogSuffixChoices.length)]
            const randomSpacer = dialogSpacerChoices[Math.floor(Math.random() * dialogSpacerChoices.length)]
            setJojoText(jojoMuda.toUpperCase() + randomSpacer + randomSuffix)
        }
    }

    const handleTitleChange = (e) => {
        if (uploadBtnDisabled) setUploadBtnDisabled(false)
        const textValue = e.target.value

        const randomSuffix = dialogSuffixChoices[Math.floor(Math.random() * dialogSuffixChoices.length)]
        const randomSpacer = dialogSpacerChoices[Math.floor(Math.random() * dialogSpacerChoices.length)]

        const isValid = verifyTitle(textValue)

        let jojoDialog = jojoOra
        if (textValue.length < minTitleLength) {
            jojoDialog = jojoMuda
        }

        if (textValue.length === 0) {
            setJojoText('')
        } else {
            setJojoText((prev) => {
                let prevLength = Math.max(prev.length, 15)
                let newLength = prevLength + 1

                if (newLength > 18) {
                    newLength = 15
                }

                let newText = prev + jojoDialog
                if (newText.length > newLength) {
                    newText = newText.slice(-newLength)
                }
                return newText + randomSpacer + randomSuffix
            })
        }

        if (textValue.length <= maxTitleLength) {
            dispatch(setTitle(e.target.value))
        }
    }

    // target height field
    const [huiIndex, setHuiIndex] = useState(0)
    const slideLeft = (e) => {
        setHuiIndex((prev) => {
            let newIndex = prev - 1
            if (newIndex < 0) {
                newIndex = heightUsageInfos.length - 1
            }
            return newIndex
        })
    }
    const slideRight = (e) => {
        setHuiIndex((prev) => {
            let newIndex = prev + 1
            if (newIndex >= heightUsageInfos.length) {
                newIndex = 0
            }
            return newIndex
        })
    }

    const handleTargetHtChange = (e) => {
        if (uploadBtnDisabled) setUploadBtnDisabled(false)
        dispatch(setTargetHt(e.target.value))
    }

    const setTargetHtDefault = (e) => {
        const arena = document.getElementById('DnDSpace')
        const arenaRect = arena.getBoundingClientRect()
        if (arena) {
            dispatch(setTargetHt(arenaRect.height))
        }
    }

    // image file field
    const [imgFile, setImgFile] = useState(null)
    const handleFileAdd = e => {
        if (e.target.files.length < 1) {
            return;
        }
        const file = e.target.files[0];
        evaluateFile(file, uploadedImage.targetInfo.targetHt, setImageState)
    }

    const setImageState = (result, imageFile) => {
        if (uploadBtnDisabled) setUploadBtnDisabled(false)
        dispatch(setImageInfo(result))
        if (result.isValid && imageFile) {
            setImgFile(imageFile)
        }
    }

    // rows and cols fields
    const handleNumRowsChange = (e) => {
        if (uploadBtnDisabled) setUploadBtnDisabled(false)
        dispatch(setNumRows(e.target.value))
    }

    const handleNumColsChange = (e) => {
        if (uploadBtnDisabled) setUploadBtnDisabled(false)
        dispatch(setNumCols(e.target.value))
    }

    // upload button
    const [uploadBtnDisabled, setUploadBtnDisabled] = useState(false)
    const handleUpload = (e) => {
        const isFormValid = titleIsValid
            && uploadedImage.imageInfo.isValid
            && uploadedImage.targetInfo.isValid
            && uploadedImage.gridInfo.isValid
        if (!isFormValid) {
            if (!uploadedImage.gridInfo.isValid) {
                // console.log('gridInfo invalid')
            }
            if (!uploadedImage.targetInfo.isValid) {
                // console.log('targetInfo invalid')
            }
            if (!uploadedImage.imageInfo.isValid) {
                // console.log('imageInfo invalid')
            }
            if (!titleIsValid) {
                // console.log('title invalid')
            }
            setMessage('All fields required')
            return
        } else {
            setUploadBtnDisabled(true)
            setMessage('Uploading now')
        }

        makeWsConn(toast);

        postNewImage(
            uploadedImage,
            imgFile,
            cookies.Authorization
        )
            .then(function (data) {
                if (data.status === 204) {
                    toast({description: 'Uploaded, building the puzzle now ...'})
                    setShowUForm(false)
                }
                else if (!data.ok) {setMessage(data.message)}
                else {setMessage("We will send a notification as soon as its done.")}
            })
            .catch(function (error) {
                setUploadBtnDisabled(false)
                setMessage(error.message)
            });
    }


    const imageFieldStyle = "flex items-center justify-center text-slate-500 font-normal rounded-md border border-slate-200 px-3 py-2 col-span-3"
    const textFieldStyle = "flex h-10 w-full rounded-md border border-slate-200 bg-white"

    return (
        <Dialog defaultOpen={false} open={showUForm} onOpenChange={onOpenChange} >
            <DialogContent className="sm:max-w-[425px]" id="uploadForm" onKeyDown={(e) => { e.stopPropagation(); }} >
                <DialogHeader>
                    <DialogTitle>Add your custom image</DialogTitle>
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
                        <div
                            className={cn(`${textFieldStyle} col-span-3 grid grid-cols-16`, uploadedImage.imageTitle && !titleIsValid && 'border-red-500')}
                        >
                            <EncasedTextInput
                                id="title"
                                placeholder={`${minTitleLength}-${maxTitleLength} letters|numbers`}
                                className={"col-span-9 focus-visible:outline-none"}
                                minLength={`${minTitleLength}`}
                                value={uploadedImage.imageTitle}
                                onChange={handleTitleChange}
                                onFocus={handleTitleFieldFocus}
                                onBlur={handleTitleFieldBlur}
                            />
                            <div className='col-span-7 content-center text-right whitespace-nowrap overflow-hidden'>
                                {jojoText}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="screen-height" className="text-right" onClick={setTargetHtDefault}>
                            Target height:
                        </Label>
                        <div className="grid col-span-3 grid-cols-4 items-center gap-4">
                            <div className="grid col-span-4 grid-cols-11 items-center text-center">
                                <Input
                                    id="screen-height"
                                    type="text"
                                    placeholder={`>${minTargetHt}`}
                                    value={uploadedImage.targetInfo.targetHt}
                                    onChange={handleTargetHtChange}
                                    className={cn(
                                        "col-span-3 focus-visible:ring-transparent",
                                        uploadedImage.targetInfo.targetHt && !uploadedImage.targetInfo.isValid && 'border-red-500'
                                    )}
                                />

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
                                    {/* </div> */}
                                </div>

                            </div>
                        </div>
                    </div>

                    <div
                        className="grid grid-cols-4 items-center gap-4"
                    >
                        <Label htmlFor="_picture" className="text-right">Select image:</Label>
                        <Label
                            htmlFor="picture"
                            className={cn(
                                imageFieldStyle,
                                uploadedImage.imageInfo.filesize && !uploadedImage.imageInfo.isValid && 'border-red-500'
                            )}
                        >
                            {uploadedImage.imageFieldText}
                        </Label>
                        <Input id="picture" type="file" className="hidden focus-visible:ring-transparent" onChange={handleFileAdd} />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="numrows" className="text-right">
                            Number of rows:
                        </Label>
                        <Input
                            id="numrows"
                            type="text"
                            className="col-span-1 focus-visible:ring-transparent"
                            placeholder={`[${minNumRows}-${maxNumRows}]`}
                            value={uploadedImage.gridInfo.numRows}
                            onChange={handleNumRowsChange}
                        />
                        <Label htmlFor="numcols" className="text-right">
                            Number of columns:
                        </Label>
                        <Input
                            id="numcols"
                            type="text"
                            className="col-span-1 focus-visible:ring-transparent"
                            placeholder={
                                `[${uploadedImage.gridInfo.minNumCols}-${uploadedImage.gridInfo.maxNumCols}]`
                            }
                            value={uploadedImage.gridInfo.numCols}
                            onChange={handleNumColsChange}
                        />
                    </div>

                </div>
                <DialogFooter>
                    <Button type="submit" variant="ghost" onClick={onOpenChange}>Cancel</Button>
                    <Button type="submit" onClick={handleUpload} disabled={uploadBtnDisabled}>Upload</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default UploadImage;