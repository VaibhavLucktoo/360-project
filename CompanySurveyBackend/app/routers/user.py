from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session  
from app.database.database import get_db
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user_services import create_user,get_all_users,get_user_by_id,update_user,delete_user,login_user
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.token import Token
from app.dependencies.permissions import require_admin
from app.auth.auth import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/me",response_model= UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
       return current_user


@router.get("/", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return get_all_users(db)

@router.get("/{user_id}", response_model = UserResponse)
def get_user(user_id: int , db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
             return get_user_by_id(db,user_id)

@router.post("/",response_model=UserResponse)
def add_user(user: UserCreate,db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return create_user(db,user)

@router.put("/{user_id}",response_model=UserResponse)
def update_existing_user(
       user_id: int,
       user: UserUpdate,
       db: Session = Depends(get_db), current_user: User = Depends(require_admin)
):
       updated_user = update_user(db,user_id,user)
       if updated_user is None:
              raise HTTPException(status_code = 404,detail= "User not found")
       
       return updated_user

@router.delete("/{user_id}")
def delete_existing_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
       deleted_user = delete_user(db,user_id)
       if deleted_user is None:
              raise HTTPException(
                     status_code= 404,
                     detail = "User not Found"
              )
       return{
              "message":"User deleted successfully"
       }
       
@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm =  Depends(),db: Session =Depends(get_db)):
       token = login_user(db,form_data)

       if token is None:
              
              raise HTTPException(
                     
                     status_code= 401,
                     detail =  "Invalid email or password"
              )
       
       return token



