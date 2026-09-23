import { removeWhitespace } from "../utils/inputWhitespace";
import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    getSurvey,
    getSurveys,
    getSurveyResponses,
} from "../services/api";

import Sidebar from "../components/Sidebar";

import "../styles/Responses.css";


function Responses() {

    const { id } = useParams();

    const navigate = useNavigate();


    /* ===========================================
       State
    =========================================== */

    const [surveyIdInput, setSurveyIdInput] =
        useState("");

    const [survey, setSurvey] =
        useState(null);

    const [surveyList, setSurveyList] =
        useState([]);

    const [responses, setResponses] =
        useState([]);

    const [
        expandedSubmissionId,
        setExpandedSubmissionId,
    ] = useState(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [sortOrder, setSortOrder] =
        useState("newest");


    /* ===========================================
       Load Survey List On /responses
    =========================================== */

    useEffect(() => {

        if (id) {
            return;
        }


        let mounted = true;


        async function loadSurveys() {

            try {

                setLoading(true);
                setError("");

                const data =
                    await getSurveys();


                if (!mounted) {
                    return;
                }


                setSurveyList(
                    Array.isArray(data)
                        ? data
                        : []
                );

            } catch (loadError) {

                if (!mounted) {
                    return;
                }


                setError(
                    loadError.message ||
                    "Failed to load surveys."
                );

            } finally {

                if (mounted) {
                    setLoading(false);
                }

            }

        }


        loadSurveys();


        return () => {
            mounted = false;
        };

    }, [id]);


    /* ===========================================
       Load One Survey's Responses
    =========================================== */

    useEffect(() => {

        let mounted = true;


        async function loadResponses() {

            try {

                if (!id) {

                    setSurvey(null);
                    setResponses([]);

                    return;
                }


                setLoading(true);
                setError("");


                const [
                    surveyData,
                    responseData,
                ] = await Promise.all([

                    getSurvey(id),

                    getSurveyResponses(id),

                ]);


                if (!mounted) {
                    return;
                }


                setSurvey(
                    surveyData
                );


                setResponses(
                    Array.isArray(responseData)
                        ? responseData
                        : []
                );


            } catch (loadError) {

                if (!mounted) {
                    return;
                }


                setError(
                    loadError.message ||
                    "Failed to load responses."
                );

                setSurvey(null);
                setResponses([]);


            } finally {

                if (mounted) {
                    setLoading(false);
                }

            }

        }


        loadResponses();


        return () => {
            mounted = false;
        };

    }, [id]);


    /* ===========================================
       Group By Submission ID
    =========================================== */

    const submissions = useMemo(() => {

        const grouped =
            new Map();


        responses.forEach(
            (response) => {

                const submissionId =
                    response.submission_id ||
                    `legacy-${response.id}`;


                if (!grouped.has(submissionId)) {

                    grouped.set(
                        submissionId,
                        {
                            submission_id:
                                submissionId,

                            answers: [],
                        }
                    );

                }


                grouped
                    .get(submissionId)
                    .answers
                    .push(response);

            }
        );


        const items =
            Array.from(
                grouped.values()
            );


        items.forEach(
            (submission) => {

                submission.answers.sort(
                    (
                        firstAnswer,
                        secondAnswer
                    ) =>
                        firstAnswer.question_id -
                        secondAnswer.question_id
                );


                submission.submittedAt =
                    submission.answers[0]
                        ?.created_at ||
                    null;

            }
        );


        // Give submissions stable friendly numbers.
        const chronological =
            [...items].sort(
                (
                    firstSubmission,
                    secondSubmission
                ) =>
                    new Date(
                        firstSubmission.submittedAt || 0
                    ) -
                    new Date(
                        secondSubmission.submittedAt || 0
                    )
            );


        chronological.forEach(
            (submission, index) => {

                submission.responseNumber =
                    index + 1;

            }
        );


        return [...chronological].sort(
            (
                firstSubmission,
                secondSubmission
            ) => {

                const firstDate =
                    new Date(
                        firstSubmission.submittedAt || 0
                    );

                const secondDate =
                    new Date(
                        secondSubmission.submittedAt || 0
                    );


                return sortOrder === "newest"
                    ? secondDate - firstDate
                    : firstDate - secondDate;

            }
        );

    }, [
        responses,
        sortOrder,
    ]);


    /* ===========================================
       Question Count
    =========================================== */

    const questionCount = useMemo(() => {

        return new Set(

            responses.map(
                (response) =>
                    response.question_id
            )

        ).size;

    }, [responses]);


    /* ===========================================
       Open Survey By ID
    =========================================== */

    function handleSurveySearch(event) {

        event.preventDefault();


        const cleanedValue =
            surveyIdInput.trim();


        if (!cleanedValue) {

            setError(
                "Enter a Survey ID."
            );

            return;
        }


        const surveyId =
            Number(cleanedValue);


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
            `/surveys/${surveyId}/responses`
        );

    }


    /* ===========================================
       Toggle Submission
    =========================================== */

    function toggleSubmission(
        submissionId
    ) {

        setExpandedSubmissionId(
            (currentId) =>
                currentId === submissionId
                    ? null
                    : submissionId
        );

    }


    /* ===========================================
       /responses Landing Page
    =========================================== */

    if (!id) {

        return (
        <>
            <Sidebar />

            <main className="responses-page">


                <section className="responses-hero">

                    <div className="responses-hero-div">

                        <span className="responses-eyebrow">
                            Response Management
                        </span>

                        <h1>
                            Survey Responses
                        </h1>

                        <p>
                            Select a survey or enter its ID
                            to review individual anonymous
                            submissions.
                        </p>

                    </div>

                </section>


                <section className="response-search-panel">

                <div
                    className="survey-dashboard-header-left"
                >

                    <button
                    type="button"
                    className="dashboard-back-btn-response-page"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                    >

                    Dashboard

                    </button>
                </div>

                    <div className="response-search-copy">

                        <h2>
                            Find a Survey
                        </h2>

                        <p>
                            Enter the Survey ID to open
                            its individual responses.
                        </p>

                    </div>


                    <form
                        className="response-search-form"
                        onSubmit={
                            handleSurveySearch
                        }
                    >

                        <label htmlFor="survey-id-input">

                            Survey ID

                        </label>


                        <div className="response-search-control">

                            <span className="response-id-prefix">
                                #
                            </span>

                            <input
                                id="survey-id-input"
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                value={
                                    surveyIdInput
                                }
                                placeholder="e.g. 32"
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

                            <button type="submit">

                                View Responses

                            </button>

                        </div>

                    </form>


                    {error && (

                        <div className="responses-error">

                            {error}

                        </div>

                    )}

                </section>


                <section className="responses-survey-directory">

                    <div className="responses-section-heading">

                        <div>

                            <h2>
                                Your Surveys
                            </h2>

                            <p>
                                Choose a survey to review
                                its submissions.
                            </p>

                        </div>

                        <div  className="survey-directory-count">
                            <span>

                            {surveyList.length}
                            <span> Created Surveys</span>
                            </span>
                        </div>


                    </div>


                    {loading ? (

                        <div className="responses-state-card">

                            Loading surveys...

                        </div>

                    ) : surveyList.length === 0 ? (

                        <div className="responses-state-card">

                            No surveys available.

                        </div>

                    ) : (

                        <div className="response-survey-grid">

                            {surveyList.map(
                                (item) => (

                                    <button
                                        key={item.id}
                                        type="button"
                                        className="response-survey-card"
                                        onClick={() =>
                                            navigate(
                                                `/surveys/${item.id}/responses`
                                            )
                                        }
                                    >

                                        <div className="response-survey-card-top">

                                            <span className="response-survey-id">

                                                Survey #{item.id}

                                            </span>


                                            <span
                                                className={
                                                    item.is_published
                                                        ? "response-status published"
                                                        : "response-status draft"
                                                }
                                            >

                                                {item.is_published
                                                    ? "Published"
                                                    : "Draft"}

                                            </span>

                                        </div>


                                        <h3>
                                            {item.title}
                                        </h3>


                                        <p>
                                            {item.description ||
                                                "No description provided."}
                                        </p>


                                        <span className="response-survey-open">

                                            View Responses

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
       Loading Survey Responses
    =========================================== */

    if (loading) {

        return (

            <>
                <Sidebar />

                <main className="responses-page">

                    <div className="responses-loading">

                        <div className="responses-loader" />

                        <p>
                            Loading survey responses...
                        </p>

                    </div>

                </main>
            </>

        );

    }


    /* ===========================================
       Survey Specific Page
    =========================================== */

    return (

        <>
            <Sidebar />

            <main className="responses-page">


            <section className="survey-response-header">

                <div className="survey-response-heading-row">


                                    <div
                    className="survey-response-header-left"
                >

                    <button
                    type="button"
                    className="responses-back-btn"
                    onClick={() =>
                        navigate("/responses")
                    }
                    >

                    Responses

                    </button>
                </div>

                    <div>

                        <span className="responses-eyebrow">

                            Survey #{id}

                        </span>


                        <h1>

                            {survey?.title ||
                                `Survey ${id}`}

                        </h1>


                        <p>
                            Review individual anonymous
                            submissions for this survey.
                        </p>

                    </div>


                    <div className="survey-response-actions">

                        <select
                            value={
                                sortOrder
                            }
                            onChange={
                                (event) =>
                                    setSortOrder(
                                        event.target.value
                                    )
                            }
                        >

                            <option value="newest">
                                Newest first
                            </option>

                            <option value="oldest">
                                Oldest first
                            </option>

                        </select>

                    </div>

                </div>

            </section>


            {error && (

                <div className="responses-error">
                    {error}
                </div>

            )}


            {!error && (

                <section className="responses-summary">

                    <div className="response-summary-card">

                        <span>
                            Total Submissions
                        </span>

                        <strong>
                            {submissions.length}
                        </strong>

                        <small>
                            Completed responses
                        </small>

                    </div>


                    <div className="response-summary-card">

                        <span>
                            Questions
                        </span>

                        <strong>
                            {questionCount}
                        </strong>

                        <small>
                            Questions answered
                        </small>

                    </div>


                    <div className="response-summary-card">

                        <span>
                            Latest Response
                        </span>

                        <strong className="summary-date">

                            {submissions.length
                                ? new Date(
                                    submissions[0]
                                        .submittedAt
                                ).toLocaleDateString()
                                : "—"}

                        </strong>

                        <small>

                            {submissions.length
                                ? new Date(
                                    submissions[0]
                                        .submittedAt
                                ).toLocaleTimeString(
                                    [],
                                    {
                                        hour:
                                            "2-digit",
                                        minute:
                                            "2-digit",
                                    }
                                )
                                : "No submissions"}

                        </small>

                    </div>

                </section>

            )}


            {!error &&
                submissions.length === 0 && (

                <section className="responses-empty">

                    <div className="responses-empty-icon">
                        ↳
                    </div>

                    <h2>
                        No responses yet
                    </h2>

                    <p>
                        This survey has not received
                        any submissions.
                    </p>

                </section>

            )}


            {submissions.length > 0 && (

                <section className="response-feed">

                    <div className="responses-section-heading">

                        <div>

                            <h2>
                                Individual Submissions
                            </h2>

                            <p>
                                Each response represents
                                one completed survey.
                            </p>

                        </div>

                    </div>


                    <div className="submission-list">

                        {submissions.map(
                            (submission) => {

                                const isExpanded =
                                    expandedSubmissionId ===
                                    submission.submission_id;


                                return (

                                    <article
                                        key={
                                            submission.submission_id
                                        }
                                        className={
                                            isExpanded
                                                ? "submission-card expanded"
                                                : "submission-card"
                                        }
                                    >

                                        <button
                                            type="button"
                                            className="submission-header"
                                            onClick={() =>
                                                toggleSubmission(
                                                    submission
                                                        .submission_id
                                                )
                                            }
                                        >

                                            <div className="submission-primary">

                                                <div className="response-number-badge">

                                                    {
                                                        submission
                                                            .responseNumber
                                                    }

                                                </div>


                                                <div>

                                                    <h3>

                                                        Response #
                                                        {
                                                            submission
                                                                .responseNumber
                                                        }

                                                    </h3>


                                                    <p>

                                                        {submission.submittedAt
                                                            ? new Date(
                                                                submission
                                                                    .submittedAt
                                                            ).toLocaleString()
                                                            : "Unknown submission time"}

                                                    </p>

                                                </div>

                                            </div>


                                            <div className="submission-header-right">

                                                <span className="answer-count">

                                                    {
                                                        submission.answers
                                                            .length
                                                    }{" "}
                                                    answers

                                                </span>


                                                <span
                                                    className={
                                                        isExpanded
                                                            ? "submission-chevron open"
                                                            : "submission-chevron"
                                                    }
                                                >

                                                    ▾

                                                </span>

                                            </div>

                                        </button>


                                        {isExpanded && (

                                            <div className="submission-content">


                                                <div className="submission-meta">

                                                    <span>
                                                        Submission ID
                                                    </span>

                                                    <code>

                                                        {
                                                            submission
                                                                .submission_id
                                                        }

                                                    </code>

                                                </div>


                                                <div className="submission-answers">

                                                    {submission.answers.map(
                                                        (
                                                            response,
                                                            index
                                                        ) => (

                                                            <div
                                                                key={
                                                                    response.id
                                                                }
                                                                className="submission-answer"
                                                            >

                                                                <div className="answer-question">

                                                                    <span className="answer-number">

                                                                        {
                                                                            index +
                                                                            1
                                                                        }

                                                                    </span>


                                                                    <div>

                                                                        <h4>

                                                                            {
                                                                                response
                                                                                    .question_text ||
                                                                                `Question ${response.question_id}`
                                                                            }

                                                                        </h4>


                                                                        <span className="answer-type">

                                                                            {
                                                                                response
                                                                                    .question_type ||
                                                                                "question"
                                                                            }

                                                                        </span>

                                                                    </div>

                                                                </div>


                                                                <div className="answer-value">

                                                                    {
                                                                        response
                                                                            .answer_display ||
                                                                        response
                                                                            .answer ||
                                                                        "No answer"
                                                                    }

                                                                </div>

                                                            </div>

                                                        )
                                                    )}

                                                </div>

                                            </div>

                                        )}

                                    </article>

                                );

                            }
                        )}

                    </div>

                </section>

            )}


            </main>
        </>

    );

}


export default Responses;
