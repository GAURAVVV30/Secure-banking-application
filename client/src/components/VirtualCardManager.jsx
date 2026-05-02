import { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { Loader2 } from 'lucide-react';

export default function VirtualCardManager() {
  const [card, setCard] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCard = async () => {
    try {
      const { data } = await api.get('/banking/card');
      setCard(data.card);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Failed to fetch card:', err);
      }
      setCard(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCard();
  }, []);

  const generateCard = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/banking/card/generate');
      setCard(data.card);
    } catch (err) {
      console.error('Failed to generate card:', err);
      alert(err.response?.data?.message || 'Failed to generate card');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFreeze = async () => {
    try {
      const { data } = await api.put('/banking/card/freeze');
      setCard(data.card);
    } catch (err) {
      console.error('Failed to freeze card:', err);
      alert(err.response?.data?.message || 'Failed to update card status');
    }
  };

  const reportLost = async () => {
    if (!confirm('Are you sure you want to report this card as lost? It will be deleted permanently.')) return;
    try {
      await api.delete('/banking/card');
      setCard(null);
    } catch (err) {
      console.error('Failed to delete card:', err);
      alert(err.response?.data?.message || 'Failed to report lost');
    }
  };

  if (isLoading && !card) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading virtual card...</p>
      </div>
    );
  }

  const isFrozen = card?.status === 'frozen';
  const formattedCardNumber = card?.cardNumber?.match(/.{1,4}/g)?.join(' ') || '';

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-8">Virtual Card</h3>
      
      {!card ? (
        <div className="text-center py-10">
          <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h4 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">No Virtual Card Found</h4>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm max-w-xs mx-auto">Generate a secure virtual card for safe online transactions.</p>
          <button 
            onClick={generateCard}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70 flex items-center mx-auto"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Generate Card
          </button>
        </div>
      ) : (
        <div className="space-y-8 flex flex-col items-center">
          <div className={`relative w-full max-w-sm h-56 rounded-2xl p-6 text-white overflow-hidden transition-all duration-500 shadow-2xl ${isFrozen ? 'bg-slate-400 dark:bg-slate-600 grayscale' : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black opacity-10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="flex justify-between items-start mb-10 relative z-10">
              <span className="font-bold text-2xl tracking-widest italic opacity-90">VISA</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 shadow-sm">
                {isFrozen ? 'Frozen' : 'Active'}
              </span>
            </div>
            
            <div className="mb-6 font-mono text-xl tracking-[0.2em] relative z-10 text-shadow-sm">
              {showDetails ? formattedCardNumber : '•••• •••• •••• ' + card.cardNumber.slice(-4)}
            </div>
            
            <div className="flex justify-between font-mono text-sm opacity-90 relative z-10">
              <div>
                <span className="block text-[9px] uppercase tracking-wider opacity-75 mb-1">Valid Thru</span>
                {card.expiry}
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-wider opacity-75 mb-1">CVV</span>
                {showDetails ? card.cvv : '•••'}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 w-full">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="flex-1 min-w-[120px] px-4 py-3 bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
            <button 
              onClick={toggleFreeze}
              className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                isFrozen 
                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60' 
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:hover:bg-orange-900/60'
              }`}
            >
              {isFrozen ? 'Unfreeze Card' : 'Freeze Card'}
            </button>
            <button 
              onClick={reportLost}
              className="flex-1 min-w-[120px] px-4 py-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
            >
              Report Lost
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
