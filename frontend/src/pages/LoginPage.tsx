import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Rocket, Github, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

export function LoginPage() {
  const navigate = useNavigate();
  const { loginWithGitHub, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500 border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-500/10 via-transparent to-transparent" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-10 w-10 gradient-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold gradient-text">DeployEasy</span>
        </div>

        {/* Login card */}
        <div className="glass rounded-2xl p-8 border border-surface-700/50 shadow-2xl">
          <h1 className="text-2xl font-bold text-white text-center mb-2">Sign in to DeployEasy</h1>
          <p className="text-surface-400 text-center text-sm mb-8">
            Connect your GitHub account to deploy applications
          </p>

          <button
            onClick={loginWithGitHub}
            className="w-full flex items-center justify-center gap-3 bg-surface-100 hover:bg-white text-surface-950 font-semibold py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-white/5"
          >
            <Github className="h-5 w-5" />
            Continue with GitHub
            <ArrowRight className="h-4 w-4 ml-auto text-surface-500" />
          </button>

          <div className="mt-6 pt-6 border-t border-surface-800 text-center">
            <p className="text-xs text-surface-400">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-surface-500 mt-6">
          <button onClick={() => navigate('/')} className="text-brand-400 hover:text-brand-300 transition-colors">
            ← Back to home
          </button>
        </p>
      </div>
    </div>
  );
}
