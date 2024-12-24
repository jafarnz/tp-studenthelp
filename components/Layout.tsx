import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      <header>
        <nav className="navbar">
          <div className="nav-brand">
            <img src="/tp-logo.png" alt="TP Logo" className="nav-logo" />
            <span>TP Study Connect</span>
          </div>
          <div className="nav-links">
            <Link href="/dashboard" className={`nav-link ${router.pathname === '/dashboard' ? 'active' : ''}`}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              Home
            </Link>
            <Link href="/study-hub" className={`nav-link ${router.pathname === '/study-hub' ? 'active' : ''}`}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              Study Hub
            </Link>
            <Link href="/connect" className={`nav-link ${router.pathname === '/connect' ? 'active' : ''}`}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Connect Now
            </Link>
          </div>
          <div className="nav-profile">
            <button className="notifications-btn">
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="notification-badge">3</span>
            </button>
            {session?.user && (
              <div className="profile-menu">
                <img src={session.user.image || "/placeholder.png"} alt="Profile" className="profile-avatar" />
                <div className="profile-info">
                  <span className="profile-name">{session.user.name}</span>
                  <span className="profile-role">Student</span>
                </div>
                <button onClick={() => signOut()} className="sign-out-btn">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} TP Study Connect</p>
      </footer>
    </div>
  );
}
