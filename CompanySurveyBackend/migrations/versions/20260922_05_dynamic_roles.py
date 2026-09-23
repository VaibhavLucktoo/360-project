"""Introduce dynamic roles and backfill every existing user's role assignment."""

from alembic import op
import sqlalchemy as sa

revision = "20260922_05"
down_revision = "20260922_04"
branch_labels = None
depends_on = None

# Freeze migration data independently of future application changes.
CATALOG = {
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


def upgrade():
    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("key", sa.String(100), nullable=False, unique=True),
        sa.Column("description", sa.String(255), nullable=False),
    )
    op.create_index("ix_permissions_id", "permissions", ["id"])
    op.create_table(
        "role_permissions",
        sa.Column("role_id", sa.Integer(), sa.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("permission_id", sa.Integer(), sa.ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
    )
    op.add_column("users", sa.Column("role_id", sa.Integer(), nullable=True))
    bind = op.get_bind()
    permissions = sa.table("permissions", sa.column("key", sa.String), sa.column("description", sa.String))
    op.bulk_insert(permissions, [{"key": key, "description": description} for key, description in CATALOG.items()])
    # Normalize legacy role labels and merge case variants before making assignments.
    roles = bind.execute(sa.text("SELECT id, role_name FROM roles ORDER BY id")).all()
    names = {}
    for role_id, role_name in roles:
        normalized = role_name.strip().lower()
        if normalized in names:
            bind.execute(sa.text("DELETE FROM roles WHERE id=:id"), {"id": role_id})
        else:
            names[normalized] = role_id
    for name, role_id in names.items():
        bind.execute(sa.text("UPDATE roles SET role_name=:name WHERE id=:id"), {"name": name, "id": role_id})
    legacy_names = bind.execute(sa.text("SELECT DISTINCT lower(trim(role)) FROM users")).scalars().all()
    for name in sorted(set(legacy_names) | {"admin", "employee", "manager"}):
        if name not in names:
            names[name] = bind.execute(sa.text("INSERT INTO roles (role_name) VALUES (:name) RETURNING id"), {"name": name}).scalar_one()
    bind.execute(sa.text("UPDATE users SET role_id=roles.id FROM roles WHERE lower(trim(users.role))=roles.role_name"))
    for permission_id in bind.execute(sa.text("SELECT id FROM permissions")).scalars():
        bind.execute(sa.text("INSERT INTO role_permissions (role_id, permission_id) VALUES (:role, :permission)"),
                     {"role": names["admin"], "permission": permission_id})
    op.alter_column("users", "role", existing_type=sa.String(20), type_=sa.String(50), existing_nullable=False)
    op.alter_column("users", "role_id", existing_type=sa.Integer(), nullable=False)
    op.create_foreign_key("fk_users_role_id", "users", "roles", ["role_id"], ["id"], ondelete="RESTRICT")
    op.create_index("ix_users_role_id", "users", ["role_id"])
    op.create_index("uq_roles_name_lower", "roles", [sa.text("lower(role_name)")], unique=True)


def downgrade():
    bind = op.get_bind()
    # Keep the previous application usable: custom role users become respondents.
    bind.execute(sa.text("""UPDATE users SET role = CASE
        WHEN roles.role_name IN ('admin', 'employee', 'manager') THEN roles.role_name
        ELSE 'employee' END FROM roles WHERE users.role_id=roles.id"""))
    op.drop_index("uq_roles_name_lower", table_name="roles")
    op.drop_index("ix_users_role_id", table_name="users")
    op.drop_constraint("fk_users_role_id", "users", type_="foreignkey")
    op.drop_column("users", "role_id")
    op.alter_column("users", "role", existing_type=sa.String(50), type_=sa.String(20), existing_nullable=False)
    op.drop_table("role_permissions")
    op.drop_index("ix_permissions_id", table_name="permissions")
    op.drop_table("permissions")
