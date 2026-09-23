from sqlalchemy import Column, Integer, String
from app.database.database import Base
from sqlalchemy.orm import relationship

from app.models.role_permission import role_permissions

class Permission(Base):
    __tablename__= "permissions"
    id = Column(Integer,primary_key=True,index=True)
    key = Column(String(100),unique=True,nullable=False)
    description = Column(String(255),nullable=False)
    roles = relationship("Role",secondary=role_permissions,back_populates="permissions",)