const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

// Middleware to check for admin role
function authorizeAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
}

// Add a resource
router.post('/resources', authenticateToken, authorizeAdmin, (req, res) => {
  let { name, description, category, availability_slots } = req.body;

  if (!Array.isArray(availability_slots)) {
    return res.status(400).json({ message: 'Availability slots should be an array' });
  }

  // console.log('Received Data:', { name, category, description, availability_slots });
  
  // Convert array into JSON string before saving
  const slotsToSave = JSON.stringify(availability_slots);

  // Insert the resource into the 'resources' table
  const sql = 'INSERT INTO resources (name, description, category, availability_slots) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, description, category, slotsToSave], (err, result) => {
    if (err) return res.status(500).json({ error: err });

    const resourceId = result.insertId;

    // Insert the availability slots into the 'availability_slots' table
    const slotValues = availability_slots.map(slot => [resourceId, slot]); // just save full string
    const slotSql = 'INSERT INTO availability_slots (resource_id, slot) VALUES ?';

    db.query(slotSql, [slotValues], (err, result) => {
      if (err) return res.status(500).json({ error: err });

      res.json({ message: 'Resource and availability slots added successfully!' });
    });
  });
});

// Get all resources
router.get('/resources', authenticateToken, authorizeAdmin, (req, res) => {
  db.query('SELECT * FROM resources', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Delete a resource
router.delete('/resources/:resourceId', authenticateToken, async (req, res) => {
  const resourceId = parseInt(req.params.resourceId, 10);

  try {
    // Step 1: Delete all related slots
    await db.promise().execute(
      'DELETE FROM availability_slots WHERE resource_id = ?',
      [resourceId]
    );

    // Step 2: Delete the resource itself
    const [result] = await db.promise().execute(
      'DELETE FROM resources WHERE id = ?',
      [resourceId]
    );

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Resource deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Resource not found' });
    }
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// Update a resource
router.put('/resources/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const { name, description, category, availability_slots, status } = req.body;
  const resourceId = parseInt(req.params.id, 10); // correct extraction

  try {
    const conn = db.promise(); // just use promise wrapper!

    // Step 1: Update the resource info (we still need to set availability_slots = NULL or '' if you want)
    const updateResourceSql = `
      UPDATE resources
      SET name = ?, description = ?, category = ?, availability_slots = ?, status = ?
      WHERE id = ?
    `;
    await conn.query(updateResourceSql, [name, description, category, availability_slots, status, resourceId]); 
    // 👆 setting availability_slots column to null because we are using separate table now.

    // Step 2: Delete old slots
    const deleteSlotsSql = `
      DELETE FROM availability_slots WHERE resource_id = ?
    `;
    await conn.query(deleteSlotsSql, [resourceId]);

    // Step 3: Insert new slots
    let slotsArray = [];

    if (typeof availability_slots === 'string') {
      try {
        slotsArray = JSON.parse(availability_slots); // <-- Parse it
      } catch (err) {
        console.error('Failed to parse availability_slots:', err);
        return res.status(400).json({ error: 'Invalid format for availability_slots' });
      }
    } else if (Array.isArray(availability_slots)) {
      slotsArray = availability_slots;
    }

    if (slotsArray.length > 0) {
      const insertSlotSql = `
        INSERT INTO availability_slots (resource_id, slot) VALUES (?, ?)
      `;
      for (const slot of slotsArray) {
        await conn.query(insertSlotSql, [resourceId, slot]);
      }
    }

    res.json({ message: 'Resource updated successfully' });

  } catch (err) {
    console.error('Error updating resource:', err);
    res.status(500).json({ error: err.message });
  }
});

// Search resources by name or category
router.get('/resources/search/:query', authenticateToken, authorizeAdmin, (req, res) => {
  const query = `%${req.params.query}%`;
  db.query('SELECT * FROM resources WHERE name LIKE ? OR category LIKE ?', [query, query], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Get all bookings
router.get('/bookings', authenticateToken, authorizeAdmin, (req, res) => {
  db.query(
    `SELECT b.id, b.created_at AS bookedAt, u.email AS userEmail, r.name AS resourceName, 
          s.slot AS timeSlot, b.status
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN resources r ON b.resource_id = r.id
    JOIN availability_slots s ON b.slot_id = s.id`,
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    }
  );
});

// Approve a booking
router.patch('/bookings/:id/approve', authenticateToken, authorizeAdmin, (req, res) => {
  const bookingId = parseInt(req.params.id, 10);
  db.query(
    'UPDATE bookings SET status = ? WHERE id = ?',
    ['approved', bookingId],
    (err, result) => {
      if (err) {
        console.error('Database Error:', err);  // <-- Add this too
        return res.status(500).json({ error: err });
      }
      res.json({ message: 'Booking approved successfully.' });
    }
  );
});


// Reject a booking
router.patch('/bookings/:id/reject', authenticateToken, authorizeAdmin, (req, res) => {
  const bookingId = req.params.id;
  db.query(
    'UPDATE bookings SET status = ? WHERE id = ?',
    ['rejected', bookingId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'Booking rejected successfully.' });
    }
  );
});

// Delete a booking
router.delete('/bookings/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const bookingId = req.params.id;
  db.query(
    'DELETE FROM bookings WHERE id = ?',
    [bookingId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'Booking deleted successfully.' });
    }
  );
});


module.exports = router;
