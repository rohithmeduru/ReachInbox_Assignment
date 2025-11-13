"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiCategorizationService = exports.AiCategorizationService = void 0;
const openai_1 = __importDefault(require("openai"));
const email_1 = require("../models/email");
const elasticsearchService_1 = require("./elasticsearchService");
const slackService_1 = require("./slackService");
const webhookService_1 = require("./webhookService");
const logger_1 = require("../utils/logger");
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
class AiCategorizationService {
    async categorizeEmail(emailId) {
        try {
            // Get email from Elasticsearch
            const email = await elasticsearchService_1.elasticsearchService.getEmailById(emailId);
            if (!email) {
                throw new Error(`Email not found: ${emailId}`);
            }
            // Prepare email content for analysis
            const emailContent = this.prepareEmailContent(email);
            // Use OpenAI to categorize
            const completion = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are an email categorization assistant. Categorize emails into one of these categories:

            1. "Interested" - The sender shows genuine interest in your product/service/opportunity, asks questions, requests more info, or expresses positive sentiment
            2. "Meeting Booked" - Email contains confirmation of a scheduled meeting, call, or interview
            3. "Not Interested" - Sender explicitly declines, says no thanks, or shows clear disinterest
            4. "Spam" - Promotional content, suspicious links, phishing attempts, or unwanted marketing
            5. "Out of Office" - Automatic replies indicating the person is away

            Respond with a JSON object containing:
            - category: one of the exact category names above
            - confidence: number between 0 and 1
            - reasoning: brief explanation of your choice`
                    },
                    {
                        role: 'user',
                        content: emailContent
                    }
                ],
                temperature: 0.1,
                response_format: { type: 'json_object' }
            });
            const result = JSON.parse(completion.choices[0].message.content || '{}');
            // Validate and normalize the category
            const category = this.validateCategory(result.category);
            const confidence = Math.max(0, Math.min(1, result.confidence || 0.5));
            // Update email in Elasticsearch
            await elasticsearchService_1.elasticsearchService.updateEmailCategory(emailId, category, confidence);
            // Trigger notifications for "Interested" emails
            if (category === email_1.EmailCategory.INTERESTED) {
                await this.triggerInterestedNotifications(email);
            }
            logger_1.logger.info(`Email ${emailId} categorized as ${category} with confidence ${confidence}`);
            return {
                category,
                confidence,
                reasoning: result.reasoning
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to categorize email ${emailId}:`, error);
            // Default categorization on error
            const defaultCategory = email_1.EmailCategory.SPAM;
            await elasticsearchService_1.elasticsearchService.updateEmailCategory(emailId, defaultCategory, 0.1);
            return {
                category: defaultCategory,
                confidence: 0.1,
                reasoning: 'Classification failed, defaulted to Spam'
            };
        }
    }
    prepareEmailContent(email) {
        return `
Subject: ${email.subject}
From: ${email.from.name} <${email.from.email}>
To: ${email.to.map((t) => `${t.name} <${t.email}>`).join(', ')}
Date: ${email.date}

Body:
${email.body.substring(0, 2000)} // Limit to first 2000 chars for analysis
    `.trim();
    }
    validateCategory(category) {
        const validCategories = Object.values(email_1.EmailCategory);
        if (validCategories.includes(category)) {
            return category;
        }
        // Fallback logic for common variations
        const lowerCategory = category.toLowerCase();
        if (lowerCategory.includes('interest') || lowerCategory.includes('positive')) {
            return email_1.EmailCategory.INTERESTED;
        }
        if (lowerCategory.includes('meeting') || lowerCategory.includes('schedule') || lowerCategory.includes('confirm')) {
            return email_1.EmailCategory.MEETING_BOOKED;
        }
        if (lowerCategory.includes('not interest') || lowerCategory.includes('decline') || lowerCategory.includes('no thanks')) {
            return email_1.EmailCategory.NOT_INTERESTED;
        }
        if (lowerCategory.includes('spam') || lowerCategory.includes('promotion') || lowerCategory.includes('marketing')) {
            return email_1.EmailCategory.SPAM;
        }
        if (lowerCategory.includes('out of office') || lowerCategory.includes('away') || lowerCategory.includes('vacation')) {
            return email_1.EmailCategory.OUT_OF_OFFICE;
        }
        // Default to Spam if no match
        return email_1.EmailCategory.SPAM;
    }
    async triggerInterestedNotifications(email) {
        try {
            // Send Slack notification
            await slackService_1.slackService.sendInterestedNotification(email);
            // Trigger webhook
            await webhookService_1.webhookService.triggerInterestedWebhook(email);
            logger_1.logger.info(`Triggered notifications for interested email: ${email.id}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to trigger notifications for email ${email.id}:`, error);
        }
    }
    async batchCategorizeUncategorized(limit = 100) {
        try {
            // Find uncategorized emails
            const { emails } = await elasticsearchService_1.elasticsearchService.searchEmails({
                query: '',
                limit,
                filters: [{
                        term: { aiProcessed: false }
                    }]
            });
            logger_1.logger.info(`Found ${emails.length} uncategorized emails to process`);
            for (const email of emails) {
                try {
                    await this.categorizeEmail(email.id);
                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                catch (error) {
                    logger_1.logger.error(`Failed to categorize email ${email.id}:`, error);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to batch categorize emails:', error);
        }
    }
    async reclassifyEmail(emailId, forcedCategory) {
        try {
            await elasticsearchService_1.elasticsearchService.updateEmailCategory(emailId, forcedCategory, 1.0);
            logger_1.logger.info(`Manually reclassified email ${emailId} as ${forcedCategory}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to reclassify email ${emailId}:`, error);
            throw error;
        }
    }
}
exports.AiCategorizationService = AiCategorizationService;
exports.aiCategorizationService = new AiCategorizationService();
//# sourceMappingURL=aiCategorizationService.js.map