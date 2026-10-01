# 📚 Шпоргалка: Лабораторные работы №2-5 (BookShare)

## 📋 Структура лабораторных работ

### Лаба 1 ✅ (готово)
- Frontend на React + TypeScript
- UI/UX компоненты (каталог, фильтры, личный кабинет, статистика)

### Лаба 2️⃣ (Database Design)
### Лаба 3️⃣ (Backend API)
### Лаба 4️⃣ (Frontend-Backend Integration)
### Лаба 5️⃣ (Testing & Documentation)

---

## 🗄️ ЛАБА 2: Реляционная База Данных на Python

### Технологический стек:
- **Python 3.9+**
- **SQLAlchemy ORM** — для работы с БД
- **SQLite** — встроенная реляционная БД (файл `bookshare.db`)
- **bcrypt** — хеширование паролей

### Сущности (таблицы):

#### 1. **User** (Пользователи)
```
id (PRIMARY KEY)
name (VARCHAR) — имя пользователя
email (VARCHAR, UNIQUE) — уникальный email
password (VARCHAR) — хеш пароля (bcrypt)
created_at (DATETIME) — дата регистрации
```

#### 2. **Book** (Книги)
```
id (PRIMARY KEY)
title (VARCHAR) — название книги
author (VARCHAR) — автор
genre (VARCHAR) — жанр (Фантастика, Детектив, Научная фантастика и т.д.)
year (INTEGER) — год издания
description (TEXT) — описание книги
condition (VARCHAR) — состояние (Идеальное, Хорошее, Приемлемое, Плохое)
pickup_location (VARCHAR) — место передачи
status (VARCHAR) — статус (Доступна, Забронирована, Выдана, Возвращена)
owner_id (FOREIGN KEY → User.id) — кто владеет книгой

Индексы:
- на owner_id (внешний ключ)
- на status (для фильтрации)
- на genre (для фильтрации)
```

#### 3. **Booking** (Бронирования/Обмены)
```
id (PRIMARY KEY)
book_id (FOREIGN KEY → Book.id) — какую книгу бронируют
owner_id (FOREIGN KEY → User.id) — владелец книги
recipient_id (FOREIGN KEY → User.id) — кто забронировал
booking_date (DATETIME) — дата бронирования
completion_date (DATETIME) — дата завершения обмена
status (VARCHAR) — статус (Забронирована, Выдана, Возвращена, Завершена)

Связи:
- Одна книга может иметь несколько бронирований
- Один пользователь может забронировать несколько книг
- Один пользователь может быть владельцем нескольких книг
```

### Диаграмма связей (ER-модель):
```
User (1) ──────┐
               ├── Book (N) [owner_id]
               └── Booking (N) [recipient_id]

User (1) ──────┐
               └── Booking (N) [owner_id]

Book (1) ──────────── Booking (N) [book_id]
```

### Ключевые моменты при проектировании БД:
✅ **Foreign Keys** — связи между таблицами должны быть логичными  
✅ **UniqueConstrains** — email должен быть уникальным  
✅ **Индексы** — на часто фильтруемые поля (status, genre, owner_id)  
✅ **Каскадное удаление** — если удалить пользователя, удалить его книги  
✅ **Типы данных** — выбирать правильные (INTEGER для года, VARCHAR для строк)  

### Пример кода (SQLAlchemy моделей):
```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import bcrypt

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Book(Base):
    __tablename__ = "books"
    
    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    author = Column(String(100), nullable=False)
    genre = Column(String(50), nullable=False)
    year = Column(Integer)
    description = Column(String(1000))
    condition = Column(String(50), default="Хорошее")
    pickup_location = Column(String(200))
    status = Column(String(50), default="Доступна")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    booking_date = Column(DateTime, default=datetime.utcnow)
    completion_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="Забронирована")
```

### Seeding (Заполнение тестовыми данными):
- Создание 3+ тестовых пользователей с разными книгами
- Создание бронирований в разных статусах
- Использование bcrypt для хеширования паролей

---

## 🔌 ЛАБА 3: RESTful Backend API (FastAPI на Python)

### Технологический стек:
- **FastAPI** — современный веб-фреймворк
- **Uvicorn** — ASGI сервер (порт 5001)
- **PyJWT** — JWT токены для авторизации
- **Pydantic** — валидация данных
- **bcrypt** — хеширование паролей

### Основные API endpoints:

