# Dynamic roles and permissions

Users have one assigned role. Roles contain any combination of supported permissions.
Role names are labels and never grant access on their own.

## Use the application

The sidebar has separate **Roles** and **Users** entries.

1. Open **Roles**, select **New role**, enter a name, choose permissions, and save.
2. Open **Users**, select **New user**, complete the account details, choose a role, and save.
3. Use the compact pencil button to edit a role or user. The user form updates employee ID,
   name, email, department, role, and active status.
4. Use the trash button to delete, then confirm the named account or role.

The Roles page requires `role.manage`; Users requires `user.manage`. A user manager can
select existing roles without permission to edit them. Old `/access` bookmarks redirect
to an available management page.

Editing a role immediately changes backend access for its users. The frontend refreshes
on navigation, window focus, permission errors, and every minute. If a change removes
your own page permission, you return to an accessible page. Deleting or deactivating your
own account signs you out after a successful operation.

Assigned roles cannot be deleted. Users who own surveys cannot be deleted; deactivate them
instead to preserve their surveys. Deleting other users preserves their response rows and
removes the user link. The last active access administrator cannot be deleted, deactivated,
or demoted.

A role without permissions can still log in, update its own password, and see published
surveys. Public survey links continue to accept anonymous submissions without login.

## Permission scope

Permissions apply to all surveys, not only surveys created by the user.
Survey actions, response actions, and analytics access also allow reading draft survey
metadata and previewing questions. This is necessary to select the survey on which to act.
They do not automatically grant response reading, exporting, or analytics access.

- `survey.view`: survey directory, draft details, and preview.
- `survey.create`: create a draft.
- `survey.edit`: update survey details and add/edit/delete questions.
- `survey.publish`: publish and unpublish.
- `survey.delete`: delete surveys.
- `response.view`: read individual response data.
- `response.edit`, `response.delete`: existing response mutation API endpoints.
- `response.export`: export CSV from survey details or analytics.
- `analytics.view`: analytics, including aggregated answers and text responses.
- `user.manage`: manage users and assign ANY role, including a privileged role.
- `role.manage`: manage roles and assign ANY supported permission.

The last two permissions are trusted access-administration capabilities. Keep at least one
active user with both. The API prevents deleting or demoting the last such user and rejects
role edits that would remove this capability. Assigned roles cannot be deleted.

## Backend architecture

- Models: `User.role_id → Role → role_permissions → Permission`.
- Pydantic schemas validate role names, positive IDs, and duplicate permission IDs.
- Services check referenced IDs, role-name uniqueness, and last-manager protection.
- Routes enforce `require_permission("action.key")` against the current database user.
- `GET /users/me` returns `role` (display name), `role_id`, and `permissions`.
- User creation/update requests now require `role_id`, not a role-name string.
- `PUT /users/{id}/role` assigns an existing role.
- `GET /roles/` lists roles for users with role or user management access.
- `GET /roles/permissions` lists the permission catalog for role managers.
- `GET /roles/{id}`, `POST /roles/`, `PUT /roles/{id}`, `DELETE /roles/{id}` manage roles.
- `GET /users/{id}`, `POST /users/`, `PUT /users/{id}`, `DELETE /users/{id}` manage users.
- User updates accept `employee_id` and `is_active`; omitted values remain unchanged.
- Role updates require an explicit `permission_ids` list to avoid accidental revocation.

Permission keys are defined in code because each key must correspond to an implemented
action. Adding an action requires a catalog change, a migration to insert its permission,
and the corresponding route/UI checks. There is no arbitrary permission-creation endpoint.

## Validation

Both forms show field-level errors and block invalid submissions. Backend validation remains
authoritative for direct API calls and changes made by another administrator.

- Names and departments are trimmed, required, length-limited, and reject control characters.
- Employee IDs are 1?10 characters without spaces; email and employee ID uniqueness checks
  are case insensitive. Emails are trimmed and normalized; login is case insensitive.
- New passwords require at least 8 characters, no whitespace, and at most 72 UTF-8 bytes
  to prevent bcrypt truncation. Existing passwords are not returned by the API.
- Role and permission IDs must be positive 32-bit integers. Referenced records must exist.
- Account status must be a boolean. Extra request fields, duplicate permission IDs, unknown
  permissions, blank role names, and duplicate role names are rejected.
- Failed changes roll back. Permission checks, last-administrator protection, and ownership
  constraints apply regardless of visible buttons.
- Submit buttons are disabled while saving, and an in-flight guard prevents duplicate requests.
  Failed loads offer Retry; API field errors are mapped back to inputs.

## Database rollout

From `CompanySurveyBackend`, using the backend virtual environment:

```powershell
python -m scripts.check_role_migration
python -m alembic upgrade head
```

Revision `20260922_05` seeds the permission catalog, merges legacy role-name case variants,
assigns every existing user to a role, and grants all permissions to the existing admin role.
Employee, manager, and other legacy roles receive no management permissions.
The legacy `users.role` column remains synchronized for rollback compatibility; it is never
used for authorization. New assignments use a required foreign key.

Run migrations before starting the updated backend. An existing active admin is needed to
configure access. For a fresh database, use the interactive bootstrap command:
`python -m scripts.bootstrap_access`. It only runs when no active access manager exists.

Downgrading revision 05 removes permission assignments. Custom-role users become employees
for compatibility with the old application; downgrade is not a way to preserve RBAC settings.

## Checks

```powershell
python -m pytest -q -p no:cacheprovider
```

From `CompanySurveyFrontend`: `npm test`, `npm run lint`, and `npm run build`.

The CRUD suite uses isolated test data. It covers role/user lifecycle, login and inactive
accounts, last-manager protection, duplicate values, invalid fields/IDs, independent
management permissions, and preserving survey/response data during account changes.
