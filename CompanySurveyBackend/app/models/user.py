from sqlalchemy import Column, Integer, String, Boolean, DateTime,ForeignKey
from app.database.database import Base
from datetime import datetime
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(10), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    # Legacy display value retained for migration rollback, never authorization.
    role = Column(String(50), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False, index=True)
    assigned_role = relationship("Role", back_populates="users")
    department = Column(String(100), nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    surveys = relationship("Survey", back_populates="creator")
    responses = relationship("Response", back_populates="user")

    @property
    def role_name(self):
        return self.assigned_role.role_name if self.assigned_role else ""

    @property
    def permissions(self):
        if not self.is_active or not self.assigned_role:
            return []
        return sorted(permission.key for permission in self.assigned_role.permissions)
