import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      username?: string | null;
      image?: string | null;
      profilePicture?: string | null;
      bio?: string | null;
      school?: string | null;
      diploma?: string | null;
      studentYear?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
    profilePicture?: string | null;
    bio?: string | null;
    school?: string | null;
    diploma?: string | null;
    studentYear?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub?: string;
    accessToken?: string;
  }
}
