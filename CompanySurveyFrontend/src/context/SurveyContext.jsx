import { createContext, useContext, useState } from "react";

const SurveyContext = createContext();

export function SurveyProvider({ children }) {

    const [survey, setSurvey] = useState(null);

    const [activeSurveyId, setActiveSurveyId] = useState(null);

    const [questions, setQuestions] = useState([]);

    return (

        <SurveyContext.Provider
            value={{
                survey,
                setSurvey,
                activeSurveyId,
                setActiveSurveyId,
                questions,
                setQuestions,
            }}
        >

            {children}

        </SurveyContext.Provider>

    );

}

// This hook intentionally shares the provider's context from this module.
// eslint-disable-next-line react-refresh/only-export-components
export function useSurvey() {

    return useContext(SurveyContext);

}
