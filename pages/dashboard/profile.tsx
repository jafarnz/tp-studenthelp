import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  PencilIcon,
  XMarkIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ChatBubbleLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  LinkIcon,
  LinkedInIcon,
  GitHubIcon,
  GlobeAltIcon,
  UsersIcon,
  PaintBrushIcon,
  UserIcon,
  PlusIcon,
  ClockIcon,
  CheckIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { FaLinkedin, FaGithub, FaGlobe } from 'react-icons/fa';

interface ProfileProps {
  session: any;
}

const Profile: React.FC<ProfileProps> = ({ session: serverSession }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState<any>({
    name: '',
    email: '',
    bio: '',
    school: '',
    diploma: '',
    studentYear: null,
    image: '',
    profilePicture: '',
    skillsets: [],
    username: '',
    connections: []
  });
  const [editingField, setEditingField] = useState(null);
  const [editData, setEditData] = useState({
    bio: '',
    modules: [],
    socialLinks: {},
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users/profile', {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || data.details || 'Failed to fetch profile');
        }

        setProfileData({
          ...data,
          studentYear: data.studentYear || '',
          bio: data.bio || '',
          school: data.school || '',
          diploma: data.diploma || '',
          skillsets: data.skillsets || [],
          connections: data.connections || []
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.email) {
      fetchProfile();
    }
  }, [session]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications', {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch notifications');
        }

        setNotifications(data);
        setNotificationCount(data.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    if (session?.user?.email) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const intervalId = setInterval(fetchNotifications, 30000);
      return () => clearInterval(intervalId);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.name,
          bio: profileData.bio,
          school: profileData.school,
          diploma: profileData.diploma,
          studentYear: profileData.studentYear,
          skillsets: profileData.skillsets,
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      if (data.success) {
        setProfileData(data.user);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async (field: string) => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          [field]: editData[field]
        }),
        credentials: 'same-origin'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      if (data.success) {
        setProfileData(prev => ({
          ...prev,
          [field]: editData[field]
        }));
        setEditingField(null);
        toast.success('Profile updated successfully!');
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const handleModuleChange = (index: number, field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      modules: prev.modules.map((module, i) => i === index ? { ...module, [field]: value } : module)
    }));
  };

  const handleAddModule = () => {
    setEditData(prev => ({
      ...prev,
      modules: [...prev.modules, { code: '', name: '' }]
    }));
  };

  const handleRemoveModule = (index: number) => {
    setEditData(prev => ({
      ...prev,
      modules: prev.modules.filter((module, i) => i !== index)
    }));
  };

  const handleSocialLinkChange = (platform: string, url: string) => {
    setEditData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: url }
    }));
  };

  const handleAcceptConnection = async (notification: any) => {
    try {
      const data = JSON.parse(notification.data || '{}');
      const connectionId = data.connectionId;

      if (!connectionId) {
        throw new Error('Invalid notification data');
      }

      // Accept the connection
      const response = await fetch(`/api/connections/${connectionId}/accept`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to accept connection');
      }

      // Mark notification as read
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: notification.id }),
        credentials: 'include'
      });

      toast.success('Connection accepted!');
      
      // Redirect to study sessions page
      router.push('/dashboard/study-sessions');
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast.error('Failed to accept connection');
    }
  };

  const handleRejectConnection = async (notification: any) => {
    try {
      const data = JSON.parse(notification.data || '{}');
      const connectionId = data.connectionId;

      if (!connectionId) {
        throw new Error('Invalid notification data');
      }

      // Reject the connection
      const response = await fetch(`/api/connections/${connectionId}/reject`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to reject connection');
      }

      // Mark notification as read
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: notification.id }),
        credentials: 'include'
      });

      // Refresh notifications
      const notificationsResponse = await fetch('/api/notifications', {
        credentials: 'include'
      });
      const newNotifications = await notificationsResponse.json();
      setNotifications(newNotifications);
      setNotificationCount(newNotifications.filter(n => !n.read).length);

      toast.success('Connection rejected');
    } catch (error) {
      console.error('Error rejecting connection:', error);
      toast.error('Failed to reject connection');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#f7efe7] p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-2xl mb-6"></div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 rounded-2xl"></div>
                <div className="h-32 bg-gray-200 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f7efe7] p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <div 
            className="rounded-2xl overflow-hidden shadow-sm h-48"
          >
            <div className="p-8 h-full flex items-center">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden relative">
                      <Image
                        src={profileData.image || profileData.profilePicture || '/default-avatar.png'}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="rounded-2xl object-cover"
                        priority
                      />
                    </div>
                    <button className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors">
                      <PencilIcon className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold text-gray-900">{profileData.name}</h1>
                    <p className="text-gray-600">{profileData.email}</p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 bg-gray-100 px-4 py-1.5 rounded-full">
                        <AcademicCapIcon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">{profileData.school}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-gray-100 px-4 py-1.5 rounded-full">
                        <BookOpenIcon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">{profileData.diploma}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-gray-100 px-4 py-1.5 rounded-full">
                        <AcademicCapIcon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">Year {profileData.studentYear}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About Me */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <ChatBubbleLeftIcon className="h-6 w-6 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-700">About Me</h2>
              </div>
              <button 
                onClick={() => setEditingField('bio')}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <PencilIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            {editingField === 'bio' ? (
              <div className="space-y-3">
                <textarea
                  value={editData.bio || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setEditingField(null)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave('bio')}
                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">{profileData.bio}</p>
            )}
          </div>

          {/* Modules */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BookOpenIcon className="h-6 w-6 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-700">Modules</h2>
              </div>
              <button 
                onClick={() => setEditingField('modules')}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <PencilIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            {editingField === 'modules' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  {editData.modules?.map((module, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={module.code}
                        onChange={(e) => handleModuleChange(index, 'code', e.target.value)}
                        placeholder="Module Code"
                        className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={module.name}
                        onChange={(e) => handleModuleChange(index, 'name', e.target.value)}
                        placeholder="Module Name"
                        className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleRemoveModule(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddModule}
                  className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
                >
                  + Add Module
                </button>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setEditingField(null)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave('modules')}
                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {profileData.modules?.map((module) => (
                  <div key={module.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{module.code}</p>
                    <p className="text-sm text-gray-600">{module.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <LinkIcon className="h-6 w-6 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-700">Social Links</h2>
              </div>
              <button 
                onClick={() => setEditingField('socialLinks')}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <PencilIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            {editingField === 'socialLinks' ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FaLinkedin className="text-[#0077B5] text-xl" />
                    <input
                      type="url"
                      value={editData.socialLinks?.linkedin || ''}
                      onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaGithub className="text-[#333] text-xl" />
                    <input
                      type="url"
                      value={editData.socialLinks?.github || ''}
                      onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                      placeholder="https://github.com/username"
                      className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaGlobe className="text-[#2563EB] text-xl" />
                    <input
                      type="url"
                      value={editData.socialLinks?.portfolio || ''}
                      onChange={(e) => handleSocialLinkChange('portfolio', e.target.value)}
                      placeholder="Your portfolio website"
                      className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setEditingField(null)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave('socialLinks')}
                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {Object.entries(profileData.socialLinks || {}).map(([platform, url]) => (
                  url && (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors group"
                      title={platform}
                    >
                      {platform === 'linkedin' && <FaLinkedin className="text-[#0077B5] text-2xl group-hover:scale-110 transition-transform" />}
                      {platform === 'github' && <FaGithub className="text-[#333] text-2xl group-hover:scale-110 transition-transform" />}
                      {platform === 'portfolio' && <FaGlobe className="text-[#2563EB] text-2xl group-hover:scale-110 transition-transform" />}
                    </a>
                  )
                ))}
              </div>
            )}
          </div>

          {/* Connections */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <UsersIcon className="h-6 w-6 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-700">Connections</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {profileData.connections?.map((connection) => (
                <div
                  key={connection.id}
                  className="flex flex-col items-center space-y-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/profile/${connection.user.id}`)}
                >
                  <div className="relative">
                    <div className="w-16 h-16">
                      <Image
                        src={connection.user.image || '/default-avatar.png'}
                        alt={connection.user.name || 'User'}
                        width={64}
                        height={64}
                        className="rounded-full object-cover"
                      />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 text-center line-clamp-1">
                    {connection.user.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <PhoneIcon className="h-6 w-6 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-700">Contact</h2>
              </div>
              <button 
                onClick={() => setEditingField('contact')}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <PencilIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            {editingField === 'contact' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setEditingField(null)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave('contact')}
                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">{profileData.email}</span>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              <button
                onClick={async () => {
                  // Mark all as read
                  const unreadNotifications = notifications.filter(n => !n.read);
                  for (const notification of unreadNotifications) {
                    await fetch('/api/notifications', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: notification.id }),
                      credentials: 'include'
                    });
                  }
                  // Refresh notifications
                  const response = await fetch('/api/notifications', { credentials: 'include' });
                  const newNotifications = await response.json();
                  setNotifications(newNotifications);
                  setNotificationCount(0);
                }}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                Mark all as read
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-4 flex items-start space-x-3 ${
                    !notification.read ? 'bg-purple-50' : ''
                  } hover:bg-gray-50`}
                >
                  <div className="flex-shrink-0">
                    {notification.type === 'CONNECTION_REQUEST' && (
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-purple-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                    {notification.type === 'CONNECTION_REQUEST' && !notification.read && (
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => handleAcceptConnection(notification)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-white bg-purple-600 hover:bg-purple-700 focus:outline-none"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectConnection(notification)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;

export { getServerSideProps } from '@/lib/getServerSideProps';
