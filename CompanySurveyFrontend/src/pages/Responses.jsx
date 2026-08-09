import { useEffect, useState } from "react";
import { getResponses } from "../services/api";
function Responses() { const [responses, setResponses] = useState([]); const [error, setError] = useState(""); useEffect(() => { getResponses().then(setResponses).catch((e) => setError(e.message)); }, []); return <main className="page"><h1>Responses</h1>{error ? <p className="error">{error}</p> : <table className="survey-table"><thead><tr><th>Survey</th><th>Question</th><th>Answer</th><th>Submitted</th></tr></thead><tbody>{responses.map((r) => <tr key={r.id}><td>{r.survey_id}</td><td>{r.question_id}</td><td>{r.answer}</td><td>{new Date(r.created_at).toLocaleString()}</td></tr>)}</tbody></table>}</main>; }
export default Responses;
