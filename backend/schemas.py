from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth Schemas
class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: str

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    user: UserOut
    token: str

# Book Schemas
class BookCreate(BaseModel):
    title: str
    author: str
    genre: str
    year: int
    description: str
    condition: str
    pickupLocation: str

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    genre: Optional[str] = None
    year: Optional[int] = None
    description: Optional[str] = None
    condition: Optional[str] = None
    pickupLocation: Optional[str] = None

class BookOut(BaseModel):
    id: str
    title: str
    author: str
    genre: str
    year: int
    description: str
    condition: str
    pickupLocation: str
    status: str
    ownerId: str
    ownerName: str
    createdAt: str

# Exchange / Booking Schemas
class ExchangeStatusUpdate(BaseModel):
    status: str

class ExchangeOut(BaseModel):
    id: str
    bookId: str
    bookTitle: str
    ownerId: str
    ownerName: str
    recipientId: str
    recipientName: str
    bookingDate: str
    completionDate: Optional[str] = None
    status: str

# Stats Schemas
class GenreStat(BaseModel):
    genre: str
    count: int

class StatsOut(BaseModel):
    totalBooks: int
    availableBooks: int
    bookedBooks: int
    completedExchanges: int
    totalUsers: int
    genreDistribution: List[GenreStat]
