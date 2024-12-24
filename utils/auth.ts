export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
}

export function generateUsername(name: string): string {
  // Remove special characters and spaces, convert to lowercase
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  // Add random numbers
  const randomNum = Math.floor(Math.random() * 10000);
  return `${cleanName}${randomNum}`;
}
