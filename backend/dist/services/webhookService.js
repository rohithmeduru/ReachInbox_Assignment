"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookService = exports.WebhookService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class WebhookService {
    async triggerInterestedWebhook(email) {
        try {
            const webhookUrl = process.env.WEBHOOK_URL || 'https://webhook.site/your-unique-id';
            const payload = {
                event: 'email_interested',
                timestamp: new Date().toISOString(),
                email: {
                    id: email.id,
                    subject: email.subject,
                    from: email.from,
                    to: email.to,
                    date: email.date,
                    body: email.body?.substring(0, 500), // First 500 chars
                    category: email.category,
                    accountId: email.accountId
                }
            };
            const response = await axios_1.default.post(webhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'EmailOnebox/1.0'
                },
                timeout: 10000
            });
            logger_1.logger.info(`Webhook sent successfully for email ${email.id}. Status: ${response.status}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to send webhook for email ${email.id}:`, error.message);
            // Don't throw error - webhook failures shouldn't break the flow
        }
    }
    async testWebhook() {
        try {
            const webhookUrl = process.env.WEBHOOK_URL || 'https://webhook.site/your-unique-id';
            const testPayload = {
                event: 'test',
                timestamp: new Date().toISOString(),
                message: 'Email Onebox webhook test'
            };
            const response = await axios_1.default.post(webhookUrl, testPayload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            logger_1.logger.info(`Webhook test successful. Status: ${response.status}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Webhook test failed:', error.message);
            return false;
        }
    }
    async triggerCustomWebhook(url, payload, headers) {
        try {
            await axios_1.default.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'EmailOnebox/1.0',
                    ...headers
                },
                timeout: 10000
            });
            logger_1.logger.info(`Custom webhook sent successfully to ${url}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to send custom webhook to ${url}:`, error.message);
            throw error;
        }
    }
    async batchTriggerWebhooks(webhooks) {
        const promises = webhooks.map(({ url, payload, headers }) => this.triggerCustomWebhook(url, payload, headers).catch(error => {
            logger_1.logger.error(`Failed to send batch webhook to ${url}:`, error);
        }));
        await Promise.allSettled(promises);
        logger_1.logger.info(`Batch webhooks processed: ${webhooks.length} webhooks sent`);
    }
    async retryFailedWebhook(url, payload, maxRetries = 3) {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                await this.triggerCustomWebhook(url, payload);
                logger_1.logger.info(`Webhook succeeded on attempt ${attempt + 1}`);
                return;
            }
            catch (error) {
                attempt++;
                logger_1.logger.warn(`Webhook attempt ${attempt} failed:`, error.message);
                if (attempt >= maxRetries) {
                    logger_1.logger.error(`Webhook failed after ${maxRetries} attempts`);
                    throw error;
                }
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    async sendBulkEmailSummary(emails, category) {
        try {
            const webhookUrl = process.env.WEBHOOK_URL || 'https://webhook.site/your-unique-id';
            const summary = {
                event: 'bulk_email_summary',
                timestamp: new Date().toISOString(),
                category,
                count: emails.length,
                emails: emails.map(email => ({
                    id: email.id,
                    subject: email.subject,
                    from: email.from,
                    date: email.date
                }))
            };
            await this.triggerCustomWebhook(webhookUrl, summary);
            logger_1.logger.info(`Bulk email summary sent for category: ${category}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to send bulk email summary:', error);
        }
    }
}
exports.WebhookService = WebhookService;
exports.webhookService = new WebhookService();
//# sourceMappingURL=webhookService.js.map