import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getQuestionAnalytics } from "../services/api";

function QuestionAnalytics() {
  const { id } = useParams(); const [data, setData] = useState(null); const [error, setError] = useState("");
  useEffect(() => { getQuestionAnalytics(id).then(setData).catch((e) => setError(e.message)); }, [id]);
  if (error) return <main className="page"><p className="error">{error}</p></main>;
  if (!data) return <main className="page">Loading question analysis…</main>;
  return <main className="page"><h1>Question analysis</h1><h2>{data.question}</h2><p>{data.total_responses} answers</p>
    {data.average_rating !== null && <p className="metric">Average rating: {data.average_rating}/5</p>}
    {data.answer_breakdown && <ul>{Object.entries(data.answer_breakdown).map(([answer, count]) => <li key={answer}>{answer}: <b>{count}</b></li>)}</ul>}
    {data.text_responses && <ul>{data.text_responses.map((answer, index) => <li key={index}>{answer}</li>)}</ul>}
  </main>;
}
export default QuestionAnalytics;
