import type { Book, BookStatus, ExchangeHistory, User } from './types';

const API_BASE_URL = 'http://localhost:5001/api';

export const getToken = (): string | null => {
  return localStorage.getItem('bookshare_token');
};

export const setToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('bookshare_token', token);
  } else {
    localStorage.removeItem('bookshare_token');
  }
};

const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Произошла ошибка при выполнении запроса');
  }

  return data;
};

export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      return data;
    },
    register: async (name: string, email: string, password: string): Promise<{ user: User; token: string }> => {
      const data = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      setToken(data.token);
      return data;
    },
    me: async (): Promise<User> => {
      const data = await fetchApi('/auth/me');
      return data.user;
    },
    logout: () => {
      setToken(null);
    },
  },

  // Books
  books: {
    getAll: async (params?: { search?: string; genre?: string; status?: string }): Promise<Book[]> => {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.genre) query.append('genre', params.genre);
      if (params?.status) query.append('status', params.status);

      const queryString = query.toString() ? `?${query.toString()}` : '';
      return fetchApi(`/books${queryString}`);
    },
    getById: async (id: string): Promise<Book> => {
      return fetchApi(`/books/${id}`);
    },
    create: async (bookData: {
      title: string;
      author: string;
      genre: string;
      year: number;
      description: string;
      condition: string;
      pickupLocation: string;
    }): Promise<Book> => {
      return fetchApi('/books', {
        method: 'POST',
        body: JSON.stringify(bookData),
      });
    },
    update: async (
      id: string,
      bookData: {
        title?: string;
        author?: string;
        genre?: string;
        year?: number;
        description?: string;
        condition?: string;
        pickupLocation?: string;
      }
    ): Promise<Book> => {
      return fetchApi(`/books/${id}`, {
        method: 'PUT',
        body: JSON.stringify(bookData),
      });
    },
    delete: async (id: string): Promise<{ message: string }> => {
      return fetchApi(`/books/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Exchanges / Bookings
  exchanges: {
    bookBook: async (bookId: string): Promise<ExchangeHistory> => {
      return fetchApi(`/exchanges/book/${bookId}`, {
        method: 'POST',
      });
    },
    updateStatus: async (exchangeId: string, status: BookStatus): Promise<ExchangeHistory> => {
      return fetchApi(`/exchanges/${exchangeId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    getHistory: async (): Promise<ExchangeHistory[]> => {
      return fetchApi('/exchanges/history');
    },
  },

  // Stats
  stats: {
    getStats: async (): Promise<{
      totalBooks: number;
      availableBooks: number;
      bookedBooks: number;
      completedExchanges: number;
      totalUsers: number;
      genreDistribution: { genre: string; count: number }[];
    }> => {
      return fetchApi('/stats');
    },
  },
};
