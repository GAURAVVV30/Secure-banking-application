import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useBanking } from "../context/BankingContext.jsx";
import { 
  ArrowLeft, Smartphone, Tv, ShoppingBag, Droplets, Landmark, 
  Receipt, CreditCard, Lock, ShieldCheck, Loader2, Calendar, 
  ArrowRight, CheckCircle2, Zap, Wifi, MessageSquare, Globe,
  Shirt, Utensils, Laptop, Pencil, Sparkles, ShoppingCart, Tag
} from "lucide-react";
import Toast from "../components/Toast.jsx";

const PAYMENT_TYPES = {
  mobile: { icon: Smartphone, label: "Mobile Recharge", color: "from-blue-500 to-indigo-600" },
  dth: { icon: Tv, label: "DTH Payment", color: "from-purple-500 to-pink-600" },
  shopping: { icon: ShoppingBag, label: "Shopping", color: "from-orange-500 to-red-600" },
  water: { icon: Droplets, label: "Water Bill", color: "from-cyan-500 to-blue-600" },
  tax: { icon: Landmark, label: "Tax Payment", color: "from-emerald-500 to-teal-600" },
  loan: { icon: Receipt, label: "Loan Repayment", color: "from-indigo-500 to-blue-700" }
};

const RECHARGE_PACKS = [
  { id: 1, price: 15, data: "1 GB", validity: "1 Day", calls: "None", sms: "None", info: "Data Add-on" },
  { id: 2, price: 45, data: "2 GB", validity: "2 Days", calls: "Unlimited", sms: "100/Day", info: "Short Term Pack" },
  { id: 3, price: 100, data: "1.5 GB/Day", validity: "28 Days", calls: "Unlimited", sms: "100/Day", info: "Value Pack" },
  { id: 4, price: 250, data: "2 GB/Day", validity: "28 Days", calls: "Unlimited", sms: "100/Day", info: "Popular Choice" },
  { id: 5, price: 299, data: "3 GB/Day", validity: "28 Days", calls: "Unlimited", sms: "100/Day", info: "Heavy Data User" }
];

const SHOPPING_DATA = {
  categories: [
    { id: 'dress', label: 'Dress', icon: Shirt, color: 'from-pink-500 to-rose-600' },
    { id: 'grocery', label: 'Grocery', icon: Utensils, color: 'from-green-500 to-emerald-600' },
    { id: 'electronics', label: 'Electronics', icon: Laptop, color: 'from-blue-500 to-cyan-600' },
    { id: 'stationaries', label: 'Stationaries', icon: Pencil, color: 'from-orange-500 to-amber-600' },
    { id: 'cosmetics', label: 'Cosmetics', icon: Sparkles, color: 'from-purple-500 to-fuchsia-600' }
  ],
  items: {
    dress: [
      { id: 101, name: 'Cotton Shirt', price: 800, desc: 'Premium 100% cotton casual shirt' },
      { id: 102, name: 'Denim Jeans', price: 1500, desc: 'Slim fit durable blue denim' },
      { id: 103, name: 'Summer Dress', price: 1200, desc: 'Lightweight floral print dress' },
      { id: 104, name: 'Leather Jacket', price: 3500, desc: 'Genuine leather winter jacket' }
    ],
    grocery: [
      { id: 201, name: 'Fruit Basket', price: 450, desc: 'Fresh seasonal mixed fruits' },
      { id: 202, name: 'Basmati Rice', price: 600, desc: '5kg Premium long grain rice' },
      { id: 203, name: 'Organic Honey', price: 350, desc: 'Pure raw forest honey 500g' },
      { id: 204, name: 'Gourmet Coffee', price: 850, desc: 'Roasted Arabica whole beans' }
    ],
    electronics: [
      { id: 301, name: 'Laptop Pro', price: 55000, desc: 'High performance work laptop' },
      { id: 302, name: 'Wireless Pods', price: 2500, desc: 'Noise cancelling bluetooth buds' },
      { id: 303, name: 'Smart Watch', price: 4000, desc: 'Fitness tracker with OLED' },
      { id: 304, name: 'Power Bank', price: 1200, desc: '20000mAh Fast charge bank' }
    ],
    stationaries: [
      { id: 401, name: 'Art Journal', price: 500, desc: 'A4 Hardbound premium paper' },
      { id: 402, name: 'Pro Pen Set', price: 300, desc: 'Pack of 5 gel ink smooth pens' },
      { id: 403, name: 'Desk Organizer', price: 750, desc: 'Metallic mesh multi-tier stand' },
      { id: 404, name: 'Luxury Fountain Pen', price: 1500, desc: 'Gold plated nib executive pen' }
    ],
    cosmetics: [
      { id: 501, name: 'Face Glow Kit', price: 2200, desc: 'Full herbal skin care routine' },
      { id: 502, name: 'Velvet Lipstick', price: 650, desc: 'Matte finish long-lasting' },
      { id: 503, name: 'Hydrating Serum', price: 1100, desc: 'Vitamin C enriched night serum' },
      { id: 504, name: 'Luxury Fragrance', price: 4500, desc: 'Parisian floral eau de parfum' }
    ]
  }
};

