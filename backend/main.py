from typing import Optional, List
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import engine, get_db, Base
import models
import schemas
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BookShare API",
    description="Python FastAPI REST Backend for BookShare Platform",
    version="1.0.0"
)

# Enable CORS for Frontend React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat(), "server": "FastAPI Python"}

# ================= AUTH ENDPOINTS =================

@app.post("/api/auth/register", response_model=schemas.AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(data: schemas.UserRegister, db: Session = Depends(get_db)):
    if not data.name or not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Заполните имя, email и пароль")

    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже зарегистрирован")

    hashed_pwd = hash_password(data.password)
    user = models.User(name=data.name, email=data.email, password=hashed_pwd)
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"id": user.id, "email": user.email, "name": user.name})
    return {
        "user": {"id": user.id, "name": user.name, "email": user.email},
        "token": token,
    }

@app.post("/api/auth/login", response_model=schemas.AuthResponse)
def login_user(data: schemas.UserLogin, db: Session = Depends(get_db)):
    if not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Введите email и пароль")

    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=400, detail="Неверный email или пароль")

    token = create_access_token({"id": user.id, "email": user.email, "name": user.name})
    return {
        "user": {"id": user.id, "name": user.name, "email": user.email},
        "token": token,
    }

@app.get("/api/auth/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
        }
    }

# ================= BOOKS ENDPOINTS =================

@app.get("/api/books", response_model=List[schemas.BookOut])
def get_books(
    search: Optional[str] = Query(None),
    genre: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Book)

    if genre and genre != "Все":
        query = query.filter(models.Book.genre == genre)

    if status_filter and status_filter != "Все":
        query = query.filter(models.Book.status == status_filter)

    if search:
        search_pattern = f"%{search.lower()}%"
        query = query.filter(
            or_(
                models.Book.title.ilike(search_pattern),
                models.Book.author.ilike(search_pattern),
                models.Book.description.ilike(search_pattern),
            )
        )

    books = query.order_by(models.Book.created_at.desc()).all()

    res = []
    for b in books:
        res.append({
            "id": b.id,
            "title": b.title,
            "author": b.author,
            "genre": b.genre,
            "year": b.year,
            "description": b.description,
            "condition": b.condition,
            "pickupLocation": b.pickup_location,
            "status": b.status,
            "ownerId": b.owner_id,
            "ownerName": b.owner.name if b.owner else "Неизвестен",
            "createdAt": b.created_at.isoformat(),
        })
    return res

@app.get("/api/books/{book_id}", response_model=schemas.BookOut)
def get_book(book_id: str, db: Session = Depends(get_db)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")

    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "genre": book.genre,
        "year": book.year,
        "description": book.description,
        "condition": book.condition,
        "pickupLocation": book.pickup_location,
        "status": book.status,
        "ownerId": book.owner_id,
        "ownerName": book.owner.name if book.owner else "Неизвестен",
        "createdAt": book.created_at.isoformat(),
    }

