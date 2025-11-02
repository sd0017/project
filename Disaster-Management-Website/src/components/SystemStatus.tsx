import React from 'react';
import { ENV } from '../utils/env';

export const SystemStatus: React.FC = () => {
  const isConfigured = ENV.isSupabaseConfigured();
  
  return (
    <div className="text-sm text-gray-600 p-2">
      Status: {isConfigured ? 'Supabase Connected' : 'Offline Mode'}
    </div>
  );
};