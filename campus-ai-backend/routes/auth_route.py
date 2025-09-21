from fastapi import APIRouter, Depends, HTTPException

from config.database import db_connection
from controller.user_controller import UserCreate, UserLogin
from util.auth_utils import create_access_token, verify_token


auth_router=APIRouter()

collection=db_connection()
if collection is not None:
    print("MongoDB Connection Successfully")
else:
    print("Error MongoDB Connection")

@auth_router.post("/register")
async def register(user: UserCreate):
    try:
        email_exit=collection.find_one({"email":user.email})
        if email_exit:
            raise HTTPException(status_code=400, detail="Email already exists")
        # hashed_password = get_hash_password(user.password)
        user_data = {
            "firstName": user.firstName,
            "email": user.email,
            "password": user.password
        }
        collection.insert_one(user_data)
        print("data",user_data)
        return {
            "status": "success",
            "data": {"email": user.email, "firstName": user.firstName}
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "data": None
        }




@auth_router.post("/login")
async def login(user: UserLogin):
    try:
        # Check if user exists
        db_user = collection.find_one({"email": user.email})
        print("user find",db_user)
        if not db_user:
            raise HTTPException(status_code=400, detail="Invalid email or password")
        if db_user['password']!=user.password:
            raise HTTPException(status_code=400, detail="Invalid password")
        # if not verify_password(user.password, db_user["password"]):
        #     raise HTTPException(status_code=400, detail="Invalid email or password")
        token=create_access_token(data={"email":db_user['email'],"firstName":db_user['firstName'],"id":str(db_user['_id'])})
        print('token')
        return {
            "status": "success",
            "message": "Login successful",
            "data": {"email": db_user["email"], "firstName": db_user['firstName']},
            "token":token
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "data": None
        }
    



@auth_router.get("/profile")
def get_profile(user_data: dict = Depends(verify_token)):
    return {"user": user_data}