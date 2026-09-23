import {
    useEffect,
    useState,
} from "react";
import {
    FaArrowLeft,
    FaChartBar,
} from "react-icons/fa";
import {
    useNavigate,
    useParams,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";
import { getQuestionAnalytics } from "../services/api";
import "../styles/Analytics.css";


function QuestionAnalytics() {

    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");


    useEffect(() => {

        getQuestionAnalytics(id)
            .then((analytics) => {
                setData(analytics);
                setError("");
            })
            .catch((apiError) => {
                setError(
                    apiError.message ||
                    "Unable to load question analytics."
                );
            });

    }, [id]);


    return (
        <>
            <Sidebar />

            <main className="analytics-page">
                <header className="analytics-header">
                    <div className="analytics-back-button">
                        <button
                            type="button"
                            className="dashboard-back-btn-analytics-page"
                            onClick={() => navigate(-1)}
                        >
                            <FaArrowLeft />
                            <span>Back</span>
                        </button>
                    </div>

                    <div className="analytics-header-content">
                        <span className="analytics-eyebrow">
                            Question
                        </span>

                        <h1>
                            Question analytics
                        </h1>

                        {data && (
                            <p>
                                {data.question}
                            </p>
                        )}
                    </div>

                    <div className="analytics-header-right question-analytics-icon">
                        <FaChartBar />
                    </div>
                </header>

                {error && (
                    <p className="error">
                        {error}
                    </p>
                )}

                {!error && !data && (
                    <p>
                        Loading question analytics...
                    </p>
                )}

                {data && (
                    <section className="analytics-grid">
                        <article className="analytics-card">
                            <h3>Total answers</h3>
                            <p className="metric">
                                {data.total_responses}
                            </p>
                        </article>

                        {data.average_rating !== null && (
                            <article className="analytics-card">
                                <h3>Average rating</h3>
                                <p className="metric">
                                    {data.average_rating}/5
                                </p>
                            </article>
                        )}

                        {data.answer_breakdown && (
                            <article className="analytics-card">
                                <h3>Answer breakdown</h3>
                                <ul>
                                    {Object.entries(data.answer_breakdown).map(
                                        ([answer, count]) => (
                                            <li key={answer}>
                                                {answer}: <strong>{count}</strong>
                                            </li>
                                        )
                                    )}
                                </ul>
                            </article>
                        )}

                        {data.text_responses && (
                            <article className="analytics-card">
                                <h3>Text responses</h3>
                                <ul>
                                    {data.text_responses.map(
                                        (answer, index) => (
                                            <li key={index}>
                                                {answer}
                                            </li>
                                        )
                                    )}
                                </ul>
                            </article>
                        )}
                    </section>
                )}
            </main>
        </>
    );

}


export default QuestionAnalytics;
