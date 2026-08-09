/* ===========================================
   Take Survey Page
=========================================== */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as API from "../services/api";

/* ===========================================
   Helper Function
=========================================== */

function sortQuestions(questions) {

    return [...questions].sort(
        (a, b) => (a.display_order || 0) - (b.display_order || 0)
    );

}

/* ===========================================
   Take Survey Component
=========================================== */

function TakeSurvey() {

    /* ===========================================
       Get Survey ID
    =========================================== */

    const { id } = useParams();

    /* ===========================================
       State Variables
    =========================================== */

    const [survey, setSurvey] = useState(null);

    const [questions, setQuestions] = useState([]);

    const [answers, setAnswers] = useState({});

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    /* ===========================================
       Text / Textarea / Dropdown
    =========================================== */

    function handleAnswerChange(questionId, value) {

        setAnswers((previousAnswers) => ({

            ...previousAnswers,

            [questionId]: value,

        }));

    }

    /* ===========================================
       Checkbox
    =========================================== */

    function handleCheckboxChange(questionId, optionValue, checked) {

        setAnswers((previousAnswers) => {

            const selectedOptions = Array.isArray(
                previousAnswers[questionId]
            )
                ? previousAnswers[questionId]
                : [];

            return {

                ...previousAnswers,

                [questionId]: checked
                    ? [...selectedOptions, optionValue]
                    : selectedOptions.filter(
                        (value) => value !== optionValue
                    ),

            };

        });

    }


    /* ===========================================
       Rating
    =========================================== */

    function handleRatingChange(questionId, rating) {

        setAnswers((previousAnswers) => ({

            ...previousAnswers,

            [questionId]: String(rating),

        }));

    }

    /* ===========================================
   Validate Required Questions
=========================================== */

function validateSurvey() {

    for (const question of questions) {

        if (!question.is_required) {
            continue;
        }

        // Skip question types that currently have no backend options
        if (
            ["radio", "checkbox", "dropdown"].includes(
                question.question_type
            )
        ) {
            continue;
        }

        const answer = answers[question.id];

        if (
            answer === undefined ||
            answer === null ||
            answer === ""
        ) {

            setError(
                `Please answer: ${question.question_text}`
            );

            return false;

        }

    }

    setError("");

    return true;

}
/* ===========================================
   Submit Survey
=========================================== */

async function handleSubmit(event) {

    event.preventDefault();

    if (!validateSurvey()) {

        return;

    }

    const payload = Object.entries(answers).map(

        ([questionId, answer]) => ({

            question_id: Number(questionId),

            answer: answer,

        })

    );

    console.log("Submitting:", payload);

    try {

        await API.submitSurvey(id, payload);

        alert("Survey submitted successfully!");

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}
    // useEffect comes next...
    /* -----------------------------
       Load Survey
    ------------------------------ */

    useEffect(() => {

        async function fetchSurvey() {

            try {

                setLoading(true);

                setError("");

                const data = await API.getSurveyQuestions(id);

                console.log("Survey Data:", data);

                setSurvey(data);

                setQuestions(
                    sortQuestions(data.questions || [])
                );

            }

            catch (err) {

                console.error(err);

                setError("Failed to load survey.");

            }

            finally {

                setLoading(false);

            }

        }

        fetchSurvey();

    }, [id]);

    /* -----------------------------
       Loading Screen
    ------------------------------ */

    if (loading) {

        return <h2>Loading Survey...</h2>;

    }

    /* -----------------------------
       Error Screen
    ------------------------------ */

    if (error) {

        return <h2>{error}</h2>;

    }

    /* -----------------------------
       UI
    ------------------------------ */

return (

    <div
        style={{
            maxWidth: "900px",
            margin: "40px auto",
            padding: "30px",
            fontFamily: "Arial, sans-serif",
        }}
    >

        <h1>{survey?.title}</h1>

        <p>{survey?.description}</p>

        <hr />

        {error && (
            <p style={{ color: "red" }}>
                {error}
            </p>
        )}

        {questions.length === 0 ? (

            <p>No questions found.</p>

        ) : (

            <form onSubmit={handleSubmit}>

                {questions.map((question) => {

                    console.log(
                        question.question_text,
                        question.question_type,
                        question.options
                    );

                    const options = question.options || [];

                    return (

                        <div
                            key={question.id}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                padding: "20px",
                                marginBottom: "25px",
                                background: "#fafafa",
                            }}
                        >

                            <h3>

                                {question.question_text}

                                {question.is_required && (
                                    <span style={{ color: "red" }}> *</span>
                                )}

                            </h3>

                            {/* TEXT */}

                            {question.question_type === "text" && (

                                <input
                                    type="text"
                                    placeholder="Enter your answer..."
                                    value={answers[question.id] || ""}
                                    onChange={(e) =>
                                        handleAnswerChange(
                                            question.id,
                                            e.target.value
                                        )
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                    }}
                                />

                            )}

                            {/* TEXTAREA */}

                            {question.question_type === "textarea" && (

                                <textarea
                                    rows={4}
                                    placeholder="Enter your answer..."
                                    value={answers[question.id] || ""}
                                    onChange={(e) =>
                                        handleAnswerChange(
                                            question.id,
                                            e.target.value
                                        )
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                    }}
                                />

                            )}

                            {/* RADIO */}

                            {question.question_type === "radio" && (

                                options.length > 0 ? (

                                    options.map((option) => (

                                        <label
                                            key={option}
                                            style={{
                                                display: "block",
                                                marginBottom: "10px",
                                            }}
                                        >

                                            <input
                                                type="radio"
                                                name={`question-${question.id}`}
                                                value={option}
                                                checked={
                                                    answers[question.id] === option
                                                }
                                                onChange={(e) =>
                                                    handleAnswerChange(
                                                        question.id,
                                                        e.target.value
                                                    )
                                                }
                                            />

                                            {" "}
                                            {option}

                                        </label>

                                    ))

                                ) : (

                                    <p>No options available.</p>

                                )

                            )}

                            {/* CHECKBOX */}

                            {question.question_type === "checkbox" && (

                                options.length > 0 ? (

                                    options.map((option) => (

                                        <label
                                            key={option}
                                            style={{
                                                display: "block",
                                                marginBottom: "10px",
                                            }}
                                        >

                                            <input
                                                type="checkbox"
                                                checked={
                                                    (
                                                        answers[question.id] || []
                                                    ).includes(option)
                                                }
                                                onChange={(e) =>
                                                    handleCheckboxChange(
                                                        question.id,
                                                        option,
                                                        e.target.checked
                                                    )
                                                }
                                            />

                                            {" "}
                                            {option}

                                        </label>

                                    ))

                                ) : (

                                    <p>No options available.</p>

                                )

                            )}

                            {/* DROPDOWN */}

                            {question.question_type === "dropdown" && (

                                options.length > 0 ? (

                                    <select
                                        value={answers[question.id] || ""}
                                        onChange={(e) =>
                                            handleAnswerChange(
                                                question.id,
                                                e.target.value
                                            )
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                        }}
                                    >

                                        <option value="">
                                            Select an option
                                        </option>

                                        {options.map((option) => (

                                            <option
                                                key={option}
                                                value={option}
                                            >
                                                {option}
                                            </option>

                                        ))}

                                    </select>

                                ) : (

                                    <p>No options available.</p>

                                )

                            )}

                            {/* RATING */}

                            {question.question_type === "rating" && (

                                <div
                                    style={{
                                        display: "flex",
                                        gap: "10px",
                                        marginTop: "10px",
                                    }}
                                >

                                    {[1, 2, 3, 4, 5].map((rating) => (

                                        <button
                                            key={rating}
                                            type="button"
                                            onClick={() =>
                                                handleRatingChange(
                                                    question.id,
                                                    rating
                                                )
                                            }
                                            style={{
                                                padding: "10px 16px",
                                                borderRadius: "6px",
                                                border:
                                                    answers[question.id] === String(rating)
                                                        ? "2px solid blue"
                                                        : "1px solid #ccc",
                                                background:
                                                    answers[question.id] === String(rating)
                                                        ? "#1976d2"
                                                        : "#fff",
                                                color:
                                                    answers[question.id] === String(rating)
                                                        ? "#fff"
                                                        : "#000",
                                                cursor: "pointer",
                                            }}
                                        >

                                            {rating}

                                        </button>

                                    ))}

                                </div>

                            )}

                        </div>

                    );

                })}

                <button
                    type="submit"
                    style={{
                        padding: "12px 30px",
                        fontSize: "16px",
                        cursor: "pointer",
                    }}
                >

                    Submit Survey

                </button>

            </form>

        )}

    </div>

);

}

export default TakeSurvey;
