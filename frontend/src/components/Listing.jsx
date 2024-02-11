import { useContext } from 'react'
import { useNavigate } from 'react-router-dom';

import { authContext } from "@/hooks/authProvider";

import JigsawList from './JigsawList';
import ShareablesList from './ShareablesList';
import ImageCard from '@/components/submodules/ImageCard';


const Listing = ({mode}) => {
    const { listOfImages, listOfPlayables, listOfShareables, JState, pageIsLoading } = useContext(authContext);

    const navigateTo = useNavigate()
    if (pageIsLoading) { return null }
    else { if (!JState.user) { navigateTo("/")} }

    return (<>
        <div className='w-full h-max grid justify-items-center'>
            <div className='w-9/12 flex flex-wrap justify-center'>
            {listOfImages.map((imageInfo) => <ImageCard imageInfo={imageInfo} showActionMenu={(mode==="images")} key={imageInfo.imageid}/>)}
            </div>

            <div className="h-8"></div>

            {(mode==="images")
                ? <JigsawList listOfImages={listOfImages} listOfPlayables={listOfPlayables} />
                : <ShareablesList listOfImages={listOfImages} listOfShareables={listOfShareables} />
            }
        </div>
    </>)
}


export default Listing