-- Add completed flag to schedules for task completion tracking
ALTER TABLE schedules ADD COLUMN completed BOOLEAN NOT NULL DEFAULT FALSE;
