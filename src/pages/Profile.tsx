import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, User, Mail, AlertCircle } from 'lucide-react';

interface UserData {
  email: string;
  display_name: string;
  avatar_url?: string;
}

export function Profile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setUserData({
          email: data.email,
          display_name: data.display_name,
          avatar_url: data.avatar_url
        });
        setEditedName(data.display_name);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: editedName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setUserData(prev => prev ? { ...prev, display_name: editedName } : null);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-6 py-8">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-indigo-300 flex items-center justify-center">
                  {userData?.avatar_url ? (
                    <img
                      src={userData.avatar_url}
                      alt="Profile"
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-white" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100">
                  <Camera className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <div className="text-white">
                {isEditing ? (
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="px-3 py-1 rounded text-gray-900 text-lg font-medium"
                      placeholder="Enter your name"
                    />
                    <div className="space-x-2">
                      <button
                        onClick={updateProfile}
                        disabled={loading}
                        className="px-3 py-1 bg-white text-indigo-600 rounded hover:bg-gray-100"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedName(userData?.display_name || '');
                        }}
                        className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <h1 className="text-2xl font-semibold flex items-center space-x-3">
                    <span>{userData?.display_name}</span>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm px-3 py-1 bg-indigo-500 rounded hover:bg-indigo-400"
                    >
                      Edit
                    </button>
                  </h1>
                )}
                <div className="flex items-center mt-2 text-indigo-100">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{userData?.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {message && (
              <div className={`mb-6 p-4 rounded-md ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              } flex items-center`}>
                <AlertCircle className="h-5 w-5 mr-2" />
                {message.text}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your profile information and email preferences.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <dl className="divide-y divide-gray-200">
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Display name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {userData?.display_name}
                    </dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Email address</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {userData?.email}
                    </dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Account type</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      HexMail User
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}