import express from 'express';
import { elasticsearchService } from '../services/elasticsearchService';
import { aiReplyService } from '../services/aiReplyService';
import { aiCategorizationService } from '../services/aiCategorizationService';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/emails - Search and list emails
router.get('/', async (req, res) => {
  try {
    const {
      q: query,
      accountId,
      folder,
      category,
      dateFrom,
      dateTo,
      limit = '50',
      offset = '0'
    } = req.query;

    const searchParams: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    if (query) searchParams.query = query as string;
    if (accountId) searchParams.accountId = accountId as string;
    if (folder) searchParams.folder = folder as string;
    if (category) searchParams.category = category as string;
    if (dateFrom) searchParams.dateFrom = new Date(dateFrom as string);
    if (dateTo) searchParams.dateTo = new Date(dateTo as string);

    const result = await elasticsearchService.searchEmails(searchParams);

    res.json({
      success: true,
      data: {
        emails: result.emails,
        total: result.total,
        limit: searchParams.limit,
        offset: searchParams.offset
      }
    });

  } catch (error) {
    logger.error('Error in GET /api/emails:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emails'
    });
  }
});

// GET /api/emails/stats - Get email statistics
router.get('/stats', async (req, res) => {
  try {
    const { accountId } = req.query;

    const stats = await elasticsearchService.getEmailStats(accountId as string);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error in GET /api/emails/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email statistics'
    });
  }
});

// GET /api/emails/:id - Get specific email
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const email = await elasticsearchService.getEmailById(id);

    if (!email) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    res.json({
      success: true,
      data: email
    });

  } catch (error) {
    logger.error(`Error in GET /api/emails/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email'
    });
  }
});

// POST /api/emails/:id/reply-suggestion - Generate AI reply suggestion
router.post('/:id/reply-suggestion', async (req, res) => {
  try {
    const { id } = req.params;
    const suggestion = await aiReplyService.generateReplySuggestion(id);

    res.json({
      success: true,
      data: suggestion
    });

  } catch (error) {
    logger.error(`Error in POST /api/emails/${req.params.id}/reply-suggestion:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate reply suggestion'
    });
  }
});

// POST /api/emails/:id/reply-suggestions/multiple - Generate multiple reply suggestions
router.post('/:id/reply-suggestions/multiple', async (req, res) => {
  try {
    const { id } = req.params;
    const { count = 3 } = req.body;

    const suggestions = await aiReplyService.generateMultipleSuggestions(id, count);

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    logger.error(`Error in POST /api/emails/${req.params.id}/reply-suggestions/multiple:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate multiple reply suggestions'
    });
  }
});

// POST /api/emails/:id/reply-suggestions/refine - Refine reply suggestion
router.post('/:id/reply-suggestions/refine', async (req, res) => {
  try {
    const { id } = req.params;
    const { originalSuggestion, feedback } = req.body;

    const refined = await aiReplyService.refineReply(id, originalSuggestion, feedback);

    res.json({
      success: true,
      data: refined
    });

  } catch (error) {
    logger.error(`Error in POST /api/emails/${req.params.id}/reply-suggestions/refine:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to refine reply suggestion'
    });
  }
});

// POST /api/emails/:id/categorize - Manually categorize email
router.post('/:id/categorize', async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;

    await aiCategorizationService.reclassifyEmail(id, category);

    res.json({
      success: true,
      message: 'Email categorized successfully'
    });

  } catch (error) {
    logger.error(`Error in POST /api/emails/${req.params.id}/categorize:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to categorize email'
    });
  }
});

// DELETE /api/emails/:id - Delete email
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await elasticsearchService.deleteEmail(id);

    res.json({
      success: true,
      message: 'Email deleted successfully'
    });

  } catch (error) {
    logger.error(`Error in DELETE /api/emails/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete email'
    });
  }
});

// PUT /api/emails/:id - Update email
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    await elasticsearchService.updateEmail(id, updates);

    res.json({
      success: true,
      message: 'Email updated successfully'
    });

  } catch (error) {
    logger.error(`Error in PUT /api/emails/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to update email'
    });
  }
});

export default router;