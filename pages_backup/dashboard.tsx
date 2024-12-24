import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface User {
  id: string;
  name: string;
  email: string;
  school: string;
  expertiseModules: { module: string }[];
  learningModules: { module: string }[];
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suggestedConnections, setSuggestedConnections] = useState<User[]>([]);

  useEffect(() => {
    const fetchSuggestedConnections = async () => {
      try {
        const response = await fetch('/api/users/suggestions');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch suggestions');
        }

        setSuggestedConnections(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchSuggestedConnections();
    }
  }, [session]);

  const handleConnect = async (userId: string) => {
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toId: userId,
          subject: 'Would like to connect for peer learning',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send connection request');
      }

      // Remove the user from suggestions
      setSuggestedConnections(prev => 
        prev.filter(user => user.id !== userId)
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Welcome back, {session?.user?.name}!
            </h1>

            {error && <ErrorMessage message={error} />}

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">
                  Suggested Connections
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  People who can help you with your learning modules
                </p>
              </div>

              {loading ? (
                <div className="p-8 flex justify-center">
                  <LoadingSpinner size="large" />
                </div>
              ) : suggestedConnections.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {suggestedConnections.map((user) => (
                    <li key={user.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xl text-gray-600">
                                {user.name.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <h3 className="text-lg font-medium text-gray-900">
                                {user.name}
                              </h3>
                              <p className="text-sm text-gray-500">{user.school}</p>
                              <div className="mt-1">
                                <span className="text-sm text-gray-500">Expertise in: </span>
                                {user.expertiseModules.map((module, index) => (
                                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                                    {module.module}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => handleConnect(user.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                  No suggestions available at the moment
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
