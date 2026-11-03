import { parseApiError } from "../utils/apiErrors";
const BASE_URL =
    import.meta.env?.VITE_API_URL ||
    "http://127.0.0.1:8001";

const TOKEN_KEY = "token";


export function getStoredToken() {

    return (
        localStorage.getItem(TOKEN_KEY) ||
        sessionStorage.getItem(TOKEN_KEY)
    );

}


export function saveToken(token, rememberMe = false) {

    const selectedStorage =
        rememberMe
            ? localStorage
            : sessionStorage;

    const otherStorage =
        rememberMe
            ? sessionStorage
            : localStorage;

    otherStorage.removeItem(TOKEN_KEY);
    selectedStorage.setItem(TOKEN_KEY, token);

}


export function clearStoredToken() {

    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);

}


/* Build request headers */
function headers(json = false) {

    const token =
        getStoredToken();

    return {
        ...(json
            ? {
                "Content-Type":
                    "application/json",
            }
            : {}
        ),

        ...(token
            ? {
                Authorization:
                    `Bearer ${token}`,
            }
            : {}
        ),
    };

}


/* Handle expired or invalid login session */
function handleUnauthorized() {

    // Remove only authentication data
    clearStoredToken();

    // Send protected pages back to login
    if (
        window.location.pathname !==
        "/login"
    ) {
        window.location.replace(
            "/login"
        );
    }

}


/* Shared API request handler */
async function request(
    path,
    options = {}
) {

    const response =
        await fetch(
            `${BASE_URL}${path}`,
            {
                ...options,

                headers: {
                    ...headers(
                        Boolean(
                            options.body
                        )
                    ),

                    ...options.headers,
                },
            }
        );


    const data =
        await response
            .json()
            .catch(() => null);


    // Session expired or token is invalid
    if (response.status === 401) {

        handleUnauthorized();

        const error =
            new Error(
                data?.detail ||
                "Your session has expired. Please log in again."
            );

        error.status = 401;

        throw error;
    }


    if (response.status === 403) window.dispatchEvent(new Event("permissions-changed"));

    // Handle other API errors
    if (!response.ok) {

        const parsed = parseApiError(data?.detail, "Request failed. Please try again.");
        const error = new Error(parsed.message);
        error.fieldErrors = parsed.fields;

        // Keep status for page-specific handling
        error.status =
            response.status;

        throw error;
    }


    return data;

}


/* =========================================
   Authentication
========================================= */

export async function loginUser(
    loginData
) {

    const body =
        new URLSearchParams({
            username:
                loginData.email,

            password:
                loginData.password,
        });


    const response =
        await fetch(
            `${BASE_URL}/users/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded",
                },

                body,
            }
        );


    const data =
        await response
            .json()
            .catch(() => null);


    if (!response.ok) {

        throw new Error(
            data?.detail ||
            "Invalid email or password"
        );

    }


    return data;

}


/* =========================================
   Users
========================================= */

export const getCurrentUser = () =>
    request("/users/me");


export const changePassword = (data) =>
    request(
        "/users/me/password",
        {
            method: "PUT",

            body:
                JSON.stringify(data),
        }
    );


export const getUsers = () =>
    request("/users/");

export const deleteUser = (id) =>
    request(`/users/${id}`, { method: "DELETE" });


/* =========================================
   Surveys
========================================= */

export const getSurveys = () =>
    request("/surveys/");


export const getSurvey = (id) =>
    request(
        `/surveys/${id}`
    );


export const createSurvey = (data) =>
    request(
        "/surveys/",
        {
            method: "POST",

            body:
                JSON.stringify(data),
        }
    );


export const updateSurvey = (
    id,
    data
) =>
    request(
        `/surveys/${id}`,
        {
            method: "PUT",

            body:
                JSON.stringify(data),
        }
    );


export const deleteSurvey = (id) =>
    request(
        `/surveys/${id}`,
        {
            method: "DELETE",
        }
    );


/* Publish survey */
export const publishSurvey = (id) =>
    request(
        `/surveys/${id}/publish`,
        {
            method: "PUT",
        }
    );


/* Unpublish survey */
export const unpublishSurvey = (id) =>
    request(
        `/surveys/${id}/unpublish`,
        {
            method: "PUT",
        }
    );


/* =========================================
   Survey Questions
========================================= */

/* Public survey questions */
export const getSurveyQuestions = (id) =>
    request(
        `/surveys/${id}/questions`
    );


/* Admin preview and management */
export const getAdminSurveyQuestions = (
    id
) =>
    request(
        `/surveys/${id}/questions/admin`
    );


/* =========================================
   Questions
========================================= */

export const createQuestion = (data) =>
    request(
        "/questions/",
        {
            method: "POST",

            body:
                JSON.stringify(data),
        }
    );


export const updateQuestion = (
    id,
    data
) =>
    request(
        `/questions/${id}`,
        {
            method: "PUT",

            body:
                JSON.stringify(data),
        }
    );


export const deleteQuestion = (id) =>
    request(
        `/questions/${id}`,
        {
            method: "DELETE",
        }
    );


/* =========================================
   Responses
========================================= */

export const getResponses = () =>
    request("/responses/");


export const getSurveyResponses = (id) =>
    request(
        `/surveys/${id}/responses`
    );


/* Submit anonymous survey */
export const submitSurvey = (
    id,
    submissionId,
    answers
) =>
    request(
        `/surveys/${id}/submit`,
        {
            method: "POST",

            body:
                JSON.stringify({
                    submission_id:
                        submissionId,

                    answers,
                }),
        }
    );


/* =========================================
   Analytics
========================================= */

export const getSurveyAnalytics = (id) =>
    request(
        `/surveys/${id}/analytics`
    );


export const getQuestionAnalytics = (id) =>
    request(
        `/questions/${id}/analytics`
    );


/* Export survey analytics */
export async function exportSurveyAnalytics(
    id
) {

    const response =
        await fetch(
            `${BASE_URL}/surveys/${id}/export`,
            {
                method: "GET",

                headers:
                    headers(),
            }
        );


    // Handle expired token during export
    if (response.status === 401) {

        handleUnauthorized();

        const error =
            new Error(
                "Your session has expired. Please log in again."
            );

        error.status = 401;

        throw error;
    }


    if (!response.ok) {

        const data =
            await response
                .json()
                .catch(() => null);


        const error =
            new Error(
                data?.detail ||
                "Failed to export survey analytics"
            );

        error.status =
            response.status;

        throw error;
    }


    return response.blob();

}


export default BASE_URL;

// Dynamic roles and assignments.
export const getRoles = () => request("/roles/");
export const getPermissions = () => request("/roles/permissions");
export const createRole = (data) => request("/roles/", { method: "POST", body: JSON.stringify(data) });
export const updateRole = (id, data) => request(`/roles/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteRole = (id) => request(`/roles/${id}`, { method: "DELETE" });
export const createUser = (data) => request("/users/", { method: "POST", body: JSON.stringify(data) });
export const assignUserRole = (id, roleId) => request(`/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role_id: roleId }) });

export const updateUser = (id, data) => request(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) });
