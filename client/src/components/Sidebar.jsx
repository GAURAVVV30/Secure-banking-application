import { useTheme } from '../context/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Settings, Banknote, LogOut, Sun, Moon } from 'lucide-react';

export default function Sidebar({ openModal, onLogout }) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'settings', label: 'Profile', icon: Settings, type: 'modal', modalId: 'settings' },
    { id: 'loans', label: 'Loans', icon: Banknote, path: '/loans' },
    { id: 'cards', label: 'Virtual Cards', icon: CreditCard, type: 'modal', modalId: 'cards' },
  ];

  return (
    <div className="w-72 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-xl shadow-lg h-[calc(100vh-48px)] flex flex-col transition-colors duration-300 rounded-[2.5rem] shrink-0 border border-white/20 dark:border-zinc-700/50 mr-8 overflow-hidden">
      <div className="p-8 flex-1">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Banknote className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">SecureBank</h2>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.type === 'modal') {
                    openModal(item.modalId);
                  } else {
                    navigate(item.path);
                  }
                }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 translate-x-1' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-zinc-700/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'group-hover:text-indigo-600'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      <div className="p-8 border-t border-gray-100/50 dark:border-zinc-700/50 space-y-4">
        <button 
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-700/30 rounded-2xl border border-white/20 dark:border-zinc-600/30 group transition-all"
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-orange-400" />}
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Theme</span>
          </div>
          <div className={`w-10 h-5 rounded-full transition-colors duration-300 flex items-center px-1 ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}>
            <div className={`w-3 h-3 rounded-full bg-white transform transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </button>

        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-5 py-4 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-2xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </div>
  );
}
