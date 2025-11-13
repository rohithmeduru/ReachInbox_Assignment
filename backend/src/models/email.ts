export interface Email {
  id?: string;
  messageId: string;
  threadId?: string;
  subject: string;
  from: {
    email: string;
    name?: string;
  };
  to: Array<{
    email: string;
    name?: string;
  }>;
  cc?: Array<{
    email: string;
    name?: string;
  }>;
  bcc?: Array<{
    email: string;
    name?: string;
  }>;
  body: string;
  htmlBody?: string;
  date: Date;
  accountId: string;
  folder: string;
  flags: string[];
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    contentId?: string;
  }>;
  category?: EmailCategory;
  categoryConfidence?: number;
  aiProcessed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum EmailCategory {
  INTERESTED = 'Interested',
  MEETING_BOOKED = 'Meeting Booked',
  NOT_INTERESTED = 'Not Interested',
  SPAM = 'Spam',
  OUT_OF_OFFICE = 'Out of Office'
}