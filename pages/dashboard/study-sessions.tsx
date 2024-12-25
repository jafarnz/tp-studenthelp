import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  PaperAirplaneIcon, 
  PhotoIcon,
  UserIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { pusherClient } from '@/lib/pusher';
import ChatWindow from '@/components/ChatWindow';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender: {
    name: string;
    profilePicture: string | null;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
  profilePicture: string | null;
  school: string | null;
  diploma: string | null;
}

export default function StudySessions() {
  const { data: session } = useSession();
  const router = useRouter();
  const { userId: selectedUserId } = router.query;
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Get current user with profile info
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await fetch('/api/users/me', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch current user');
        }
        const data = await response.json();
        setCurrentUserId(data.id);
        setCurrentUser(data); // Store full user data
      } catch (error) {
        console.error('Error fetching current user:', error);
        toast.error('Failed to load user data');
      }
    };

    getCurrentUser();
  }, []);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      }
    };

    fetchUsers();
  }, []);

  // Handle user selection and message fetching
  useEffect(() => {
    const loadMessages = async () => {
      if (selectedUserId && typeof selectedUserId === 'string') {
        const user = users.find(u => u.id === selectedUserId);
        if (user) {
          setSelectedUser(user);
          
          try {
            console.log('Fetching messages for user:', selectedUserId);
            const response = await fetch(`/api/messages?userId=${selectedUserId}`);
            if (!response.ok) {
              throw new Error('Failed to fetch messages');
            }
            const data = await response.json();
            console.log('Fetched messages:', data);
            setMessages(data);
            scrollToBottom();

            // Set up Pusher subscription
            if (currentUserId) {
              const channelName = [currentUserId, selectedUserId].sort().join('-');
              console.log('Setting up Pusher subscription for channel:', channelName);
              
              // Unsubscribe from previous channel if exists
              pusherClient.unsubscribe(channelName);
              
              const channel = pusherClient.subscribe(channelName);

              channel.bind('new-message', (message: Message) => {
                console.log('Received message through Pusher:', message);
                setMessages(prevMessages => {
                  // Check if message already exists
                  const messageExists = prevMessages.some(m => m.id === message.id);
                  if (messageExists) {
                    console.log('Message already exists, not adding:', message.id);
                    return prevMessages;
                  }
                  console.log('Adding new message to state');
                  return [...prevMessages, message];
                });
                scrollToBottom();
              });

              return () => {
                console.log('Cleaning up Pusher subscription for channel:', channelName);
                pusherClient.unsubscribe(channelName);
              };
            }
          } catch (error) {
            console.error('Error loading messages:', error);
            toast.error('Failed to load messages');
          }
        }
      }
    };

    loadMessages();
  }, [selectedUserId, users, currentUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      console.log('Sending message:', messageContent);
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          receiverId: selectedUser.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const sentMessage = await response.json();
      console.log('Message sent successfully:', sentMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageContent); // Restore message if send failed
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', selectedUser.id);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const message = await response.json();
      // No need to update messages here as Pusher will handle it
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  // Empty state when no users
  if (!isLoading && users.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-5rem)] bg-white rounded-lg shadow-sm">
          <div className="w-80 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500">No users found.</p>
              <p className="mt-2 text-sm text-gray-500">
                Please try again later!
              </p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <UserIcon className="h-full w-full" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No active chats
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a user to start chatting!
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-5rem)] bg-white rounded-lg shadow-sm">
        {/* Users Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                  selectedUser?.id === user.id ? 'bg-purple-50' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  {user.profilePicture ? (
                    <Image
                      src={user.profilePicture}
                      alt=""
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-purple-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.school || 'No school listed'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {selectedUser ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedUser.profilePicture ? (
                  <Image
                    src={selectedUser.profilePicture}
                    alt=""
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-purple-600" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedUser.name || selectedUser.email}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedUser.school ? `${selectedUser.school}${selectedUser.diploma ? ` • ${selectedUser.diploma}` : ''}` : 'No school listed'}
                  </p>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <EllipsisHorizontalIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Chat Window */}
            <ChatWindow
              key={selectedUser.id}
              selectedUserId={selectedUser.id}
            />

            {/* Image Upload Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <UserIcon className="h-full w-full" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Select a user
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose someone from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
