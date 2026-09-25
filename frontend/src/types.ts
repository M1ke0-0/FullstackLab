export type BookStatus = 'Доступна' | 'Забронирована' | 'Выдана' | 'Возвращена';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  year: number;
  description: string;
  condition: string; // e.g. 'Новое', 'Отличное', 'Хорошее', 'Зачитанное'
  ownerId: string;
  ownerName: string;
  status: BookStatus;
  pickupLocation: string;
  createdAt: string;
}

export interface ExchangeHistory {
  id: string;
  bookId: string;
  bookTitle: string;
  ownerId: string;
  ownerName: string;
  recipientId: string;
  recipientName: string;
  bookingDate: string;
  completionDate?: string;
  status: BookStatus;
}
