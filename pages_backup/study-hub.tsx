import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Layout from '../components/Layout';

type Tab = 'all' | 'expertise' | 'learning';
type ResourceTab = 'all' | 'notes' | 'papers';

export default function StudyHub() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [activeResourceTab, setActiveResourceTab] = useState<ResourceTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Please sign in to access the Study Hub</div>;
  }

  const subjects = [
    { id: 1, name: 'Computer Science', icon: '💻', resources: 156 },
    { id: 2, name: 'Business', icon: '📊', resources: 98 },
    { id: 3, name: 'Engineering', icon: '⚡', resources: 124 },
    { id: 4, name: 'Design', icon: '🎨', resources: 87 },
    { id: 5, name: 'Life Sciences', icon: '🧬', resources: 92 },
    { id: 6, name: 'Mathematics', icon: '📐', resources: 145 },
  ];

  const resources = [
    {
      id: 1,
      title: 'Introduction to Programming Notes',
      subject: 'Computer Science',
      author: 'John Doe',
      type: 'Notes',
      downloads: 234,
      rating: 4.8,
    },
    {
      id: 2,
      title: 'Business Analytics Case Studies',
      subject: 'Business',
      author: 'Jane Smith',
      type: 'Case Study',
      downloads: 156,
      rating: 4.6,
    },
    // Add more resources as needed
  ];

  return (
    <Layout>
      <Head>
        <title>Study Hub | TP Connect</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Study Hub</h1>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search users by name, module, or expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)]"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-4 mb-8">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'all' 
                ? 'bg-[var(--primary-color)] text-white' 
                : 'bg-[var(--card-bg)] text-[var(--text-secondary)]'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setActiveTab('expertise')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'expertise'
                ? 'bg-[var(--primary-color)] text-white'
                : 'bg-[var(--card-bg)] text-[var(--text-secondary)]'
            }`}
          >
            By Expertise
          </button>
          <button
            onClick={() => setActiveTab('learning')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'learning'
                ? 'bg-[var(--primary-color)] text-white'
                : 'bg-[var(--card-bg)] text-[var(--text-secondary)]'
            }`}
          >
            By Learning Interest
          </button>
        </div>

        {/* Subject Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Explore Subjects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {subjects.map((subject) => (
              <div key={subject.id} className="card hover:scale-105 transition-transform cursor-pointer">
                <div className="text-4xl mb-2">{subject.icon}</div>
                <h3 className="font-medium mb-1">{subject.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {subject.resources} resources
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Resource Grid */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Latest Resources</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveResourceTab('all')}
                className={`px-4 py-2 rounded-md ${
                  activeResourceTab === 'all' 
                    ? 'bg-[var(--primary-color)] text-white' 
                    : 'bg-[var(--card-bg)] text-[var(--text-secondary)]'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setActiveResourceTab('notes')}
                className={`px-4 py-2 rounded-md ${
                  activeResourceTab === 'notes' 
                    ? 'bg-[var(--primary-color)] text-white' 
                    : 'bg-[var(--card-bg)] text-[var(--text-secondary)]'
                }`}
              >
                Notes
              </button>
              <button 
                onClick={() => setActiveResourceTab('papers')}
                className={`px-4 py-2 rounded-md ${
                  activeResourceTab === 'papers' 
                    ? 'bg-[var(--primary-color)] text-white' 
                    : 'bg-[var(--card-bg)] text-[var(--text-secondary)]'
                }`}
              >
                Past Papers
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources
              .filter(resource => 
                activeResourceTab === 'all' || 
                (activeResourceTab === 'notes' && resource.type === 'Notes') ||
                (activeResourceTab === 'papers' && resource.type === 'Case Study')
              )
              .map((resource) => (
                <div key={resource.id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium mb-1">{resource.title}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">{resource.subject}</p>
                    </div>
                    <span className="bg-[var(--accent-color)] text-[var(--primary-color)] px-2 py-1 rounded text-sm">
                      {resource.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {resource.downloads}
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {resource.rating}
                    </div>
                    <span>By {resource.author}</span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
