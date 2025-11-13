"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imapService = exports.ImapService = void 0;
const imapflow_1 = require("imapflow");
const mailparser_1 = require("mailparser");
const elasticsearchService_1 = require("./elasticsearchService");
const aiCategorizationService_1 = require("./aiCategorizationService");
const logger_1 = require("../utils/logger");
const constants_1 = require("../utils/constants");
class ImapService {
    constructor() {
        this.connections = new Map();
        this.reconnectAttempts = new Map();
    }
    async connectAccount(account) {
        const client = new imapflow_1.ImapFlow({
            host: account.host,
            port: account.port,
            secure: account.secure,
            auth: {
                user: account.username,
                pass: account.password,
            },
            logger: logger_1.logger,
        });
        try {
            await client.connect();
            this.connections.set(account.id, client);
            this.reconnectAttempts.set(account.id, 0);
            logger_1.logger.info(`Connected to IMAP account: ${account.email}`);
            // Start real-time monitoring
            await this.startRealtimeSync(account, client);
            // Initial sync for last 30 days
            await this.performInitialSync(account, client);
        }
        catch (error) {
            logger_1.logger.error(`Failed to connect to account ${account.email}:`, error);
            await this.scheduleReconnect(account);
        }
    }
    async startRealtimeSync(account, client) {
        const syncFolders = account.syncFolders.length > 0 ? account.syncFolders : constants_1.DEFAULT_SYNC_FOLDERS;
        for (const folder of syncFolders) {
            try {
                const lock = await client.getMailboxLock(folder);
                // Listen for new messages
                client.on('exists', async (data) => {
                    // For new messages, we need to get the latest UID
                    try {
                        const status = await client.status(folder, { uidNext: true });
                        if (status.uidNext && status.uidNext > 1) {
                            const latestUid = status.uidNext - 1;
                            await this.fetchAndProcessEmail(client, latestUid, account, folder);
                        }
                    }
                    catch (error) {
                        logger_1.logger.error(`Failed to fetch latest UID for folder ${folder}:`, error);
                    }
                });
                // Enable IDLE mode for real-time updates
                await client.idle();
                lock.release();
                logger_1.logger.info(`Started real-time monitoring for ${folder} on ${account.email}`);
            }
            catch (error) {
                logger_1.logger.error(`Failed to monitor folder ${folder}:`, error);
            }
        }
        // Handle connection errors
        client.on('error', async (error) => {
            logger_1.logger.error(`IMAP connection error for ${account.email}:`, error);
            await this.handleConnectionError(account);
        });
        client.on('close', async () => {
            logger_1.logger.warn(`IMAP connection closed for ${account.email}`);
            await this.handleConnectionError(account);
        });
    }
    async performInitialSync(account, client) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - constants_1.DEFAULT_SYNC_DAYS);
        const syncFolders = account.syncFolders.length > 0 ? account.syncFolders : constants_1.DEFAULT_SYNC_FOLDERS;
        for (const folder of syncFolders) {
            try {
                const lock = await client.getMailboxLock(folder);
                // Search for emails from last 30 days
                const searchResult = await client.search({
                    since: thirtyDaysAgo,
                }, { uid: true });
                const uids = Array.isArray(searchResult) ? searchResult : [];
                logger_1.logger.info(`Found ${uids.length} emails in ${folder} for ${account.email}`);
                // Process in batches to avoid memory issues
                for (let i = 0; i < uids.length; i += constants_1.EMAIL_BATCH_SIZE) {
                    const batch = uids.slice(i, i + constants_1.EMAIL_BATCH_SIZE);
                    for (const uid of batch) {
                        await this.fetchAndProcessEmail(client, uid, account, folder);
                    }
                    // Small delay between batches
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                lock.release();
            }
            catch (error) {
                logger_1.logger.error(`Failed to sync folder ${folder}:`, error);
            }
        }
        logger_1.logger.info(`Initial sync completed for ${account.email}`);
    }
    async fetchAndProcessEmail(client, uid, account, folder) {
        try {
            const message = await client.fetchOne(uid, {
                source: true,
                envelope: true,
                flags: true
            });
            const messageData = message;
            if (!messageData.source) {
                logger_1.logger.warn(`No source found for UID ${uid} in ${folder}`);
                return;
            }
            // Parse email using mailparser
            const parsed = await (0, mailparser_1.simpleParser)(messageData.source);
            // Extract email data
            const email = {
                messageId: messageData.envelope?.messageId || `${uid}@${account.email}`,
                subject: parsed.subject || '(No Subject)',
                from: {
                    email: parsed.from?.value?.[0]?.address || '',
                    name: parsed.from?.value?.[0]?.name || ''
                },
                to: parsed.to?.value?.map((addr) => ({
                    email: addr.address || '',
                    name: addr.name || ''
                })) || [],
                cc: parsed.cc?.value?.map((addr) => ({
                    email: addr.address || '',
                    name: addr.name || ''
                })) || [],
                body: parsed.text || '',
                htmlBody: parsed.html || undefined,
                date: parsed.date || new Date(),
                accountId: account.id,
                folder,
                flags: messageData.flags || [],
                attachments: parsed.attachments?.map(att => ({
                    filename: att.filename || '',
                    contentType: att.contentType || '',
                    size: att.size || 0,
                    contentId: att.contentId
                })) || [],
                aiProcessed: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            // Store in Elasticsearch
            await elasticsearchService_1.elasticsearchService.indexEmail(email);
            // Categorize with AI (async)
            this.categorizeEmailAsync(email.id);
            logger_1.logger.info(`Processed email: ${email.subject} from ${email.from.email}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to fetch/process email UID ${uid}:`, error);
        }
    }
    async categorizeEmailAsync(emailId) {
        try {
            const category = await aiCategorizationService_1.aiCategorizationService.categorizeEmail(emailId);
            logger_1.logger.info(`Email ${emailId} categorized as: ${category.category}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to categorize email ${emailId}:`, error);
        }
    }
    async handleConnectionError(account) {
        this.connections.delete(account.id);
        await this.scheduleReconnect(account);
    }
    async scheduleReconnect(account) {
        const attempts = this.reconnectAttempts.get(account.id) || 0;
        const delay = Math.min(1000 * Math.pow(2, attempts), 30000); // Exponential backoff, max 30 seconds
        this.reconnectAttempts.set(account.id, attempts + 1);
        logger_1.logger.info(`Scheduling reconnect for ${account.email} in ${delay}ms (attempt ${attempts + 1})`);
        setTimeout(async () => {
            if (this.reconnectAttempts.get(account.id) < constants_1.MAX_RECONNECT_ATTEMPTS) {
                await this.connectAccount(account);
            }
            else {
                logger_1.logger.error(`Max reconnection attempts reached for ${account.email}`);
            }
        }, delay);
    }
    async disconnectAccount(accountId) {
        const client = this.connections.get(accountId);
        if (client) {
            await client.logout();
            this.connections.delete(accountId);
            this.reconnectAttempts.delete(accountId);
            logger_1.logger.info(`Disconnected account: ${accountId}`);
        }
    }
    async getConnectionStatus(accountId) {
        return this.connections.has(accountId);
    }
    async getConnectedAccounts() {
        return Array.from(this.connections.keys());
    }
}
exports.ImapService = ImapService;
exports.imapService = new ImapService();
//# sourceMappingURL=imapService.js.map