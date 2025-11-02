import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { ENV } from '../utils/env';

export const SupabaseStatus: React.FC = () => {
  const isConfigured = ENV.isSupabaseConfigured();

  if (isConfigured) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-900">Supabase Connected</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            Your Supabase backend is properly configured and connected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Real-time database active
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <CardTitle className="text-yellow-900">Offline Mode</CardTitle>
        </div>
        <CardDescription className="text-yellow-700">
          Supabase backend not configured. Running with demo data and local storage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Demo data active
          </Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Local storage
          </Badge>
        </div>
        
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-yellow-800 hover:text-yellow-900">
            Setup Instructions
          </summary>
          <div className="mt-2 p-3 bg-yellow-100 rounded-md text-xs text-yellow-800">
            <p>To enable Supabase backend:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Create a Supabase project at supabase.com</li>
              <li>Get your project URL and anon key</li>
              <li>Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
              <li>Run the database migration scripts</li>
            </ol>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};