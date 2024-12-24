import { schools } from '@/data/schools';
import { moduleCategories } from '@/data/modules';

export interface SignupData {
  email: string;
  username: string;
  password: string;
  school: string;
  diploma: string;
  studentYear: string;
  modulesNeedHelp: string[];
  modulesCanHelp: string[];
  bio?: string;
  skillsets?: string[];
  image?: string;
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  return { isValid: true };
}

export function validateSignupData(data: Partial<SignupData>): { isValid: boolean; error?: string } {
  // Email validation
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { isValid: false, error: 'Invalid email address' };
  }

  // Password validation
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    return { isValid: false, error: passwordValidation.error };
  }

  // Username validation (3-20 characters, alphanumeric and underscores)
  if (!data.username || !/^[a-zA-Z0-9_]{3,20}$/.test(data.username)) {
    return { isValid: false, error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores' };
  }

  // School validation
  if (!data.school || !schools.find(s => s.name === data.school)) {
    return { isValid: false, error: 'Invalid school selection' };
  }

  // Diploma validation
  const selectedSchool = schools.find(s => s.name === data.school);
  if (!data.diploma || !selectedSchool?.diplomas.includes(data.diploma)) {
    return { isValid: false, error: 'Invalid diploma selection for the selected school' };
  }

  // Student Year validation
  if (!data.studentYear || !['1', '2', '3'].includes(data.studentYear)) {
    return { isValid: false, error: 'Invalid student year' };
  }

  // Modules validation (at least one module in either category)
  if (!data.modulesNeedHelp?.length && !data.modulesCanHelp?.length) {
    return { isValid: false, error: 'Please enter at least one module you need help with or can help with' };
  }

  // Module format validation
  const allModules = [...(data.modulesNeedHelp || []), ...(data.modulesCanHelp || [])];
  if (allModules.some(module => !module.trim() || module.length > 64)) {
    return { isValid: false, error: 'Modules must not be empty and must be less than 64 characters' };
  }

  // Bio validation (optional, max 500 chars)
  if (data.bio && data.bio.length > 500) {
    return { isValid: false, error: 'Bio must be less than 500 characters' };
  }

  // Skillsets validation (optional)
  if (data.skillsets && (!Array.isArray(data.skillsets) || data.skillsets.some(skill => typeof skill !== 'string'))) {
    return { isValid: false, error: 'Invalid skillsets format' };
  }

  return { isValid: true };
}
