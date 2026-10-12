const { pool } = require('../utils/db');
const { successResponse, errorResponse } = require('../utils/response');
const { createAuditLog } = require('../services/auditService');

const getServices = async (req, res) => {
  try {
    const { category, status = 'active' } = req.query;
    let query = 'SELECT * FROM services WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    query += ' ORDER BY name ASC';
    const [rows] = await pool.execute(query, params);
    return successResponse(res, { services: rows });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch services.', 500);
  }
};

const getServiceById = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM services WHERE id = ?', [req.params.id]);
    if (!rows.length) return errorResponse(res, 'Service not found.', 404);
    return successResponse(res, { service: rows[0] });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch service.', 500);
  }
};

const createService = async (req, res) => {
  const { name, description, category, base_price, estimated_duration, icon } = req.body;
  if (!name || !base_price) return errorResponse(res, 'Name and base price are required.', 400);
  try {
    const [result] = await pool.execute(
      'INSERT INTO services (name, description, category, base_price, estimated_duration, icon) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || null, category || null, base_price, estimated_duration || 60, icon || null]
    );
    await createAuditLog({ userId: req.user.id, action: 'SERVICE_CREATED', module: 'SERVICE', recordId: result.insertId, description: `Service "${name}" created`, ipAddress: req.ip });
    return successResponse(res, { id: result.insertId }, 'Service created successfully.', 201);
  } catch (err) {
    return errorResponse(res, 'Failed to create service.', 500);
  }
};

const updateService = async (req, res) => {
  const { name, description, category, base_price, estimated_duration, icon, status } = req.body;
  try {
    const [existing] = await pool.execute('SELECT id FROM services WHERE id = ?', [req.params.id]);
    if (!existing.length) return errorResponse(res, 'Service not found.', 404);
    await pool.execute(
      'UPDATE services SET name=?, description=?, category=?, base_price=?, estimated_duration=?, icon=?, status=? WHERE id=?',
      [name, description, category, base_price, estimated_duration, icon, status, req.params.id]
    );
    await createAuditLog({ userId: req.user.id, action: 'SERVICE_UPDATED', module: 'SERVICE', recordId: req.params.id, description: `Service "${name}" updated`, ipAddress: req.ip });
    return successResponse(res, {}, 'Service updated successfully.');
  } catch (err) {
    return errorResponse(res, 'Failed to update service.', 500);
  }
};

const deleteService = async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT id, name FROM services WHERE id = ?', [req.params.id]);
    if (!existing.length) return errorResponse(res, 'Service not found.', 404);
    await pool.execute("UPDATE services SET status = 'inactive' WHERE id = ?", [req.params.id]);
    await createAuditLog({ userId: req.user.id, action: 'SERVICE_DELETED', module: 'SERVICE', recordId: req.params.id, description: `Service "${existing[0].name}" deactivated`, ipAddress: req.ip });
    return successResponse(res, {}, 'Service deactivated successfully.');
  } catch (err) {
    return errorResponse(res, 'Failed to delete service.', 500);
  }
};

module.exports = { getServices, getServiceById, createService, updateService, deleteService };
