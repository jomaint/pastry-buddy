-- RLS policies for admin access + admin stats function.
-- Admins (role = 'admin') can update/delete content for moderation.

-- Helper: check if current user is an admin
CREATE OR REPLACE FUNCTION fn_is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Staff can update any profile (toggle roles, edit bios, etc.)
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE USING (fn_is_admin());

-- Admins can update any pastry (edit, toggle featured)
CREATE POLICY "Admins can update pastries"
  ON pastries FOR UPDATE USING (fn_is_admin());

-- Admins can delete pastries
CREATE POLICY "Admins can delete pastries"
  ON pastries FOR DELETE USING (fn_is_admin());

-- Admins can update any place
CREATE POLICY "Admins can update places"
  ON places FOR UPDATE USING (fn_is_admin());

-- Admins can delete places
CREATE POLICY "Admins can delete places"
  ON places FOR DELETE USING (fn_is_admin());

-- Admins can delete any check-in (moderation)
CREATE POLICY "Admins can delete any check-in"
  ON check_ins FOR DELETE USING (fn_is_admin());

-- Admins can delete any comment (moderation)
CREATE POLICY "Admins can delete any comment"
  ON check_in_comments FOR DELETE USING (fn_is_admin());

-- Dashboard stats function (admin only, security definer bypasses RLS)
CREATE OR REPLACE FUNCTION fn_admin_stats()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM profiles),
    'total_checkins', (SELECT count(*) FROM check_ins),
    'total_pastries', (SELECT count(*) FROM pastries),
    'total_places', (SELECT count(*) FROM places),
    'total_comments', (SELECT count(*) FROM check_in_comments),
    'users_today', (SELECT count(*) FROM profiles WHERE created_at >= CURRENT_DATE),
    'checkins_today', (SELECT count(*) FROM check_ins WHERE created_at >= CURRENT_DATE),
    'checkins_this_week', (SELECT count(*) FROM check_ins WHERE created_at >= date_trunc('week', now())),
    'checkins_this_month', (SELECT count(*) FROM check_ins WHERE created_at >= date_trunc('month', now()))
  );
$$;
