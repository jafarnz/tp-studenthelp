import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            isTemporary: true,
            emailVerified: true,
            image: true,
            bio: true,
            school: true,
            diploma: true,
            studentYear: true,
            skillsets: true,
            profilePicture: true,
            password: true
          }
        });

        if (!user) {
          throw new Error('No account found with this email');
        }

        if (user.isTemporary) {
          throw new Error('Please verify your email before signing in');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.username,
          username: user.username,
          image: user.image || user.profilePicture,
          bio: user.bio || '',
          school: user.school || '',
          diploma: user.diploma || '',
          studentYear: user.studentYear || 0,
          skillsets: user.skillsets ? JSON.parse(user.skillsets) : []
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.username = user.username;
        token.image = user.image;
        token.bio = user.bio;
        token.school = user.school;
        token.diploma = user.diploma;
        token.studentYear = user.studentYear;
        token.skillsets = user.skillsets;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.username = token.username;
        session.user.image = token.image;
        session.user.bio = token.bio;
        session.user.school = token.school;
        session.user.diploma = token.diploma;
        session.user.studentYear = token.studentYear;
        session.user.skillsets = token.skillsets;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET
};

export default NextAuth(authOptions);
