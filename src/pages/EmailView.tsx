import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Reply, Forward, Star, Archive, Trash2, CornerUpLeft, Paperclip, Download, Dumbbell as Label } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  recipient_email: string;
  subject: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  forward_id: string | null;
  is_draft: boolean;
  labels: string[];
  attachments: Array<{ name: string; url: string }>;
  read: boolean;
  starred: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
}

export function EmailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState<Message | null>(null);
  const [sender, setSender] = useState<UserProfile | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadMessage(id);
    }
  }, [id]);

  const loadMessage = async (messageId: string) => {
    try {
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (messageError) throw messageError;
      if (!messageData) throw new Error('Message not found');

      setMessage(messageData);

      // Mark as read if not already
      if (!messageData.read) {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('id', messageId);
      }

      // Load sender profile
      const { data: senderData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', messageData.sender_id)
        .single();

      if (senderData) {
        setSender(senderData);
      }
    } catch (err) {
      console.error('Error loading message:', err);
      setError('Failed to load message');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!message || !replyContent.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_email: sender?.email,
          subject: `Re: ${message.subject}`,
          content: replyContent,
          parent_id: message.id,
          folder: 'sent'
        });

      if (error) throw error;

      setShowReply(false);
      setReplyContent('');
      navigate('/');
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Failed to send reply');
    }
  };

  const handleForward = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a draft forward message
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_email: '',
          subject: `Fwd: ${message?.subject}`,
          content: `---------- Forwarded message ----------\nFrom: ${sender?.display_name}\nDate: ${new Date(message?.created_at || '').toLocaleString()}\nSubject: ${message?.subject}\n\n${message?.content}`,
          forward_id: message?.id,
          is_draft: true,
          folder: 'drafts'
        });

      if (error) throw error;
      navigate('/compose');
    } catch (err) {
      console.error('Error creating forward:', err);
      setError('Failed to forward message');
    }
  };

  const toggleStar = async () => {
    if (!message) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ starred: !message.starred })
        .eq('id', message.id);

      if (error) throw error;
      setMessage(prev => prev ? { ...prev, starred: !prev.starred } : null);
    } catch (err) {
      console.error('Error toggling star:', err);
      setError('Failed to update message');
    }
  };

  const moveToFolder = async (folder: string) => {
    if (!message) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ folder })
        .eq('id', message.id);

      if (error) throw error;
      navigate('/');
    } catch (err) {
      console.error('Error moving message:', err);
      setError('Failed to move message');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">{error || 'Message not found'}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Email Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">{message.subject}</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleStar}
                className={`p-2 rounded-full hover:bg-gray-100 ${
                  message.starred ? 'text-yellow-400' : 'text-gray-400'
                }`}
              >
                <Star className="h-5 w-5" />
              </button>
              <button
                onClick={() => moveToFolder('archive')}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <Archive className="h-5 w-5" />
              </button>
              <button
                onClick={() => moveToFolder('trash')}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{sender?.display_name}</p>
              <p className="text-sm text-gray-500">{sender?.email}</p>
            </div>
            <p className="text-sm text-gray-500">
              {new Date(message.created_at).toLocaleString()}
            </p>
          </div>

          {message.labels.length > 0 && (
            <div className="flex items-center space-x-2 mb-4">
              <Label className="h-4 w-4 text-gray-400" />
              {message.labels.map((label, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Message Content */}
          <div className="prose max-w-none mt-4">
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>

          {/* Attachments */}
          {message.attachments.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments
              </h3>
              <ul className="mt-2 divide-y divide-gray-200">
                {message.attachments.map((attachment, index) => (
                  <li key={index} className="py-2 flex items-center justify-between">
                    <span className="text-sm text-gray-500">{attachment.name}</span>
                    <a
                      href={attachment.url}
                      download
                      className="text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      <span className="text-sm">Download</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3 bg-gray-50 sm:px-6 rounded-b-lg flex justify-between">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <CornerUpLeft className="h-4 w-4 mr-1.5" />
            Back
          </button>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowReply(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Reply className="h-4 w-4 mr-1.5" />
              Reply
            </button>
            <button
              onClick={handleForward}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Forward className="h-4 w-4 mr-1.5" />
              Forward
            </button>
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {showReply && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Reply</h3>
            <div className="space-y-4">
              <textarea
                rows={6}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Write your reply..."
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowReply(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}