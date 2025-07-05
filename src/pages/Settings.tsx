import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Bell, Palette, Info, ChevronRight, Globe, LogIn, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/GoalContext';
import { useAuth } from '../context/AuthContext';

const APP_VERSION = '0.0.0'; // Synced with package.json
const APP_DESCRIPTION = 'TaskMore helps you set, track, and achieve your tasks with analytics, reminders, and productivity tools.';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const { user: profileUser } = useUser();
  const { user: authUser, signInWithGoogle, signOut } = useAuth();
  const [showAbout, setShowAbout] = useState(false);

  // Motivational quotes
  const quotes = [
    "Success is the sum of small efforts, repeated day in and day out.",
    "The secret of getting ahead is getting started.",
    "Don't watch the clock; do what it does. Keep going.",
    "Great things are done by a series of small things brought together.",
    "You don't have to be great to start, but you have to start to be great.",
    "Dream big. Start small. Act now.",
    "Discipline is the bridge between goals and accomplishment."
  ];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  // Add local profile state for guests
  const [guestProfile, setGuestProfile] = useState(() => {
    const stored = localStorage.getItem('guestProfile');
    return stored ? JSON.parse(stored) : { name: '', profilePic: null };
  });

  // Sync guest profile to localStorage
  useEffect(() => {
    if (!authUser) {
      localStorage.setItem('guestProfile', JSON.stringify(guestProfile));
    }
  }, [guestProfile, authUser]);

  // Handler for guest profile changes
  const handleGuestProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuestProfile({ ...guestProfile, [e.target.name]: e.target.value });
  };

  // Handler for guest profile picture upload
  const handleGuestProfilePic = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setGuestProfile((prev: any) => ({ ...prev, profilePic: ev.target?.result }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setShowLanguageSelector(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8">{t('settings_title')}</h1>

        {/* Account Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 border-b-2 border-gray-300 dark:border-gray-700 pb-2">{t('settings_account')}</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {/* Authentication Status */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <User className="w-6 h-6 mr-4" />
                <div>
                  <span className="font-semibold">
                    {authUser ? 'Signed In' : 'Not Signed In'}
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {authUser ? authUser.email : 'Sign in to sync your data'}
                  </p>
                </div>
              </div>
              {authUser ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <LogIn size={16} className="mr-2" />
                  Login with Google
                </button>
              )}
            </div>

            {/* Profile Management - Only show if signed in */}
            {authUser && (
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <User className="w-6 h-6 mr-4" />
                  <div>
                    <span className="font-semibold">{t('settings_profile')}</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings_manage_account')}</p>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                      {t('profile_name_label')}: {authUser?.user_metadata?.full_name || profileUser?.name}
                      {authUser?.user_metadata?.full_name && <span className="text-green-600 ml-1">(Google)</span>}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6" />
              </div>
            )}

            {/* Profile Edit Form for all users */}
            {(authUser && !authUser.user_metadata?.full_name) && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <form onSubmit={e => { e.preventDefault(); }}>
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">{t('profile_name_label')}</label>
                    <input
                      type="text"
                      name="name"
                      value={authUser ? (profileUser?.name || '') : guestProfile.name}
                      onChange={authUser ? (e) => {/* handle signed-in profile change if needed */} : handleGuestProfileChange}
                      className="w-full px-3 py-2 border rounded"
                      title="Profile Name"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">Profile Picture</label>
                    <input type="file" accept="image/*" onChange={authUser ? undefined : handleGuestProfilePic} title="Upload profile picture" />
                    {(!authUser && guestProfile.profilePic) && (
                      <img src={guestProfile.profilePic} alt="Profile" className="w-16 h-16 rounded-full mt-2" />
                    )}
                  </div>
                  {/* Save button for guest profile */}
                  {!authUser && (
                    <button type="button" className="mt-2 px-4 py-2 bg-blue-500 text-white rounded" onClick={() => localStorage.setItem('guestProfile', JSON.stringify(guestProfile))}>
                      Save Profile
                    </button>
                  )}
                </form>
              </div>
            )}

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <Bell className="w-6 h-6 mr-4" />
                <div>
                  <span className="font-semibold">{t('settings_notifications')}</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings_enable_notifications')}</p>
                </div>
              </div>
              <div
                className={`w-14 h-8 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer ${notifications ? 'bg-blue-500' : 'bg-gray-600'}`}
                onClick={() => setNotifications(!notifications)}
              >
                <div
                  className={`bg-white w-6 h-6 rounded-full shadow-md transform duration-300 ease-in-out ${notifications ? 'translate-x-6' : ''}`}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 border-b-2 border-gray-300 dark:border-gray-700 pb-2">{t('settings_appearance')}</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <Palette className="w-6 h-6 mr-4" />
                <div>
                  <span className="font-semibold">{t('settings_theme')}</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings_switch_theme')}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div
                  className={`w-14 h-8 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer ${theme === 'dark' ? 'bg-gray-600' : ''}`}
                  onClick={toggleTheme}
                >
                  <div
                    className={`bg-white w-6 h-6 rounded-full shadow-md transform duration-300 ease-in-out ${theme === 'dark' ? 'translate-x-6' : ''}`}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* General Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 border-b-2 border-gray-300 dark:border-gray-700 pb-2">{t('settings_general')}</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowLanguageSelector(!showLanguageSelector)}>
                <div className="flex items-center">
                  <Globe className="w-6 h-6 mr-4" />
                  <div>
                    <span className="font-semibold">{t('settings_language')}</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings_change_language')}</p>
                  </div>
                </div>
                <ChevronRight className={`w-6 h-6 transform transition-transform ${showLanguageSelector ? 'rotate-90' : ''}`} />
              </div>
              {showLanguageSelector && (
                <div className="mt-4 pl-10">
                  <div className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md" onClick={() => changeLanguage('en')}>English</div>
                  <div className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md" onClick={() => changeLanguage('id')}>Bahasa Indonesia</div>
                  <div className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md" onClick={() => changeLanguage('zh')}>中文</div>
                  <div className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md" onClick={() => changeLanguage('ja')}>日本語</div>
                  <div className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md" onClick={() => changeLanguage('ko')}>한국어</div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setShowAbout(!showAbout)}>
              <div className="flex items-center">
                <Info className="w-6 h-6 mr-4" />
                <div>
                  <span className="font-semibold">{t('settings_about')}</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings_app_info')}</p>
                </div>
              </div>
              <ChevronRight className={`w-6 h-6 transform transition-transform ${showAbout ? 'rotate-90' : ''}`} />
            </div>
            {showAbout && (
              <div className="px-8 pb-6 pt-2 text-sm text-gray-700 dark:text-gray-200">
                <div className="mb-2">
                  <span className="font-semibold">Version:</span> {APP_VERSION}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">App:</span> TaskMore
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Description:</span> {APP_DESCRIPTION}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Author:</span> TaskQ™
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Website:</span> <a href="https://taskmore.app" className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">taskmore.app</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 dark:text-gray-500 text-sm">TaskMore v{APP_VERSION}</p>
        <p className="text-gray-600 dark:text-gray-600 text-xs mt-1 italic">"{randomQuote}"</p>
      </div>
    </div>
  );
};

export default Settings;