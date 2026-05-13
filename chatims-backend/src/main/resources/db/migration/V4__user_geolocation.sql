-- Geolocation columns for distance-based matchmaking.
-- All nullable: existing users keep working until they opt-in to location sharing.
ALTER TABLE users ADD COLUMN latitude  DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN longitude DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN max_distance_km INTEGER;

-- Index helps the bounding-box prefilter when the matchmaking query is added.
CREATE INDEX idx_users_lat_lon ON users (latitude, longitude);
