import { minNumRows, maxNumRows, minTargetHt, imageMaxMB, minImageHt } from '@/constants';

const minTitleLength = 5
const maxTitleLength = 12
const defaultImageFieldText = `jpg|png;  <${imageMaxMB}MB;  >${minImageHt}x${minImageHt}`


function verifyTitleUtil(title, setTitleIsValid) {
    let isValid = true
    if (title.length < minTitleLength) {
        isValid = false
    } else if (title.length > maxTitleLength) {
        isValid = false
    } else if (!/^[a-zA-Z0-9]*$/.test(title)) {
        isValid = false
    }
    setTitleIsValid(isValid)
    return isValid
}

const initialJsState = {
    isUploadRequired: false,
    imageTitle: '',
    targetInfo: {
        isValid: false,
        targetHt: '',
    },
    imageFieldText: defaultImageFieldText,
    imageInfo: {
        title: '',
        imgWidth: null,
        imgHeight: null,
        imageid: null,
        isValid: false
    },
    gridInfo: {
        isValid: false,
        numRows: '',
        numCols: '',
        minNumCols: minNumRows,
        maxNumCols: maxNumRows
    }
}

const newJsReducer = (state, action) => {
    const newValue = action.payload;
    let currentValue, parsedValue, isValid;

    let isNumColsOk = state.gridInfo.numCols >= minNumRows && state.gridInfo.numCols <= maxNumRows;
    let isNumRowsOk = state.gridInfo.numRows >= minNumRows && state.gridInfo.numRows <= maxNumRows;

    switch (action.type) {
        case 'setTitle':
            state.imageTitle = action.payload
            return {...state}
        
        case 'setTargetHt':
            if (!/^[0-9]*$/.test(newValue)) return {...state}

            isValid = false;

            if (newValue === '' || newValue === '0') {
                parsedValue = '';
            } else {
                parsedValue = parseInt(newValue);
                if (parsedValue > 9999) {
                    parsedValue = state.targetInfo.targetHt;
                }
                if (parsedValue > minTargetHt && parsedValue <=9999) {
                    isValid = true;
                }
            }

            state.targetInfo.targetHt = parsedValue;
            state.targetInfo.isValid = isValid;

            const newMinImageHt = Math.max(minTargetHt, state.targetInfo.targetHt)
            state.imageFieldText = `jpg|png;  <${imageMaxMB}MB;  >${newMinImageHt}x${newMinImageHt}`

            if (state.imageInfo.imgWidth) {
                state.imageInfo.isValid = state.imageInfo.imgHeight >= newMinImageHt;
            }

            return {...state}

        case 'setTargetHtValidity': 
            state.targetInfo.isValid = action.payload
            return {...state}

        case 'setImageFieldText':
            if (newValue >= minImageHt) {
                state.imageFieldText = `jpg|png;  <${imageMaxMB}MB;  >${newValue}x${newValue}`
            } else {
                state.imageFieldText = `jpg|png;  <${imageMaxMB}MB;  >${minImageHt}x${minImageHt}`
            }
            return {...state}

        case 'setImageInfo':
            state.imageInfo = newValue;
            return {...state}

        case 'setNumRows':
            if (!/^[0-9]*$/.test(newValue)) return {...state}
            
            if (newValue === '' || newValue === '0') {
                parsedValue = '';
            } else {
                parsedValue = parseInt(newValue);
                if (parsedValue > maxNumRows) {
                    parsedValue = state.gridInfo.numRows;
                }
            }
            state.gridInfo.numRows = parsedValue;

            isNumRowsOk = parsedValue >= minNumRows && parsedValue <= maxNumRows;
            state.gridInfo.isValid = isNumColsOk && isNumRowsOk

            return {...state}

        case 'setNumCols':
            if (!/^[0-9]*$/.test(newValue)) return {...state}

            if (newValue === '' || newValue === '0') {
                parsedValue = '';
            } else {
                parsedValue = parseInt(newValue)
                if (parsedValue > maxNumRows) {
                    parsedValue = state.gridInfo.numCols;
                }
            }
            state.gridInfo.numCols = parsedValue;

            isNumColsOk = parsedValue >= minNumRows && parsedValue <= maxNumRows;
            state.gridInfo.isValid = isNumColsOk && isNumRowsOk

            return {...state}

        case 'resetState':
            return {...initialJsState}
    }
}


export {
    verifyTitleUtil,
    initialJsState,
    newJsReducer,
    defaultImageFieldText
}