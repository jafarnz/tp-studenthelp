import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function Profile() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    school: '',
    description: '',
    expertiseModules: [] as string[],
    learningModules: [] as string[],
    status: 'online',
  });
  const [newModule, setNewModule] = useState('');

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}`);
      const data = await response.json();
      setProfileData(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSave = async () => {
    try {
      await fetch(`/api/users/${session?.user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const addModule = (type: 'expertise' | 'learning') => {
    if (!newModule) return;
    if (type === 'expertise') {
      setProfileData({
        ...profileData,
        expertiseModules: [...profileData.expertiseModules, newModule],
      });
    } else {
      setProfileData({
        ...profileData,
        learningModules: [...profileData.learningModules, newModule],
      });
    }
    setNewModule('');
  };

  const removeModule = (type: 'expertise' | 'learning', module: string) => {
    if (type === 'expertise') {
      setProfileData({
        ...profileData,
        expertiseModules: profileData.expertiseModules.filter(m => m !== module),
      });
    } else {
      setProfileData({
        ...profileData,
        learningModules: profileData.learningModules.filter(m => m !== module),
      });
    }
  };

  return (
    <Layout>
      <div className="pt-[var(--nav-height)] min-h-screen bg-[var(--bg-light)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={session?.user?.image || "/placeholder.png"}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
                {isEditing && (
                  <button className="text-[var(--primary-color)] hover:text-[var(--hover-color)]">
                    Change Photo
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School
                </label>
                <select
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  value={profileData.school}
                  onChange={(e) => setProfileData({ ...profileData, school: e.target.value })}
                  disabled={!isEditing}
                >
                  <option value="">Select School</option>
                  <option value="Engineering">School of Engineering</option>
                  <option value="Business">School of Business</option>
                  <option value="Design">School of Design</option>
                  <option value="IT">School of Informatics & IT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  About Me
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  rows={4}
                  value={profileData.description}
                  onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  value={profileData.status}
                  onChange={(e) => setProfileData({ ...profileData, status: e.target.value })}
                  disabled={!isEditing}
                >
                  <option value="online">Online</option>
                  <option value="idle">Idle</option>
                  <option value="dnd">Do Not Disturb</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Expertise</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profileData.expertiseModules.map((module, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-[var(--accent-color)] text-[var(--primary-color)] flex items-center gap-2"
                    >
                      {module}
                      {isEditing && (
                        <button
                          onClick={() => removeModule('expertise', module)}
                          className="text-[var(--primary-color)] hover:text-[var(--hover-color)]"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add module..."
                      className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                      value={newModule}
                      onChange={(e) => setNewModule(e.target.value)}
                    />
                    <button
                      onClick={() => addModule('expertise')}
                      className="btn-primary"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Learning</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profileData.learningModules.map((module, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-[var(--accent-color)] text-[var(--primary-color)] flex items-center gap-2"
                    >
                      {module}
                      {isEditing && (
                        <button
                          onClick={() => removeModule('learning', module)}
                          className="text-[var(--primary-color)] hover:text-[var(--hover-color)]"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add module..."
                      className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                      value={newModule}
                      onChange={(e) => setNewModule(e.target.value)}
                    />
                    <button
                      onClick={() => addModule('learning')}
                      className="btn-primary"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
