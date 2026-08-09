import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSurveys } from "../services/api";
function SurveyList() { const [surveys, setSurveys] = useState([]); useEffect(() => { getSurveys().then(setSurveys); }, []); return <main className="page"><h1>Surveys</h1><div className="analytics-grid">{surveys.map((survey) => <article className="analytics-card" key={survey.id}><h3>{survey.title}</h3><p>{survey.description}</p><p>{survey.is_published ? "Published" : "Draft"}</p><Link to={`/surveys/${survey.id}`}>Open survey →</Link></article>)}</div></main>; }
export default SurveyList;
