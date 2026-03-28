-- Add rotation field to diary_photos for canvas transform consistency
ALTER TABLE diary_photos ADD COLUMN rotation DOUBLE PRECISION DEFAULT 0;
