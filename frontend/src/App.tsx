import React, { useState } from 'react';
import { INITIAL_BOOKS, INITIAL_EXCHANGES, INITIAL_USERS } from './mockData';
import type { Book, BookStatus, ExchangeHistory, User } from './types';
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
  Calendar,
  Tag,
  Info,
  LogOut,
  LogIn,
  Trash2,
  Edit3
} from 'lucide-react';

export function App() {
  // State
  const [users] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]); // Default logged in user
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [exchanges, setExchanges] = useState<ExchangeHistory[]>(INITIAL_EXCHANGES);
  
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
  const [authName, setAuthName] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');

  // Genres list for filter
  const genres = Array.from(new Set(books.map(b => b.genre)));

  // Handlers
  const handleOpenBookDetails = (id: string) => {
    setSelectedBookId(id);
    setActiveTab('details');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail) {
      setAuthError('Укажите email');
      return;
    }
    const found = users.find(u => u.email.toLowerCase() === authEmail.toLowerCase());
    if (found) {
      setCurrentUser(found);
      setActiveTab('catalog');
    } else {
      setAuthError('Пользователь с таким email не найден (попробуйте ivan@example.com)');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authName || !authEmail) {
      setAuthError('Заполните имя и email');
      return;
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: authName,
      email: authEmail,
    };
    users.push(newUser);
    setCurrentUser(newUser);
    setActiveTab('catalog');
  };

  const handleCreateOrUpdateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!bookForm.title || !bookForm.author || !bookForm.pickupLocation) {
      alert('Пожалуйста, заполните обязательные поля (Название, Автор, Место передачи)');
      return;
    }

    if (editingBookId) {
      // Edit mode
      setBooks(prev =>
        prev.map(b =>
          b.id === editingBookId
            ? {
                ...b,
                title: bookForm.title,
                author: bookForm.author,
                genre: bookForm.genre,
                year: Number(bookForm.year),
                description: bookForm.description,
                condition: bookForm.condition,
                pickupLocation: bookForm.pickupLocation,
              }
            : b
        )
      );
      setEditingBookId(null);
    } else {
      // Add mode
      const newBook: Book = {
        id: `book-${Date.now()}`,
        title: bookForm.title,
        author: bookForm.author,
        genre: bookForm.genre,
        year: Number(bookForm.year),
        description: bookForm.description,
        condition: bookForm.condition,
        ownerId: currentUser.id,
        ownerName: currentUser.name,
        status: 'Доступна',
        pickupLocation: bookForm.pickupLocation,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setBooks([newBook, ...books]);
    }

    // Reset Form
    setBookForm({
      title: '',
      author: '',
      genre: 'Классика',
      year: new Date().getFullYear(),
      description: '',
      condition: 'Отличное',
      pickupLocation: '',
    });
    setActiveTab('catalog');
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

  const handleDeleteBook = (bookId: string) => {
    if (confirm('Вы уверены, что хотите удалить эту книгу?')) {
      setBooks(prev => prev.filter(b => b.id !== bookId));
      if (selectedBookId === bookId) {
        setActiveTab('catalog');
      }
    }
  };

  const handleBookExchange = (book: Book) => {
    if (!currentUser) {
      setActiveTab('auth');
      return;
    }
    if (book.ownerId === currentUser.id) {
      alert('Вы не можете забронировать свою собственную книгу');
      return;
    }

    // Update book status
    setBooks(prev =>
      prev.map(b => (b.id === book.id ? { ...b, status: 'Забронирована' } : b))
    );

    // Add exchange history record
    const newExchange: ExchangeHistory = {
      id: `ex-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      ownerId: book.ownerId,
      ownerName: book.ownerName,
      recipientId: currentUser.id,
      recipientName: currentUser.name,
      bookingDate: new Date().toISOString().split('T')[0],
      status: 'Забронирована',
    };

    setExchanges([newExchange, ...exchanges]);
    alert(`Вы успешно забронировали книгу "${book.title}"! Свяжитесь с владельцем (${book.ownerName}).`);
  };

  const handleChangeStatus = (bookId: string, newStatus: BookStatus) => {
    setBooks(prev =>
      prev.map(b => (b.id === bookId ? { ...b, status: newStatus } : b))
    );

    setExchanges(prev =>
      prev.map(ex =>
        ex.bookId === bookId
          ? {
              ...ex,
              status: newStatus,
              completionDate:
                newStatus === 'Возвращена'
                  ? new Date().toISOString().split('T')[0]
                  : ex.completionDate,
            }
          : ex
      )
    );
  };

  // Filtered Books
  const filteredBooks = books.filter(b => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre ? b.genre === selectedGenre : true;
    const matchesStatus = selectedStatus ? b.status === selectedStatus : true;
    return matchesSearch && matchesGenre && matchesStatus;
  });

  const selectedBook = books.find(b => b.id === selectedBookId);

  // Status Badge Helper Component
  const renderStatusBadge = (status: BookStatus) => {
    switch (status) {
      case 'Доступна':
        return <span className="status-badge available"><CheckCircle size={14} /> Доступна</span>;
      case 'Забронирована':
        return <span className="status-badge reserved"><Clock size={14} /> Забронирована</span>;
      case 'Выдана':
        return <span className="status-badge issued"><ArrowRightLeft size={14} /> Выдана</span>;
      case 'Возвращена':
        return <span className="status-badge returned"><XCircle size={14} /> Возвращена</span>;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Top Navbar */}
      <nav className="glass-nav">
        <div className="app-header">
          <div className="logo-group" onClick={() => setActiveTab('catalog')}>
            <div className="logo-icon">
              <BookOpen size={22} />
            </div>
            <span>BookShare</span>
          </div>

          <div className="nav-links">
            <button
              className={`nav-btn ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => setActiveTab('catalog')}
            >
              <BookOpen size={18} /> Каталог
            </button>

            {currentUser && (
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
                <PlusCircle size={18} /> Добавить книгу
              </button>
            )}

            {currentUser && (
              <button
                className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <UserIcon size={18} /> Личный кабинет
              </button>
            )}

            <button
              className={`nav-btn ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              <BarChart3 size={18} /> Статистика
            </button>

            {currentUser ? (
              <div className="user-badge" style={{ marginLeft: '0.75rem' }}>
                <div className="avatar">{currentUser.name.charAt(0)}</div>
                <span>{currentUser.name}</span>
                <button
                  title="Выйти"
                  onClick={() => setCurrentUser(null)}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', marginLeft: '4px' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                className="btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
                onClick={() => setActiveTab('auth')}
              >
                <LogIn size={16} /> Войти
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Body */}
      <main className="main-content">
        {/* TAB 1: CATALOG */}
        {activeTab === 'catalog' && (
          <div className="animate-fade-in">
            {/* Header Banner */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                Книгообмен в университете и городе
              </h1>
              <p style={{ color: 'var(--text-muted)', maxWidth: '650px' }}>
                Делитесь прочитанными книгами, находите интересные произведения и давайте знаниям вторую жизнь!
              </p>
            </div>

            {/* Search & Filter Bar */}
            <div className="glass-panel" style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Поиск по названию или автору..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={18} style={{ color: 'var(--text-muted)' }} />
                <select
                  className="select-field"
                  value={selectedGenre}
                  onChange={e => setSelectedGenre(e.target.value)}
                  style={{ width: '160px' }}
                >
                  <option value="">Все жанры</option>
                  {genres.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  className="select-field"
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  style={{ width: '160px' }}
                >
                  <option value="">Все статусы</option>
                  <option value="Доступна">Доступна</option>
                  <option value="Забронирована">Забронирована</option>
                  <option value="Выдана">Выдана</option>
                  <option value="Возвращена">Возвращена</option>
                </select>
              </div>
            </div>

            {/* Books Grid */}
            {filteredBooks.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', marginTop: '1.5rem' }}>
                <Info size={40} style={{ color: 'var(--text-subtle)', marginBottom: '0.75rem' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>По вашему запросу ничего не найдено.</p>
              </div>
            ) : (
              <div className="books-grid">
                {filteredBooks.map(book => (
                  <div
                    key={book.id}
                    className="glass-panel book-card"
                    onClick={() => handleOpenBookDetails(book.id)}
                  >
                    <div>
                      <div className="book-card-header">
                        <div>
                          <h3 className="book-title">{book.title}</h3>
                          <p className="book-author">{book.author} ({book.year})</p>
                        </div>
                      </div>
                      <div>
                        {renderStatusBadge(book.status)}
                        <br />
                        <span className="book-genre-tag">{book.genre}</span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {book.description}
                      </p>
                    </div>

                    <div className="book-card-footer">
                      <span>Владелец: {book.ownerName}</span>
                      <span>{book.condition}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BOOK DETAILS */}
        {activeTab === 'details' && selectedBook && (
          <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <button
              className="btn-secondary"
              onClick={() => setActiveTab('catalog')}
              style={{ marginBottom: '1.5rem' }}
            >
              ← Назад в каталог
            </button>

            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{selectedBook.title}</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.2rem' }}>
                    Автор: <strong style={{ color: 'var(--text-main)' }}>{selectedBook.author}</strong> ({selectedBook.year})
                  </p>
                </div>
                <div>{renderStatusBadge(selectedBook.status)}</div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ color: 'var(--text-subtle)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Tag size={14} /> Жанр
                  </div>
                  <div style={{ fontWeight: 600, marginTop: '0.3rem' }}>{selectedBook.genre}</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ color: 'var(--text-subtle)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} /> Состояние
                  </div>
                  <div style={{ fontWeight: 600, marginTop: '0.3rem' }}>{selectedBook.condition}</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ color: 'var(--text-subtle)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={14} /> Место передачи
                  </div>
                  <div style={{ fontWeight: 600, marginTop: '0.3rem' }}>{selectedBook.pickupLocation}</div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Описание</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{selectedBook.description || 'Описание отсутствует.'}</p>
              </div>

              <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#a5b4fc', marginBottom: '0.3rem' }}>Информация о владельце</h4>
                <p style={{ fontSize: '0.95rem' }}>Разместил: <strong>{selectedBook.ownerName}</strong></p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Дата добавления: {selectedBook.createdAt}</p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {selectedBook.status === 'Доступна' && (
                  <button
                    className="btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => handleBookExchange(selectedBook)}
                  >
                    Забронировать книгу
                  </button>
                )}

                {currentUser && currentUser.id === selectedBook.ownerId && (
                  <>
                    <button
                      className="btn-secondary"
                      onClick={() => handleStartEdit(selectedBook)}
                    >
                      <Edit3 size={16} /> Редактировать
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDeleteBook(selectedBook.id)}
                    >
                      <Trash2 size={16} /> Удалить
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADD OR EDIT BOOK */}
        {activeTab === 'add' && currentUser && (
          <div className="animate-fade-in" style={{ maxWidth: '650px', margin: '0 auto' }}>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                {editingBookId ? 'Редактирование книги' : 'Добавление новой книги'}
              </h2>

              <form onSubmit={handleCreateOrUpdateBook} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Название книги *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    placeholder="Например: Совершенный код"
                    value={bookForm.title}
                    onChange={e => setBookForm({ ...bookForm, title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Автор *</label>
                    <input
                      type="text"
                      className="input-field"
                      required
                      placeholder="Стив Макконнелл"
                      value={bookForm.author}
                      onChange={e => setBookForm({ ...bookForm, author: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Жанр</label>
                    <select
                      className="select-field"
                      value={bookForm.genre}
                      onChange={e => setBookForm({ ...bookForm, genre: e.target.value })}
                    >
                      <option value="Классика">Классика</option>
                      <option value="Программирование">Программирование</option>
                      <option value="Фантастика">Фантастика</option>
                      <option value="Антиутопия">Антиутопия</option>
                      <option value="Приключения">Приключения</option>
                      <option value="Фэнтези">Фэнтези</option>
                      <option value="Наука и Учеба">Наука и Учеба</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Год издания</label>
                    <input
                      type="number"
                      className="input-field"
                      value={bookForm.year}
                      onChange={e => setBookForm({ ...bookForm, year: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Состояние книги</label>
                    <select
                      className="select-field"
                      value={bookForm.condition}
                      onChange={e => setBookForm({ ...bookForm, condition: e.target.value })}
                    >
                      <option value="Новое">Новое</option>
                      <option value="Отличное">Отличное</option>
                      <option value="Хорошее">Хорошее</option>
                      <option value="Зачитанное">Зачитанное</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Место передачи *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    placeholder="Например: Корпус МТУСИ на Авиамоторной"
                    value={bookForm.pickupLocation}
                    onChange={e => setBookForm({ ...bookForm, pickupLocation: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Описание</label>
                  <textarea
                    className="textarea-field"
                    rows={4}
                    placeholder="Коротко опишите книгу или условия обмена..."
                    value={bookForm.description}
                    onChange={e => setBookForm({ ...bookForm, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    {editingBookId ? 'Сохранить изменения' : 'Опубликовать книгу'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setActiveTab('catalog')}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && currentUser && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div className="avatar" style={{ width: '64px', height: '64px', fontSize: '1.8rem' }}>
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{currentUser.name}</h2>
                <p style={{ color: 'var(--text-muted)' }}>{currentUser.email}</p>
              </div>
            </div>

            {/* My Books Section */}
            <div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Мои выложенные книги</h3>
              {books.filter(b => b.ownerId === currentUser.id).length === 0 ? (
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Вы еще не выложили ни одной книги.
                </div>
              ) : (
                <div className="books-grid">
                  {books.filter(b => b.ownerId === currentUser.id).map(book => (
                    <div key={book.id} className="glass-panel book-card">
                      <div>
                        <div className="book-card-header">
                          <h4 className="book-title">{book.title}</h4>
                        </div>
                        {renderStatusBadge(book.status)}
                        
                        {/* Status Change control for owner */}
                        <div style={{ marginTop: '1rem' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.3rem' }}>Изменить статус:</label>
                          <select
                            className="select-field"
                            style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                            value={book.status}
                            onChange={e => handleChangeStatus(book.id, e.target.value as BookStatus)}
                          >
                            <option value="Доступна">Доступна</option>
                            <option value="Забронирована">Забронирована</option>
                            <option value="Выдана">Выдана</option>
                            <option value="Возвращена">Возвращена</option>
                          </select>
                        </div>
                      </div>

                      <div className="book-card-footer" style={{ marginTop: '1rem' }}>
                        <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleStartEdit(book)}>
                          <Edit3 size={14} /> Редактировать
                        </button>
                        <button className="btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleDeleteBook(book.id)}>
                          <Trash2 size={14} /> Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reserved Books by Me */}
            <div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Забронированные мной книги</h3>
              {exchanges.filter(ex => ex.recipientId === currentUser.id).length === 0 ? (
                <div className="glass-panel" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
                  У вас нет активных или завершенных бронирований.
                </div>
              ) : (
                <div className="glass-panel" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '1rem' }}>Книга</th>
                        <th style={{ padding: '1rem' }}>Владелец</th>
                        <th style={{ padding: '1rem' }}>Дата брони</th>
                        <th style={{ padding: '1rem' }}>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exchanges.filter(ex => ex.recipientId === currentUser.id).map(ex => (
                        <tr key={ex.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>{ex.bookTitle}</td>
                          <td style={{ padding: '1rem' }}>{ex.ownerName}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{ex.bookingDate}</td>
                          <td style={{ padding: '1rem' }}>{renderStatusBadge(ex.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* History Section */}
            <div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>История обменов</h3>
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Все операции с вашим участием (в качестве владельца или получателя).
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>Книга</th>
                        <th style={{ padding: '0.75rem' }}>Владелец</th>
                        <th style={{ padding: '0.75rem' }}>Получатель</th>
                        <th style={{ padding: '0.75rem' }}>Дата брони</th>
                        <th style={{ padding: '0.75rem' }}>Завершено</th>
                        <th style={{ padding: '0.75rem' }}>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exchanges.filter(ex => ex.ownerId === currentUser.id || ex.recipientId === currentUser.id).map(ex => (
                        <tr key={ex.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{ex.bookTitle}</td>
                          <td style={{ padding: '0.75rem' }}>{ex.ownerName}</td>
                          <td style={{ padding: '0.75rem' }}>{ex.recipientName}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{ex.bookingDate}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{ex.completionDate || '—'}</td>
                          <td style={{ padding: '0.75rem' }}>{renderStatusBadge(ex.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: STATS */}
        {activeTab === 'stats' && (
          <div className="animate-fade-in">
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1.5rem' }}>
              Статистика платформы обмена
            </h1>

            <div className="stats-grid">
              <div className="glass-panel stat-card">
                <div className="stat-icon"><BookOpen size={28} /></div>
                <div>
                  <div className="stat-value">{books.length}</div>
                  <div className="stat-label">Всего книг в системе</div>
                </div>
              </div>

              <div className="glass-panel stat-card">
                <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7' }}>
                  <CheckCircle size={28} />
                </div>
                <div>
                  <div className="stat-value">{books.filter(b => b.status === 'Доступна').length}</div>
                  <div className="stat-label">Доступных для брони</div>
                </div>
              </div>

              <div className="glass-panel stat-card">
                <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d' }}>
                  <Clock size={28} />
                </div>
                <div>
                  <div className="stat-value">{books.filter(b => b.status === 'Забронирована').length}</div>
                  <div className="stat-label">Забронированных сейчас</div>
                </div>
              </div>

              <div className="glass-panel stat-card">
                <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#7dd3fc' }}>
                  <ArrowRightLeft size={28} />
                </div>
                <div>
                  <div className="stat-value">{exchanges.filter(ex => ex.status === 'Возвращена').length}</div>
                  <div className="stat-label">Завершённых обменов</div>
                </div>
              </div>

              <div className="glass-panel stat-card">
                <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
                  <UserIcon size={28} />
                </div>
                <div>
                  <div className="stat-value">{users.length}</div>
                  <div className="stat-label">Пользователей сервиса</div>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Популярность жанров в каталоге</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {genres.map(genre => {
                  const count = books.filter(b => b.genre === genre).length;
                  const percentage = Math.round((count / books.length) * 100);
                  return (
                    <div key={genre}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                        <span>{genre}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{count} книг ({percentage}%)</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.06)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--primary), var(--accent-purple))',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AUTHENTICATION (LOGIN / REGISTER) */}
        {activeTab === 'auth' && (
          <div className="animate-fade-in" style={{ maxWidth: '420px', margin: '2rem auto' }}>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '1.5rem' }}>
                {authMode === 'login' ? 'Вход в систему' : 'Регистрация'}
              </h2>

              {authError && (
                <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fda4af', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.88rem' }}>
                  {authError}
                </div>
              )}

              <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {authMode === 'register' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Ваше имя *</label>
                    <input
                      type="text"
                      className="input-field"
                      required
                      placeholder="Иван Иванов"
                      value={authName}
                      onChange={e => setAuthName(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Email *</label>
                  <input
                    type="email"
                    className="input-field"
                    required
                    placeholder="ivan@example.com"
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Пароль *</label>
                  <input
                    type="password"
                    className="input-field"
                    required
                    placeholder="••••••••"
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
                  {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                {authMode === 'login' ? (
                  <span>
                    Нет аккаунта?{' '}
                    <button
                      onClick={() => { setAuthMode('register'); setAuthError(''); }}
                      style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Зарегистрироваться
                    </button>
                  </span>
                ) : (
                  <span>
                    Уже есть аккаунт?{' '}
                    <button
                      onClick={() => { setAuthMode('login'); setAuthError(''); }}
                      style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Войти
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div>BookShare — Лабораторная работа №1 по курсу «Fullstack»</div>
      </footer>
    </div>
  );
}

export default App;
