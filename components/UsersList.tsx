import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { UserIcon } from '@heroicons/react/24/solid';

interface User {
  id: string;
  name: string | null;
  email: string;
  profilePicture: string | null;
}

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleUserClick = (userId: string) => {
    setSelectedUser(userId);
    router.push(`/dashboard/study-sessions?userId=${userId}`);
  };

  return (
    <div className="w-64 bg-gray-800 h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Direct Messages</h2>
      </div>
      <div className="space-y-1 py-2">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => handleUserClick(user.id)}
            className={`w-full px-4 py-2 flex items-center space-x-3 hover:bg-gray-700 transition-colors ${
              selectedUser === user.id ? 'bg-gray-700' : ''
            }`}
          >
            <div className="flex-shrink-0">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name || ''}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate">
                {user.name || user.email}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default UsersList;
