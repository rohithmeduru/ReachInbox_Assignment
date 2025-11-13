import { WebClient } from '@slack/web-api';
import { logger } from '../utils/logger';

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

export class SlackService {
  async sendInterestedNotification(email: any): Promise<void> {
    try {
      const message = this.buildSlackMessage(email);

      await slackClient.chat.postMessage({
        channel: process.env.SLACK_CHANNEL_ID || '#general',
        ...message
      });

      logger.info(`Sent Slack notification for interested email: ${email.id}`);
    } catch (error) {
      logger.error(`Failed to send Slack notification for email ${email.id}:`, error);
      throw error;
    }
  }

  private buildSlackMessage(email: any) {
    const subject = email.subject || '(No Subject)';
    const from = email.from;
    const bodyPreview = email.body?.substring(0, 200) || '(No content)';

    return {
      text: `🎉 New Interested Email: ${subject}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎉 New Interested Lead!'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*From:*\n${from.name || from.email}`
            },
            {
              type: 'mrkdwn',
              text: `*Date:*\n${new Date(email.date).toLocaleDateString()}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Subject:*\n${subject}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: bodyPreview,
            emoji: false
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Email'
              },
              url: `${process.env.FRONTEND_URL}/emails/${email.id}`
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Reply'
              },
              url: `${process.env.FRONTEND_URL}/emails/${email.id}?reply=true`
            }
          ]
        }
      ]
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const auth = await slackClient.auth.test();
      logger.info('Slack connection test successful:', auth);
      return true;
    } catch (error) {
      logger.error('Slack connection test failed:', error);
      return false;
    }
  }

  async sendCustomMessage(channel: string, message: string, blocks?: any[]): Promise<void> {
    try {
      await slackClient.chat.postMessage({
        channel,
        text: message,
        blocks
      });
      logger.info(`Sent custom Slack message to ${channel}`);
    } catch (error) {
      logger.error(`Failed to send custom Slack message:`, error);
      throw error;
    }
  }

  async getCategoryStatsMessage(stats: { byCategory: Record<string, number> }): Promise<string> {
    const total = Object.values(stats.byCategory).reduce((sum, count) => sum + count, 0);
    const interested = stats.byCategory['Interested'] || 0;

    return `📊 Email Stats Update:\n` +
           `Total: ${total} emails\n` +
           `🎉 Interested: ${interested} (${((interested / total) * 100).toFixed(1)}%)\n` +
           `📅 Meeting Booked: ${stats.byCategory['Meeting Booked'] || 0}\n` +
           `❌ Not Interested: ${stats.byCategory['Not Interested'] || 0}\n` +
           `🗑️ Spam: ${stats.byCategory['Spam'] || 0}\n` +
           `🏖️ Out of Office: ${stats.byCategory['Out of Office'] || 0}`;
  }

  async sendDailyDigest(stats: { byCategory: Record<string, number> }, newInterestedCount: number): Promise<void> {
    try {
      const message = `🌅 Daily Email Digest - ${new Date().toLocaleDateString()}\n\n` +
                     `📈 New Interested Today: ${newInterestedCount}\n\n` +
                     await this.getCategoryStatsMessage(stats);

      await this.sendCustomMessage(
        process.env.SLACK_CHANNEL_ID || '#general',
        message
      );

      logger.info('Sent daily digest to Slack');
    } catch (error) {
      logger.error('Failed to send daily digest:', error);
    }
  }
}

export const slackService = new SlackService();