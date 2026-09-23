import {
    useEffect,
    useMemo,
    useState,
} from "react";

import { ThemeContext } from "./theme-context";
const THEME_KEY = "themePreference";
const VALID_THEMES = ["system", "light", "dark"];


function getInitialTheme() {

    const storedTheme =
        localStorage.getItem(THEME_KEY);

    return VALID_THEMES.includes(storedTheme)
        ? storedTheme
        : "system";

}


function getSystemTheme() {

    if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
        return "dark";
    }

    return "light";

}


function resolveTheme(theme) {

    return theme === "system"
        ? getSystemTheme()
        : theme;

}


export function ThemeProvider({ children }) {

    const [theme, setThemeState] =
        useState(getInitialTheme);

    const [resolvedTheme, setResolvedTheme] =
        useState(() => resolveTheme(getInitialTheme()));


    useEffect(() => {

        const mediaQuery =
            window.matchMedia("(prefers-color-scheme: dark)");

        function applyTheme() {

            const nextTheme =
                resolveTheme(theme);

            document.documentElement.dataset.theme =
                nextTheme;

            setResolvedTheme(nextTheme);

        }

        applyTheme();

        if (theme === "system") {
            mediaQuery.addEventListener(
                "change",
                applyTheme
            );
        }

        return () => {

            mediaQuery.removeEventListener(
                "change",
                applyTheme
            );

        };

    }, [theme]);


    function setTheme(nextTheme) {

        const normalizedTheme =
            VALID_THEMES.includes(nextTheme)
                ? nextTheme
                : "system";

        localStorage.setItem(
            THEME_KEY,
            normalizedTheme
        );

        setThemeState(normalizedTheme);

    }


    const value = useMemo(
        () => ({
            theme,
            resolvedTheme,
            setTheme,
        }),
        [theme, resolvedTheme]
    );


    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );

}
