-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create rescue_centers table
CREATE TABLE rescue_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    total_capacity INTEGER NOT NULL CHECK (total_capacity > 0),
    current_guests INTEGER DEFAULT 0 CHECK (current_guests >= 0),
    available_capacity INTEGER GENERATED ALWAYS AS (total_capacity - current_guests) STORED,
    water_level INTEGER DEFAULT 0 CHECK (water_level >= 0 AND water_level <= 100),
    food_level INTEGER DEFAULT 0 CHECK (food_level >= 0 AND food_level <= 100),
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    facilities TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'full')),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    emergency_contacts JSONB DEFAULT '{}',
    supplies JSONB DEFAULT '{"medical": 0, "bedding": 0, "clothing": 0}',
    staff_count INTEGER DEFAULT 0 CHECK (staff_count >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create guests table
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    gender TEXT NOT NULL,
    date_of_birth DATE,
    age TEXT,
    mobile_phone TEXT NOT NULL,
    alternate_mobile TEXT,
    email TEXT,
    permanent_address TEXT,
    family_members TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    dependents TEXT,
    medical_conditions TEXT,
    current_medications TEXT,
    allergies TEXT,
    disability_status TEXT,
    special_needs TEXT,
    center_id UUID NOT NULL REFERENCES rescue_centers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('citizen', 'government', 'rescue_center')),
    employee_id TEXT,
    center_id UUID REFERENCES rescue_centers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_rescue_centers_status ON rescue_centers(status);
CREATE INDEX idx_rescue_centers_location ON rescue_centers(lat, lng);
CREATE INDEX idx_guests_center_id ON guests(center_id);
CREATE INDEX idx_guests_name ON guests(first_name, last_name);
CREATE INDEX idx_guests_phone ON guests(mobile_phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Create function to update rescue center current_guests count
CREATE OR REPLACE FUNCTION update_rescue_center_capacity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the rescue center's current_guests count
    UPDATE rescue_centers 
    SET 
        current_guests = (
            SELECT COUNT(*) 
            FROM guests 
            WHERE center_id = COALESCE(NEW.center_id, OLD.center_id)
        ),
        status = CASE 
            WHEN (SELECT COUNT(*) FROM guests WHERE center_id = COALESCE(NEW.center_id, OLD.center_id)) >= total_capacity 
            THEN 'full'
            ELSE 'active'
        END,
        last_updated = NOW(),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.center_id, OLD.center_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update capacity when guests are added/removed/updated
CREATE TRIGGER trigger_update_capacity_after_guest_insert
    AFTER INSERT ON guests
    FOR EACH ROW
    EXECUTE FUNCTION update_rescue_center_capacity();

CREATE TRIGGER trigger_update_capacity_after_guest_delete
    AFTER DELETE ON guests
    FOR EACH ROW
    EXECUTE FUNCTION update_rescue_center_capacity();

CREATE TRIGGER trigger_update_capacity_after_guest_update
    AFTER UPDATE OF center_id ON guests
    FOR EACH ROW
    WHEN (OLD.center_id IS DISTINCT FROM NEW.center_id)
    EXECUTE FUNCTION update_rescue_center_capacity();

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER trigger_rescue_centers_updated_at
    BEFORE UPDATE ON rescue_centers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_guests_updated_at
    BEFORE UPDATE ON guests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE rescue_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Rescue centers: All users can read, only government and rescue center staff can modify
CREATE POLICY "rescue_centers_select_policy" ON rescue_centers
    FOR SELECT USING (true);

CREATE POLICY "rescue_centers_insert_policy" ON rescue_centers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('government', 'rescue_center')
        )
    );

CREATE POLICY "rescue_centers_update_policy" ON rescue_centers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (
                users.role = 'government' 
                OR (users.role = 'rescue_center' AND users.center_id = rescue_centers.id)
            )
        )
    );

CREATE POLICY "rescue_centers_delete_policy" ON rescue_centers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'government'
        )
    );

-- Guests: Government can see all, rescue centers can see their own guests, citizens can see their own records
CREATE POLICY "guests_select_policy" ON guests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (
                users.role = 'government'
                OR (users.role = 'rescue_center' AND users.center_id = guests.center_id)
                OR (users.role = 'citizen' AND users.email = guests.email)
            )
        )
    );

CREATE POLICY "guests_insert_policy" ON guests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('government', 'rescue_center', 'citizen')
        )
    );

CREATE POLICY "guests_update_policy" ON guests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (
                users.role = 'government'
                OR (users.role = 'rescue_center' AND users.center_id = guests.center_id)
                OR (users.role = 'citizen' AND users.email = guests.email)
            )
        )
    );

CREATE POLICY "guests_delete_policy" ON guests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (
                users.role = 'government'
                OR (users.role = 'rescue_center' AND users.center_id = guests.center_id)
            )
        )
    );

-- Users: Users can see their own record, government can see all
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (
        users.id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users admin_user 
            WHERE admin_user.id = auth.uid() 
            AND admin_user.role = 'government'
        )
    );

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (users.id = auth.uid());