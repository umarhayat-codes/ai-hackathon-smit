from typing_extensions import Annotated
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    firstName : Annotated[str,Field(min_length=3, max_length=50)]
    email: Annotated[str,Field(pattern=r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')]
    password: Annotated[str,Field(min_length=6)]

class UserLogin(BaseModel):
    email : str
    password : str
    