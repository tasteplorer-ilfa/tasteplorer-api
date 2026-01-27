-- Migration: add likes_count and hot_score, add index, create updater function

BEGIN;

-- Add columns (idempotent)
ALTER TABLE IF EXISTS recipes
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hot_score double precision NOT NULL DEFAULT 0;

-- Composite index to support ORDER BY hot_score DESC, created_at DESC and the tuple comparison
CREATE INDEX IF NOT EXISTS idx_recipes_hot_score_created_at
  ON recipes (hot_score DESC, created_at DESC);

COMMIT;

-- Function to recompute hot_score for all non-deleted recipes
-- Score = (likes_count + 1) / (AgeInHours + 2)^1.8
CREATE OR REPLACE FUNCTION update_hot_scores()
RETURNS void AS $$
BEGIN
  UPDATE recipes
  SET hot_score = ((likes_count + 1)::double precision)
    / POWER(((EXTRACT(EPOCH FROM (now() - created_at)) / 3600.0) + 2.0), 1.8)
  WHERE deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Optional: function to update hot_score for a single recipe id (call after likes_count change)
CREATE OR REPLACE FUNCTION update_hot_score_for_recipe(p_recipe_id bigint)
RETURNS void AS $$
BEGIN
  UPDATE recipes
  SET hot_score = ((likes_count + 1)::double precision)
    / POWER(((EXTRACT(EPOCH FROM (now() - created_at)) / 3600.0) + 2.0), 1.8)
  WHERE id = p_recipe_id
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Example invocation (cron/scheduler should run this periodically)
-- To update all:
SELECT update_hot_scores();

-- To update one recipe after like/unlike:
SELECT update_hot_score_for_recipe(123);

------------------------------------------------------------------------------------------------------------------------------------
-- 1. Database Triggers (Automatic Sync)
-- The best approach is to use database triggers to automatically update likes_count whenever a like is added or removed:
-- Migration: Add triggers to sync likes_count

-- Function to increment likes_count when a like is added
CREATE OR REPLACE FUNCTION increment_recipe_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recipes
  SET likes_count = likes_count + 1
  WHERE id = NEW.recipe_id;
  
  -- Also update hot_score immediately
  PERFORM update_hot_score_for_recipe(NEW.recipe_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement likes_count when a like is removed
CREATE OR REPLACE FUNCTION decrement_recipe_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recipes
  SET likes_count = GREATEST(likes_count - 1, 0)  -- Prevent negative counts
  WHERE id = OLD.recipe_id;
  
  -- Also update hot_score immediately
  PERFORM update_hot_score_for_recipe(OLD.recipe_id);
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger: After INSERT on recipe_likes
CREATE TRIGGER trigger_increment_likes_count
AFTER INSERT ON recipe_likes
FOR EACH ROW
EXECUTE FUNCTION increment_recipe_likes_count();

-- Trigger: After DELETE on recipe_likes
CREATE TRIGGER trigger_decrement_likes_count
AFTER DELETE ON recipe_likes
FOR EACH ROW
EXECUTE FUNCTION decrement_recipe_likes_count();

-- 2. Initial Data Backfill
-- Add this to your migration to populate existing counts:
-- Backfill likes_count from recipe_likes table
UPDATE recipes r
SET likes_count = (
  SELECT COUNT(*) 
  FROM recipe_likes rl 
  WHERE rl.recipe_id = r.id
);

-- Then calculate initial hot_scores
SELECT update_hot_scores();