#### 🔐 **Аутентификация**
```
POST /api/auth/register
  Body: { "name": "Иван", "email": "ivan@ex.com", "password": "123456" }
  Response: { "id": 1, "name": "Иван", "email": "ivan@ex.com" }

POST /api/auth/login
  Body: { "email": "ivan@ex.com", "password": "123456" }
  Response: { "access_token": "JWT_TOKEN", "token_type": "bearer" }

GET /api/auth/me
  Headers: { "Authorization": "Bearer JWT_TOKEN" }
  Response: { "id": 1, "name": "Иван", "email": "ivan@ex.com", ... }
```

#### 📚 **Каталог книг**
```
GET /api/books
  Query: ?search=название&genre=Фантастика&status=Доступна
  Response: [ { "id": 1, "title": "...", "author": "...", ... }, ... ]

GET /api/books/:id
  Response: { "id": 1, "title": "...", "owner": { "id": 1, "name": "..." }, ... }

POST /api/books (требует авторизация)
  Headers: { "Authorization": "Bearer JWT_TOKEN" }
  Body: { "title": "...", "author": "...", "genre": "...", "year": 2020, ... }
  Response: { "id": 1, ... }

PUT /api/books/:id (только владелец)
  Body: { "title": "...", "description": "..." }
  Response: { "id": 1, ... }

DELETE /api/books/:id (только владелец)
  Response: { "message": "Book deleted" }
```

#### 📌 **Бронирования**
```
POST /api/exchanges/book/:bookId (требует авторизация)
  Действие: Забронировать книгу
  Response: { "id": 1, "book_id": 5, "status": "Забронирована" }

PATCH /api/exchanges/:id/status (только владелец)
  Body: { "status": "Выдана" }
  Доступные статусы: Забронирована → Выдана → Возвращена → Завершена
  Response: { "id": 1, "status": "Выдана" }

GET /api/exchanges/history (требует авторизация)
  Response: [ { "id": 1, "book_title": "...", "status": "...", ... }, ... ]
```

#### 📊 **Статистика**
```
GET /api/stats
  Response: {
    "total_books": 25,
    "available_books": 10,
    "booked_books": 5,
    "completed_exchanges": 8,
    "total_users": 3,
    "genres_distribution": { "Фантастика": 10, "Детектив": 5, ... }
  }
```

### Ключевые концепции:

#### JWT Авторизация:
```python
# При логине генерируется JWT токен
jwt.encode({
    "sub": user_id,
    "iat": datetime.utcnow(),
    "exp": datetime.utcnow() + timedelta(hours=24)
}, "SECRET_KEY", algorithm="HS256")

# Клиент отправляет токен в header: "Authorization: Bearer JWT_TOKEN"
# Сервер декодирует и проверяет токен
```

#### Pydantic схемы (валидация):
```python
from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class BookCreate(BaseModel):
    title: str
    author: str
    genre: str
    year: int
    description: str
    condition: str
    pickup_location: str
```

#### Обработка ошибок:
```
400 Bad Request — ошибка валидации
401 Unauthorized — неправильный логин/пароль
403 Forbidden — нет прав (не владелец)
404 Not Found — книга/пользователь не найден
409 Conflict — книга уже забронирована
```

### Обработка бизнес-логики:
✅ Только авторизованные пользователи могут добавлять книги  
✅ Редактировать можно только свои книги  
✅ Нельзя забронировать уже забронированную книгу  
✅ Нельзя забронировать свою же книгу  
✅ Статусы меняются в определённом порядке: Забронирована → Выдана → Возвращена  
✅ История сохраняется для всех обменов  

### Структура FastAPI приложения:
```
backend/
├── main.py          # основное приложение, маршруты
├── models.py        # SQLAlchemy модели
├── schemas.py       # Pydantic схемы валидации
├── auth.py          # JWT + bcrypt функции
├── database.py      # подключение к БД
├── seed.py          # скрипт наполнения данными
└── requirements.txt # зависимости
```

---

## 🔗 ЛАБА 4: Интеграция Frontend и Backend

### Что нужно сделать:
1. **API клиент** на TypeScript (frontend/src/api.ts)
2. **Сохранение JWT токена** в localStorage
3. **Асинхронные запросы** ко всем API endpoints
4. **Обработка ошибок** и показ сообщений
5. **Управление авторизацией** (проверка токена, выход)

