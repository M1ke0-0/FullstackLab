import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.booking.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // Create Users
  const user1 = await prisma.user.create({
    data: {
      id: 'u1',
      name: 'Анна Смирнова',
      email: 'anna@example.com',
      password: defaultPasswordHash,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      id: 'u2',
      name: 'Алексей Иванов',
      email: 'alexey@example.com',
      password: defaultPasswordHash,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      id: 'u3',
      name: 'Елена Петрова',
      email: 'elena@example.com',
      password: defaultPasswordHash,
    },
  });

  console.log('Created Users:', [user1.name, user2.name, user3.name]);

  // Create Books
  const book1 = await prisma.book.create({
    data: {
      id: 'b1',
      title: 'Мастер и Маргарита',
      author: 'Михаил Булгаков',
      genre: 'Классика',
      year: 1967,
      description: 'Знаменитый роман о визите дьявола в советскую Москву и истории любви Мастера и Маргариты.',
      condition: 'Отличное',
      status: 'Доступна',
      pickupLocation: 'Москва, м. Университет, Главное здание МГУ',
      ownerId: user1.id,
    },
  });

  const book2 = await prisma.book.create({
    data: {
      id: 'b2',
      title: 'Чистый код',
      author: 'Роберт Мартин',
      genre: 'Программирование',
      year: 2008,
      description: 'Создание, анализ и рефакторинг. Практическое руководство для разработчиков.',
      condition: 'Хорошее',
      status: 'Забронирована',
      pickupLocation: 'Москва, м. Бауманская',
      ownerId: user2.id,
    },
  });

  const book3 = await prisma.book.create({
    data: {
      id: 'b3',
      title: 'Дюна',
      author: 'Фрэнк Герберт',
      genre: 'Фантастика',
      year: 1965,
      description: 'Эпическая научно-фантастическая saga о пустынной планете Арракис.',
      condition: 'Новое',
      status: 'Доступна',
      pickupLocation: 'Санкт-Петербург, м. Невский проспект',
      ownerId: user1.id,
    },
  });

  const book4 = await prisma.book.create({
    data: {
      id: 'b4',
      title: '1984',
      author: 'Джордж Оруэлл',
      genre: 'Антиутопия',
      year: 1949,
      description: 'Культовый роман-антиутопия о тоталитарном обществе и контроле над разумом.',
      condition: 'Хорошее',
      status: 'Выдана',
      pickupLocation: 'Москва, м. Китай-город',
      ownerId: user3.id,
    },
  });

  const book5 = await prisma.book.create({
    data: {
      id: 'b5',
      title: 'Цветы для Элджернона',
      author: 'Дэниел Киз',
      genre: 'Фантастика',
      year: 1966,
      description: 'Трогательная история умственно отсталого Чарли Гордона, участвующего в эксперименте.',
      condition: 'Отличное',
      status: 'Возвращена',
      pickupLocation: 'Москва, м. Сокол',
      ownerId: user2.id,
    },
  });

  console.log('Created Books');

  // Create Bookings/Exchanges
  await prisma.booking.create({
    data: {
      id: 'ex1',
      bookId: book2.id,
      ownerId: user2.id,
      recipientId: user1.id,
      status: 'Забронирована',
      bookingDate: new Date('2026-09-25T10:00:00Z'),
    },
  });

  await prisma.booking.create({
    data: {
      id: 'ex2',
      bookId: book4.id,
      ownerId: user3.id,
      recipientId: user2.id,
      status: 'Выдана',
      bookingDate: new Date('2026-09-20T14:30:00Z'),
    },
  });

  await prisma.booking.create({
    data: {
      id: 'ex3',
      bookId: book5.id,
      ownerId: user2.id,
      recipientId: user3.id,
      status: 'Возвращена',
      bookingDate: new Date('2026-09-10T12:00:00Z'),
      completionDate: new Date('2026-09-18T16:00:00Z'),
    },
  });

  console.log('Created Seed Bookings');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
