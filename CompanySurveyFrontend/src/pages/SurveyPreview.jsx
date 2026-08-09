import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSurveyQuestions, publishSurvey } from "../services/api";
import { useSurvey } from "../context/SurveyContext";


function normalizeQuestion(question) {

    return {
        id: question.id,
        text: question.question_text,
        type: question.question_type,
        required: question.is_required,
        display_order: question.display_order,
        survey_id: question.survey_id,
    };

}

function sortQuestions(questions) {

    return [...questions].sort((firstQuestion, secondQuestion) => {
        return (firstQuestion.display_order || 0) - (secondQuestion.display_order || 0);
    });

}

function SurveyPreview() {

    const { id } = useParams();

    const surveyId = Number(id);

    const { questions: contextQuestions, activeSurveyId, setActiveSurveyId } = useSurvey();

    const [questions, setQuestions] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {

        let isMounted = true;

        if (surveyId) {
            setActiveSurveyId(surveyId);
        }

        if (activeSurveyId === surveyId && contextQuestions.length > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setQuestions(contextQuestions);
            setLoading(false);
            setError("");
            return () => {
                isMounted = false;
            };
        }

        async function fetchQuestions() {

            try {

                setLoading(true);
                setError("");

                const payload = await getSurveyQuestions(surveyId);

                const normalizedQuestions = Array.isArray(payload?.questions)
                    ? sortQuestions(payload.questions.map(normalizeQuestion))
                    : [];

                if (isMounted) {
                    setQuestions(normalizedQuestions);
                }

            } catch (fetchError) {

                if (isMounted) {
                    setError(fetchError.message || "Failed to load preview questions.");
                    setQuestions([]);
                }

            } finally {

                if (isMounted) {
                    setLoading(false);
                }

            }

        }

        if (surveyId) {
            fetchQuestions();
        } else {
            setLoading(false);
        }

        return () => {
            isMounted = false;
        };

    }, [activeSurveyId, contextQuestions, setActiveSurveyId, surveyId]);

    async function handlePublishSurvey() {
        try {
            const response = await publishSurvey(surveyId);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                alert(data.detail || "Failed to publish survey.");
                return;
            }

            alert("Survey published successfully!");
            navigate("/dashboard");
        } catch (error) {
            console.error(error);
            alert("Something went wrong.");
        }
    }


    return (

        <div style={{ padding: "30px" }}>

            <h1>Survey Preview</h1>

            <p>Survey ID: {id}</p>

            {error && <p style={{ color: "#b00020" }}>{error}</p>}

            <hr />

            <h2>Preview</h2>

            {loading ? (
                <p>Loading preview...</p>
            ) : questions.length === 0 ? (

                <p>No questions added yet.</p>

            ) : (

                questions.map((question, index) => (

                    <div
                        key={question.id}
                        style={{
                            border: "1px solid #ddd",
                            padding: "15px",
                            marginBottom: "15px",
                            borderRadius: "8px"
                        }}
                    >

                        <h3>Question {index + 1}</h3>

                        <p>{question.text}</p>

                        {question.type === "text" && (
                            <input
                                type="text"
                                placeholder="Your answer"
                                disabled
                            />
                        )}

                        {question.type === "rating" && (
                            <div>⭐⭐⭐⭐⭐</div>
                        )}

                        {question.type === "radio" && (
                            <input type="radio" disabled />
                        )}

                        {question.type === "checkbox" && (
                            <input type="checkbox" disabled />
                        )}

                    </div>

                ))

            )}

            <div style={{ marginTop: "30px", display: "flex", gap: "15px" }}>

            <button
            onClick={() => navigate(`/surveys/${id}/questions`)}
            >
            ← Back to Builder
        </button>

        <button
        onClick={handlePublishSurvey}
    >
            Publish Survey
        </button>

        </div>

        </div>

    );

}

export default SurveyPreview;
