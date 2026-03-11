-- Migration 013: Expanded categories, bookmarks ("Want to Try"), verdict labels
-- Supports the product rethink: full bakery experience + documenter/explorer flows

-- ---------------------------------------------------------------------------
-- 1. Bookmarks ("Want to Try")
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pastry_id UUID NOT NULL REFERENCES pastries(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, pastry_id)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bookmarks"
  ON bookmarks FOR SELECT USING (true);

CREATE POLICY "Users can manage their own bookmarks"
  ON bookmarks FOR ALL USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. User Item Verdicts (verdict labels on Item Cards)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_item_verdicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pastry_id UUID NOT NULL REFERENCES pastries(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  verdict TEXT NOT NULL CHECK (verdict IN ('go_to', 'overrated', 'worth_the_detour', 'one_and_done', 'hidden_gem')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, pastry_id, place_id)
);

ALTER TABLE user_item_verdicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verdicts"
  ON user_item_verdicts FOR SELECT USING (true);

CREATE POLICY "Users can manage their own verdicts"
  ON user_item_verdicts FOR ALL USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER set_verdict_updated_at
  BEFORE UPDATE ON user_item_verdicts
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Indexes for performance
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_pastry ON bookmarks(pastry_id);
CREATE INDEX IF NOT EXISTS idx_verdicts_user ON user_item_verdicts(user_id);
CREATE INDEX IF NOT EXISTS idx_verdicts_pastry_place ON user_item_verdicts(pastry_id, place_id);

-- ---------------------------------------------------------------------------
-- 4. Check-ins index for Item Card grouping queries
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_checkins_user_pastry_place
  ON check_ins(user_id, pastry_id, place_id);
