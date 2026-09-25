-- Email subscribers for every TensaCo site. One row per (email, arm): someone can follow PHASER and TensorCode separately.
CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  arm TEXT NOT NULL,              -- 'tensaco' | 'phaser' | 'tensorcode'
  source TEXT,                    -- where on the site they signed up (e.g. 'home', 'post:phaser')
  country TEXT,                   -- Cloudflare's request.cf.country
  ip_hash TEXT,                   -- sha-256 of the client IP + salt, for rate limiting only
  status TEXT NOT NULL DEFAULT 'subscribed',
  unsubscribe_token TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (email, arm)
);
CREATE INDEX subscribers_ip_recent ON subscribers (ip_hash, created_at);
