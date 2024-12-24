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

interface Connection {
  id: string;
  user: {
    id: string;
    name: string;
    profilePicture: string | null;
    school: string;
    diploma: string;
    lastMessage?: Message;
  };
}

export default function StudySessions() {
  const { data: session } = useSession();
  const router = useRouter();
  const { user: selectedUserId } = router.query;
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedUser, setSelectedUser] = useState<Connection['user'] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Select user from connections when query parameter is present
  useEffect(() => {
    if (selectedUserId && connections.length > 0) {
      const connection = connections.find(c => c.user.id === selectedUserId);
      if (connection) {
        setSelectedUser(connection.user);
      }
    }
  }, [selectedUserId, connections]);

  // Fetch connections
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await fetch('/api/connections?status=CONNECTED', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch connections');
        }
        const data = await response.json();
        
        // Transform the data to get the other user's info
        const processedConnections = data.map((conn: any) => ({
          id: conn.id,
          user: conn.fromUserId === session?.user?.id ? conn.toUser : conn.fromUser
        }));
        
        setConnections(processedConnections);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching connections:', error);
        toast.error('Failed to load connections');
      }
    };

    if (session?.user?.email) {
      fetchConnections();
    }
  }, [session]);

  // Fetch messages when a user is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;

      try {
        const response = await fetch(`/api/messages?userId=${selectedUser.id}`, {
          credentials: 'include'
        });
        const data = await response.json();
        setMessages(data);
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      }
    };

    fetchMessages();
  }, [selectedUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newMessage.trim()) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage,
          receiverId: selectedUser.id
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const message = await response.json();
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', selectedUser.id);

    try {
      const response = await fetch('/api/messages/image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const message = await response.json();
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  // Empty state when no connections
  if (!isLoading && connections.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-5rem)] bg-white rounded-lg shadow-sm">
          <div className="w-80 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Study Partners</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500">No connected study partners yet.</p>
              <p className="mt-2 text-sm text-gray-500">
                Visit the dashboard to find and connect with other students!
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
                Connect with other students to start chatting!
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
        {/* Connections Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Study Partners</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {connections.map(connection => (
              <button
                key={connection.id}
                onClick={() => setSelectedUser(connection.user)}
                className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                  selectedUser?.id === connection.user.id ? 'bg-purple-50' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  {connection.user.profilePicture ? (
                    <Image
                      src={connection.user.profilePicture}
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
                    {connection.user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {connection.user.school}
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
                    {selectedUser.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedUser.school} • {selectedUser.diploma}
                  </p>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <EllipsisHorizontalIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => {
                const isCurrentUser = message.senderId === session?.user?.id;
                const showAvatar = index === 0 || 
                  messages[index - 1].senderId !== message.senderId;

                return (
                  <div
                    key={message.id}
                    className={`flex items-end space-x-2 ${
                      isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    {showAvatar && (
                      <div className="flex-shrink-0">
                        {message.sender.profilePicture ? (
                          <Image
                            src={message.sender.profilePicture}
                            alt=""
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-purple-600" />
                          </div>
                        )}
                      </div>
                    )}
                    <div
                      className={`max-w-md px-4 py-2 rounded-2xl ${
                        isCurrentUser
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs mt-1 opacity-75">
                        {format(new Date(message.createdAt), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <PhotoIcon className="h-6 w-6" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 text-white bg-purple-600 rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <UserIcon className="h-full w-full" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Select a study partner
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
