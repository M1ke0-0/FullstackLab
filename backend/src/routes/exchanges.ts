import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/exchanges/book/:bookId (Book a book)
router.post('/book/:bookId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { bookId } = req.params;
    const recipientId = req.user!.id;

    const book = await prisma.book.findUnique({ where: { id: bookId } });

    if (!book) {
      return res.status(404).json({ error: 'Книга не найдена' });
    }

    if (book.ownerId === recipientId) {
      return res.status(400).json({ error: 'Вы не можете забронировать собственную книгу' });
    }

    if (book.status !== 'Доступна') {
      return res.status(400).json({ error: `Книга недоступна для бронирования (текущий статус: ${book.status})` });
    }

    // Update book status to "Забронирована"
    await prisma.book.update({
      where: { id: bookId },
      data: { status: 'Забронирована' },
    });

    // Create booking record
    const booking = await prisma.booking.create({
      data: {
        bookId,
        ownerId: book.ownerId,
        recipientId,
        status: 'Забронирована',
      },
      include: {
        book: true,
        owner: { select: { name: true } },
        recipient: { select: { name: true } },
      },
    });

    return res.status(201).json({
      id: booking.id,
      bookId: booking.bookId,
      bookTitle: booking.book.title,
      ownerId: booking.ownerId,
      ownerName: booking.owner.name,
      recipientId: booking.recipientId,
      recipientName: booking.recipient.name,
      bookingDate: booking.bookingDate.toISOString(),
      completionDate: booking.completionDate ? booking.completionDate.toISOString() : undefined,
      status: booking.status,
    });
  } catch (error) {
    console.error('Book action error:', error);
    return res.status(500).json({ error: 'Ошибка при бронировании книги' });
  }
});

// PATCH /api/exchanges/:id/status (Change status by book owner)
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;

    const validStatuses = ['Доступна', 'Забронирована', 'Выдана', 'Возвращена'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Некорректный статус обмена' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { book: true },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Запись обмена не найдена' });
    }

    if (booking.ownerId !== userId) {
      return res.status(403).json({ error: 'Только владелец книги может изменять статус обмена' });
    }

    const completionDate = status === 'Возвращена' ? new Date() : undefined;

    // Update booking record
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status,
        completionDate: completionDate ? completionDate : booking.completionDate,
      },
      include: {
        book: true,
        owner: { select: { name: true } },
        recipient: { select: { name: true } },
      },
    });

    // Sync book status (If returned or set back to available, book becomes "Доступна" or "Возвращена")
    const bookNewStatus = status === 'Возвращена' ? 'Возвращена' : status;
    await prisma.book.update({
      where: { id: booking.bookId },
      data: { status: bookNewStatus },
    });

    return res.json({
      id: updatedBooking.id,
      bookId: updatedBooking.bookId,
      bookTitle: updatedBooking.book.title,
      ownerId: updatedBooking.ownerId,
      ownerName: updatedBooking.owner.name,
      recipientId: updatedBooking.recipientId,
      recipientName: updatedBooking.recipient.name,
      bookingDate: updatedBooking.bookingDate.toISOString(),
      completionDate: updatedBooking.completionDate ? updatedBooking.completionDate.toISOString() : undefined,
      status: updatedBooking.status,
    });
  } catch (error) {
    console.error('Update exchange status error:', error);
    return res.status(500).json({ error: 'Ошибка обновления статуса обмена' });
  }
});

// GET /api/exchanges/history (Get all exchange records for dashboard / history tab)
router.get('/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const bookings = await prisma.booking.findMany({
      where: {
        OR: [{ ownerId: userId }, { recipientId: userId }],
      },
      include: {
        book: true,
        owner: { select: { name: true } },
        recipient: { select: { name: true } },
      },
      orderBy: { bookingDate: 'desc' },
    });

    const history = bookings.map((b) => ({
      id: b.id,
      bookId: b.bookId,
      bookTitle: b.book.title,
      ownerId: b.ownerId,
      ownerName: b.owner.name,
      recipientId: b.recipientId,
      recipientName: b.recipient.name,
      bookingDate: b.bookingDate.toISOString(),
      completionDate: b.completionDate ? b.completionDate.toISOString() : undefined,
      status: b.status,
    }));

    return res.json(history);
  } catch (error) {
    return res.status(500).json({ error: 'Ошибка получения истории обменов' });
  }
});

export default router;
