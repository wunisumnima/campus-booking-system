const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

// Middleware to check if the user is a student (similar to your admin check)
function authorizeStudent(req, res, next) {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied. Student role required.' });
  }
  next();
}

// POST /api/bookings - Create a booking
router.post('/api/bookings', authenticateToken, authorizeStudent, async (req, res) => {
  const { resourceId, slotId } = req.body;
  const userId = req.user.id;

  if (!resourceId || !slotId) {
    return res.status(400).json({ success: false, message: 'Resource ID and Slot ID are required.' });
  }

  try {
    const conn = db.promise();

    // Optional: Check if this slot is already booked (if needed)

    const insertBookingSql = `
      INSERT INTO bookings (user_id, resource_id, slot_id)
      VALUES (?, ?, ?)
    `;
    await conn.query(insertBookingSql, [userId, resourceId, slotId]);

    res.json({ success: true, message: 'Booking successful' });
  } catch (error) {
    console.error('Error saving booking:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/resources - Get all available resources
router.get('/api/resources', authenticateToken, (req, res) => {
  db.query('SELECT * FROM resources', (err, results) => {
    if (err) {
      console.error('Error fetching resources:', err);
      return res.status(500).json({ success: false, message: 'Error fetching resources' });
    }

    res.json(results); // Send the list of resources
  });
});

// GET /api/slots/:resourceId - Get available slots for a resource
router.get('/api/slots/:resourceId', authenticateToken, async (req, res) => {
  const resourceId = parseInt(req.params.resourceId, 10); // <- force it into an integer

  console.log(`Received request to fetch slots for resource ID: ${resourceId}`);

  try {
    // Logging the query parameters
    console.log('Executing query with resourceId:', resourceId);

    const conn = db.promise();

    const [rows] = await conn.query(
      `SELECT s.id, s.slot,
              CASE 
                  WHEN EXISTS (
                      SELECT 1 FROM bookings 
                      WHERE slot_id = s.id 
                      AND (status = 'Pending' OR status = 'Approved')
                  ) THEN 0
                  ELSE 1
              END AS isAvailable
       FROM availability_slots s
       WHERE s.resource_id = ?`,
      [resourceId]
    );
    
    if (rows && rows.length > 0) {
      res.json({ success: true, slots: rows });
    } else {
      console.log('No slots found for resource ID:', resourceId);
      res.status(404).json({ success: false, message: 'No slots found for this resource' });
    }
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// NEW: GET /api/bookings - Get student's own bookings
router.get('/api/bookings', authenticateToken, authorizeStudent, async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.promise().execute(
      `SELECT b.id AS id, b.resource_id AS resourceId, b.status AS status, r.name AS resourceName, s.slot
       FROM bookings b
       JOIN resources r ON b.resource_id = r.id
       JOIN availability_slots s ON b.slot_id = s.id
       WHERE b.user_id = ?`,
      [userId]
    );

    res.json({ success: true, bookings: rows });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ================================================
// NEW: PUT /api/bookings/:bookingId - Update a booking (change slot)
router.put('/api/bookings/:bookingId', authenticateToken, authorizeStudent, async (req, res) => {
  const bookingId = parseInt(req.params.bookingId, 10);
  const { newSlotId } = req.body;
  const userId = req.user.id;

  if (!newSlotId) {
    return res.status(400).json({ success: false, message: 'New slot ID is required.' });
  }

  try {
    const conn = db.promise();

    // Verify that the booking belongs to the user
    const [bookingRows] = await conn.query('SELECT * FROM bookings WHERE id = ? AND user_id = ?', [bookingId, userId]);
    if (bookingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Update the slot
    await conn.query('UPDATE bookings SET slot_id = ? WHERE id = ?', [newSlotId, bookingId]);

    res.json({ success: true, message: 'Booking updated successfully.' });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ================================================
// NEW: DELETE /api/bookings/:bookingId - Cancel a booking
router.delete('/api/bookings/:bookingId', authenticateToken, authorizeStudent, async (req, res) => {
  const bookingId = parseInt(req.params.bookingId, 10);
  const userId = req.user.id;

  try {
    const conn = db.promise();

    // Verify that the booking belongs to the user
    const [bookingRows] = await conn.query('SELECT * FROM bookings WHERE id = ? AND user_id = ?', [bookingId, userId]);
    if (bookingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Delete the booking
    await conn.query('DELETE FROM bookings WHERE id = ?', [bookingId]);

    res.json({ success: true, message: 'Booking cancelled successfully.' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



module.exports = router;
