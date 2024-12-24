import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { UserGroupIcon, BookOpenIcon, VideoCameraIcon } from '@heroicons/react/24/solid';

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Head>
        <title>TP Connect - Student Connection Platform</title>
        <meta name="description" content="Connect with fellow students at Temasek Polytechnic" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <nav className="bg-bg-primary border-b border-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <Image
                    src="/download.svg"
                    alt="TP Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <span className="text-xl font-bold text-text-primary">TP Connect</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/signin"
                className="btn-outline"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="btn-primary"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-bg-primary overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-bg-primary sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <motion.h1 
                  className="text-4xl tracking-tight font-extrabold text-text-primary sm:text-5xl md:text-6xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="block">Connect with peers at</span>
                  <span className="block text-accent">Temasek Polytechnic</span>
                </motion.h1>
                <motion.p 
                  className="mt-3 text-base text-text-primary sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Join TP Connect to find study partners, share resources, and excel in your modules together.
                </motion.p>
                <motion.div 
                  className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="rounded-md shadow">
                    <Link
                      href="/auth/signup"
                      className="w-full flex items-center justify-center px-8 py-3 btn-primary text-lg"
                    >
                      Get Started
                    </Link>
                  </div>
                </motion.div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-text-primary sm:text-4xl">
              FEATURES
            </h2>
            <p className="mt-4 text-xl text-text-primary">
              Everything you need to succeed
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <motion.div
                className="pt-6"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flow-root bg-bg-primary px-6 pb-8 rounded-lg border-2 border-bg-secondary">
                  <div className="-mt-6">
                    <div className="inline-flex items-center justify-center p-3 bg-accent rounded-md shadow-lg">
                      <UserGroupIcon className="h-6 w-6 text-bg-primary" aria-hidden="true" />
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-text-primary tracking-tight">Find Study Partners</h3>
                    <p className="mt-5 text-base text-text-primary">
                      Connect with peers taking the same modules as you.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="pt-6"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flow-root bg-bg-primary px-6 pb-8 rounded-lg border-2 border-bg-secondary">
                  <div className="-mt-6">
                    <div className="inline-flex items-center justify-center p-3 bg-accent rounded-md shadow-lg">
                      <BookOpenIcon className="h-6 w-6 text-bg-primary" aria-hidden="true" />
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-text-primary tracking-tight">Share Resources</h3>
                    <p className="mt-5 text-base text-text-primary">
                      Access and share study materials with your peers.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="pt-6"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flow-root bg-bg-primary px-6 pb-8 rounded-lg border-2 border-bg-secondary">
                  <div className="-mt-6">
                    <div className="inline-flex items-center justify-center p-3 bg-accent rounded-md shadow-lg">
                      <VideoCameraIcon className="h-6 w-6 text-bg-primary" aria-hidden="true" />
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-text-primary tracking-tight">Online Study Sessions</h3>
                    <p className="mt-5 text-base text-text-primary">
                      Start video study sessions with Microsoft Teams integration.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}