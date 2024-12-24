import { useState } from 'react';
import Layout from '../components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function Connect() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Mock data - replace with API calls
  const tutors = [
    {
      id: 1,
      name: 'Sarah Chen',
      subjects: ['Computer Science', 'Mathematics'],
      rating: 4.8,
      reviews: 24,
      status: 'online',
      image: '/placeholder.png',
      school: 'School of Engineering',
    },
    {
      id: 2,
      name: 'Michael Lee',
      subjects: ['Business Analytics', 'Economics'],
      rating: 4.9,
      reviews: 32,
      status: 'idle',
      image: '/placeholder.png',
      school: 'School of Business',
    },
    // Add more mock tutors
  ];

  const handleConnect = async (tutorId: number) => {
    try {
      const response = await fetch('/api/connect/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: tutorId,
          subject: selectedSubject,
          message: 'Hi, I would like to connect for a study session!',
        }),
      });

      const data = await response.json();
      if (data.meetingLink) {
        window.open(data.meetingLink, '_blank');
      }
    } catch (error) {
      console.error('Error connecting:', error);
    }
  };

  return (
    <Layout>
      <div className="pt-[var(--nav-height)] min-h-screen bg-[var(--bg-light)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect with Peers</h1>
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by name or subject..."
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="all">All Subjects</option>
                <option value="cs">Computer Science</option>
                <option value="business">Business</option>
                <option value="engineering">Engineering</option>
                <option value="design">Design</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutors.map((tutor) => (
              <div key={tutor.id} className="card">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={tutor.image}
                      alt={tutor.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white
                      ${tutor.status === 'online' ? 'bg-green-500' : 
                        tutor.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'}`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{tutor.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">{tutor.school}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="ml-1 text-sm font-medium">{tutor.rating}</span>
                      </span>
                      <span className="text-sm text-[var(--text-secondary)]">
                        ({tutor.reviews} reviews)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tutor.subjects.map((subject, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-full bg-[var(--accent-color)] text-[var(--primary-color)]"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleConnect(tutor.id)}
                      className="btn-primary w-full"
                    >
                      Connect Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
