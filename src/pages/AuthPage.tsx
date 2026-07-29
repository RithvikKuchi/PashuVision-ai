import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Milk, Mail, Lock, User2, ArrowRight, Eye, EyeOff, ShieldCheck, ScanLine, Database } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useI18n } from '@/context/I18nContext';
import { Spinner } from '@/components/ui';
import type { UserRole } from '@/types';

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: 'farmer', label: 'Farmer', desc: 'Manage your livestock records' },
  { value: 'veterinarian', label: 'Veterinarian', desc: 'Track health and vaccinations' },
  { value: 'officer', label: 'Govt. Officer', desc: 'Field registration & audits' },
  { value: 'admin', label: 'Administrator', desc: 'Full system management' },
];

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) toast(error, 'error');
      else {
        toast(t('auth.welcomeBackToast'), 'success');
        navigate('/app');
      }
    } else {
      const { error } = await signUp(email, password, fullName, role);
      if (error) toast(error, 'error');
      else {
        toast(t('auth.accountCreated'), 'success');
        navigate('/login');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-primary-700 via-primary-800 to-[#03261a] flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(52,211,153,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(14,165,233,0.3) 0%, transparent 50%)',
        }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Milk className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-lg">{t('brand.name')}</h1>
            <p className="text-primary-200 text-xs tracking-wide">{t('brand.tagline')}</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="font-display font-bold text-white text-4xl leading-tight">
              Identify cattle & buffalo breeds with AI precision.
            </h2>
            <p className="text-primary-100 mt-4 text-lg max-w-md">
              Built for the Bharat Pashudhan initiative. Replace manual, error-prone breed registration with instant, explainable AI recognition.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { icon: ScanLine, text: 'Top-3 breed predictions with confidence scores' },
              { icon: Database, text: 'Digital animal profiles & vaccination records' },
              { icon: ShieldCheck, text: 'Role-based access for farmers, vets & officers' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-primary-100">
                <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center shrink-0">
                  <f.icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-primary-300 text-xs">SIH25004 · Smart India Hackathon 2025</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-[#0a0f0d]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Milk className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-display font-bold">{t('brand.name')}</h1>
          </div>

          <h2 className="font-display font-bold text-2xl mb-1">
            {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {isLogin ? 'Sign in to access your breed recognition dashboard.' : 'Join PashuVision to start identifying livestock breeds.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('auth.fullName')}</label>
                <div className="relative">
                  <User2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Rajesh Kumar"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
                />
                <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('auth.role')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`text-left p-3 rounded-xl border text-sm transition-all ${
                        role === r.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500/30'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                    >
                      <span className="font-medium block">{r.label}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-60"
            >
              {loading ? <Spinner className="w-4 h-4" /> : <>
                {isLogin ? t('auth.signIn') : t('auth.createAccount')} <ArrowRight className="w-4 h-4" />
              </>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link to={isLogin ? '/register' : '/login'} className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
              {isLogin ? t('auth.signUp') : t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
