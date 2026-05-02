import { useTheme } from '../context/ThemeContext';

export default function Sidebar({ openModal, onLogout }) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className="w-64 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-xl shadow-lg h-[calc(100vh-48px)] flex flex-col transition-colors duration-300 rounded-3xl shrink-0 border border-white/20 dark:border-zinc-700/50 mr-6">
      <div className="p-8 flex-1">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-10">SecureBank</h2>
        <nav className="space-y-3">
          <button
            className="w-full text-left px-5 py-3.5 rounded-2xl transition-all duration-200 font-medium bg-indigo-50/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-100/50 dark:border-indigo-800/50"
          >
            Dashboard
          </button>
          <button
            onClick={() => openModal('cards')}
            className="w-full text-left px-5 py-3.5 rounded-2xl transition-all duration-200 font-medium text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-zinc-700/50 border border-transparent"
          >
            Virtual Cards
          </button>
          <button
            onClick={() => openModal('settings')}
            className="w-full text-left px-5 py-3.5 rounded-2xl transition-all duration-200 font-medium text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-zinc-700/50 border border-transparent"
          >
            Settings
          </button>
        </nav>
      </div>
      
      <div className="p-8 border-t border-gray-100/50 dark:border-zinc-700/50">
        <div className="flex items-center justify-between mb-6 bg-white/40 dark:bg-zinc-700/30 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 dark:border-zinc-600/30">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
          <button 
            onClick={toggleDarkMode}
            className={`w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none flex items-center px-1 shadow-inner ${
              isDarkMode ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-zinc-600'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transform transition-transform duration-300 shadow-sm ${
              isDarkMode ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>
        <button 
          onClick={onLogout}
          className="w-full px-5 py-3.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-2xl transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
