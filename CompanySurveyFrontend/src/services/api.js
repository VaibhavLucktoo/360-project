const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function headers(json = false) {
    const token = localStorage.getItem("token");
    return { ...(json ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function request(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, { ...options, headers: { ...headers(Boolean(options.body)), ...options.headers } });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.detail || "Request failed");
    return data;
}

export async function loginUser(loginData) {
    const body = new URLSearchParams({ username: loginData.email, password: loginData.password });
    const response = await fetch(`${BASE_URL}/users/login`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.detail || "Invalid email or password");
    return data;
}

export const getCurrentUser = () => request("/users/me");
export const getUsers = () => request("/users/");
export const getSurveys = () => request("/surveys/");
export const getSurvey = (id) => request(`/surveys/${id}`);
export const getResponses = () => request("/responses/");
export const getSurveyQuestions = (id) => request(`/surveys/${id}/questions`);
export const getSurveyAnalytics = (id) => request(`/surveys/${id}/analytics`);
export async function exportSurveyAnalytics(id) {

    const response = await fetch(
        `${BASE_URL}/surveys/${id}/export`,
        {
            method: "GET",
            headers: headers(),
        }
    );

    if (!response.ok) {

        const data = await response.json().catch(() => null);

        throw new Error(
            data?.detail || "Failed to export survey analytics"
        );
    }

    return response.blob();
}
export const getQuestionAnalytics = (id) => request(`/questions/${id}/analytics`);
export const getSurveyResponses = (id) => request(`/surveys/${id}/responses`);
export const createSurvey = (data) => request("/surveys/", { method: "POST", body: JSON.stringify(data) });
export const updateSurvey = (id, data) => request(`/surveys/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteSurvey = (id) => request(`/surveys/${id}`, { method: "DELETE" });
export const publishSurvey = (id) => request(`/surveys/${id}/publish`, { method: "PUT" });
export const createQuestion = (data) => request("/questions/", { method: "POST", body: JSON.stringify(data) });
export const updateQuestion = (id, data) => request(`/questions/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteQuestion = (id) => request(`/questions/${id}`, { method: "DELETE" });
export const submitSurvey = (id, answers) => request(`/surveys/${id}/submit`, { method: "POST", body: JSON.stringify({ answers }) });

export default BASE_URL;
