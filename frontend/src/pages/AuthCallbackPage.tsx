import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/States';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refetchUser } = useAuth();

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code');
      const mock = searchParams.get('mock');

      if (code || mock) {
        try {
          await fetch(`/api/auth/github/callback?${searchParams.toString()}`);
          await refetchUser();
        } catch {
          // Ignore
        }
      }
      navigate('/dashboard');
    };

    handleAuth();
  }, [searchParams, refetchUser, navigate]);

  return <LoadingState message="Completing GitHub sign in..." />;
}
