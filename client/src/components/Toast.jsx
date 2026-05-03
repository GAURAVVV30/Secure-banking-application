import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

export default function Toast({ message, type = "info", onClose, duration = 5000 }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgColors = {
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50",
    error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50"
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[100] flex items-center p-4 min-w-[300px] rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform ${isExiting ? 'translate-x-20 opacity-0' : 'translate-x-0 opacity-100'} ${bgColors[type]}`}>
      <div className="flex items-center gap-3 flex-1">
        {icons[type]}
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{message}</p>
      </div>
      <button 
        onClick={handleClose}
        className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
