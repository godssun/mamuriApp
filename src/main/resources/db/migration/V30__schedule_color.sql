-- Add color column to schedules for calendar pill display
ALTER TABLE schedules ADD COLUMN color VARCHAR(20) NOT NULL DEFAULT 'sage';
