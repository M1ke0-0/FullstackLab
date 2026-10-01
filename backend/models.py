import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    books = relationship("Book", back_populates="owner", cascade="all, delete-orphan")
    as_owner_exchanges = relationship("Booking", foreign_keys="[Booking.owner_id]", back_populates="owner", cascade="all, delete-orphan")
    as_recipient_exchanges = relationship("Booking", foreign_keys="[Booking.recipient_id]", back_populates="recipient", cascade="all, delete-orphan")

class Book(Base):
    __tablename__ = "books"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    genre = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    description = Column(String, nullable=False)
    condition = Column(String, nullable=False)
    pickup_location = Column(String, nullable=False)
    status = Column(String, default="Доступна")  # "Доступна" | "Забронирована" | "Выдана" | "Возвращена"
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="books")
    exchanges = relationship("Booking", back_populates="book", cascade="all, delete-orphan")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, default=generate_uuid)
    book_id = Column(String, ForeignKey("books.id"), nullable=False)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(String, ForeignKey("users.id"), nullable=False)
    booking_date = Column(DateTime, default=datetime.utcnow)
    completion_date = Column(DateTime, nullable=True)
    status = Column(String, default="Забронирована")
    created_at = Column(DateTime, default=datetime.utcnow)

    book = relationship("Book", back_populates="exchanges")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="as_owner_exchanges")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="as_recipient_exchanges")
