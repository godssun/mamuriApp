ALTER TABLE diary_photos
  ADD COLUMN position_x DOUBLE PRECISION,
  ADD COLUMN position_y DOUBLE PRECISION,
  ADD COLUMN display_width INT,
  ADD COLUMN display_height INT,
  ADD COLUMN z_index INT DEFAULT 0;
