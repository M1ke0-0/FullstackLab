import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/books (with query filtering: search, genre, status)
router.get('/', async (req, res) => {
  try {
    const { search, genre, status } = req.query;

    const where: any = {};

    if (genre && genre !== 'Все') {
      where.genre = String(genre);
    }

    if (status && status !== 'Все') {
      where.status = String(status);
    }

    if (search) {
      const queryStr = String(search).toLowerCase();
      where.OR = [
        { title: { contains: queryStr } },
        { author: { contains: queryStr } },
        { description: { contains: queryStr } },
      ];
    }

    const books = await prisma.book.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedBooks = books.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      genre: b.genre,
      year: b.year,
      description: b.description,
      condition: b.condition,
      ownerId: b.ownerId,
      ownerName: b.owner.name,
      status: b.status,
      pickupLocation: b.pickupLocation,
      createdAt: b.createdAt.toISOString(),
    }));

    return res.json(formattedBooks);
  } catch (error) {
    console.error('Fetch books error:', error);
    return res.status(500).json({ error: 'Ошибка получения списка книг' });
  }
});

// GET /api/books/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!book) {
      return res.status(404).json({ error: 'Книга не найдена' });
    }

    return res.json({
      id: book.id,
      title: book.title,
      author: book.author,
      genre: book.genre,
      year: book.year,
      description: book.description,
      condition: book.condition,
      ownerId: book.ownerId,
      ownerName: book.owner.name,
      status: book.status,
      pickupLocation: book.pickupLocation,
      createdAt: book.createdAt.toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Ошибка получения информации о книге' });
  }
});

// POST /api/books (add new book)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, author, genre, year, description, condition, pickupLocation } = req.body;

    if (!title || !author || !genre || !year || !description || !condition || !pickupLocation) {
      return res.status(400).json({ error: 'Пожалуйста, заполните все обязательные поля книги' });
    }

    const newBook = await prisma.book.create({
      data: {
        title,
        author,
        genre,
        year: parseInt(year, 10),
        description,
        condition,
        pickupLocation,
        status: 'Доступна',
        ownerId: req.user!.id,
      },
      include: {
        owner: { select: { name: true } },
      },
    });

    return res.status(201).json({
      id: newBook.id,
      title: newBook.title,
      author: newBook.author,
      genre: newBook.genre,
      year: newBook.year,
      description: newBook.description,
      condition: newBook.condition,
      ownerId: newBook.ownerId,
      ownerName: newBook.owner.name,
      status: newBook.status,
      pickupLocation: newBook.pickupLocation,
      createdAt: newBook.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Create book error:', error);
    return res.status(500).json({ error: 'Ошибка при добавлении книги' });
  }
});

// PUT /api/books/:id (update book details)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, author, genre, year, description, condition, pickupLocation } = req.body;

    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return res.status(404).json({ error: 'Книга не найдена' });
    }

    if (book.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Вы не можете редактировать чужую книгу' });
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        title: title || book.title,
        author: author || book.author,
        genre: genre || book.genre,
        year: year ? parseInt(year, 10) : book.year,
        description: description || book.description,
        condition: condition || book.condition,
        pickupLocation: pickupLocation || book.pickupLocation,
      },
      include: {
        owner: { select: { name: true } },
      },
    });

    return res.json({
      id: updatedBook.id,
      title: updatedBook.title,
      author: updatedBook.author,
      genre: updatedBook.genre,
      year: updatedBook.year,
      description: updatedBook.description,
      condition: updatedBook.condition,
      ownerId: updatedBook.ownerId,
      ownerName: updatedBook.owner.name,
      status: updatedBook.status,
      pickupLocation: updatedBook.pickupLocation,
      createdAt: updatedBook.createdAt.toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Ошибка при обновлении книги' });
  }
});

// DELETE /api/books/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.findUnique({ where: { id } });

    if (!book) {
      return res.status(404).json({ error: 'Книга не найдена' });
    }

    if (book.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Вы не можете удалить чужую книгу' });
    }

    await prisma.book.delete({ where: { id } });

    return res.json({ message: 'Книга успешно удалена' });
  } catch (error) {
    return res.status(500).json({ error: 'Ошибка при удалении книги' });
  }
});

export default router;
