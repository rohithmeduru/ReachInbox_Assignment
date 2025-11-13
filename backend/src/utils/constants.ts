export const EMAIL_CATEGORIES = {
  INTERESTED: 'Interested',
  MEETING_BOOKED: 'Meeting Booked',
  NOT_INTERESTED: 'Not Interested',
  SPAM: 'Spam',
  OUT_OF_OFFICE: 'Out of Office'
} as const;

export const DEFAULT_SYNC_FOLDERS = ['INBOX', 'Sent'];
export const DEFAULT_SYNC_DAYS = 30;
export const MAX_RECONNECT_ATTEMPTS = 5;
export const EMAIL_BATCH_SIZE = 50;