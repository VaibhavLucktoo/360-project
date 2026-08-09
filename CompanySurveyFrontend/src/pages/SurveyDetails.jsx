import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getSurvey } from "../services/api";
import { getCurrentUser } from "../services/api";

function SurveyDetails() {
    const { id } = useParams();
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        async function fetchSurvey() {
            try {
                const [surveyData, currentUser] = await Promise.all([getSurvey(id), getCurrentUser()]);
                setSurvey(surveyData);
                setIsAdmin(currentUser.role?.toLowerCase() === "admin");
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        fetchSurvey();
    }, [id]);

    if (loading) {
        return <div><h1>Survey Details</h1><p>Loading...</p></div>;
    }

    if (!survey) {
        return <div><h1>Survey Details</h1><p>Survey not found.</p></div>;
    }

    return (
        <div>
            <h1>Survey Details</h1>
            <p><strong>Title:</strong> {survey.title}</p>
            <p><strong>Description:</strong> {survey.description}</p>
            <p><strong>Status:</strong> {survey.is_published ? "Published" : "Draft"}</p>
            {isAdmin ? <p><Link to={`/surveys/${id}/questions`}>Manage questions</Link> · <Link to={`/surveys/${id}/preview`}>Preview</Link> · <Link to={`/surveys/${id}/analytics`}>View analytics</Link></p> : <p><Link to={`/surveys/${id}/take`}>Take survey</Link></p>}
        </div>
    );
}

export default SurveyDetails;