export default function PaymentPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { balance, refreshAll } = useBanking();
  
  const [loading, setLoading] = useState(false);
  const [fetchingLoans, setFetchingLoans] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [formData, setFormData] = useState({
    cardNumber: "",
    cvv: "",
    pin: "",
    amount: ""
  });

  const paymentInfo = PAYMENT_TYPES[type] || PAYMENT_TYPES.mobile;
  const Icon = paymentInfo.icon;

  useEffect(() => {
    if (type === 'loan') {
      fetchLoans();
    }
  }, [type]);

  const fetchLoans = async () => {
    setFetchingLoans(true);
    try {
      const { data } = await api.get("/banking/loans");
      setLoans(data.loans || []);
    } catch (error) {
      setToast({ message: "Failed to fetch loans", type: "error" });
    } finally {
      setFetchingLoans(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (["cardNumber", "cvv", "pin", "amount"].includes(name) && value !== "" && !/^\d+$/.test(value)) {
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectLoan = (loan) => {
    setSelectedLoan(loan);
    setFormData(prev => ({ ...prev, amount: loan.monthlyPayment.toString() }));
  };

  const handleSelectPack = (pack) => {
    setSelectedPack(pack);
    setFormData(prev => ({ ...prev, amount: pack.price.toString() }));
    scrollToForm();
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setFormData(prev => ({ ...prev, amount: item.price.toString() }));
    scrollToForm();
  };

  const scrollToForm = () => {
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(formData.amount) > balance) {
      setToast({ message: "Insufficient balance", type: "error" });
      return;
    }

    setLoading(true);
    try {
      await api.post("/banking/pay", {
        type,
        ...formData,
        loanId: selectedLoan?.id,
        packId: selectedPack?.id,
        itemId: selectedItem?.id
      });
      setToast({ message: "Payment Successful!", type: "success" });
      refreshAll();
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error) {
      setToast({ 
        message: error.response?.data?.message || "Payment failed", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderLoanList = () => {
    if (fetchingLoans) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <p className="text-gray-500 font-medium">Fetching active loans...</p>
        </div>
      );
    }

    if (loans.length === 0) {
      return (
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-zinc-800 p-12 text-center animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Receipt className="w-10 h-10 text-gray-300 dark:text-zinc-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">No loans to be paid</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">You don't have any active loans that require payment at this time.</p>
          <button onClick={() => navigate("/dashboard")} className="mt-8 px-8 py-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-2xl font-bold transition-colors">Go Back</button>
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 ml-2">Select a Loan to Pay</h3>
        <div className="grid grid-cols-1 gap-4">
          {loans.map((loan) => (
            <div key={loan.id} className="group relative bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-zinc-800 hover:border-indigo-500/50 transition-all overflow-hidden">
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${loan.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'} dark:bg-indigo-900/30`}>
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Amount</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100">Rs. {loan.amount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Monthly EMI</p>
                  <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">Rs. {loan.monthlyPayment.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-50 dark:border-zinc-800 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                  <Calendar className="w-4 h-4" /> {loan.months} Months Duration
                </div>
                {loan.status === 'paid' ? (
                  <div className="flex items-center gap-2 text-green-500 font-bold"><CheckCircle2 className="w-5 h-5" /> Fully Paid</div>
                ) : (
                  <button onClick={() => handleSelectLoan(loan)} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all transform hover:scale-105">Pay EMI <ArrowRight className="w-4 h-4" /></button>
                )}
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform"></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMobilePacks = () => {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 ml-2">Available Recharge Packs</h3>
        <div className="grid grid-cols-1 gap-4">
          {RECHARGE_PACKS.map((pack) => (
            <div key={pack.id} onClick={() => handleSelectPack(pack)} className={`group relative bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border-2 transition-all cursor-pointer overflow-hidden ${selectedPack?.id === pack.id ? 'border-indigo-500 ring-4 ring-indigo-500/10 scale-[1.02]' : 'border-transparent hover:border-indigo-500/30'}`}>
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-5">
                  <div className="text-3xl font-black text-gray-900 dark:text-white">₹{pack.price}</div>
                  <div>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">{pack.info}</p>
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5" /> {pack.data}</span>
                      <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> {pack.validity}</span>
                      <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> {pack.sms}</span>
                    </div>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 hidden md:block">
                  <div className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30">Choose Pack</div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform"></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderShoppingSelection = () => {
    if (!selectedCategory) {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 ml-2">Choose Category</h3>
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {SHOPPING_DATA.categories.map((cat) => (
                <button 
                  key={cat.id} 
                  onClick={() => setSelectedCategory(cat)}
                  className="group relative w-full h-32 bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-gray-100 dark:border-zinc-800 hover:border-indigo-500/50 transition-all flex flex-col items-center justify-center overflow-hidden hover:shadow-xl hover:-translate-y-1"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${cat.color} rounded-xl flex items-center justify-center mb-2 text-white shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-100 text-xs uppercase tracking-widest">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const items = SHOPPING_DATA.items[selectedCategory.id] || [];
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between ml-2">
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <selectedCategory.icon className="w-5 h-5 text-indigo-500" /> {selectedCategory.label} Items
          </h3>
          <button onClick={() => setSelectedCategory(null)} className="text-sm font-bold text-indigo-600 hover:underline">Change Category</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleSelectItem(item)}
              className={`group relative bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border-2 transition-all cursor-pointer overflow-hidden ${selectedItem?.id === item.id ? 'border-indigo-500 ring-4 ring-indigo-500/10 scale-[1.02]' : 'border-transparent hover:border-indigo-500/30'}`}
            >
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl">
                  <ShoppingCart className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">₹{item.price.toLocaleString()}</div>
              </div>
              <div className="relative z-10">
                <h4 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-1">{item.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-6 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 relative z-10">
                <div className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30">
                  Buy Now <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br ${selectedCategory.color} opacity-5 rounded-full group-hover:scale-150 transition-transform`}></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const isSelectionRequired = ['loan', 'mobile', 'shopping'].includes(type);
  const hasSelection = (type === 'loan' && selectedLoan) || (type === 'mobile' && selectedPack) || (type === 'shopping' && selectedItem);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => {
              if (type === 'shopping' && selectedItem) { setSelectedItem(null); return; }
              if (type === 'shopping' && selectedCategory) { setSelectedCategory(null); return; }
              if (hasSelection) {
                if (type === 'loan') setSelectedLoan(null);
                if (type === 'mobile') setSelectedPack(null);
                return;
              }
              navigate("/dashboard");
            }}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-semibold"
          >
            <ArrowLeft className="w-5 h-5" /> 
            {type === 'shopping' && selectedItem ? "Back to Items" : 
             type === 'shopping' && selectedCategory ? "Back to Categories" :
             hasSelection ? "Change Selection" : "Back to Dashboard"}
          </button>
          
          {hasSelection && (
            <div className="px-4 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-widest">
              {type === 'loan' ? `Loan ID: #${selectedLoan.id}` : 
               type === 'shopping' ? `Item: ${selectedItem.name}` : "Selection Active"}
            </div>
          )}
        </div>

        {type === 'loan' && !selectedLoan && renderLoanList()}
        {type === 'mobile' && !selectedPack && renderMobilePacks()}
        {type === 'shopping' && !selectedItem && renderShoppingSelection()}

        {(hasSelection || !isSelectionRequired) && (
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
            <div className={`bg-gradient-to-r ${paymentInfo.color} p-8 text-white relative`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{paymentInfo.label}</h2>
                  <p className="text-white/80 text-sm">
                    {hasSelection ? "Finalizing Payment" : "Safe & Secure Instant Payment"}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="bg-gray-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available Balance</span>
                  <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                    Rs. {balance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Virtual Card Number</label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      name="cardNumber"
                      maxLength="16"
                      placeholder="0000 0000 0000 0000"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="w-full px-6 pr-4 py-4 bg-gray-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">CVV</label>
                    <div className="relative">
                      <input
                        required
                        type="password"
                        name="cvv"
                        maxLength="3"
                        placeholder="•••"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        className="w-full px-6 pr-4 py-4 bg-gray-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Security PIN</label>
                    <div className="relative">
                      <input
                        required
                        type="password"
                        name="pin"
                        maxLength="4"
                        placeholder="••••"
                        value={formData.pin}
                        onChange={handleInputChange}
                        className="w-full px-6 pr-4 py-4 bg-gray-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Amount (Rs.)</label>
                  <input
                    required
                    readOnly={isSelectionRequired}
                    type="text"
                    name="amount"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-4 bg-gray-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-2xl font-bold ${isSelectionRequired ? 'text-indigo-600 dark:text-indigo-400 cursor-not-allowed opacity-80' : ''}`}
                  />
                  {isSelectionRequired && (
                    <p className="mt-2 ml-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {type === 'loan' ? "Calculated Monthly EMI" : type === 'mobile' ? "Selected Pack Price" : "Selected Item Price"}
                    </p>
                  )}
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirm Payment"}
              </button>
            </form>
          </div>
        )}
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
