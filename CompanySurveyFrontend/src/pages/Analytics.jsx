import { removeWhitespace } from "../utils/inputWhitespace";
import PermissionGate from "../components/PermissionGate";
import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    getSurveyAnalytics,
    exportSurveyAnalytics,
    getSurveys,
} from "../services/api";

import "../styles/Analytics.css";

import RatingChart from "../components/RatingChart";
import Sidebar from "../components/Sidebar";


function Analytics() {

    const { id } = useParams();
    const navigate = useNavigate();


    /* ===========================================
       State
    =========================================== */

    const [data, setData] =
        useState(null);

    const [surveys, setSurveys] =
        useState([]);

    const [surveyIdInput, setSurveyIdInput] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    /* ===========================================
       Load Analytics Landing Page
       /analytics
    =========================================== */

    useEffect(() => {

        if (id) {
            return;
        }


        let mounted = true;


        async function fetchSurveys() {

            try {

                setLoading(true);
                setError("");


                const result =
                    await getSurveys();


                if (!mounted) {
                    return;
                }


                setSurveys(
                    Array.isArray(result)
                        ? result
                        : []
                );


            } catch (err) {

                if (!mounted) {
                    return;
                }


                console.error(
                    "Survey Load Error:",
                    err
                );


                setError(
                    err.message ||
                    "Failed to load surveys."
                );


            } finally {

                if (mounted) {
                    setLoading(false);
                }

            }

        }


        fetchSurveys();


        return () => {
            mounted = false;
        };

    }, [id]);


    /* ===========================================
       Fetch One Survey's Analytics
       /surveys/:id/analytics
    =========================================== */

    useEffect(() => {

        if (!id) {
            return;
        }


        let mounted = true;


        async function fetchAnalytics() {

            try {

                setLoading(true);
                setError("");
                setData(null);


                const result =
                    await getSurveyAnalytics(id);


                if (!mounted) {
                    return;
                }


                setData(result);


            } catch (err) {

                if (!mounted) {
                    return;
                }


                console.error(
                    "Analytics Load Error:",
                    err
                );


                setError(
                    err.message ||
                    "Failed to load analytics."
                );


            } finally {

                if (mounted) {
                    setLoading(false);
                }

            }

        }


        fetchAnalytics();


        return () => {
            mounted = false;
        };

    }, [id]);


    /* ===========================================
       Open Analytics By Survey ID
    =========================================== */

    function handleSurveySearch(event) {

        event.preventDefault();


        const cleanedId =
            surveyIdInput.trim();


        if (!cleanedId) {

            setError(
                "Enter a Survey ID."
            );

            return;
        }


        const surveyId =
            Number(cleanedId);


        if (
            !Number.isInteger(surveyId) ||
            surveyId <= 0
        ) {

            setError(
                "Enter a valid Survey ID."
            );

            return;
        }


        setError("");


        navigate(
            `/surveys/${surveyId}/analytics`
        );

    }


    /* ===========================================
       Download Analytics CSV
    =========================================== */

    async function handleDownload() {

        try {

            setError("");


            const blob =
                await exportSurveyAnalytics(id);


            const url =
                window.URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement("a");


            link.href = url;

            link.download =
                `survey-${id}-analytics.csv`;


            document.body.appendChild(
                link
            );


            link.click();


            document.body.removeChild(
                link
            );


            window.URL.revokeObjectURL(
                url
            );


        } catch (err) {

            console.error(
                "Analytics Download Error:",
                err
            );


            setError(
                err.message ||
                "Failed to download analytics."
            );

        }

    }


    /* ===========================================
       Analytics Landing Page
       /analytics
    =========================================== */

    if (!id) {

        return (

            <>

                <Sidebar />


                <main className="analytics-page">


                    {/* Page Header */}

                    <section className="analytics-landing-header">

                        <span className="analytics-eyebrow">
                            Survey Analytics
                        </span>


                        <h1>
                            Analytics
                        </h1>


                        <p>
                            Select a survey to explore
                            combined trends and insights.
                        </p>

                    </section>


                    {/* Survey Search */}

                    <section className="analytics-search-panel">

                        <div className="analytics-search-info">

                            <h2>
                                Find Survey Analytics
                            </h2>


                            <p>
                                Enter a Survey ID or choose
                                one of your surveys below.
                            </p>

                        </div>


                        <form
                            className="analytics-search-form"
                            onSubmit={
                                handleSurveySearch
                            }
                        >

                            <label
                                htmlFor="analytics-survey-id"
                            >
                                Survey ID
                            </label>


                            <div className="analytics-search-control">

                                <span>
                                    #
                                </span>


                                <input
                                    id="analytics-survey-id"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="e.g. 32"
                                    value={
                                        surveyIdInput
                                    }
                                    onChange={
                                        (event) => {

                                            setSurveyIdInput(
                                                removeWhitespace(event.target.value)
                                            );

                                            if (error) {
                                                setError("");
                                            }

                                        }
                                    }
                                />


                                <button
                                    type="submit"
                                >
                                    View Analytics
                                </button>

                            </div>

                        </form>

                    </section>


                    {/* Error */}

                    {error && (

                        <div className="analytics-error">
                            {error}
                        </div>

                    )}


                    {/* Survey Directory */}

                    <section className="analytics-survey-directory">


                        <div className="analytics-section-heading">

                            <div>

                                <h2>
                                    Your Surveys
                                </h2>


                                <p>
                                    Choose a survey to
                                    open its analytics.
                                </p>

                            </div>


                            <span className="analytics-survey-count">

                                {surveys.length}

                            </span>

                        </div>


                        {loading ? (

                            <div className="analytics-loading">

                                Loading surveys...

                            </div>

                        ) : surveys.length === 0 ? (

                            <div className="analytics-empty">

                                No surveys available.

                            </div>

                        ) : (

                            <div className="analytics-survey-grid">


                                {surveys.map(
                                    (survey) => (

                                        <button
                                            key={survey.id}
                                            type="button"
                                            className="analytics-survey-card"
                                            onClick={() =>
                                                navigate(
                                                    `/surveys/${survey.id}/analytics`
                                                )
                                            }
                                        >


                                            <div className="analytics-survey-card-top">

                                                <span className="analytics-survey-id">

                                                    Survey #{survey.id}

                                                </span>


                                                <span
                                                    className={
                                                        survey.is_published
                                                            ? "analytics-survey-status published"
                                                            : "analytics-survey-status draft"
                                                    }
                                                >

                                                    {survey.is_published
                                                        ? "Published"
                                                        : "Draft"}

                                                </span>

                                            </div>


                                            <h3>
                                                {survey.title}
                                            </h3>


                                            <p>

                                                {survey.description ||
                                                    "No description provided."}

                                            </p>


                                            <span className="analytics-survey-open">

                                                View Analytics

                                            </span>


                                        </button>

                                    )
                                )}


                            </div>

                        )}


                    </section>


                </main>

            </>

        );

    }


    /* ===========================================
       Loading Survey Analytics
    =========================================== */

    if (loading || !data) {

        return (

            <>

                <Sidebar />

                <main className="analytics-page">

                    <div className="analytics-loading">

                        Loading analytics...

                    </div>

                </main>

            </>

        );

    }


    /* ===========================================
       Survey Analytics Page
       /surveys/:id/analytics
    =========================================== */

    return (

        <>

            <Sidebar />


            <main className="analytics-page">


                {/* ===========================================
                    Analytics Header
                =========================================== */}

                <section className="analytics-header">


                    {/* Left Side */}

                    <div className="analytics-header-left">


                        {/* Back Navigation */}

                        <div className="analytics-back-button">

                            <button
                                type="button"
                                className="dashboard-back-btn-analytics-page"
                                onClick={() =>
                                    navigate("/analytics")
                                }
                            >
                                Analytics
                            </button>

                        </div>


                        {/* Survey Information */}

                        <div className="analytics-header-content">

                            <span className="analytics-eyebrow">

                                Survey #{data.survey_id}

                            </span>


                            <h1 className="analytics-title">

                                {data.survey_title}

                            </h1>


                            <p className="analytics-description">

                                Combined survey trends and
                                question-level insights.

                            </p>

                        </div>


                    </div>


                    {/* Right Side */}

                    <div className="analytics-header-right">

                        <PermissionGate permission="response.export"><button
                            type="button"
                            onClick={
                                handleDownload
                            }
                            className="download-analytics-btn"
                        >
                            Download CSV
                        </button></PermissionGate>

                    </div>


                </section>


                {/* Error */}

                {error && (

                    <div className="analytics-error">

                        {error}

                    </div>

                )}


                {/* ===========================================
                    Survey Summary
                =========================================== */}

                <section className="analytics-summary">


                    <div className="summary-card">

                        <span className="summary-label">

                            Total Submissions

                        </span>


                        <strong className="summary-value">

                            {data.total_responses}

                        </strong>


                        <small>
                            Anonymous responses
                        </small>

                    </div>


                    <div className="summary-card">

                        <span className="summary-label">

                            Questions

                        </span>


                        <strong className="summary-value">

                            {data.questions?.length || 0}

                        </strong>


                        <small>
                            Questions analyzed
                        </small>

                    </div>


                    <div className="summary-card">

                        <span className="summary-label">

                            Overall Rating

                        </span>


                        <strong className="summary-value">

                            {data.average_rating !== null
                                ? `${data.average_rating} / 5`
                                : "—"}

                        </strong>


                        <small>
                            Average rating
                        </small>

                    </div>


                    <div className="summary-card">

                        <span className="summary-label">

                            Status

                        </span>


                        <strong
                            className={
                                data.is_published
                                    ? "summary-status published"
                                    : "summary-status draft"
                            }
                        >

                            {data.is_published
                                ? "Published"
                                : "Draft"}

                        </strong>


                        <small>
                            Current survey state
                        </small>

                    </div>


                </section>


                {/* Privacy Note */}

                <div className="privacy-note">

                    Results are shown in aggregate
                    to preserve respondent anonymity.

                </div>


                {/* ===========================================
                    Question Analytics
                =========================================== */}

                <section className="analytics-questions">


                    <div className="analytics-section-heading">

                        <div>

                            <h2>
                                Question Analytics
                            </h2>


                            <p>
                                Explore combined responses
                                for each question.
                            </p>

                        </div>

                    </div>


                    {data.questions?.length === 0 ? (

                        <div className="analytics-empty">

                            No questions available.

                        </div>

                    ) : (

                        <div className="analytics-question-list">


                            {data.questions.map(
                                (
                                    question,
                                    index
                                ) => {


                                    const questionType =
                                        question
                                            .question_type
                                            ?.toLowerCase();


                                    const isChoiceQuestion =
                                        [
                                            "radio",
                                            "dropdown",
                                            // "checkbox", // Reserved for future multi-select support.
                                        ].includes(
                                            questionType
                                        );


                                    const isTextQuestion =
                                        [
                                            "text",
                                            "textarea",
                                        ].includes(
                                            questionType
                                        );


                                    return (

                                        <article
                                            key={
                                                question.question_id ||
                                                index
                                            }
                                            className="analytics-question-card"
                                        >


                                            {/* Question Header */}

                                            <div className="analytics-question-header">


                                                <div className="analytics-question-number">

                                                    {index + 1}

                                                </div>


                                                <div className="analytics-question-title">

                                                    <h3>

                                                        {
                                                            question
                                                                .question
                                                        }

                                                    </h3>


                                                    <div className="analytics-question-meta">

                                                        <span className="question-type-badge">

                                                            {
                                                                questionType
                                                            }

                                                        </span>


                                                        <span>

                                                            {
                                                                question
                                                                    .total_responses
                                                            }{" "}
                                                            responses

                                                        </span>

                                                    </div>

                                                </div>


                                            </div>


                                            {/* Rating */}

                                            {questionType ===
                                                "rating" && (

                                                <div className="rating-result">


                                                    <div className="rating-summary">

                                                        <span className="rating-label">

                                                            Average Rating

                                                        </span>


                                                        {question.average_rating !==
                                                        null ? (

                                                            <strong className="rating-value">

                                                                {
                                                                    question
                                                                        .average_rating
                                                                }

                                                                <span className="rating-max">
                                                                    {" "} / 5
                                                                </span>

                                                            </strong>

                                                        ) : (

                                                            <span className="no-responses">

                                                                No responses yet

                                                            </span>

                                                        )}

                                                    </div>


                                                    {question.rating_distribution && (

                                                        <RatingChart
                                                            distribution={
                                                                question
                                                                    .rating_distribution
                                                            }
                                                        />

                                                    )}


                                                </div>

                                            )}


                                            {/* Choice Analytics */}

                                            {isChoiceQuestion && (

                                                <div className="choice-analytics">


                                                    {question.answer_breakdown &&
                                                    Object.keys(
                                                        question.answer_breakdown
                                                    ).length > 0 ? (

                                                        Object.entries(
                                                            question.answer_breakdown
                                                        ).map(
                                                            ([
                                                                option,
                                                                count,
                                                            ]) => {


                                                                const percentage =
                                                                    question.total_responses >
                                                                    0
                                                                        ? Math.round(
                                                                            (
                                                                                count /
                                                                                question.total_responses
                                                                            ) *
                                                                            100
                                                                        )
                                                                        : 0;


                                                                return (

                                                                    <div
                                                                        key={
                                                                            option
                                                                        }
                                                                        className="choice-result-row"
                                                                    >


                                                                        <div className="choice-result-header">

                                                                            <span className="choice-label">

                                                                                {option}

                                                                            </span>


                                                                            <span className="choice-result-count">

                                                                                {count} ({percentage}%)

                                                                            </span>

                                                                        </div>


                                                                        <div className="choice-progress-track">

                                                                            <div
                                                                                className="choice-progress-bar"
                                                                                style={{
                                                                                    width: `${percentage}%`,
                                                                                }}
                                                                            />

                                                                        </div>


                                                                    </div>

                                                                );

                                                            }
                                                        )

                                                    ) : (

                                                        <p className="no-responses">

                                                            No responses yet.

                                                        </p>

                                                    )}


                                                </div>

                                            )}


                                            {/* Text / Textarea */}

                                            {isTextQuestion && (

                                                <div className="feedback-section">


                                                    {question.text_responses &&
                                                    question.text_responses.length >
                                                    0 ? (

                                                        <div className="feedback-list">


                                                            {question.text_responses.map(
                                                                (
                                                                    response,
                                                                    responseIndex
                                                                ) => (

                                                                    <div
                                                                        key={
                                                                            responseIndex
                                                                        }
                                                                        className="feedback-card"
                                                                    >

                                                                        <span className="feedback-number">

                                                                            #{responseIndex + 1}

                                                                        </span>


                                                                        <p>
                                                                            {response}
                                                                        </p>

                                                                    </div>

                                                                )
                                                            )}


                                                        </div>

                                                    ) : (

                                                        <p className="no-responses">

                                                            No responses yet.

                                                        </p>

                                                    )}


                                                </div>

                                            )}


                                        </article>

                                    );

                                }
                            )}


                        </div>

                    )}


                </section>


            </main>

        </>

    );

}


export default Analytics;
