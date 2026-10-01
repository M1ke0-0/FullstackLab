import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /api/stats
router.get('/', async (req, res) => {
  try {
    const totalBooks = await prisma.book.count();
    const availableBooks = await prisma.book.count({ where: { status: 'Доступна' } });
    const bookedBooks = await prisma.book.count({ where: { status: 'Забронирована' } });
    const completedExchanges = await prisma.booking.count({ where: { status: 'Возвращена' } });
    const totalUsers = await prisma.user.count();

    // Genre distribution calculation
    const books = await prisma.book.findMany({ select: { genre: true } });
    const genreCounts: Record<string, number> = {};
    books.forEach((b) => {
      genreCounts[b.genre] = (genreCounts[b.genre] || 0) + 1;
    });

    const genreDistribution = Object.entries(genreCounts).map(([genre, count]) => ({
      genre,
      count,
    }));

    return res.json({
      totalBooks,
      availableBooks,
      bookedBooks,
      completedExchanges,
      totalUsers,
      genreDistribution,
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    return res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

export default router;
