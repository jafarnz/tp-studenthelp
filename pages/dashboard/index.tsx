import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  AcademicCapIcon, 
  DocumentDuplicateIcon,
  UserIcon,
  PlusIcon,
  ClockIcon,
  CheckIcon,
  BookOpenIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  school: string;
  diploma: string;
  studentYear: number;
  bio: string;
  profilePicture: string | null;
  skillsets: string[];
  connectionStatus: 'NONE' | 'PENDING' | 'CONNECTED';
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Fetch users based on search query
  useEffect(() => {
    const fetchUsers = async () => {
      if (!session?.user) return;
      
      try {
        setIsSearching(true);
        const queryParams = new URLSearchParams();
        if (searchQuery.trim()) {
          queryParams.append('search', searchQuery);
        }
        
        const response = await fetch(`/api/users/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to fetch users');
      } finally {
        setIsSearching(false);
        setIsLoading(false);
      }
    };

    // Only debounce if there's a search query
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      // Fetch immediately if no search query
      fetchUsers();
    }
  }, [searchQuery, session]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications', {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    if (session?.user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const handleConnect = async (userId: string) => {
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send connection request');
      }

      // Update the local state to reflect the pending connection
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, connectionStatus: 'PENDING' }
            : user
        )
      );

      toast.success('Connection request sent!');
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send connection request');
    }
  };

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept connection');
      }

      // Update notifications locally
      setNotifications(prev => prev.filter(n => 
        !(n.type === 'CONNECTION_REQUEST' && JSON.parse(n.data).connectionId === connectionId)
      ));

      // Refresh users list to update connection status
      const timeoutId = setTimeout(() => {
        const queryParams = new URLSearchParams();
        if (searchQuery) {
          queryParams.append('search', searchQuery);
        }
        
        fetch(`/api/users/search?${queryParams.toString()}`, {
          credentials: 'include'
        })
          .then(res => res.json())
          .then(data => setUsers(data))
          .catch(console.error);
      }, 300);

      toast.success('Connection accepted!');
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to accept connection');
    }
  };

  const handleRejectConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject connection');
      }

      // Update notifications locally
      setNotifications(prev => prev.filter(n => 
        !(n.type === 'CONNECTION_REQUEST' && JSON.parse(n.data).connectionId === connectionId)
      ));

      toast.success('Connection rejected');
    } catch (error) {
      console.error('Error rejecting connection:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject connection');
    }
  };

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Dashboard - Study Partner</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-[#1A1D23] rounded-lg p-6 mb-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-gray-300" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {session.user?.name?.split(' ')[0]}!</h1>
              <p className="text-gray-400">Ready to connect with your peers and enhance your learning journey?</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-[#2F3138] rounded-lg p-4">
              <div className="flex items-center gap-2">
                <UserGroupIcon className="w-6 h-6 text-purple-400" />
                <span className="text-2xl font-bold">24</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">Study Partners</p>
            </div>
            <div className="bg-[#2F3138] rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-blue-400" />
                <span className="text-2xl font-bold">8</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">Upcoming Sessions</p>
            </div>
            <div className="bg-[#2F3138] rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="w-6 h-6 text-green-400" />
                <span className="text-2xl font-bold">12</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">Completed Sessions</p>
            </div>
            <div className="bg-[#2F3138] rounded-lg p-4">
              <div className="flex items-center gap-2">
                <DocumentDuplicateIcon className="w-6 h-6 text-yellow-400" />
                <span className="text-2xl font-bold">5</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">Shared Resources</p>
            </div>
          </div>
        </div>

        {/* Global Search */}
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Search for study partners, subjects, or resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-[#2F3138] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <MagnifyingGlassIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Find Study Partners Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="h-6 w-6 text-gray-400" />
                <h2 className="text-xl font-semibold text-white">Find Study Partners</h2>
              </div>
              <Link 
                href="/dashboard/connections"
                className="text-sm text-purple-400 hover:text-purple-300 font-medium"
              >
                View All
              </Link>
            </div>

            {isSearching ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <UserIcon className="mx-auto h-12 w-12 text-gray-500 mb-2" />
                <p>No users found</p>
                <p className="text-sm">Try adjusting your search query</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map((user) => (
                  <div 
                    key={user.id} 
                    className="bg-[#2F3138] rounded-lg p-4 flex flex-col"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {user.profilePicture ? (
                          <Image
                            src={user.profilePicture}
                            alt={user.name}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">{user.name}</h3>
                        <p className="text-sm text-gray-400">{user.school}</p>
                        <p className="text-sm text-gray-400">{user.diploma} • Year {user.studentYear}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {user.connectionStatus === 'NONE' && (
                          <button
                            onClick={() => handleConnect(user.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Connect
                          </button>
                        )}
                        {user.connectionStatus === 'PENDING' && (
                          <span className="inline-flex items-center px-3 py-1 text-sm text-gray-400">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Pending
                          </span>
                        )}
                        {user.connectionStatus === 'CONNECTED' && (
                          <span className="inline-flex items-center px-3 py-1 text-sm text-green-400">
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Connected
                          </span>
                        )}
                      </div>
                    </div>
                    {user.bio && (
                      <p className="mt-2 text-sm text-gray-400 line-clamp-2">{user.bio}</p>
                    )}
                    {user.skillsets?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {user.skillsets.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300"
                          >
                            <BookOpenIcon className="h-3 w-3 mr-1" />
                            {skill}
                          </span>
                        ))}
                        {user.skillsets.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                            +{user.skillsets.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Section */}
          <div className="lg:col-span-1">
            <div className="bg-[#2F3138] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Notifications</h3>
                {notifications.length > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-purple-600 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </div>
              
              {notifications.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <p>No new notifications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification: any) => {
                    const data = JSON.parse(notification.data || '{}');
                    
                    if (notification.type === 'CONNECTION_REQUEST') {
                      return (
                        <div key={notification.id} className="flex items-start space-x-4 p-3 bg-[#1A1D23] rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm text-white">{notification.message}</p>
                            <div className="mt-2 flex space-x-2">
                              <button
                                onClick={() => handleAcceptConnection(data.connectionId)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectConnection(data.connectionId)}
                                className="inline-flex items-center px-3 py-1 border border-gray-600 text-xs font-medium rounded-md text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-6 w-6 text-gray-400" />
                <h2 className="text-xl font-semibold text-white">Upcoming Events</h2>
              </div>
            </div>
            <div className="space-y-4">
              {[
                {
                  title: "Web Development Workshop",
                  date: "Wednesday, Dec 25 at 14:00",
                  participants: "8/12 participants",
                  host: "John Chen",
                  type: "workshop"
                },
                {
                  title: "Data Science Study Group",
                  date: "Thursday, Dec 28 at 15:30",
                  participants: "5/8 participants",
                  host: "Sarah Lee",
                  type: "study"
                }
              ].map((event, index) => (
                <div key={index} className="bg-[#2F3138] rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-white">{event.title}</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-300">
                    <p className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {event.date}
                    </p>
                    <p className="flex items-center gap-2">
                      <UserGroupIcon className="h-4 w-4" />
                      {event.participants}
                    </p>
                    <p className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Hosted by {event.host}
                    </p>
                  </div>
                  <button className="w-full mt-4 px-4 py-2 bg-[#3B3F54] text-white rounded-lg hover:bg-[#444869] transition-colors">
                    Join Session
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
