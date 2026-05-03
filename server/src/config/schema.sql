CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    bank_name VARCHAR(255),
    bank_branch VARCHAR(255) DEFAULT '',
    account_number VARCHAR(20) DEFAULT '',
    account_type VARCHAR(50) DEFAULT '',
    pin_hash VARCHAR(255) DEFAULT '',
    account_setup_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    role VARCHAR(20) DEFAULT 'user',
    balance NUMERIC(15, 2) DEFAULT 0,
    login_attempts INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    lock_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_temporally_flagged BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    status_flag VARCHAR(20) DEFAULT 'normal',
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migrations for users table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_temporally_flagged') THEN 
        ALTER TABLE users ADD COLUMN is_temporally_flagged BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status_flag') THEN 
        ALTER TABLE users ADD COLUMN status_flag VARCHAR(20) DEFAULT 'normal';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='failed_login_attempts') THEN 
        ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='login_attempts') THEN 
        ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login_at') THEN 
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    END IF;

    -- Fix existing NULL balances and enforce NOT NULL
    UPDATE users SET balance = 0 WHERE balance IS NULL;
    ALTER TABLE users ALTER COLUMN balance SET NOT NULL;
    ALTER TABLE users ALTER COLUMN balance SET DEFAULT 0;
END $$;

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    amount NUMERIC(15, 2) NOT NULL,
    type VARCHAR(20) DEFAULT 'transfer',
    source VARCHAR(20) DEFAULT 'direct',
    merchant_name VARCHAR(255) DEFAULT '',
    status VARCHAR(50) DEFAULT 'completed',
    flag_reason TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migrations for transactions table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='source') THEN 
        ALTER TABLE transactions ADD COLUMN source VARCHAR(20) DEFAULT 'direct';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='merchant_name') THEN 
        ALTER TABLE transactions ADD COLUMN merchant_name VARCHAR(255) DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='flag_reason') THEN 
        ALTER TABLE transactions ADD COLUMN flag_reason TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='category') THEN 
        ALTER TABLE transactions ADD COLUMN category VARCHAR(50) DEFAULT 'transfer';
        -- Migrate existing types to categories and set type to credit/debit
        UPDATE transactions SET category = type;
        UPDATE transactions SET type = 'credit' WHERE category = 'credit';
        UPDATE transactions SET type = 'debit' WHERE category != 'credit';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS virtual_cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    card_number VARCHAR(20) UNIQUE NOT NULL,
    cvv VARCHAR(5) NOT NULL,
    expiry VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip VARCHAR(50) DEFAULT '',
    user_agent TEXT DEFAULT '',
    device_type VARCHAR(50) DEFAULT 'Unknown',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migrations for user_logs table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_logs' AND column_name='metadata') THEN 
        ALTER TABLE user_logs ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_logs' AND column_name='ip') THEN 
        ALTER TABLE user_logs ADD COLUMN ip VARCHAR(50) DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_logs' AND column_name='user_agent') THEN 
        ALTER TABLE user_logs ADD COLUMN user_agent TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_logs' AND column_name='device_type') THEN 
        ALTER TABLE user_logs ADD COLUMN device_type VARCHAR(50) DEFAULT 'Unknown';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS security_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    months INTEGER NOT NULL,
    monthly_payment NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migration for loans table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='loan_type') THEN 
        ALTER TABLE loans ADD COLUMN loan_type VARCHAR(255) DEFAULT 'Personal';
    END IF;
END $$;

-- Ensure ID columns have correct sequences (fixes issues if tables were created without SERIAL)
DO $$ 
DECLARE
    t text;
    m bigint;
BEGIN 
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'id' 
        AND data_type IN ('integer', 'bigint', 'smallint')
    LOOP
        -- Check if the column already has a default sequence
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = t 
            AND column_name = 'id' 
            AND (column_default LIKE 'nextval%' OR column_default LIKE 'serial%')
        ) THEN
            EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I_id_seq', t);
            EXECUTE format('ALTER TABLE %I ALTER COLUMN id SET DEFAULT nextval(%L)', t, t || '_id_seq');
            
            -- Get max id and set sequence val
            EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM %I', t) INTO m;
            EXECUTE format('SELECT setval(%L, %L)', t || '_id_seq', m + 1);
        END IF;
    END LOOP;
END $$;



CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_user ON user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id);

