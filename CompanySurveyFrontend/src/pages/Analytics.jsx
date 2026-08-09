import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSurveyAnalytics } from "../services/api";

function Analytics() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const result = await getSurveyAnalytics(id);
        setData(result);
      } catch (err) {
        setError(err.message || "Failed to load analytics.");
      }
    }

    fetchAnalytics();
  }, [id]);

  if (error) {
    return (
      <div>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return <p>Loading analytics...</p>;
  }

  return (
    <div className="analytics-page">
      <Link to={`/surveys/${id}`}>← Back to Survey</Link>

      <h1>{data.survey_title} — Analytics</h1>

      <div className="analytics-summary">
        <p>
          <strong>Anonymous Submissions:</strong>{" "}
          {data.total_responses}
        </p>

        <p>
          <strong>Survey Status:</strong>{" "}
          {data.is_published ? "Published" : "Draft"}
        </p>

        <p>
          <strong>Overall Average Rating:</strong>{" "}
          {data.average_rating ?? "N/A"}
        </p>

        <p>
          Individual responses are displayed only in aggregate to protect
          respondent privacy.
        </p>
      </div>

      <hr />

      <h2>Question Analytics</h2>

      {data.questions.length === 0 ? (
        <p>No questions available.</p>
      ) : (
        data.questions.map((question, index) => (
          <div
            key={index}
            className="question-card"
            style={{
              border: "1px solid #ddd",
              padding: "16px",
              marginBottom: "16px",
              borderRadius: "8px",
            }}
          >
            <h3>{question.question}</h3>

            <p>
              <strong>Type:</strong> {question.question_type}
            </p>

            <p>
              <strong>Total Responses:</strong>{" "}
              {question.total_responses}
            </p>

            {question.question_type === "rating" ? (
              <p>
                <strong>Average Rating:</strong>{" "}
                {question.average_rating ?? "N/A"}
              </p>
            ) : (
              <>
                <strong>Responses:</strong>

                {question.text_responses &&
                question.text_responses.length > 0 ? (
                  <ul>
                    {question.text_responses.map((response, i) => (
                      <li key={i}>{response}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No text responses.</p>
                )}
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default Analytics;