@app.post("/api/books", response_model=schemas.BookOut, status_code=status.HTTP_201_CREATED)
def create_book(
    data: schemas.BookCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_book = models.Book(
        title=data.title,
        author=data.author,
        genre=data.genre,
        year=data.year,
        description=data.description,
        condition=data.condition,
        pickup_location=data.pickupLocation,
        status="Доступна",
        owner_id=current_user.id
    )
    db.add(new_book)
    db.commit()
    db.refresh(new_book)

    return {
        "id": new_book.id,
        "title": new_book.title,
        "author": new_book.author,
        "genre": new_book.genre,
        "year": new_book.year,
        "description": new_book.description,
        "condition": new_book.condition,
        "pickupLocation": new_book.pickup_location,
        "status": new_book.status,
        "ownerId": new_book.owner_id,
        "ownerName": current_user.name,
        "createdAt": new_book.created_at.isoformat(),
    }

@app.put("/api/books/{book_id}", response_model=schemas.BookOut)
def update_book(
    book_id: str,
    data: schemas.BookUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")

    if book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы не можете редактировать чужую книгу")

    if data.title is not None: book.title = data.title
    if data.author is not None: book.author = data.author
    if data.genre is not None: book.genre = data.genre
    if data.year is not None: book.year = data.year
    if data.description is not None: book.description = data.description
    if data.condition is not None: book.condition = data.condition
    if data.pickupLocation is not None: book.pickup_location = data.pickupLocation

    db.commit()
    db.refresh(book)

    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "genre": book.genre,
        "year": book.year,
        "description": book.description,
        "condition": book.condition,
        "pickupLocation": book.pickup_location,
        "status": book.status,
        "ownerId": book.owner_id,
        "ownerName": current_user.name,
        "createdAt": book.created_at.isoformat(),
    }

@app.delete("/api/books/{book_id}")
def delete_book(
    book_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")

    if book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы не можете удалить чужую книгу")

    db.delete(book)
    db.commit()
    return {"message": "Книга успешно удалена"}

# ================= EXCHANGES / BOOKINGS ENDPOINTS =================

@app.post("/api/exchanges/book/{book_id}", response_model=schemas.ExchangeOut, status_code=status.HTTP_201_CREATED)
def book_a_book(
    book_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")

    if book.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="Вы не можете забронировать собственную книгу")

    if book.status != "Доступна":
        raise HTTPException(status_code=400, detail=f"Книга недоступна для бронирования (статус: {book.status})")

    book.status = "Забронирована"

    booking = models.Booking(
        book_id=book.id,
        owner_id=book.owner_id,
        recipient_id=current_user.id,
        status="Забронирована"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    owner = db.query(models.User).filter(models.User.id == book.owner_id).first()

    return {
        "id": booking.id,
        "bookId": booking.book_id,
        "bookTitle": book.title,
        "ownerId": booking.owner_id,
        "ownerName": owner.name if owner else "Владелец",
        "recipientId": booking.recipient_id,
        "recipientName": current_user.name,
        "bookingDate": booking.booking_date.isoformat(),
        "completionDate": booking.completion_date.isoformat() if booking.completion_date else None,
        "status": booking.status,
    }

@app.patch("/api/exchanges/{exchange_id}/status", response_model=schemas.ExchangeOut)
def update_exchange_status(
    exchange_id: str,
    data: schemas.ExchangeStatusUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    valid_statuses = ["Доступна", "Забронирована", "Выдана", "Возвращена"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Некорректный статус обмена")

    booking = db.query(models.Booking).filter(models.Booking.id == exchange_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Запись обмена не найдена")

    if booking.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Только владелец книги может изменять статус обмена")

    booking.status = data.status
    if data.status == "Возвращена":
        booking.completion_date = datetime.utcnow()

    # Sync status to book
    book = db.query(models.Book).filter(models.Book.id == booking.book_id).first()
    if book:
        book.status = "Возвращена" if data.status == "Возвращена" else data.status

    db.commit()
    db.refresh(booking)

    recipient = db.query(models.User).filter(models.User.id == booking.recipient_id).first()

    return {
        "id": booking.id,
        "bookId": booking.book_id,
        "bookTitle": book.title if book else "Книга",
        "ownerId": booking.owner_id,
        "ownerName": current_user.name,
        "recipientId": booking.recipient_id,
        "recipientName": recipient.name if recipient else "Получатель",
        "bookingDate": booking.booking_date.isoformat(),
        "completionDate": booking.completion_date.isoformat() if booking.completion_date else None,
        "status": booking.status,
    }

@app.get("/api/exchanges/history", response_model=List[schemas.ExchangeOut])
def get_exchange_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookings = db.query(models.Booking).filter(
        or_(
            models.Booking.owner_id == current_user.id,
            models.Booking.recipient_id == current_user.id
        )
    ).order_by(models.Booking.booking_date.desc()).all()

    res = []
    for b in bookings:
        res.append({
            "id": b.id,
            "bookId": b.book_id,
            "bookTitle": b.book.title if b.book else "Книга",
            "ownerId": b.owner_id,
            "ownerName": b.owner.name if b.owner else "Владелец",
            "recipientId": b.recipient_id,
            "recipientName": b.recipient.name if b.recipient else "Получатель",
            "bookingDate": b.booking_date.isoformat(),
            "completionDate": b.completion_date.isoformat() if b.completion_date else None,
            "status": b.status,
        })
    return res

# ================= STATS ENDPOINT =================

@app.get("/api/stats", response_model=schemas.StatsOut)
def get_stats(db: Session = Depends(get_db)):
    total_books = db.query(models.Book).count()
    available_books = db.query(models.Book).filter(models.Book.status == "Доступна").count()
    booked_books = db.query(models.Book).filter(models.Book.status == "Забронирована").count()
    completed_exchanges = db.query(models.Booking).filter(models.Booking.status == "Возвращена").count()
    total_users = db.query(models.User).count()

    books = db.query(models.Book.genre).all()
    genre_counts = {}
    for (g,) in books:
        genre_counts[g] = genre_counts.get(g, 0) + 1

    genre_distribution = [
        {"genre": g, "count": cnt} for g, cnt in genre_counts.items()
    ]

    return {
        "totalBooks": total_books,
        "availableBooks": available_books,
        "bookedBooks": booked_books,
        "completedExchanges": completed_exchanges,
        "totalUsers": total_users,
        "genreDistribution": genre_distribution,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5001, reload=True)
