import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Loader2 } from 'lucide-react';

export default function ProfileSettings() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoadingContact, setIsLoadingContact] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/user/profile');
        if (data.user) {
          setEmail(data.user.email || '');
          setPhone(data.user.phone || '');
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };
  
  const handleUpdateContact = async (e) => {
    e.preventDefault();
    setIsLoadingContact(true);
    try {
      await api.put('/user/contact', { email, phone });
      showMessage('success', 'Contact information updated successfully!');
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to update contact info');
    } finally {
      setIsLoadingContact(false);
    }
  };
  
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setIsLoadingPassword(true);
    try {
      await api.put('/user/password', { currentPassword, newPassword });
      showMessage('success', 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoadingPassword(false);
    }
  };

  if (isFetching) {
    return (
      <div className="w-full flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-8">Profile Settings</h3>
      
      {message.text && (
        <div className={`mb-8 p-4 rounded-2xl text-sm font-medium flex items-center gap-3 border ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-900/50 text-green-700 dark:text-green-400' 
            : 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400'
        }`}>
          {message.type === 'success' ? (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Contact Information</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your email and phone number.</p>
          </div>
          
          <form onSubmit={handleUpdateContact} className="space-y-5 bg-gray-50 dark:bg-slate-700/20 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                pattern="\d{10}"
                title="Must be exactly 10 digits"
                maxLength={10}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                placeholder="0000000000"
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoadingContact}
              className="w-full flex justify-center items-center px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoadingContact ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Save Contact Changes
            </button>
          </form>
        </div>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Security</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ensure your account is using a long, random password.</p>
          </div>
          
          <form onSubmit={handleUpdatePassword} className="space-y-5 bg-gray-50 dark:bg-slate-700/20 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoadingPassword}
              className="w-full flex justify-center items-center px-6 py-3.5 bg-gray-800 hover:bg-gray-900 dark:bg-slate-600 dark:hover:bg-slate-500 text-white rounded-xl font-bold transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoadingPassword ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
