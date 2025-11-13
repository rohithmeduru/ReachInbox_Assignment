export interface IMAPAccountConfig {
  id: string;
  email: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailSyncOptions {
  account: IMAPAccountConfig;
  folders: string[];
  daysBack: number;
}