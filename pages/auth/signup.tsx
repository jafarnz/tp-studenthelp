import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import Image from 'next/image';
import { EnvelopeIcon, KeyIcon, UserIcon, AcademicCapIcon, BookOpenIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import { schools } from '@/data/schools';
import { getModulesForDiploma } from '@/data/modules';
import FileUpload from '@/components/FileUpload';
import { validatePassword } from '@/utils/validation';
import { useRouter } from 'next/router';

export default function SignUp() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // User details
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Academic details
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedDiploma, setSelectedDiploma] = useState('');
  const [modulesNeedHelp, setModulesNeedHelp] = useState<string[]>([]);
  const [modulesCanHelp, setModulesCanHelp] = useState<string[]>([]);
  const [moduleInput, setModuleInput] = useState('');
  const [studentYear, setStudentYear] = useState('1');
  
  // Profile details
  const [bio, setBio] = useState('');
  const [skillsets, setSkillsets] = useState<string[]>([]);
  const [profilePicture, setProfilePicture] = useState('');

  const totalSteps = 6;
  const steps = [
    { num: 1, icon: EnvelopeIcon, label: 'Email' },
    { num: 2, icon: KeyIcon, label: 'Verify' },
    { num: 3, icon: UserIcon, label: 'Account' },
    { num: 4, icon: AcademicCapIcon, label: 'School' },
    { num: 5, icon: BookOpenIcon, label: 'Modules' },
    { num: 6, icon: UserCircleIcon, label: 'Profile' }
  ];

  // Password validation effect
  useEffect(() => {
    const errors: string[] = [];
    if (password) {
      if (password.length < 8) {
        errors.push('At least 8 characters');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('One uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('One lowercase letter');
      }
      if (!/[0-9]/.test(password)) {
        errors.push('One number');
      }
    }
    setPasswordErrors(errors);
  }, [password]);

  const handleStepClick = (stepNum: number) => {
    // Only allow going back to previous steps
    if (stepNum < step) {
      setStep(stepNum);
      setError('');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      setStep(2);
    } catch (error: any) {
      setError(error.message || 'Failed to send verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid verification code');
      }

      setStep(3);
    } catch (error: any) {
      setError(error.message || 'Failed to verify code');
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password
    const { isValid, error: passwordError } = validatePassword(password);
    if (!isValid) {
      setError(passwordError || 'Invalid password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    setStep(4);
  };

  const handleSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool || !selectedDiploma) {
      setError('Please select both school and diploma');
      return;
    }
    setStep(5);
  };

  const handleModulesSubmit = () => {
    if (modulesNeedHelp.length === 0 && modulesCanHelp.length === 0) {
      setError('Please select at least one module you need help with or can help with');
      return;
    }
    setError('');
    setStep(6);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          password,
          school: selectedSchool,
          diploma: selectedDiploma,
          modulesNeedHelp,
          modulesCanHelp,
          studentYear,
          bio: bio || '',
          skillsets: skillsets || [],
          image: profilePicture || ''
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create account');
      }

      // On successful signup, redirect to signin
      router.push('/auth/signin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7efe7] py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Sign Up - TP Connect</title>
        <link rel="icon" href="/download.svg" />
      </Head>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="relative w-20 h-20 mb-4">
          <Image
            src="/download.svg"
            alt="TP Logo"
            width={150}
            height={150}
            priority
          />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          TP Connect
        </h2>
      </div>

      {/* Wider container for progress bar */}
      <div className="mt-8 sm:mx-auto sm:w-full max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8 px-4">
          <div className="relative flex justify-between">
            {/* Progress Bar Background */}
            <div className="absolute top-6 left-0 right-0 h-2 bg-pink-100 rounded-full"></div>
            
            {/* Active Progress Bar */}
            <div 
              className="absolute top-6 left-0 h-2 bg-[#E73C37] rounded-full transition-all duration-500 ease-in-out"
              style={{ 
                width: `${Math.max(0, ((step - 1) / (totalSteps - 1)) * 100)}%`
              }}
            ></div>

            {/* Steps */}
            {steps.map(({ num, icon: Icon, label }) => (
              <div key={num} className="relative flex flex-col items-center" style={{ width: '150px' }}>
                <button
                  onClick={() => handleStepClick(num)}
                  disabled={num > step}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    border-2 z-10 transition-all duration-300 ease-in-out
                    ${step >= num 
                      ? 'bg-gradient-to-r from-pink-400 to-red-400 border-transparent text-white shadow-lg' 
                      : 'bg-white border-pink-200 text-pink-300 hover:border-pink-300'
                    }
                    ${num <= step ? 'cursor-pointer' : 'cursor-not-allowed'}
                  `}
                >
                  <Icon className="w-6 h-6" />
                </button>
                <span className={`
                  mt-2 text-sm font-medium transition-colors duration-300 whitespace-nowrap
                  ${step >= num ? 'text-[#E73C37]' : 'text-pink-300'}
                `}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="bg-[#F7EFE7] shadow-lg rounded-2xl p-8 border border-[#BFB0A0]/30">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {step === 1 && (
                  <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:ring-[#E73C37] focus:border-[#E73C37] placeholder-gray-400"
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#E73C37] hover:bg-[#E73C37]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E73C37] disabled:opacity-50 mt-4"
                    >
                      {isVerifying ? 'Sending...' : 'Continue'}
                    </button>
                  </form>
                )}

                {step === 2 && (
                  <form onSubmit={handleVerificationSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="code" className="block text-base font-medium text-gray-700 mb-2">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        id="code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:ring-[#E73C37] focus:border-[#E73C37] placeholder-gray-400"
                        placeholder="Enter verification code"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#E73C37] hover:bg-[#E73C37]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E73C37] mt-4"
                    >
                      Verify
                    </button>
                  </form>
                )}

                {step === 3 && (
                  <form onSubmit={handleAccountSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="username" className="block text-base font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:ring-[#E73C37] focus:border-[#E73C37] placeholder-gray-400"
                        placeholder="Enter your username"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-base font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:ring-[#E73C37] focus:border-[#E73C37] placeholder-gray-400"
                        placeholder="Enter your password"
                        required
                      />
                      {/* Password Requirements */}
                      <div className="mt-2 space-y-1">
                        {passwordErrors.map((error, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <span className="w-4 h-4 mr-2 flex items-center justify-center">
                              {password && !error ? (
                                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                              )}
                            </span>
                            <span className={password && !error ? 'text-green-500' : 'text-gray-500'}>
                              {error}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:ring-[#E73C37] focus:border-[#E73C37] placeholder-gray-400"
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#E73C37] hover:bg-[#E73C37]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E73C37] mt-4"
                    >
                      Continue
                    </button>
                  </form>
                )}

                {step === 4 && (
                  <form onSubmit={handleSchoolSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="school" className="block text-base font-medium text-gray-700 mb-2">
                        School
                      </label>
                      <select
                        id="school"
                        name="school"
                        required
                        className="input-field mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:ring-[#E73C37] focus:border-[#E73C37]"
                        value={selectedSchool}
                        onChange={(e) => {
                          setSelectedSchool(e.target.value);
                          setSelectedDiploma('');
                        }}
                      >
                        <option value="">Select a school</option>
                        {schools.map((school) => (
                          <option key={school.name} value={school.name}>
                            {school.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="diploma" className="block text-base font-medium text-gray-700 mb-2">
                        Diploma
                      </label>
                      <select
                        id="diploma"
                        name="diploma"
                        required
                        className="input-field mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:ring-[#E73C37] focus:border-[#E73C37]"
                        value={selectedDiploma}
                        onChange={(e) => setSelectedDiploma(e.target.value)}
                        disabled={!selectedSchool}
                      >
                        <option value="">Select a diploma</option>
                        {schools.find(school => school.name === selectedSchool)?.diplomas.map((diploma) => (
                          <option key={diploma} value={diploma}>
                            {diploma}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#E73C37] hover:bg-[#E73C37]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E73C37] mt-4"
                      >
                        Continue
                      </button>
                    </div>
                  </form>
                )}

                {step === 5 && (
                  <motion.div
                    key="modules-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                        {error}
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-4">
                        Enter Modules You Need Help With
                      </label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={moduleInput}
                            onChange={(e) => setModuleInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && moduleInput.trim()) {
                                e.preventDefault();
                                setModulesNeedHelp([...modulesNeedHelp, moduleInput.trim()]);
                                setModuleInput('');
                              }
                            }}
                            placeholder="Enter module code and press Enter"
                            className="flex-1 input-primary mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:ring-[#E73C37] focus:border-[#E73C37]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (moduleInput.trim()) {
                                setModulesNeedHelp([...modulesNeedHelp, moduleInput.trim()]);
                                setModuleInput('');
                              }
                            }}
                            className="btn-secondary mt-1"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {modulesNeedHelp.map((module, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 px-3 py-1 bg-bg-secondary rounded-full"
                            >
                              <span>{module}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setModulesNeedHelp(modulesNeedHelp.filter((_, i) => i !== index));
                                }}
                                className="text-text-tertiary hover:text-text-primary"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-4">
                        Enter Modules You Can Help With
                      </label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={moduleInput}
                            onChange={(e) => setModuleInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && moduleInput.trim()) {
                                e.preventDefault();
                                setModulesCanHelp([...modulesCanHelp, moduleInput.trim()]);
                                setModuleInput('');
                              }
                            }}
                            placeholder="Enter module code and press Enter"
                            className="flex-1 input-primary mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:ring-[#E73C37] focus:border-[#E73C37]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (moduleInput.trim()) {
                                setModulesCanHelp([...modulesCanHelp, moduleInput.trim()]);
                                setModuleInput('');
                              }
                            }}
                            className="btn-secondary mt-1"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {modulesCanHelp.map((module, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 px-3 py-1 bg-bg-secondary rounded-full"
                            >
                              <span>{module}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setModulesCanHelp(modulesCanHelp.filter((_, i) => i !== index));
                                }}
                                className="text-text-tertiary hover:text-text-primary"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">
                        Student Year
                      </label>
                      <select
                        value={studentYear}
                        onChange={(e) => setStudentYear(e.target.value)}
                        className="input-primary mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:ring-[#E73C37] focus:border-[#E73C37]"
                      >
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                      </select>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={handleModulesSubmit}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#E73C37] hover:bg-[#E73C37]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E73C37] mt-4"
                      >
                        Continue
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 6 && (
                  <motion.form
                    key="profile-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div>
                      <label htmlFor="bio" className="block text-base font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="bio"
                          name="bio"
                          required
                          className="input-field mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:ring-[#E73C37] focus:border-[#E73C37]"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="skillsets" className="block text-base font-medium text-gray-700 mb-2">
                        Skillsets
                      </label>
                      <div className="mt-1">
                        <input
                          id="skillsets"
                          name="skillsets"
                          type="text"
                          required
                          className="input-field mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:ring-[#E73C37] focus:border-[#E73C37]"
                          value={skillsets.join(', ')}
                          onChange={(e) => setSkillsets(e.target.value.split(', '))}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <FileUpload 
                        onUpload={(url) => setProfilePicture(url)} 
                        currentImage={profilePicture}
                        isSignup={true}
                      />
                    </div>

                    <div>
                      <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#E73C37] hover:bg-[#E73C37]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E73C37] disabled:opacity-50 mt-4"
                        disabled={isVerifying}
                      >
                        Complete Signup
                      </button>
                    </div>
                  </motion.form>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
