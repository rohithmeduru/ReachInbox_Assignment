import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { Email } from '../models/email';
import { EmailAccount } from '../models/account';
import { elasticsearchService } from './elasticsearchService';
import { aiCategorizationService } from './aiCategorizationService';
import { logger } from '../utils/logger';
import { DEFAULT_SYNC_FOLDERS, DEFAULT_SYNC_DAYS, MAX_RECONNECT_ATTEMPTS, EMAIL_BATCH_SIZE } from '../utils/constants';

export class ImapService {
  private connections: Map<string, ImapFlow> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();

  async connectAccount(account: EmailAccount): Promise<void> {
    const client = new ImapFlow({
      host: account.host,
      port: account.port,
      secure: account.secure,
      auth: {
        user: account.username,
        pass: account.password,
      },
      logger: logger,
    });

    try {
      await client.connect();
      this.connections.set(account.id, client);
      this.reconnectAttempts.set(account.id, 0);

      logger.info(`Connected to IMAP account: ${account.email}`);

      // Start real-time monitoring
      await this.startRealtimeSync(account, client);

      // Initial sync for last 30 days
      await this.performInitialSync(account, client);

    } catch (error) {
      logger.error(`Failed to connect to account ${account.email}:`, error);
      await this.scheduleReconnect(account);
    }
  }

  private async startRealtimeSync(account: EmailAccount, client: ImapFlow): Promise<void> {
    const syncFolders = account.syncFolders.length > 0 ? account.syncFolders : DEFAULT_SYNC_FOLDERS;

    for (const folder of syncFolders) {
      try {
        const lock = await client.getMailboxLock(folder);

        // Listen for new messages
        client.on('exists', async (data) => {
          // For new messages, we need to get the latest UID
          try {
            const status = await client.status(folder);
            if (status.uidNext && status.uidNext > 1) {
              const latestUid = status.uidNext - 1;
              await this.fetchAndProcessEmail(client, latestUid, account, folder);
            }
          } catch (error) {
            logger.error(`Failed to fetch latest UID for folder ${folder}:`, error);
          }
        });

        // Enable IDLE mode for real-time updates
        await client.idle();

        lock.release();
        logger.info(`Started real-time monitoring for ${folder} on ${account.email}`);

      } catch (error) {
        logger.error(`Failed to monitor folder ${folder}:`, error);
      }
    }

    // Handle connection errors
    client.on('error', async (error) => {
      logger.error(`IMAP connection error for ${account.email}:`, error);
      await this.handleConnectionError(account);
    });

    client.on('close', async () => {
      logger.warn(`IMAP connection closed for ${account.email}`);
      await this.handleConnectionError(account);
    });
  }

  private async performInitialSync(account: EmailAccount, client: ImapFlow): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - DEFAULT_SYNC_DAYS);

    const syncFolders = account.syncFolders.length > 0 ? account.syncFolders : DEFAULT_SYNC_FOLDERS;

    for (const folder of syncFolders) {
      try {
        const lock = await client.getMailboxLock(folder);

        // Search for emails from last 30 days
        const searchResult = await client.search({
          since: thirtyDaysAgo,
        }, { uid: true });

        const uids = Array.isArray(searchResult) ? searchResult : [];
        logger.info(`Found ${uids.length} emails in ${folder} for ${account.email}`);

        // Process in batches to avoid memory issues
        for (let i = 0; i < uids.length; i += EMAIL_BATCH_SIZE) {
          const batch = uids.slice(i, i + EMAIL_BATCH_SIZE);

          for (const uid of batch) {
            await this.fetchAndProcessEmail(client, uid, account, folder);
          }

          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        lock.release();

      } catch (error) {
        logger.error(`Failed to sync folder ${folder}:`, error);
      }
    }

    logger.info(`Initial sync completed for ${account.email}`);
  }

  private async fetchAndProcessEmail(
    client: ImapFlow,
    uid: number,
    account: EmailAccount,
    folder: string
  ): Promise<void> {
    try {
      const message = await client.fetchOne(uid, {
        source: true,
        envelope: true,
        flags: true,
        structure: true
      });

      if (!message.source) {
        logger.warn(`No source found for UID ${uid} in ${folder}`);
        return;
      }

      // Parse email using mailparser
      const parsed = await simpleParser(message.source);

      // Extract email data
      const email: Email = {
        messageId: message.envelope?.messageId || `${uid}@${account.email}`,
        subject: parsed.subject || '(No Subject)',
        from: {
          email: parsed.from?.value[0]?.address || '',
          name: parsed.from?.value[0]?.name || ''
        },
        to: parsed.to?.value.map(addr => ({
          email: addr.address || '',
          name: addr.name || ''
        })) || [],
        cc: parsed.cc?.value.map(addr => ({
          email: addr.address || '',
          name: addr.name || ''
        })),
        body: parsed.text || '',
        htmlBody: parsed.html || undefined,
        date: parsed.date || new Date(),
        accountId: account.id,
        folder,
        flags: message.flags || [],
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
      await elasticsearchService.indexEmail(email);

      // Categorize with AI (async)
      this.categorizeEmailAsync(email.id!);

      logger.info(`Processed email: ${email.subject} from ${email.from.email}`);

    } catch (error) {
      logger.error(`Failed to fetch/process email UID ${uid}:`, error);
    }
  }

  private async categorizeEmailAsync(emailId: string): Promise<void> {
    try {
      const category = await aiCategorizationService.categorizeEmail(emailId);
      logger.info(`Email ${emailId} categorized as: ${category.category}`);
    } catch (error) {
      logger.error(`Failed to categorize email ${emailId}:`, error);
    }
  }

  private async handleConnectionError(account: EmailAccount): Promise<void> {
    this.connections.delete(account.id);
    await this.scheduleReconnect(account);
  }

  private async scheduleReconnect(account: EmailAccount): Promise<void> {
    const attempts = this.reconnectAttempts.get(account.id) || 0;
    const delay = Math.min(1000 * Math.pow(2, attempts), 30000); // Exponential backoff, max 30 seconds

    this.reconnectAttempts.set(account.id, attempts + 1);

    logger.info(`Scheduling reconnect for ${account.email} in ${delay}ms (attempt ${attempts + 1})`);

    setTimeout(async () => {
      if (this.reconnectAttempts.get(account.id)! < MAX_RECONNECT_ATTEMPTS) {
        await this.connectAccount(account);
      } else {
        logger.error(`Max reconnection attempts reached for ${account.email}`);
      }
    }, delay);
  }

  async disconnectAccount(accountId: string): Promise<void> {
    const client = this.connections.get(accountId);
    if (client) {
      await client.logout();
      this.connections.delete(accountId);
      this.reconnectAttempts.delete(accountId);
      logger.info(`Disconnected account: ${accountId}`);
    }
  }

  async getConnectionStatus(accountId: string): Promise<boolean> {
    return this.connections.has(accountId);
  }

  async getConnectedAccounts(): Promise<string[]> {
    return Array.from(this.connections.keys());
  }
}

export const imapService = new ImapService();