import React, { createContext, useState } from 'react';

// Создаем контекст доступности
export const AccessibilityContext = createContext();

// Провайдер, управляющий настройками слабовидящих
export const AccessibilityProvider = ({ children }) => {
    const [fontSize, setFontSize] = useState('normal'); // normal, large, extra-large
    const [contrastTheme, setContrastTheme] = useState('default'); // default, black-white, yellow-black

    return (
        <AccessibilityContext.Provider value={{ fontSize, setFontSize, contrastTheme, setContrastTheme }}>
            {children}
        </AccessibilityContext.Provider>
    );
};