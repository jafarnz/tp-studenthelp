import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

import { 
  Bars3Icon,
  XMarkIcon,
  BellIcon, 
  ChevronDownIcon, 
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/solid';

import NotificationDropdown from './NotificationDropdown';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Fetch user data from our API
  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/users/${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          setUserData(data);
        })
        .catch(error => {
          console.error('Error fetching user data:', error);
        });
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const response = await fetch('/api/users/profile', {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.colorScheme) {
          document.documentElement.style.setProperty('--color-primary', data.colorScheme.from);
          document.documentElement.style.setProperty('--color-secondary', data.colorScheme.to);
        }
      } catch (error) {
        console.error('Error fetching theme:', error);
      }
    };

    if (session?.user?.email) {
      fetchTheme();
    }
  }, [session]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', color: 'text-pink-500 hover:text-pink-600' },
    { name: 'Study Sessions', href: '/dashboard/study-sessions', color: 'text-purple-500 hover:text-purple-600' },
    { name: 'Resources', href: '/dashboard/resources', color: 'text-blue-500 hover:text-blue-600' },
    { name: 'Profile', href: '/dashboard/profile', color: 'text-indigo-500 hover:text-indigo-600' },
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <div className="min-h-screen bg-[#f7efe7]">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-pink-100 via-purple-50 to-pink-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            {/* Logo and Navigation */}
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Image
                    src="/download.svg"
                    alt="TP Connect"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                    TP Connect
                  </span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium
                      ${router.pathname === item.href
                        ? `${item.color} border-b-2 border-${item.color.split(' ')[0]}-600`
                        : `${item.color} hover:border-gray-300 border-b-2 border-transparent`
                      }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center">
              <button
                type="button"
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Right side buttons */}
            <div className="hidden sm:flex items-center gap-4">
              {/* Notifications */}
              <div className="flex items-center space-x-4">
                <NotificationDropdown />
                <div className="relative">
                  <button
                    className="flex items-center gap-2 focus:outline-none"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  >
                    {(userData?.profilePicture || userData?.image) ? (
                      <Image
                        src={userData.profilePicture || userData.image}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-purple-600" />
                      </div>
                    )}
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  </button>

                  {/* Profile dropdown menu */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <Link
                          href="/dashboard/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          href="/dashboard/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          Settings
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    router.pathname === item.href
                      ? 'text-purple-600 bg-purple-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
