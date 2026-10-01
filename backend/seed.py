from datetime import datetime
from database import engine, SessionLocal, Base
import models
from auth import hash_password

def seed_db():
    print("Creating tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding database...")
        default_pwd = hash_password("password123")

        # Create Users
        u1 = models.User(id="u1", name="Анна Смирнова", email="anna@example.com", password=default_pwd)
        u2 = models.User(id="u2", name="Алексей Иванов", email="alexey@example.com", password=default_pwd)
        u3 = models.User(id="u3", name="Елена Петрова", email="elena@example.com", password=default_pwd)

        db.add_all([u1, u2, u3])
        db.commit()

        # Create Books
        b1 = models.Book(
            id="b1",
            title="Мастер и Маргарита",
            author="Михаил Булгаков",
            genre="Классика",
            year=1967,
            description="Знаменитый роман о визите дьявола в советскую Москву и истории любви Мастера и Маргариты.",
            condition="Отличное",
            pickup_location="Москва, м. Университет, Главное здание МГУ",
            status="Доступна",
            owner_id=u1.id
        )

        b2 = models.Book(
            id="b2",
            title="Чистый код",
            author="Роберт Мартин",
            genre="Программирование",
            year=2008,
            description="Создание, анализ и рефакторинг. Практическое руководство для разработчиков.",
            condition="Хорошее",
            pickup_location="Москва, м. Бауманская",
            status="Забронирована",
            owner_id=u2.id
        )

        b3 = models.Book(
            id="b3",
            title="Дюна",
            author="Фрэнк Герберт",
            genre="Фантастика",
            year=1965,
            description="Эпическая научно-фантастическая saga о пустынной планете Арракис.",
            condition="Новое",
            pickup_location="Санкт-Петербург, м. Невский проспект",
            status="Доступна",
            owner_id=u1.id
        )

        b4 = models.Book(
            id="b4",
            title="1984",
            author="Джордж Оруэлл",
            genre="Антиутопия",
            year=1949,
            description="Культовый роман-антиутопия о тоталитарном обществе и контроле над разумом.",
            condition="Хорошее",
            pickup_location="Москва, м. Китай-город",
            status="Выдана",
            owner_id=u3.id
        )

        b5 = models.Book(
            id="b5",
            title="Цветы для Элджернона",
            author="Дэниел Киз",
            genre="Фантастика",
            year=1966,
            description="Трогательная история умственно отсталого Чарли Гордона, участвующего в эксперименте.",
            condition="Отличное",
            pickup_location="Москва, м. Сокол",
            status="Возвращена",
            owner_id=u2.id
        )

        db.add_all([b1, b2, b3, b4, b5])
        db.commit()

        # Create Bookings
        ex1 = models.Booking(
            id="ex1",
            book_id=b2.id,
            owner_id=u2.id,
            recipient_id=u1.id,
            status="Забронирована",
            booking_date=datetime(2026, 9, 25, 10, 0, 0)
        )

        ex2 = models.Booking(
            id="ex2",
            book_id=b4.id,
            owner_id=u3.id,
            recipient_id=u2.id,
            status="Выдана",
            booking_date=datetime(2026, 9, 20, 14, 30, 0)
        )

        ex3 = models.Booking(
            id="ex3",
            book_id=b5.id,
            owner_id=u2.id,
            recipient_id=u3.id,
            status="Возвращена",
            booking_date=datetime(2026, 9, 10, 12, 0, 0),
            completion_date=datetime(2026, 9, 18, 16, 0, 0)
        )

        db.add_all([ex1, ex2, ex3])
        db.commit()

        print("Python Database seeding completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
