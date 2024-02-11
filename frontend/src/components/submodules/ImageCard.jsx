import { useEffect, useState } from 'react'

import { downarrow } from '@/assets/images';

import ConfirmDelete from '@/components/alert/ConfirmDelete'

import { fetchThumbnailImage } from '@/requests';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"



const ImageCard = ({imageInfo, showActionMenu=false}) => {
    const [thumbImg, setThumbImg] = useState('')

    useEffect(() => {
        fetchThumbnailImage(imageInfo.thumbnail_url, imageInfo.imageid)
        .then((data) => setThumbImg(data))
    }, [])

    return (
    <>
        <div className='relative inline-block border-white border-2 w-max h-max'>
            <img className="z-0" src={thumbImg} alt="" />
            <span className="absolute right-1 bottom-1 bg-white">{imageInfo.title}</span>
            <div >
            {
                showActionMenu
                ? <ImageActionMenu imageInfo={imageInfo}/>
                : null
            }
            </div>

        </div>
        </>
    )
}


const ImageActionMenu = ({imageInfo}) => {
    const [displayAlert, setDisplayAlert] = useState(false)
    // const [showNForm, setShowNForm] = useState(false)
    const deleteImage = (imageInfo) => {
        setDisplayAlert(true)
    }

    return (<>
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="absolute right-1 top-1 bg-white w-5 place-content-center">
                    <img src={downarrow} alt="" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onSelect={deleteImage}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <ConfirmDelete objIds={[imageInfo.imageid]} displayAlert={displayAlert} setDisplayAlert={setDisplayAlert} objType="image"/>
    </>)
}


export default ImageCard;