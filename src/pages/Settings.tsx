import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, User, Mail, Bell } from 'lucide-react';

interface UserSettings {
  display_name: string;
  email_notifications: boolean;
  desktop_notifications: boolean;
  signature: string;
}

export function Settings() {
  const [settings, setSettings] = useState<UserSettings>({
    display_name: '',
    email_notifications: true,
    desktop_notifications: true,
    signature: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (data) setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Settings</h3>
        </div>

        <div className="px-4 py-5 sm:p-6 space-y-6">
          {/* Profile Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </h4>
            <div className="mt-2">
              <label htmlFor="display_name" className="block text-sm text-gray-700">
                Display Name
              </label>
              <input
                type="text"
                id="display_name"
                value={settings.display_name}
                onChange={(e) => setSettings({ ...settings, display_name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Signature Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Signature
            </h4>
            <div className="mt-2">
              <textarea
                id="signature"
                rows={4}
                value={settings.signature}
                onChange={(e) => setSettings({ ...settings, signature: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Notifications Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </h4>
            <div className="mt-2 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="email_notifications"
                  checked={settings.email_notifications}
                  onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="email_notifications" className="ml-2 block text-sm text-gray-700">
                  Email Notifications
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="desktop_notifications"
                  checked={settings.desktop_notifications}
                  onChange={(e) => setSettings({ ...settings, desktop_notifications: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="desktop_notifications" className="ml-2 block text-sm text-gray-700">
                  Desktop Notifications
                </label>
              </div>
            </div>
          </div>

          {message && (
            <div className={`rounded-md p-4 ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}