export interface Email {
  id: string;
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
  body: string;
  htmlBody?: string;
  date: string;
  accountId: string;
  folder: string;
  flags: string[];
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
  category?: EmailCategory;
  categoryConfidence?: number;
  aiProcessed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum EmailCategory {
  INTERESTED = 'Interested',
  MEETING_BOOKED = 'Meeting Booked',
  NOT_INTERESTED = 'Not Interested',
  SPAM = 'Spam',
  OUT_OF_OFFICE = 'Out of Office'
}

export interface EmailSearchParams {
  q?: string;
  accountId?: string;
  folder?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface EmailSearchResult {
  emails: Email[];
  total: number;
  limit: number;
  offset: number;
}

export interface ReplySuggestion {
  suggestion: string;
  confidence: number;
  reasoning?: string;
}

export interface MultipleReplySuggestions {
  suggestions: Array<{
    text: string;
    confidence: number;
    tone: string;
  }>;
}

export interface EmailAccount {
  id: string;
  email: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  isActive: boolean;
  lastSync?: string;
  syncFolders: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EmailStats {
  total: number;
  byCategory: Record<string, number>;
  byFolder: Record<string, number>;
}