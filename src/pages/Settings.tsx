import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Save,
  User,
  Mail,
  Bell,
  Globe,
  Shield,
  Moon,
  Sun,
  Forward,
  PalmtreeIcon,
  KeyRound,
  Smartphone,
  AlertCircle,
  Check,
  X
} from 'lucide-react';

interface UserSettings {
  display_name: string;
  email_notifications: boolean;
  desktop_notifications: boolean;
  signature: string;
}

interface OTPSettings {
  two_factor_enabled: boolean;
  recovery_email: string | null;
}

interface Preferences {
  language: string;
  timezone: string;
  theme: string;
  vacation_responder_enabled: boolean;
  vacation_responder_message: string | null;
  email_forwarding: string | null;
}

export function Settings() {
  const [settings, setSettings] = useState<UserSettings>({
    display_name: '',
    email_notifications: true,
    desktop_notifications: true,
    signature: '',
  });

  const [otpSettings, setOTPSettings] = useState<OTPSettings>({
    two_factor_enabled: false,
    recovery_email: null,
  });

  const [preferences, setPreferences] = useState<Preferences>({
    language: 'en',
    timezone: 'UTC',
    theme: 'light',
    vacation_responder_enabled: false,
    vacation_responder_message: null,
    email_forwarding: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showOTPSetup, setShowOTPSetup] = useState(false);
  const [otpCode, setOTPCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user settings
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (userSettings) setSettings(userSettings);

      // Load OTP settings
      const { data: otpData } = await supabase
        .from('user_otp_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (otpData) setOTPSettings(otpData);

      // Load preferences
      const { data: prefsData } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prefsData) setPreferences(prefsData);
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    }
  };

  const saveAllSettings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Save user settings
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        });

      // Save OTP settings
      await supabase
        .from('user_otp_settings')
        .upsert({
          user_id: user.id,
          ...otpSettings,
        });

      // Save preferences
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
        });

      setMessage({ type: 'success', text: 'All settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  const setupTwoFactor = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would:
      // 1. Generate a secret key
      // 2. Create QR code
      // 3. Verify OTP code
      // 4. Generate backup codes
      // For demo purposes, we'll simulate this:
      const mockBackupCodes = Array.from({ length: 8 }, () =>
        Math.random().toString(36).substr(2, 8).toUpperCase()
      );
      setBackupCodes(mockBackupCodes);
      setShowOTPSetup(true);
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      setMessage({ type: 'error', text: 'Failed to set up two-factor authentication' });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnableOTP = async () => {
    try {
      setLoading(true);
      // In a real implementation, verify the OTP code here
      // For demo purposes, we'll just enable it
      setOTPSettings(prev => ({ ...prev, two_factor_enabled: true }));
      setShowOTPSetup(false);
      setMessage({ type: 'success', text: 'Two-factor authentication enabled successfully!' });
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      setMessage({ type: 'error', text: 'Failed to enable two-factor authentication' });
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
          {/* Security Section */}
          <div className="border-b border-gray-200 pb-6">
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4" />
              Security
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Two-Factor Authentication</span>
                  <button
                    onClick={otpSettings.two_factor_enabled ? undefined : setupTwoFactor}
                    className={`px-3 py-1 rounded-md text-sm ${
                      otpSettings.two_factor_enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {otpSettings.two_factor_enabled ? (
                      <span className="flex items-center gap-1">
                        <Check className="h-4 w-4" />
                        Enabled
                      </span>
                    ) : (
                      'Enable 2FA'
                    )}
                  </button>
                </label>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Recovery Email</label>
                <input
                  type="email"
                  value={otpSettings.recovery_email || ''}
                  onChange={(e) => setOTPSettings(prev => ({ ...prev, recovery_email: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="backup@example.com"
                />
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="border-b border-gray-200 pb-6">
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4" />
              Preferences
            </h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Language</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Theme</label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, theme: 'light' }))}
                      className={`p-2 rounded-md ${
                        preferences.theme === 'light'
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <Sun className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, theme: 'dark' }))}
                      className={`p-2 rounded-md ${
                        preferences.theme === 'dark'
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <Moon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Timezone</label>
                <select
                  value={preferences.timezone}
                  onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
            </div>
          </div>

          {/* Email Settings Section */}
          <div className="border-b border-gray-200 pb-6">
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-4">
              <Mail className="h-4 w-4" />
              Email Settings
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email Signature</label>
                <textarea
                  value={settings.signature}
                  onChange={(e) => setSettings(prev => ({ ...prev, signature: e.target.value }))}
                  rows={4}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Your email signature..."
                />
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Vacation Responder</span>
                  <button
                    onClick={() => setPreferences(prev => ({
                      ...prev,
                      vacation_responder_enabled: !prev.vacation_responder_enabled
                    }))}
                    className={`px-3 py-1 rounded-md text-sm ${
                      preferences.vacation_responder_enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <PalmtreeIcon className="h-4 w-4" />
                      {preferences.vacation_responder_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </button>
                </label>

                {preferences.vacation_responder_enabled && (
                  <textarea
                    value={preferences.vacation_responder_message || ''}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      vacation_responder_message: e.target.value
                    }))}
                    rows={4}
                    className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="I'm currently out of office..."
                  />
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Email Forwarding</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={preferences.email_forwarding || ''}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      email_forwarding: e.target.value
                    }))}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="forward@example.com"
                  />
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, email_forwarding: null }))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-4">
              <Bell className="h-4 w-4" />
              Notifications
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="email_notifications" className="text-sm text-gray-700">
                  Email Notifications
                </label>
                <button
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    email_notifications: !prev.email_notifications
                  }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    settings.email_notifications ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.email_notifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="desktop_notifications" className="text-sm text-gray-700">
                  Desktop Notifications
                </label>
                <button
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    desktop_notifications: !prev.desktop_notifications
                  }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    settings.desktop_notifications ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.desktop_notifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className={`rounded-md p-4 ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            } flex items-center`}>
              {message.type === 'success' ? (
                <Check className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={saveAllSettings}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {showOTPSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Set Up Two-Factor Authentication</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Scan this QR code with your authenticator app:
                </p>
                <div className="bg-gray-100 p-4 flex items-center justify-center">
                  {/* Placeholder for QR code */}
                  <div className="w-48 h-48 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                    QR Code Placeholder
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Enter the 6-digit code from your authenticator app:
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOTPCode(e.target.value)}
                  maxLength={6}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="000000"
                />
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Save these backup codes in a secure place:
                </p>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="text-sm font-mono text-gray-800">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowOTPSetup(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={verifyAndEnableOTP}
                  disabled={otpCode.length !== 6}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}