import { configureStore, createSlice } from '@reduxjs/toolkit';

import { minImageHt, imageMaxMB, minNumRows, maxNumRows } from '@/constants'

import { getImageFieldDisplayText } from '@/utils/ImageFileUtils'


const initialState = {
    imageInfo: {
        isValid: false,
        filename: '',
        filesize: '',
        imgWidth: null,
        imgHeight: null,
        isImage: true,
        imgURL: null
    },
    imageFieldText: `jpg|png;  <${imageMaxMB}MB;  >${minImageHt}x${minImageHt}`,
    targetInfo: {
        isValid: false,
        targetHt: '',
    },
    imageTitle: '',
    gridInfo: {
        isValid: false,
        numRows: '',
        numCols: '',
        minNumCols: minNumRows,
        maxNumCols: maxNumRows
    }
}

const uploadedImageSlice = createSlice({
    name: 'imageUpload',
    initialState,
    reducers: {
        setTitle: (state, action) => {
            state.imageTitle = action.payload
        },

        setImageFieldText: (state, action) => {
            const newValue = action.payload
            if (newValue >= minImageHt) {
                state.imageFieldText = `jpeg|png;  <${imageMaxMB}MB;  >${newValue}x${newValue}`
            } else {
                state.imageFieldText = `jpeg|png;  <${imageMaxMB}MB;  >${minImageHt}x${minImageHt}`
            }
        },

        setImageInfo: (state, action) => {
            const result = action.payload
            state.imageInfo = result
            state.imageFieldText = getImageFieldDisplayText(result)
        },

        setTargetHt: (state, action) => {
            const newValue = action.payload
            if (!/^[0-9]*$/.test(newValue)) return

            if (newValue === '') {
                state.targetInfo.targetHt = ''
                state.targetInfo.isValid = true

            } else if (parseInt(newValue) <= 9999) {
                state.targetInfo.targetHt = parseInt(newValue)

                if (newValue >= minImageHt) {
                    state.targetInfo.isValid = true
                } else {
                    state.targetInfo.isValid = false
                }
            }

            const newMinImageHt = Math.max(minImageHt, state.targetInfo.targetHt)

            if (state.imageInfo.imgHeight && state.imageInfo.imgHeight < newMinImageHt) {
                state.targetInfo.isValid = false
            } else if (!state.imageInfo.imgHeight) {
                state.imageFieldText = `jpeg|png;  <${imageMaxMB}MB;  >${newMinImageHt}x${newMinImageHt}`
            }
        },

        setTargetHtValidity: (state, action) => {
            state.targetInfo.isValid = action.payload
        },

        setNumRows: (state, action) => {
            const newValue = action.payload
            if (!/^[0-9]*$/.test(newValue)) return
            if (newValue === '') {
                state.gridInfo.numRows = ''
                state.gridInfo.minNumCols = minNumRows
                state.gridInfo.maxNumCols = maxNumRows
                return
            }
            if (parseInt(newValue) > maxNumRows) return
            state.gridInfo.numRows = parseInt(newValue)

            if (state.gridInfo.numRows < minNumRows || state.gridInfo.numRows > maxNumRows) return

            // state.gridInfo.minNumCols = parseInt(newValue)

            if (!state.imageInfo.imgWidth || !state.imageInfo.isValid) return

            // const cellside = Math.floor(state.imageInfo.imgHeight / state.gridInfo.numRows)
            // state.gridInfo.maxNumCols = Math.min(
            //     Math.floor(
            //         state.imageInfo.imgWidth / cellside
            //     ), maxNumRows
            // )
        },

        setNumCols: (state, action) => {
            const newValue = action.payload
            if (!/^[0-9]*$/.test(newValue)) return
            if (newValue === '') {
                state.gridInfo.numCols = ''
                return
            }
            if (parseInt(newValue) > state.gridInfo.maxNumCols) return
            state.gridInfo.numCols = parseInt(newValue)
            state.gridInfo.isValid = true
        },

        resetState: (state) => {
            state.imageInfo = initialState.imageInfo
            state.imageFieldText = initialState.imageFieldText
            state.targetInfo = initialState.targetInfo
            state.imageTitle = initialState.imageTitle
            state.gridInfo = initialState.gridInfo

        }
    }
})

export const {
    setTitle, resetState,
    setNumRows, setNumCols,
    setImageInfo, setImageFieldText,
    setTargetHt, setTargetHtValidity
} = uploadedImageSlice.actions;

export const uploadImageStore = configureStore({
    reducer: {
        uploadedImage: uploadedImageSlice.reducer
    }
});