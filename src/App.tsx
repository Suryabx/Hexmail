import React, { useState, useEffect } from 'react';
import { Mail, Inbox, Send, Archive, Trash2, Star, Settings, Menu, Search, Plus, User, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { ComposeModal } from './components/ComposeModal';

interface Message {
  id: string;
  sender_id: string;
  recipient_email: string;
  subject: string;
  content: string;
  read: boolean;
  starred: boolean;
  created_at: string;
  folder: string;
}

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
}

function App() {
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [showCompose, setShowCompose] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadMessages();
  }, [selectedFolder]);

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedFolder === 'sent') {
        query = query.eq('sender_id', user.id);
      } else if (selectedFolder === 'starred') {
        query = query.eq('recipient_email', user.email).eq('starred', true);
      } else {
        query = query
          .eq('recipient_email', user.email)
          .eq('folder', selectedFolder);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      if (data) {
        const senderIds = [...new Set(data.map(msg => msg.sender_id))];
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('*')
          .in('id', senderIds);

        if (profiles) {
          const profileMap = profiles.reduce((acc, profile) => ({
            ...acc,
            [profile.id]: profile
          }), {});
          setUserProfiles(profileMap);
        }

        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const moveToFolder = async (messageId: string, folder: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ folder })
        .eq('id', messageId);

      if (error) throw error;
      
      // Remove the message from the current view
      setMessages(messages.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error moving message:', error);
    }
  };

  const toggleRead = async (messageId: string, read: boolean) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read })
        .eq('id', messageId);

      if (error) throw error;
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, read } : msg
      ));
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const toggleStarred = async (messageId: string, starred: boolean) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ starred })
        .eq('id', messageId);

      if (error) throw error;
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, starred } : msg
      ));
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const getSenderName = (senderId: string) => {
    return userProfiles[senderId]?.display_name || 'Unknown User';
  };

  const getMessageActions = (message: Message) => {
    const actions = [];
    
    if (selectedFolder !== 'trash') {
      actions.push(
        <button
          key="trash"
          onClick={(e) => {
            e.stopPropagation();
            moveToFolder(message.id, 'trash');
          }}
          className="text-gray-400 hover:text-red-600"
          title="Move to Trash"
        >
          <Trash2 size={18} />
        </button>
      );
    }

    if (selectedFolder !== 'archive' && selectedFolder !== 'trash') {
      actions.push(
        <button
          key="archive"
          onClick={(e) => {
            e.stopPropagation();
            moveToFolder(message.id, 'archive');
          }}
          className="text-gray-400 hover:text-gray-600"
          title="Archive"
        >
          <Archive size={18} />
        </button>
      );
    }

    return actions;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-indigo-500 rounded-md md:hidden"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-indigo-500 rounded-md hidden md:block"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-2">
              <Mail size={24} className="hidden sm:block" />
              <h1 className="text-xl font-bold">HexMail</h1>
            </div>
          </div>
          
          {/* Search - Desktop */}
          <div className="flex-1 max-w-2xl mx-4 hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search emails..."
                className="w-full px-4 py-2 bg-indigo-500 text-white placeholder-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
              />
              <Search className="absolute right-3 top-2.5 text-indigo-200" size={20} />
            </div>
          </div>

          {/* Mobile Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden p-2 hover:bg-indigo-500 rounded-full"
          >
            <Search size={20} />
          </button>

          <div className="flex items-center space-x-2">
            <Link to="/settings" className="p-2 hover:bg-indigo-500 rounded-full">
              <Settings size={20} />
            </Link>
            <Link to="/profile" className="p-2 hover:bg-indigo-500 rounded-full">
              <User size={20} />
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && (
          <div className="p-4 md:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="Search emails..."
                className="w-full px-4 py-2 bg-indigo-500 text-white placeholder-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
              />
              <Search className="absolute right-3 top-2.5 text-indigo-200" size={20} />
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Mobile Overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out z-30`}>
          <div className="p-4">
            <button
              onClick={() => setShowCompose(true)}
              className="w-full flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              <Plus size={20} />
              <span>Compose</span>
            </button>
          </div>
          <nav className="space-y-1 px-2">
            {[
              { icon: Inbox, label: 'Inbox', id: 'inbox' },
              { icon: Star, label: 'Starred', id: 'starred' },
              { icon: Send, label: 'Sent', id: 'sent' },
              { icon: Archive, label: 'Archive', id: 'archive' },
              { icon: Trash2, label: 'Trash', id: 'trash' },
            ].map(({ icon: Icon, label, id }) => (
              <button
                key={id}
                onClick={() => {
                  setSelectedFolder(id);
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md ${
                  selectedFolder === id
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-white">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => toggleRead(message.id, true)}
                  className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${
                    !message.read ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                      <p className={`text-sm font-medium ${!message.read ? 'text-indigo-600' : 'text-gray-900'}`}>
                        {selectedFolder === 'sent' ? message.recipient_email : getSenderName(message.sender_id)}
                      </p>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                    <h3 className={`text-sm ${!message.read ? 'font-semibold' : ''} mt-1 sm:mt-0`}>{message.subject}</h3>
                    <p className="text-sm text-gray-500 truncate">{message.content}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {getMessageActions(message)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStarred(message.id, !message.starred);
                      }}
                      className="ml-2"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          message.starred ? 'text-yellow-400 fill-current' : 'text-gray-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} />}
    </div>
  );
}

export default App;