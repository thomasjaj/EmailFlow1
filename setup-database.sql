-- EmailPro Database Schema
-- Run this script to create all required tables

-- Create custom types
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled');
CREATE TYPE contact_status AS ENUM ('active', 'unsubscribed', 'bounced', 'complained');
CREATE TYPE server_status AS ENUM ('active', 'inactive', 'error');

-- Session storage table
CREATE TABLE sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);
CREATE INDEX IDX_session_expire ON sessions (expire);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- SMTP Servers
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

-- Contact Lists
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

-- Email Templates
CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    is_default BOOLEAN DEFAULT FALSE,
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

-- Suppression List
CREATE TABLE suppression_list (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    reason VARCHAR(100) NOT NULL,
    source VARCHAR(100),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default admin user
INSERT INTO users (email, first_name, last_name) 
VALUES ('admin@emailpro.com', 'Admin', 'User') 
ON CONFLICT (email) DO NOTHING;

-- Insert sample SMTP server
INSERT INTO smtp_servers (name, host, port, username, password, user_id)
SELECT 'Default SMTP', 'smtp.gmail.com', 587, 'your-email@gmail.com', 'your-app-password', id
FROM users WHERE email = 'admin@emailpro.com'
ON CONFLICT DO NOTHING;

-- Insert sample email template
INSERT INTO email_templates (name, subject, html_content, text_content, user_id)
SELECT 
    'Welcome Template', 
    'Welcome to EmailPro!', 
    '<h1>Welcome!</h1><p>Thank you for joining EmailPro. We are excited to have you on board.</p>',
    'Welcome! Thank you for joining EmailPro. We are excited to have you on board.',
    id
FROM users WHERE email = 'admin@emailpro.com'
ON CONFLICT DO NOTHING;