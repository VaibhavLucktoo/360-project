"""Actions implemented by the API. Role names never grant permissions."""

PERMISSIONS = {
    "survey.view": "View all surveys, including drafts, and preview questions",
    "survey.create": "Create surveys",
    "survey.edit": "Edit surveys and manage their questions",
    "survey.delete": "Delete surveys",
    "survey.publish": "Publish and unpublish surveys",
    "response.view": "View survey responses",
    "response.edit": "Edit responses",
    "response.delete": "Delete responses",
    "response.export": "Export survey responses to CSV",
    "analytics.view": "View survey and question analytics",
    "user.manage": "Create, edit, delete users and assign their roles",
    "role.manage": "Create, edit and delete roles and assign permissions",
}

# These actions need survey metadata, not necessarily response contents.
SURVEY_ACCESS = frozenset(key for key in PERMISSIONS if key.startswith("survey.")) | {
    "response.view", "response.edit", "response.delete", "response.export", "analytics.view",
}
