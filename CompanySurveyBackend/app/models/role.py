from sqlalchemy import Column, Integer, String, Index, func
from sqlalchemy.orm import relationship

from app.database.database import Base
from app.models.role_permission import role_permissions


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(50), unique=True, nullable=False)
    __table_args__ = (Index("uq_roles_name_lower", func.lower(role_name), unique=True),)
    users = relationship("User", back_populates="assigned_role", passive_deletes="all")

    permissions = relationship(
        "Permission",
        secondary=role_permissions,
        back_populates="roles",
    )
