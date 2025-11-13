export interface EmailAccount {
  id: string;
  email: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string; // In production, this should be encrypted
  isActive: boolean;
  lastSync?: Date;
  syncFolders: string[];
  createdAt: Date;
  updatedAt: Date;
}