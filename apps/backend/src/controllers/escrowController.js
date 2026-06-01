const { queryOne, run } = require('../config/db');

/**
 * POST /api/escrows/:id/metadata
 *
 * Saves the human-readable details for an on-chain escrow.
 * Call this right after the smart contract's create_escrow succeeds,
 * passing the returned escrow ID as the :id param.
 */
const saveMetadata = (req, res, next) => {
    try {
        const escrowId = parseInt(req.params.id, 10);

        if (isNaN(escrowId)) {
            return res.status(400).json({ error: 'Escrow ID must be a number' });
        }

        const { title, description, client_address } = req.body;

        if (!title || !description || !client_address) {
            return res.status(400).json({
                error: 'Missing required fields: title, description, client_address',
            });
        }

        // Prevent anyone from overwriting existing metadata
        const existing = queryOne(
            'SELECT escrow_id FROM escrow_metadata WHERE escrow_id = ?',
            [escrowId]
        );

        if (existing) {
            return res.status(409).json({
                error: `Metadata for escrow ${escrowId} already exists`,
            });
        }

        run(
            `INSERT INTO escrow_metadata (escrow_id, title, description, client_address)
       VALUES (?, ?, ?, ?)`,
            [escrowId, title.trim(), description.trim(), client_address.trim()]
        );

        return res.status(201).json({
            message: 'Metadata saved successfully',
            escrow_id: escrowId,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/escrows/:id/metadata
 *
 * Fetches the title, description, and client address for a given escrow.
 * The frontend uses this to display readable context on each escrow card.
 */
const getMetadata = (req, res, next) => {
    try {
        const escrowId = parseInt(req.params.id, 10);

        if (isNaN(escrowId)) {
            return res.status(400).json({ error: 'Escrow ID must be a number' });
        }

        const row = queryOne(
            'SELECT * FROM escrow_metadata WHERE escrow_id = ?',
            [escrowId]
        );

        if (!row) {
            return res.status(404).json({
                error: `No metadata found for escrow ${escrowId}`,
            });
        }

        return res.json(row);
    } catch (err) {
        next(err);
    }
};

module.exports = { saveMetadata, getMetadata };
