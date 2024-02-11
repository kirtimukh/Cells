import { createContext, useState } from 'react';

export const generalContext = createContext();


export const useGeneralContext = () => {
    return {};
};


export const GeneralProvider = ({ children }) => {
    const handlers = useGeneralContext();

    return (
        <generalContext.Provider value={{
            ...handlers
        }}>
            {children}
        </generalContext.Provider>
    );
};
