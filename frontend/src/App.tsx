import React, { useState, useEffect } from 'react';
import type { Book, BookStatus, ExchangeHistory, User } from './types';
import { api } from './api';
import {
  BookOpen,
  PlusCircle,
  User as UserIcon,
  BarChart3,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowRightLeft,
  XCircle,
  MapPin,
  Tag,
  Info,
  LogOut,
  LogIn,
  Trash2,
  Edit3,
  Lock,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  // Application State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [exchanges, setExchanges] = useState<ExchangeHistory[]>([]);
  const [stats, setStats] = useState<{
    totalBooks: number;
    availableBooks: number;
    bookedBooks: number;
    completedExchanges: number;
    totalUsers: number;
    genreDistribution: { genre: string; count: number }[];
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Navigation: 'catalog' | 'details' | 'add' | 'profile' | 'stats' | 'auth'
  const [activeTab, setActiveTab] = useState<string>('catalog');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Form State for Add/Edit Book
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    genre: 'Классика',
    year: new Date().getFullYear(),
    description: '',
    condition: 'Отличное',
    pickupLocation: '',
  });

  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');

  // Auto-dismiss messages
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Initial Auth & Data Load
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      try {
        // Try getting current user if token exists
        try {
          const me = await api.auth.me();
          setCurrentUser(me);
        } catch {
          setCurrentUser(null);
        }

        // Load Books & Stats
        await loadBooks();
        await loadStats();
      } catch (err: any) {
        console.error('App init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  // Reload exchanges when user changes or visits profile
  useEffect(() => {
    if (currentUser) {
      loadExchanges();
    } else {
      setExchanges([]);
    }
  }, [currentUser, activeTab]);

  const loadBooks = async () => {
    try {
      const booksData = await api.books.getAll({
        search: searchQuery,
        genre: selectedGenre,
        status: selectedStatus,
      });
      setBooks(booksData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка загрузки книг');
    }
  };

  const loadExchanges = async () => {
    try {
      const history = await api.exchanges.getHistory();
      setExchanges(history);
    } catch (err: any) {
      console.error('Error loading exchange history:', err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.stats.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error loading stats:', err);
    }
  };

  // Re-fetch books when search or filter changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadBooks();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedGenre, selectedStatus]);

  // Genres list for filter dropdown
  const genresList = Array.from(new Set(['Классика', 'Программирование', 'Фантастика', 'Антиутопия', 'Детектив', 'Приключения', 'Роман', ...books.map((b) => b.genre)]));

  // Handlers
  const handleOpenBookDetails = (id: string) => {
    setSelectedBookId(id);
    setActiveTab('details');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail || !authPassword) {
      setAuthError('Заполните email и пароль');
      return;
    }

    try {
      const res = await api.auth.login(authEmail, authPassword);
      setCurrentUser(res.user);
      setSuccessMsg(`С возвращением, ${res.user.name}!`);
      setActiveTab('catalog');
      setAuthPassword('');
      loadExchanges();
    } catch (err: any) {
      setAuthError(err.message || 'Неверный email или пароль');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authName || !authEmail || !authPassword) {
      setAuthError('Заполните имя, email и пароль');
      return;
    }

    try {
      const res = await api.auth.register(authName, authEmail, authPassword);
      setCurrentUser(res.user);
      setSuccessMsg(`Добро пожаловать в BookShare, ${res.user.name}!`);
      setActiveTab('catalog');
      setAuthPassword('');
      loadExchanges();
    } catch (err: any) {
      setAuthError(err.message || 'Ошибка регистрации');
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setCurrentUser(null);
    setExchanges([]);
    setSuccessMsg('Вы успешно вышли из системы');
    setActiveTab('catalog');
  };

  const handleCreateOrUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!bookForm.title || !bookForm.author || !bookForm.pickupLocation) {
      setErrorMsg('Пожалуйста, заполните обязательные поля (Название, Автор, Место передачи)');
      return;
    }

    try {
      if (editingBookId) {
        // Edit mode
        await api.books.update(editingBookId, {
          title: bookForm.title,
          author: bookForm.author,
          genre: bookForm.genre,
          year: Number(bookForm.year),
          description: bookForm.description,
          condition: bookForm.condition,
          pickupLocation: bookForm.pickupLocation,
        });
        setSuccessMsg('Информация о книге обновлена');
        setEditingBookId(null);
      } else {
        // Add mode
        await api.books.create({
          title: bookForm.title,
          author: bookForm.author,
          genre: bookForm.genre,
          year: Number(bookForm.year),
          description: bookForm.description,
          condition: bookForm.condition,
          pickupLocation: bookForm.pickupLocation,
        });
        setSuccessMsg('Книга успешно добавлена в каталог!');
      }

      // Reset Form & Reload Data
      setBookForm({
        title: '',
        author: '',
        genre: 'Классика',
        year: new Date().getFullYear(),
        description: '',
        condition: 'Отличное',
        pickupLocation: '',
      });
      await loadBooks();
      await loadStats();
      setActiveTab('catalog');
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка сохранения книги');
    }
  };

  const handleStartEdit = (book: Book) => {
    setEditingBookId(book.id);
    setBookForm({
      title: book.title,
      author: book.author,
      genre: book.genre,
      year: book.year,
      description: book.description,
      condition: book.condition,
      pickupLocation: book.pickupLocation,
    });
    setActiveTab('add');
  };

  const handleDeleteBook = async (bookId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту книгу?')) {
      try {
        await api.books.delete(bookId);
        setSuccessMsg('Книга удалена');
        await loadBooks();
        await loadStats();
        if (selectedBookId === bookId) {
          setActiveTab('catalog');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Ошибка удаления книги');
      }
    }
  };

  const handleBookExchange = async (book: Book) => {
    if (!currentUser) {
      setActiveTab('auth');
      return;
    }
    if (book.ownerId === currentUser.id) {
      setErrorMsg('Вы не можете забронировать собственную книгу');
      return;
    }

    try {
      await api.exchanges.bookBook(book.id);
      setSuccessMsg(`Вы успешно забронировали книгу "${book.title}"! Свяжитесь с владельцем (${book.ownerName}).`);
      await loadBooks();
      await loadExchanges();
      await loadStats();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка бронирования');
    }
  };

  const handleChangeStatus = async (exchangeId: string, newStatus: BookStatus) => {
    try {
      await api.exchanges.updateStatus(exchangeId, newStatus);
      setSuccessMsg(`Статус обмена изменен на "${newStatus}"`);
      await loadBooks();
      await loadExchanges();
      await loadStats();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка изменения статуса');
    }
  };

  const selectedBook = books.find((b) => b.id === selectedBookId);

  // Status Badge Helper Component
  const renderStatusBadge = (status: BookStatus) => {
    switch (status) {
      case 'Доступна':
        return (
          <span className="badge badge-success">
            <CheckCircle className="icon-sm" /> Доступна
          </span>
        );
      case 'Забронирована':
        return (
          <span className="badge badge-warning">
            <Clock className="icon-sm" /> Забронирована
          </span>
        );
      case 'Выдана':
        return (
          <span className="badge badge-primary">
            <ArrowRightLeft className="icon-sm" /> Выдана
          </span>
        );
      case 'Возвращена':
        return (
          <span className="badge badge-neutral">
            <XCircle className="icon-sm" /> Возвращена
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="app-container">
      {/* Header / Navbar */}
      <header className="navbar glass-header">
        <div className="brand" onClick={() => setActiveTab('catalog')} style={{ cursor: 'pointer' }}>
          <div className="brand-logo">
            <BookOpen className="brand-icon" />
          </div>
          <div>
            <span className="brand-title">BookShare</span>
            <span className="brand-subtitle">Платформа обмена книгами</span>
          </div>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <BookOpen className="icon-sm" /> Каталог
          </button>
          
          <button
            className={`nav-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => {
              loadStats();
              setActiveTab('stats');
            }}
          >
            <BarChart3 className="icon-sm" /> Статистика
          </button>

          {currentUser ? (
            <>
              <button
                className={`nav-btn ${activeTab === 'add' ? 'active' : ''}`}
                onClick={() => {
                  setEditingBookId(null);
                  setBookForm({
                    title: '',
                    author: '',
                    genre: 'Классика',
                    year: new Date().getFullYear(),
                    description: '',
                    condition: 'Отличное',
                    pickupLocation: '',
                  });
                  setActiveTab('add');
                }}
              >
                <PlusCircle className="icon-sm" /> Добавить книгу
              </button>

              <button
                className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <UserIcon className="icon-sm" /> Личный кабинет ({currentUser.name})
              </button>

              <button className="nav-btn nav-btn-logout" onClick={handleLogout} title="Выйти">
                <LogOut className="icon-sm" />
              </button>
            </>
          ) : (
            <button
              className={`nav-btn nav-btn-primary ${activeTab === 'auth' ? 'active' : ''}`}
              onClick={() => setActiveTab('auth')}
            >
              <LogIn className="icon-sm" /> Войти
            </button>
          )}
        </nav>
      </header>

      {/* Alert Notifications */}
      {errorMsg && (
        <div className="toast toast-error">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)}>✕</button>
        </div>
      )}

      {successMsg && (
        <div className="toast toast-success">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}>✕</button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {loading && (
          <div className="loading-spinner">
            <RefreshCw className="spin-icon" /> Загрузка данных...
          </div>
        )}

        {/* 1. CATALOG TAB */}
        {activeTab === 'catalog' && (
          <section className="catalog-section">
            <div className="section-header">
              <h2>Каталог книг для обмена</h2>
              <p>Найдите интересующую вас книгу или поделитесь своей с другими пользователями</p>
            </div>

            {/* Search & Filters */}
            <div className="filter-bar glass-card">
              <div className="search-box">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Поиск по названию, автору или описанию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filters-group">
                <div className="select-wrapper">
                  <Filter className="select-icon" />
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                  >
                    <option value="">Все жанры</option>
                    {genresList.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="select-wrapper">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">Все статусы</option>
                    <option value="Доступна">Доступна</option>
                    <option value="Забронирована">Забронирована</option>
                    <option value="Выдана">Выдана</option>
                    <option value="Возвращена">Возвращена</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Books Grid */}
            {books.length === 0 ? (
              <div className="empty-state glass-card">
                <Info className="empty-icon" />
                <h3>Книги не найдены</h3>
                <p>Попробуйте изменить параметры поиска или сбросить фильтры</p>
              </div>
            ) : (
              <div className="books-grid">
                {books.map((book) => (
                  <div key={book.id} className="book-card glass-card">
                    <div className="card-header">
                      <span className="genre-tag">{book.genre}</span>
                      {renderStatusBadge(book.status)}
                    </div>

                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">Автор: {book.author}</p>
                    <p className="book-year">Год издания: {book.year}</p>
                    <p className="book-desc">{book.description}</p>

                    <div className="book-meta">
                      <div className="meta-item">
                        <Tag className="meta-icon" /> Состояние: {book.condition}
                      </div>
                      <div className="meta-item">
                        <UserIcon className="meta-icon" /> Владелец: {book.ownerName}
                      </div>
                      <div className="meta-item">
                        <MapPin className="meta-icon" /> {book.pickupLocation}
                      </div>
                    </div>

                    <div className="card-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleOpenBookDetails(book.id)}
                      >
                        Подробнее
                      </button>

                      {book.status === 'Доступна' && currentUser?.id !== book.ownerId && (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleBookExchange(book)}
                        >
                          Забронировать
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 2. BOOK DETAILS TAB */}
        {activeTab === 'details' && selectedBook && (
          <section className="details-section glass-card">
            <button className="btn btn-link" onClick={() => setActiveTab('catalog')}>
              ← Назад в каталог
            </button>

            <div className="details-header">
              <div>
                <h2>{selectedBook.title}</h2>
                <p className="details-subtitle">Автор: {selectedBook.author}</p>
              </div>
              {renderStatusBadge(selectedBook.status)}
            </div>

            <div className="details-grid">
              <div className="details-info">
                <h3>О книге</h3>
                <p>{selectedBook.description}</p>

                <div className="info-list">
                  <div className="info-row">
                    <span>Жанр:</span> <strong>{selectedBook.genre}</strong>
                  </div>
                  <div className="info-row">
                    <span>Год издания:</span> <strong>{selectedBook.year}</strong>
                  </div>
                  <div className="info-row">
                    <span>Состояние:</span> <strong>{selectedBook.condition}</strong>
                  </div>
                  <div className="info-row">
                    <span>Место встречи/передачи:</span> <strong>{selectedBook.pickupLocation}</strong>
                  </div>
                </div>
              </div>

              <div className="details-owner-box glass-card">
                <h3>Информация о владельце</h3>
                <div className="owner-profile">
                  <UserIcon className="owner-avatar" />
                  <div>
                    <h4>{selectedBook.ownerName}</h4>
                    <p>Владелец книги</p>
                  </div>
                </div>

                {selectedBook.status === 'Доступна' ? (
                  currentUser ? (
                    currentUser.id !== selectedBook.ownerId ? (
                      <button
                        className="btn btn-primary btn-block"
                        onClick={() => handleBookExchange(selectedBook)}
                      >
                        Забронировать книгу
                      </button>
                    ) : (
                      <p className="note">Вы являетесь владельцем этой книги</p>
                    )
                  ) : (
                    <button
                      className="btn btn-primary btn-block"
                      onClick={() => setActiveTab('auth')}
                    >
                      Авторизуйтесь, чтобы забронировать
                    </button>
                  )
                ) : (
                  <p className="note warning-note">
                    Книга сейчас недоступна для бронирования (Статус: {selectedBook.status})
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 3. ADD / EDIT BOOK TAB */}
        {activeTab === 'add' && currentUser && (
          <section className="form-section glass-card">
            <h2>{editingBookId ? 'Редактирование книги' : 'Добавление новой книги'}</h2>
            <p className="form-subtitle">
              Заполните форму, чтобы разместить свою книгу на платформе книгообмена
            </p>

            <form onSubmit={handleCreateOrUpdateBook} className="book-form">
              <div className="form-group">
                <label>Название книги *</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Мастер и Маргарита"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Автор *</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Михаил Булгаков"
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Жанр *</label>
                  <select
                    value={bookForm.genre}
                    onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })}
                  >
                    <option value="Классика">Классика</option>
                    <option value="Фантастика">Фантастика</option>
                    <option value="Программирование">Программирование</option>
                    <option value="Антиутопия">Антиутопия</option>
                    <option value="Детектив">Детектив</option>
                    <option value="Приключения">Приключения</option>
                    <option value="Роман">Роман</option>
                    <option value="Другое">Другое</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Год издания *</label>
                  <input
                    type="number"
                    required
                    min="1800"
                    max={new Date().getFullYear()}
                    value={bookForm.year}
                    onChange={(e) => setBookForm({ ...bookForm, year: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Состояние книги *</label>
                <select
                  value={bookForm.condition}
                  onChange={(e) => setBookForm({ ...bookForm, condition: e.target.value })}
                >
                  <option value="Новое">Новое (идеальное)</option>
                  <option value="Отличное">Отличное (без дефектов)</option>
                  <option value="Хорошее">Хорошее (небольшие следы использования)</option>
                  <option value="Зачитанное">Зачитанное (видимые следы чтения)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Место передачи (метро, вуз или удобный район) *</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Москва, м. Университет, возле ГЗ МГУ"
                  value={bookForm.pickupLocation}
                  onChange={(e) => setBookForm({ ...bookForm, pickupLocation: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Описание книги *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Опишите сюжет или особенности издания..."
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('catalog')}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBookId ? 'Сохранить изменения' : 'Опубликовать книгу'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* 4. PROFILE / DASHBOARD TAB */}
        {activeTab === 'profile' && currentUser && (
          <section className="profile-section">
            <div className="profile-header glass-card">
              <UserIcon className="profile-avatar" />
              <div>
                <h2>{currentUser.name}</h2>
                <p className="profile-email">{currentUser.email}</p>
                <span className="badge badge-primary">Участник сообщества BookShare</span>
              </div>
            </div>

            {/* User My Books */}
            <div className="dashboard-block glass-card">
              <h3>Мои выложенные книги</h3>
              {books.filter((b) => b.ownerId === currentUser.id).length === 0 ? (
                <p className="empty-text">Вы пока не выложили ни одной книги на обмен</p>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Название</th>
                        <th>Автор</th>
                        <th>Жанр</th>
                        <th>Статус</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {books
                        .filter((b) => b.ownerId === currentUser.id)
                        .map((b) => (
                          <tr key={b.id}>
                            <td>
                              <strong>{b.title}</strong>
                            </td>
                            <td>{b.author}</td>
                            <td>{b.genre}</td>
                            <td>{renderStatusBadge(b.status)}</td>
                            <td className="table-actions">
                              <button
                                className="icon-action-btn edit-btn"
                                onClick={() => handleStartEdit(b)}
                                title="Редактировать"
                              >
                                <Edit3 className="icon-sm" />
                              </button>
                              <button
                                className="icon-action-btn delete-btn"
                                onClick={() => handleDeleteBook(b.id)}
                                title="Удалить"
                              >
                                <Trash2 className="icon-sm" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Exchange History & Status Management */}
            <div className="dashboard-block glass-card">
              <h3>История и статус обменов</h3>
              {exchanges.length === 0 ? (
                <p className="empty-text">У вас пока нет активных или завершенных обменов</p>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Книга</th>
                        <th>Владелец</th>
                        <th>Получатель</th>
                        <th>Дата бронирования</th>
                        <th>Текущий статус</th>
                        <th>Управление (для владельца)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exchanges.map((ex) => (
                        <tr key={ex.id}>
                          <td>
                            <strong>{ex.bookTitle}</strong>
                          </td>
                          <td>{ex.ownerName}</td>
                          <td>{ex.recipientName}</td>
                          <td>{new Date(ex.bookingDate).toLocaleDateString('ru-RU')}</td>
                          <td>{renderStatusBadge(ex.status)}</td>
                          <td>
                            {ex.ownerId === currentUser.id ? (
                              <select
                                className="status-select"
                                value={ex.status}
                                onChange={(e) =>
                                  handleChangeStatus(ex.id, e.target.value as BookStatus)
                                }
                              >
                                <option value="Забронирована">Забронирована</option>
                                <option value="Выдана">Выдана</option>
                                <option value="Возвращена">Возвращена</option>
                                <option value="Доступна">Доступна (Отменить)</option>
                              </select>
                            ) : (
                              <span className="read-only-text">Ожидает действий владельца</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 5. STATISTICS TAB */}
        {activeTab === 'stats' && (
          <section className="stats-section">
            <div className="section-header">
              <h2>Аналитика и статистика сервиса</h2>
              <p>Текущие показатели активности системы книгообмена в реальном времени</p>
            </div>

            {stats ? (
              <>
                <div className="stats-grid">
                  <div className="stat-card glass-card">
                    <BookOpen className="stat-icon icon-blue" />
                    <div className="stat-value">{stats.totalBooks}</div>
                    <div className="stat-label">Всего книг в системе</div>
                  </div>

                  <div className="stat-card glass-card">
                    <CheckCircle className="stat-icon icon-green" />
                    <div className="stat-value">{stats.availableBooks}</div>
                    <div className="stat-label">Доступно для заказа</div>
                  </div>

                  <div className="stat-card glass-card">
                    <Clock className="stat-icon icon-orange" />
                    <div className="stat-value">{stats.bookedBooks}</div>
                    <div className="stat-label">Забронировано книг</div>
                  </div>

                  <div className="stat-card glass-card">
                    <ArrowRightLeft className="stat-icon icon-purple" />
                    <div className="stat-value">{stats.completedExchanges}</div>
                    <div className="stat-label">Завершённых обменов</div>
                  </div>

                  <div className="stat-card glass-card">
                    <UserIcon className="stat-icon icon-teal" />
                    <div className="stat-value">{stats.totalUsers}</div>
                    <div className="stat-label">Зарегистрированных пользователей</div>
                  </div>
                </div>

                <div className="genre-stats-box glass-card">
                  <h3>Распределение книг по жанрам</h3>
                  <div className="genre-bars">
                    {stats.genreDistribution.map((item) => {
                      const percentage = Math.round((item.count / (stats.totalBooks || 1)) * 100);
                      return (
                        <div key={item.genre} className="genre-bar-item">
                          <div className="genre-info">
                            <span>{item.genre}</span>
                            <span>
                              {item.count} шт. ({percentage}%)
                            </span>
                          </div>
                          <div className="progress-bar-bg">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state glass-card">
                <RefreshCw className="spin-icon" /> Загрузка статистики...
              </div>
            )}
          </section>
        )}

        {/* 6. AUTHENTICATION TAB */}
        {activeTab === 'auth' && (
          <section className="auth-section">
            <div className="auth-card glass-card">
              <h2>{authMode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}</h2>
              <p className="auth-subtitle">
                {authMode === 'login'
                  ? 'Введите логин и пароль для доступа к обмену книгами'
                  : 'Создайте учетную запись для участия в книгообмене'}
              </p>

              {authError && <div className="auth-error-badge">{authError}</div>}

              <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
                {authMode === 'register' && (
                  <div className="form-group">
                    <label>Ваше имя *</label>
                    <div className="input-with-icon">
                      <UserIcon className="input-icon" />
                      <input
                        type="text"
                        required
                        placeholder="Алексей Иванов"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Email адрес *</label>
                  <div className="input-with-icon">
                    <UserIcon className="input-icon" />
                    <input
                      type="email"
                      required
                      placeholder="alexey@example.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Пароль *</label>
                  <div className="input-with-icon">
                    <Lock className="input-icon" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-block mt-4">
                  {authMode === 'login' ? 'Войти в аккаунт' : 'Зарегистрироваться'}
                </button>
              </form>

              <div className="auth-toggle">
                {authMode === 'login' ? (
                  <p>
                    Нет аккаунта?{' '}
                    <span
                      onClick={() => {
                        setAuthMode('register');
                        setAuthError('');
                      }}
                    >
                      Зарегистрироваться
                    </span>
                  </p>
                ) : (
                  <p>
                    Уже есть аккаунт?{' '}
                    <span
                      onClick={() => {
                        setAuthMode('login');
                        setAuthError('');
                      }}
                    >
                      Войти
                    </span>
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
