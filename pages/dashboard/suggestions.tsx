import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/DashboardLayout';

interface User {
  id: string;
  name: string;
  email: string;
  image: string;
  bio: string;
  diploma: string;
  currentModules: string[];
  interests: string[];
}

export default function Suggestions() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const response = await fetch('/api/users/suggestions');
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        toast.error('Failed to load suggestions');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [session, status, router]);

  const handleConnect = async (userId: string) => {
    setConnecting(prev => ({ ...prev, [userId]: true }));
    
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Failed to send connection request');
      }

      toast.success('Connection request sent!');
      // Remove the user from suggestions
      setSuggestions(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    } finally {
      setConnecting(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Suggested Study Partners</h2>
          
          {suggestions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No suggestions available at the moment. Check back later!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={user.image || '/default-avatar.png'}
                        alt={user.name}
                        layout="fill"
                        className="rounded-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {user.name}
                      </h3>
                      {user.diploma && (
                        <p className="text-sm text-gray-500">{user.diploma}</p>
                      )}
                    </div>
                  </div>

                  {user.bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {user.bio}
                    </p>
                  )}

                  {user.currentModules && user.currentModules.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Current Modules
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {user.currentModules.map((module, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                          >
                            {module}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {user.interests && user.interests.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Interests
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {user.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleConnect(user.id)}
                    disabled={connecting[user.id]}
                    className={`w-full py-2 px-4 rounded-md text-white text-sm font-medium ${
                      connecting[user.id]
                        ? 'bg-purple-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                    }`}
                  >
                    {connecting[user.id] ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
