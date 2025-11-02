-- This file is used to seed the Supabase database with initial data
-- Run this after your database schema is set up

-- Insert test rescue centers
INSERT INTO rescue_centers (
    id, name, lat, lng, total_capacity, water_level, food_level, phone, address, facilities, 
    emergency_contacts, supplies, staff_count
) VALUES 
(
    'RC001',
    'Central Emergency Shelter',
    12.9716, 77.5946, 500, 85, 70,
    '+91-80-2345-6789',
    'MG Road, Bangalore, Karnataka 560001',
    ARRAY['Medical Aid', 'Sanitation', 'Power Backup', 'Communication', 'Kitchen'],
    '{"primary": "+91-80-2345-6789", "secondary": "+91-80-2345-6790"}',
    '{"medical": 80, "bedding": 75, "clothing": 60}',
    25
),
(
    'RC002',
    'North Zone Emergency Hub',
    12.9916, 77.6146, 300, 95, 60,
    '+91-80-2345-6791',
    'Hebbal Main Road, Bangalore, Karnataka 560024',
    ARRAY['Medical Aid', 'Sanitation', 'Kitchen', 'Children Area'],
    '{"primary": "+91-80-2345-6791"}',
    '{"medical": 90, "bedding": 85, "clothing": 70}',
    18
),
(
    'RC003',
    'South District Relief Center',
    12.9516, 77.5746, 400, 40, 30,
    '+91-80-2345-6792',
    '4th Block, Jayanagar, Bangalore, Karnataka 560011',
    ARRAY['Medical Aid', 'Sanitation', 'Power Backup'],
    '{"primary": "+91-80-2345-6792", "secondary": "+91-80-2345-6793"}',
    '{"medical": 45, "bedding": 30, "clothing": 25}',
    20
),
(
    'RC004',
    'East Emergency Hub',
    12.9816, 77.6346, 250, 75, 80,
    '+91-80-2345-6794',
    'ITPL Main Road, Whitefield, Bangalore, Karnataka 560066',
    ARRAY['Medical Aid', 'Kitchen', 'Communication', 'WiFi'],
    '{"primary": "+91-80-2345-6794"}',
    '{"medical": 85, "bedding": 90, "clothing": 80}',
    15
),
(
    'RC005',
    'West Relief Station',
    12.9616, 77.5546, 350, 65, 75,
    '+91-80-2345-6795',
    'Dr. Rajkumar Road, Rajajinagar, Bangalore, Karnataka 560010',
    ARRAY['Medical Aid', 'Sanitation', 'Power Backup', 'Kitchen', 'Pharmacy'],
    '{"primary": "+91-80-2345-6795", "secondary": "+91-80-2345-6796"}',
    '{"medical": 70, "bedding": 65, "clothing": 55}',
    22
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    total_capacity = EXCLUDED.total_capacity,
    water_level = EXCLUDED.water_level,
    food_level = EXCLUDED.food_level,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    facilities = EXCLUDED.facilities,
    emergency_contacts = EXCLUDED.emergency_contacts,
    supplies = EXCLUDED.supplies,
    staff_count = EXCLUDED.staff_count,
    updated_at = NOW();

-- Insert test users
INSERT INTO users (email, role, employee_id) VALUES
('admin@government.in', 'government', 'GOV001'),
('emergency@government.in', 'government', 'GOV002')
ON CONFLICT (email) DO NOTHING;

-- Insert rescue center users
INSERT INTO users (email, role, center_id) VALUES
('manager@central-shelter.in', 'rescue_center', 'RC001'),
('staff@north-hub.in', 'rescue_center', 'RC002'),
('coordinator@south-relief.in', 'rescue_center', 'RC003'),
('supervisor@east-hub.in', 'rescue_center', 'RC004'),
('manager@west-station.in', 'rescue_center', 'RC005')
ON CONFLICT (email) DO NOTHING;

-- Insert test citizen users
INSERT INTO users (email, role) VALUES
('citizen@example.com', 'citizen'),
('user@example.com', 'citizen'),
('resident@example.com', 'citizen')
ON CONFLICT (email) DO NOTHING;