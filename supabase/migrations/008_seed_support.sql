-- Add staff flag to profiles for internal/bot accounts
ALTER TABLE profiles ADD COLUMN is_staff boolean NOT NULL DEFAULT false;

-- Add featured flag to pastries for editorial picks
ALTER TABLE pastries ADD COLUMN featured boolean NOT NULL DEFAULT false;
