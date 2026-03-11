-- Replace is_staff boolean with a role enum for finer-grained access control.
-- Roles: 'user' (default), 'staff' (internal/seed accounts), 'admin' (full admin portal access).

-- 1. Create enum type
CREATE TYPE user_role AS ENUM ('user', 'staff', 'admin');

-- 2. Add new column with default
ALTER TABLE profiles ADD COLUMN role user_role NOT NULL DEFAULT 'user';

-- 3. Migrate existing data
UPDATE profiles SET role = 'staff' WHERE is_staff = true;

-- 4. Drop old column
ALTER TABLE profiles DROP COLUMN is_staff;
