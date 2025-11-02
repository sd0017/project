import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export const EnvironmentConfig: React.FC = () => {
  const [showConfig, setShowConfig] = useState(false);

  const envTemplate = `# Supabase Configuration
# Copy this to your .env file and replace with your actual values

VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Example with real values (replace with your actual values):
# VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`;

  const sqlSchema = `-- Copy this SQL and run it in your Supabase SQL Editor
-- This creates all necessary tables and security policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create rescue_centers table
CREATE TABLE rescue_centers (
    id TEXT PRIMARY KEY,
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
    id TEXT PRIMARY KEY,
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
    center_id TEXT NOT NULL REFERENCES rescue_centers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('citizen', 'government', 'rescue_center')),
    employee_id TEXT,
    center_id TEXT REFERENCES rescue_centers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_rescue_centers_status ON rescue_centers(status);
CREATE INDEX idx_rescue_centers_location ON rescue_centers(lat, lng);
CREATE INDEX idx_guests_center_id ON guests(center_id);
CREATE INDEX idx_guests_name ON guests(first_name, last_name);
CREATE INDEX idx_users_email ON users(email);

-- Enable Row Level Security
ALTER TABLE rescue_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - customize based on your needs)
CREATE POLICY "Allow all operations" ON rescue_centers FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON guests FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copied to clipboard!`);
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Configure Supabase Backend
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://supabase.com', '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              Open Supabase
            </Button>
          </CardTitle>
          <CardDescription>
            Follow these steps to set up your Supabase backend for real-time data and authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Step 1</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                Create a Supabase project and get your URL and API key
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Step 2</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                Set up environment variables in your .env file
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Step 3</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                Run the database schema in Supabase SQL Editor
              </CardContent>
            </Card>
          </div>

          <Button 
            onClick={() => setShowConfig(!showConfig)}
            variant="outline"
            className="w-full"
          >
            {showConfig ? 'Hide' : 'Show'} Configuration Details
          </Button>

          {showConfig && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Environment Variables (.env file)</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(envTemplate, 'Environment config')}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={envTemplate}
                  readOnly
                  className="font-mono text-sm h-32"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Database Schema (SQL)</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(sqlSchema, 'SQL schema')}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={sqlSchema}
                  readOnly
                  className="font-mono text-sm h-64"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};