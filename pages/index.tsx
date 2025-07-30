import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getSession } from '@/lib/auth';
import { GetServerSidePropsContext } from 'next';

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getSession(context.req, context.res);
  
  if (!session.user?.isLoggedIn) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: '/dashboard',
      permanent: false,
    },
  };
};

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return null;
}