import express from 'express';
import { EmailAccount } from '../models/account';
import { imapService } from '../services/imapService';
import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/accounts - Get all email accounts
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM email_accounts ORDER BY created_at DESC';
    const result = await pool.query(query);

    const accounts = result.rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      host: row.host,
      port: row.port,
      secure: row.secure,
      username: row.username,
      // Don't send password to frontend
      isActive: row.is_active,
      lastSync: row.last_sync,
      syncFolders: row.sync_folders || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: accounts
    });

  } catch (error) {
    logger.error('Error in GET /api/accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch accounts'
    });
  }
});

// GET /api/accounts/status - Get connection status for all accounts
router.get('/status', async (req, res) => {
  try {
    const connectedAccounts = await imapService.getConnectedAccounts();

    res.json({
      success: true,
      data: {
        connectedAccounts,
        totalConnections: connectedAccounts.length
      }
    });

  } catch (error) {
    logger.error('Error in GET /api/accounts/status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account status'
    });
  }
});

// GET /api/accounts/:id - Get specific account
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT * FROM email_accounts WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    const account = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      name: result.rows[0].name,
      host: result.rows[0].host,
      port: result.rows[0].port,
      secure: result.rows[0].secure,
      username: result.rows[0].username,
      // Don't send password to frontend
      isActive: result.rows[0].is_active,
      lastSync: result.rows[0].last_sync,
      syncFolders: result.rows[0].sync_folders || [],
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    res.json({
      success: true,
      data: account
    });

  } catch (error) {
    logger.error(`Error in GET /api/accounts/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account'
    });
  }
});

// POST /api/accounts - Add new email account
router.post('/', async (req, res) => {
  try {
    const {
      email,
      name,
      host,
      port,
      secure,
      username,
      password,
      syncFolders
    } = req.body;

    // Validate required fields
    if (!email || !host || !port || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, host, port, username, password'
      });
    }

    const accountId = uuidv4();
    const now = new Date();

    const query = `
      INSERT INTO email_accounts (
        id, email, name, host, port, secure, username, password,
        is_active, sync_folders, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      accountId,
      email,
      name || email.split('@')[0],
      host,
      port,
      secure !== false,
      username,
      password, // In production, this should be encrypted
      true,
      JSON.stringify(syncFolders || ['INBOX']),
      now,
      now
    ];

    const result = await pool.query(query, values);

    const newAccount = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      name: result.rows[0].name,
      host: result.rows[0].host,
      port: result.rows[0].port,
      secure: result.rows[0].secure,
      username: result.rows[0].username,
      isActive: result.rows[0].is_active,
      lastSync: result.rows[0].last_sync,
      syncFolders: result.rows[0].sync_folders || [],
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    res.status(201).json({
      success: true,
      data: newAccount
    });

  } catch (error) {
    logger.error('Error in POST /api/accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create account'
    });
  }
});

// PUT /api/accounts/:id - Update account
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(updates.name);
    }
    if (updates.host !== undefined) {
      updateFields.push(`host = $${paramIndex++}`);
      updateValues.push(updates.host);
    }
    if (updates.port !== undefined) {
      updateFields.push(`port = $${paramIndex++}`);
      updateValues.push(updates.port);
    }
    if (updates.secure !== undefined) {
      updateFields.push(`secure = $${paramIndex++}`);
      updateValues.push(updates.secure);
    }
    if (updates.username !== undefined) {
      updateFields.push(`username = $${paramIndex++}`);
      updateValues.push(updates.username);
    }
    if (updates.password !== undefined) {
      updateFields.push(`password = $${paramIndex++}`);
      updateValues.push(updates.password);
    }
    if (updates.syncFolders !== undefined) {
      updateFields.push(`sync_folders = $${paramIndex++}`);
      updateValues.push(JSON.stringify(updates.syncFolders));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updateFields.push(`updated_at = $${paramIndex++}`);
    updateValues.push(new Date());
    updateValues.push(id);

    const query = `
      UPDATE email_accounts
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    const updatedAccount = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      name: result.rows[0].name,
      host: result.rows[0].host,
      port: result.rows[0].port,
      secure: result.rows[0].secure,
      username: result.rows[0].username,
      isActive: result.rows[0].is_active,
      lastSync: result.rows[0].last_sync,
      syncFolders: result.rows[0].sync_folders || [],
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    res.json({
      success: true,
      data: updatedAccount
    });

  } catch (error) {
    logger.error(`Error in PUT /api/accounts/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to update account'
    });
  }
});

// DELETE /api/accounts/:id - Delete account
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Disconnect IMAP connection if active
    await imapService.disconnectAccount(id);

    const query = 'DELETE FROM email_accounts WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    logger.error(`Error in DELETE /api/accounts/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

// POST /api/accounts/:id/connect - Connect to account
router.post('/:id/connect', async (req, res) => {
  try {
    const { id } = req.params;

    // Get account details from database
    const query = 'SELECT * FROM email_accounts WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    const accountData = result.rows[0];
    const account: EmailAccount = {
      id: accountData.id,
      email: accountData.email,
      name: accountData.name,
      host: accountData.host,
      port: accountData.port,
      secure: accountData.secure,
      username: accountData.username,
      password: accountData.password,
      isActive: accountData.is_active,
      syncFolders: accountData.sync_folders || ['INBOX'],
      createdAt: accountData.created_at,
      updatedAt: accountData.updated_at
    };

    // Connect to IMAP account
    await imapService.connectAccount(account);

    // Update last sync time
    await pool.query(
      'UPDATE email_accounts SET last_sync = $1 WHERE id = $2',
      [new Date(), id]
    );

    res.json({
      success: true,
      message: 'Account connected successfully'
    });

  } catch (error) {
    logger.error(`Error in POST /api/accounts/${req.params.id}/connect:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to account'
    });
  }
});

// POST /api/accounts/:id/disconnect - Disconnect from account
router.post('/:id/disconnect', async (req, res) => {
  try {
    const { id } = req.params;

    await imapService.disconnectAccount(id);

    res.json({
      success: true,
      message: 'Account disconnected successfully'
    });

  } catch (error) {
    logger.error(`Error in POST /api/accounts/${req.params.id}/disconnect:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect from account'
    });
  }
});

export default router;