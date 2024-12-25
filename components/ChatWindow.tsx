import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { pusherClient } from '@/lib/pusher';
import Image from 'next/image';
import toast from 'react-hot-toast';

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

interface ChatWindowProps {
  selectedUserId: string;
}

const ChatWindow = ({ selectedUserId }: ChatWindowProps) => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load initial messages and set up Pusher subscription
  useEffect(() => {
    if (!selectedUserId || !session?.user?.id) return;

    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/messages?userId=${selectedUserId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        const data = await response.json();
        setMessages(data);
        scrollToBottom();
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error('Failed to load messages');
      }
    };

    loadMessages();

    // Set up Pusher subscription
    const channelName = [session.user.id, selectedUserId].sort().join('-');
    const channel = pusherClient.subscribe(channelName);

    channel.bind('new-message', (message: Message) => {
      // Only add the message via Pusher if it's from the other user
      if (message.senderId !== session.user.id) {
        setMessages(prev => {
          // Check if message already exists
          const messageExists = prev.some(m => m.id === message.id || m.content === message.content);
          if (messageExists) {
            return prev;
          }
          return [...prev, message];
        });
        scrollToBottom();
      }
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [selectedUserId, session?.user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId || !session?.user) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      senderId: session.user.id as string,
      receiverId: selectedUserId,
      createdAt: new Date().toISOString(),
      sender: {
        name: session.user.name || '',
        profilePicture: session.user.image || null,
      },
    };

    // Add optimistic message to state
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          receiverId: selectedUserId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const sentMessage = await response.json();
      
      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id ? sentMessage : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      toast.error('Failed to send message');
      setNewMessage(messageContent); // Restore message if send failed
    }
  };

  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-4 ${
                message.senderId === session?.user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.senderId !== session?.user?.id && (
                <div className="flex-shrink-0 mr-3">
                  {message.sender?.profilePicture ? (
                    <Image
                      src={message.sender.profilePicture}
                      alt={message.sender.name || ''}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-600">
                        {message.sender?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.senderId === session?.user?.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <span className="text-xs mt-1 block opacity-75">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
              </div>
              {message.senderId === session?.user?.id && (
                <div className="flex-shrink-0 ml-3">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt="You"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-600">
                        {session.user.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
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
    </>
  );
};

export default ChatWindow;
