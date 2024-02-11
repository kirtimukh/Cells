const validExtensions = ['jpg', 'jpeg', 'png']


import { imageMaxMB, minNumRows } from '@/constants'


const evaluateFile = (file, imageMinHt, callback) => {
    let result = {
        isValid: true,
        filename: file.name,
        filesize: `${Math.round(file.size / 1000)} kB`,
        imgWidth: null,
        imgHeight: null,
        isImage: true
    }

    const fileExtension = file.type.split('/')[1]

    let extOkay = true
    let sizeOkay = true
    let dimsOkay = true
    let ratioOkay = true

    if (!validExtensions.includes(fileExtension)) {
        result.message = 'Invalid file extension'
        extOkay = false
    }
    if (file.size > imageMaxMB * 1000000) {
        result.message = 'File size exceeds limit'
        sizeOkay = false
    }

    let imgObj = new Image()
    imgObj.src = URL.createObjectURL(file)
    imgObj.onload = () => {
        if (imgObj.width < imageMinHt || imgObj.height < imageMinHt) {
            result.message = 'Image dimensions below minimum'
            dimsOkay = false
        }

        const cellSide = Math.round(imgObj.height / minNumRows)
        const minWidth = minNumRows * cellSide

        // if (imgObj.width < minWidth) {
        //     result.message = 'Image width below minimum'
        //     ratioOkay = false
        // }
        result.isValid = extOkay && sizeOkay && dimsOkay && ratioOkay
        result.imgURL = imgObj.src
        result.imgWidth = imgObj.width
        result.imgHeight = imgObj.height
        URL.revokeObjectURL(imgObj.src)
        callback(result, file)
    }

    imgObj.onerror = () => {
        result.isImage = false
        result.isValid = false
        result.message = 'Not an image'
        URL.revokeObjectURL(imgObj.src)
        callback(result, null)
    }
}

const getImageFieldDisplayText = (result) => {
    let text = ''

    let textLimit = 20
    if (!result.isValid) {
        textLimit = 12
    }
    if (result.filename.length > textLimit) {
        text = `${result.filename}`.substring(0, textLimit - 5) + '..' + `;  ${result.filename}`.slice(-4)
    } else {
        text = `${result.filename}`
    }

    if (result.isImage) {
        const imgDims = `${result.imgWidth}x${result.imgHeight}`
        if (result.isValid) {
            text = `${text}; ${imgDims}`
        } else {
            text = `${text};  ${result.filesize}; ${imgDims}`
        }
    } else {
        text = `${text}; ${result.message}`
    }

    return text
}

const getMaxNumCols = (numRows) => {
    return Math.floor(9 / imageMaxMB * numRows)
}

export {
    imageMaxMB,
    evaluateFile,
    getImageFieldDisplayText
}