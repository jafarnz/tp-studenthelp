import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  // Serialize the session data
  const serializedSession = {
    user: {
      id: session.user?.id || null,
      name: session.user?.name || null,
      email: session.user?.email || null,
      image: session.user?.image || null
    },
    expires: session.expires || null
  };

  return {
    props: {
      session: serializedSession
    },
  };
};
