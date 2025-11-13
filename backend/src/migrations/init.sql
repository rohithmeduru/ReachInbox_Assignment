-- Create email_accounts table
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  host VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL,
  secure BOOLEAN NOT NULL DEFAULT true,
  username VARCHAR(255) NOT NULL,
  password TEXT NOT NULL, -- In production, this should be encrypted
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync TIMESTAMP,
  sync_folders JSONB DEFAULT '["INBOX"]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON email_accounts(email);

-- Create index on is_active for filtering active accounts
CREATE INDEX IF NOT EXISTS idx_email_accounts_is_active ON email_accounts(is_active);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_accounts_updated_at
    BEFORE UPDATE ON email_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();