const BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000";


/* Build request headers */
function headers(json = false) {

    const token =
        localStorage.getItem("token");

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
    localStorage.removeItem("token");

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


    // Handle other API errors
    if (!response.ok) {

        const error =
            new Error(
                data?.detail ||
                "Request failed"
            );

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


export const getUsers = () =>
    request("/users/");


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