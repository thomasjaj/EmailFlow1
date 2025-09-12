-- PostgreSQL 9.2 Compatible Database Setup for EmailPro
-- Run this script as: psql -h localhost -U emailpro -d emailpro -f setup-database-centos7.sql

-- Create enums
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled');
CREATE TYPE contact_status AS ENUM ('active', 'unsubscribed', 'bounced', 'complained');
CREATE TYPE server_status AS ENUM ('active', 'inactive', 'error');

-- Sessions table (required for authentication)
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess TEXT NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX IDX_session_expire ON sessions(expire);

-- Users table (required for authentication)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SMTP servers
CREATE TABLE smtp_servers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  host VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  encryption VARCHAR(10),
  max_emails_per_hour INTEGER DEFAULT 100,
  status server_status DEFAULT 'active',
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Contact lists
CREATE TABLE contact_lists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Contacts
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  status contact_status DEFAULT 'active',
  subscription_date TIMESTAMP DEFAULT NOW(),
  last_engagement_date TIMESTAMP,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email templates
CREATE TABLE email_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  is_default BOOLEAN DEFAULT false,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  from_name VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  status campaign_status DEFAULT 'draft',
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  unsubscribe_count INTEGER DEFAULT 0,
  template_id INTEGER REFERENCES email_templates(id),
  smtp_server_id INTEGER REFERENCES smtp_servers(id),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample data
INSERT INTO users (email, first_name, last_name) 
VALUES ('admin@emailpro.com', 'Admin', 'User');

INSERT INTO smtp_servers (name, host, port, username, password, encryption, user_id)
VALUES ('Local SMTP', 'localhost', 25, 'emailpro', 'password', 'none', 1);

INSERT INTO email_templates (name, subject, html_content, text_content, is_default, user_id)
VALUES ('Welcome Email', 'Welcome to EmailPro', '<h1>Welcome!</h1><p>Thank you for joining us.</p>', 'Welcome! Thank you for joining us.', true, 1);

COMMIT;