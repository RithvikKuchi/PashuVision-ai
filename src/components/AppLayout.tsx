import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ScanLine, History, Database, BarChart3, Settings,
  Sun, Moon, LogOut, Menu, X, Milk, ChevronDown, User2, Globe,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useI18n, LANGUAGES, type Language } from '@/context/I18nContext';

const navItems = [
  { to: '/app', labelKey: 'nav.dashboard' as const, icon: LayoutDashboard, end: true },
  { to: '/app/predict', labelKey: 'nav.predict' as const, icon: ScanLine },
  { to: '/app/history', labelKey: 'nav.history' as const, icon: History },
  { to: '/app/animals', labelKey: 'nav.animals' as const, icon: Database },
  { to: '/app/analytics', labelKey: 'nav.analytics' as const, icon: BarChart3 },
  { to: '/app/admin', labelKey: 'nav.admin' as const, icon: Settings, adminOnly: true },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const [langMenu, setLangMenu] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const items = navItems.filter((i) => !i.adminOnly || isAdmin);
  const currentLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  const handleSignOut = async () => {
    await signOut();
    toast(t('auth.signedOut'), 'success');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#0a0f0d]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 z-40 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } bg-white dark:bg-[#0d1411] border-r border-gray-200 dark:border-gray-800`}
      >
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
            <Milk className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-sm leading-tight">{t('brand.name')}</h1>
            <p className="text-[10px] text-primary-600 dark:text-primary-400 font-medium tracking-wide">{t('brand.tagline')}</p>
          </div>
          <button className="ml-auto lg:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <div className="rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 p-3.5 border border-primary-100 dark:border-primary-900/30">
            <p className="text-xs font-semibold text-primary-800 dark:text-primary-300">{t('brand.ready')}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
              {t('brand.readyDesc')}
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-16 glass-strong border-b border-gray-200/80 dark:border-gray-800 flex items-center px-4 lg:px-6 gap-3">
          <button className="lg:hidden text-gray-500" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
            <span className="font-medium text-gray-700 dark:text-gray-200">{t(('role.' + (profile?.role ?? 'farmer')) as 'role.admin' | 'role.officer' | 'role.veterinarian' | 'role.farmer')}</span>
            <span>·</span>
            <span>{profile?.organization || profile?.region || 'India'}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenu((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 h-9 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Select language"
              >
                <Globe className="w-[18px] h-[18px]" />
                <span className="text-sm font-medium hidden sm:block">{currentLang.nativeLabel}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {langMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setLangMenu(false)} />
                  <div className="absolute right-0 top-12 z-40 w-44 card shadow-xl p-1.5 animate-scale-in">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLang(l.code as Language); setLangMenu(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                          lang === l.code
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="text-base">{l.flag}</span>
                        <span>{l.nativeLabel}</span>
                        <span className="text-xs text-gray-400 ml-auto">{l.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileMenu((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold">
                  {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <span className="hidden sm:block text-sm font-medium">{profile?.full_name?.split(' ')[0] ?? 'User'}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {profileMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileMenu(false)} />
                  <div className="absolute right-0 top-12 z-40 w-56 card shadow-xl p-1.5 animate-scale-in">
                    <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-semibold truncate">{profile?.full_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t(('role.' + (profile?.role ?? 'farmer')) as 'role.admin' | 'role.officer' | 'role.veterinarian' | 'role.farmer')}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors mt-1"
                    >
                      <LogOut className="w-4 h-4" /> {t('auth.signOut')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="font-display font-bold text-2xl tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
