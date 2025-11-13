"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const elasticsearchService_1 = require("../services/elasticsearchService");
const aiReplyService_1 = require("../services/aiReplyService");
const aiCategorizationService_1 = require("../services/aiCategorizationService");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
// GET /api/emails - Search and list emails
router.get('/', async (req, res) => {
    try {
        const { q: query, accountId, folder, category, dateFrom, dateTo, limit = '50', offset = '0' } = req.query;
        const searchParams = {
            limit: parseInt(limit),
            offset: parseInt(offset)
        };
        if (query)
            searchParams.query = query;
        if (accountId)
            searchParams.accountId = accountId;
        if (folder)
            searchParams.folder = folder;
        if (category)
            searchParams.category = category;
        if (dateFrom)
            searchParams.dateFrom = new Date(dateFrom);
        if (dateTo)
            searchParams.dateTo = new Date(dateTo);
        try {
            const result = await elasticsearchService_1.elasticsearchService.searchEmails(searchParams);
            res.json({
                success: true,
                data: {
                    emails: result.emails,
                    total: result.total,
                    limit: searchParams.limit,
                    offset: searchParams.offset
                }
            });
        }
        catch (esError) {
            // Demo mode - return mock data when Elasticsearch is not available
            logger_1.logger.warn('Elasticsearch unavailable, returning demo data');
            const mockEmails = [
                {
                    id: 'demo-email-1',
                    messageId: '<demo1@reachinbox.com>',
                    subject: 'Welcome to ReachInbox - Demo Email',
                    from: { email: 'support@reachinbox.com', name: 'ReachInbox Team' },
                    to: [{ email: 'user@example.com', name: 'Demo User' }],
                    body: 'This is a demo email to showcase the ReachInbox email onebox functionality. In a real environment, this would be synchronized from your actual email accounts.',
                    date: new Date(Date.now() - 86400000).toISOString(),
                    accountId: 'demo-account-1',
                    folder: 'INBOX',
                    category: 'Interested',
                    categoryConfidence: 0.95,
                    aiProcessed: true
                },
                {
                    id: 'demo-email-2',
                    messageId: '<demo2@reachinbox.com>',
                    subject: 'Meeting Schedule Confirmation',
                    from: { email: 'meeting@example.com', name: 'Scheduler' },
                    to: [{ email: 'user@example.com', name: 'Demo User' }],
                    body: 'Your meeting has been scheduled for next week. Please confirm your availability.',
                    date: new Date(Date.now() - 172800000).toISOString(),
                    accountId: 'demo-account-1',
                    folder: 'INBOX',
                    category: 'Meeting Booked',
                    categoryConfidence: 0.88,
                    aiProcessed: true
                },
                {
                    id: 'demo-email-3',
                    messageId: '<demo3@reachinbox.com>',
                    subject: 'Marketing Offer',
                    from: { email: 'marketing@spam.com', name: 'Spam Marketing' },
                    to: [{ email: 'user@example.com', name: 'Demo User' }],
                    body: 'Limited time offer! Buy now and save 90%! Click here for amazing deals.',
                    date: new Date(Date.now() - 259200000).toISOString(),
                    accountId: 'demo-account-1',
                    folder: 'INBOX',
                    category: 'Spam',
                    categoryConfidence: 0.98,
                    aiProcessed: true
                }
            ];
            res.json({
                success: true,
                data: {
                    emails: mockEmails,
                    total: mockEmails.length,
                    limit: searchParams.limit,
                    offset: searchParams.offset
                }
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Error in GET /api/emails:', error);
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
        const stats = await elasticsearchService_1.elasticsearchService.getEmailStats(accountId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.logger.error('Error in GET /api/emails/stats:', error);
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
        const email = await elasticsearchService_1.elasticsearchService.getEmailById(id);
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
    }
    catch (error) {
        logger_1.logger.error(`Error in GET /api/emails/${req.params.id}:`, error);
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
        const suggestion = await aiReplyService_1.aiReplyService.generateReplySuggestion(id);
        res.json({
            success: true,
            data: suggestion
        });
    }
    catch (error) {
        logger_1.logger.error(`Error in POST /api/emails/${req.params.id}/reply-suggestion:`, error);
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
        const suggestions = await aiReplyService_1.aiReplyService.generateMultipleSuggestions(id, count);
        res.json({
            success: true,
            data: suggestions
        });
    }
    catch (error) {
        logger_1.logger.error(`Error in POST /api/emails/${req.params.id}/reply-suggestions/multiple:`, error);
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
        const refined = await aiReplyService_1.aiReplyService.refineReply(id, originalSuggestion, feedback);
        res.json({
            success: true,
            data: refined
        });
    }
    catch (error) {
        logger_1.logger.error(`Error in POST /api/emails/${req.params.id}/reply-suggestions/refine:`, error);
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
        await aiCategorizationService_1.aiCategorizationService.reclassifyEmail(id, category);
        res.json({
            success: true,
            message: 'Email categorized successfully'
        });
    }
    catch (error) {
        logger_1.logger.error(`Error in POST /api/emails/${req.params.id}/categorize:`, error);
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
        await elasticsearchService_1.elasticsearchService.deleteEmail(id);
        res.json({
            success: true,
            message: 'Email deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error(`Error in DELETE /api/emails/${req.params.id}:`, error);
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
        await elasticsearchService_1.elasticsearchService.updateEmail(id, updates);
        res.json({
            success: true,
            message: 'Email updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error(`Error in PUT /api/emails/${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to update email'
        });
    }
});
exports.default = router;
//# sourceMappingURL=emails.js.map