### Пример API клиента (TypeScript):
```typescript
const API_BASE = "http://localhost:5001/api";

class ApiClient {
  private getHeaders() {
    const token = localStorage.getItem("access_token");
    return {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` })
    };
  }

  async register(name: string, email: string, password: string) {
    return fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ name, email, password })
    }).then(r => r.json());
  }

  async login(email: string, password: string) {
    const data = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password })
    }).then(r => r.json());
    
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
    }
    return data;
  }

  async getBooks(search?: string, genre?: string, status?: string) {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (genre) params.append("genre", genre);
    if (status) params.append("status", status);
    
    return fetch(`${API_BASE}/books?${params}`, {
      headers: this.getHeaders()
    }).then(r => r.json());
  }

  async bookABook(bookId: number) {
    return fetch(`${API_BASE}/exchanges/book/${bookId}`, {
      method: "POST",
      headers: this.getHeaders()
    }).then(r => r.json());
  }
  // ... другие методы
}

export const api = new ApiClient();
```

### Интеграция в React компоненты:
```typescript
function BookCatalog() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBooks().then(data => {
      setBooks(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      {books.map(book => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
```

### CORS настройка на Backend:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Поток авторизации:
1. Пользователь заполняет форму логина
2. React отправляет POST /api/auth/login
3. Backend возвращает JWT токен
4. Фронтенд сохраняет токен в localStorage
5. Все следующие запросы включают `Authorization: Bearer TOKEN`
6. При выходе токен удаляется из localStorage

---

## ✅ ЛАБА 5: Тестирование, Аналитика и Оптимизация

### Что проверить:

#### 1. **Сценарии авторизации** ✓
- ✅ Регистрация с валидным email/пароль
- ✅ Логин с правильными учётными данными
- ✅ Отказ при неправильном пароле
- ✅ Отказ при регистрации с существующим email
- ✅ Выход из аккаунта (удаление токена)
- ✅ Доступ к защищённым маршрутам без токена → 401 ошибка

#### 2. **Работа с каталогом книг** ✓
- ✅ Получение списка всех книг
- ✅ Поиск по названию и автору (case-insensitive)
- ✅ Фильтрация по жанру
- ✅ Фильтрация по статусу (Доступна, Забронирована)
- ✅ Получение подробной информации о конкретной книге
- ✅ Отображение владельца книги

#### 3. **Добавление и редактирование книг** ✓
- ✅ Авторизованный пользователь может добавить книгу
- ✅ Новая книга добавляется в каталог
- ✅ Статус новой книги = "Доступна"
- ✅ Только владелец может редактировать свою книгу
- ✅ Попытка отредактировать чужую книгу → 403 ошибка
- ✅ Только владелец может удалить свою книгу

#### 4. **Бронирование книг** ✓
- ✅ Авторизованный пользователь может забронировать доступную книгу
- ✅ Статус книги меняется на "Забронирована"
- ✅ Нельзя забронировать уже забронированную книгу
- ✅ Нельзя забронировать свою же книгу
- ✅ После бронирования создаётся запись в Booking

#### 5. **Управление статусами обмена** ✓
- ✅ Владелец может видеть бронирования на свои книги
- ✅ Владелец может менять статус: Забронирована → Выдана → Возвращена
- ✅ Неправильный статус отклоняется (например, сразу в "Завершена")
- ✅ Только владелец может менять статусы

#### 6. **История и статистика** ✓
- ✅ Пользователь видит историю своих обменов
- ✅ Статистика показывает корректные цифры:
  - Всего книг в системе
  - Доступные книги
  - Забронированные книги
  - Завершённые обмены
  - Количество пользователей
  - Распределение по жанрам

#### 7. **Обработка ошибок и валидация** ✓
- ✅ Пустые поля в форме → ошибка валидации
- ✅ Неправильный формат email → ошибка
- ✅ Короткий пароль → ошибка
- ✅ Сервер возвращает понятные сообщения об ошибках
- ✅ Клиент показывает ошибки пользователю

#### 8. **Интеграция Frontend ↔ Backend** ✓
- ✅ Frontend отправляет корректные запросы
- ✅ Backend возвращает правильные данные
- ✅ Токены передаются в headers
- ✅ CORS настроен правильно
- ✅ Нет ошибок в консоли браузера

### Документация для запуска:

```bash
# 1. Установка зависимостей
npm run setup

# 2. Запуск backend (терминал 1)
npm run dev:backend

# 3. Запуск frontend (терминал 2)
npm run dev:frontend

# 4. Открыть браузер
http://localhost:5173
```

### Тестовые аккаунты:
- Email: `alexey@example.com` | Пароль: `password123`
- Email: `anna@example.com` | Пароль: `password123`
- Email: `elena@example.com` | Пароль: `password123`

---

## 🎯 Ключевые технологии и концепции

### Python Backend:
- **FastAPI** — декораторы для маршрутов (`@app.get()`, `@app.post()`)
- **SQLAlchemy ORM** — работа с БД через объекты (Session, Query)
- **Pydantic** — валидация через type hints
- **JWT** — токены с payload и срок действия
- **bcrypt** — хеширование паролей (`bcrypt.hashpw()`)

### Frontend (React):
- **TypeScript** — типизация
- **Fetch API / Axios** — HTTP запросы
- **localStorage** — сохранение токена на клиенте
- **useState / useEffect** — управление состоянием и эффектами
- **Conditional rendering** — показ/скрытие элементов в зависимости от авторизации

### Database:
- **Foreign Keys** — связи между таблицами
- **Индексы** — оптимизация запросов
- **Каскадное удаление** — удаление зависимых записей
- **Уникальные ограничения** — уникальность email

### Security:
- ✅ Пароли хешируются перед сохранением
- ✅ JWT токены имеют срок действия
- ✅ Проверка прав доступа (владелец может редактировать только свои данные)
- ✅ CORS ограничивает запросы только с фронтенда
- ✅ Валидация всех входных данных на сервере

---

## 💡 Что рассказать на защите лаб 2-5:

### Лаба 2:
> "Я спроектировал реляционную БД с тремя основными сущностями: User, Book и Booking. Связи построены так, чтобы каждый пользователь мог владеть книгами и бронировать книги других. Для безопасности пароли хешируются bcrypt, а email уникален. Используется SQLAlchemy ORM, чтобы работать с БД через Python объекты вместо SQL запросов."

### Лаба 3:
> "На FastAPI я создал RESTful API с endpoints для авторизации (регистрация, логин, получение текущего пользователя), управления книгами (CRUD), бронирования и статистики. Авторизация работает через JWT токены с временем жизни 24 часа. Для валидации использую Pydantic схемы. Все ошибки обрабатываются с правильными HTTP статусами (400, 401, 403, 404, 409)."

### Лаба 4:
> "Я создал TypeScript API клиент, который отправляет запросы к FastAPI серверу. JWT токен сохраняется в localStorage и отправляется в каждом запросе через Authorization header. Frontend реактивно обновляется при изменении данных. CORS настроен так, что браузер позволяет запросы только с локального фронтенда."

### Лаба 5:
> "Я протестировал все основные сценарии: регистрацию, логин, добавление и редактирование книг, бронирование, изменение статусов, просмотр истории и статистики. Проверил, что пользователь не может редактировать чужие книги, что статусы меняются корректно, и что все ошибки обрабатываются правильно. Проект полностью работоспособен и документирован."

---

## 📝 Быстрая справка по структуре проекта

```
fullstack/
├── backend/
│   ├── main.py .................. FastAPI приложение с маршрутами
│   ├── models.py ................ SQLAlchemy модели (User, Book, Booking)
│   ├── schemas.py ............... Pydantic схемы валидации
│   ├── auth.py .................. JWT и bcrypt функции
│   ├── database.py .............. Подключение SQLite + сессии
│   ├── seed.py .................. Заполнение тестовыми данными
│   └── requirements.txt ......... зависимости Python
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx ............. Точка входа React
│   │   ├── App.tsx .............. Главный компонент + роутинг
│   │   ├── api.ts ............... REST API клиент (все запросы)
│   │   ├── types.ts ............. TypeScript интерфейсы
│   │   └── index.css ............ Дизайн-система + стили
│   └── package.json ............. Зависимости React (vite, typescript)
│
├── package.json ................. Root скрипты (npm run dev:backend/frontend)
├── README.md .................... Инструкция по запуску
└── prompt.md .................... Исходное задание
```

---

## 🚀 Шпаргалка для быстрого старта

**Запуск проекта:**
```bash
npm run setup          # первый раз только
npm run dev:backend    # терминал 1
npm run dev:frontend   # терминал 2
```

**Основной URL:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5001/api`

**Логин (тестовые):**
- `alexey@example.com` / `password123`

**Основные API endpoints (запомни!):**
- `POST /api/auth/register` — регистрация
- `POST /api/auth/login` — логин (получи token)
- `GET /api/books` — список книг
- `POST /api/books` — добавить книгу
- `POST /api/exchanges/book/:id` — забронировать
- `PATCH /api/exchanges/:id/status` — изменить статус
- `GET /api/stats` — статистика

**Помни при защите:**
✅ Знай, какие таблицы в БД и как они связаны  
✅ Расскажи про JWT авторизацию  
✅ Объясни, как защищены данные (проверка прав, хеширование паролей)  
✅ Демонстрируй основные сценарии (логин → просмотр книг → бронирование)  
✅ Покажи обработку ошибок (например, попытку отредактировать чужую книгу)  
