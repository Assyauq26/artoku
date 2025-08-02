import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    addDoc, 
    query, 
    getDocs, 
    where, 
    Timestamp,
    deleteDoc,
    updateDoc,
    onSnapshot,
    limit,
    orderBy
} from 'firebase/firestore';
import { 
    Home, 
    Plus, 
    Landmark, 
    User, 
    ArrowLeft, 
    Trash2, 
    Edit, 
    X, 
    Eye, 
    EyeOff,
    LogOut,
    ArrowDownLeft,
    ArrowUpRight,
    FileText,
    Moon,
    Sun,
    Sparkles,
    UploadCloud
} from 'lucide-react';

// --- Konfigurasi Firebase ---
// Kredensial ini adalah contoh, silakan gunakan milik Anda.
const firebaseConfig = {
  apiKey: "AIzaSyACq9NfLJl0LOpAphODv8D2s04n9NRXrQo",
  authDomain: "artoku-76101.firebaseapp.com",
  projectId: "artoku-76101",
  storageBucket: "artoku-76101.appspot.com",
  messagingSenderId: "1008494564874",
  appId: "1:1008494564874:web:73e9ae8d741adf084971f3"
};

// --- Inisialisasi Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Theme Context for Dark Mode ---
const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

const useTheme = () => useContext(ThemeContext);


// --- Helper Functions ---
const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const formatNumberWithSeparators = (value) => {
    if (!value) return '';
    const numberValue = typeof value === 'string' ? parseInt(value.replace(/\D/g, ''), 10) : value;
    if (isNaN(numberValue)) return '';
    return new Intl.NumberFormat('id-ID').format(numberValue);
};

const formatDate = (date) => {
    if (!date) return '';
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatDateTime = (date) => {
    if (!date) return '';
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return d.toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).replace('pukul', ',');
};


// --- Komponen UI ---

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
    </div>
);

const Modal = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm m-4 transform transition-all duration-300 scale-95 animate-in fade-in-0 zoom-in-95">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Komponen Halaman ---

const LoginPage = ({ setView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    name: email.split('@')[0],
                    email: email,
                });
            }
        } catch (err) {
             switch (err.code) {
                case 'auth/weak-password':
                    setError('Password harus terdiri dari minimal 6 karakter.');
                    break;
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    setError('Email atau password salah.');
                    break;
                case 'auth/email-already-in-use':
                    setError('Email ini sudah terdaftar. Silakan login.');
                    break;
                default:
                    setError('Terjadi kesalahan. Silakan coba lagi.');
                    console.error(err);
                    break;
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                <h1 className="text-4xl font-bold text-center text-indigo-600 mb-2">ArtoKu</h1>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm">Kelola Keuangan, Raih Tujuan</p>
                
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 text-center">{isLogin ? 'Login' : 'Daftar Akun'}</h2>
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center text-xs">{error}</p>}
                    <form onSubmit={handleAuth}>
                        <div className="mb-4">
                            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-2 text-sm" htmlFor="email">Email</label>
                            <input
                                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm text-slate-800 dark:text-slate-200"
                                placeholder="contoh@email.com" required
                            />
                        </div>
                        <div className="mb-6 relative">
                            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-2 text-sm" htmlFor="password">Password</label>
                            <input
                                id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm text-slate-800 dark:text-slate-200"
                                placeholder="••••••••" required
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-10 text-slate-500 dark:text-slate-400">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-300 flex justify-center items-center text-sm">
                            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : (isLogin ? 'Login' : 'Daftar')}
                        </button>
                    </form>
                    <p className="text-center text-slate-600 dark:text-slate-400 mt-6 text-sm">
                        {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}
                        <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-indigo-600 font-semibold ml-1 hover:underline">
                            {isLogin ? 'Daftar' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};


const HomeScreen = ({ user, setView }) => {
    const { theme, toggleTheme } = useTheme();
    const [summary, setSummary] = useState({ totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0 });
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHomeScreenData = useCallback(() => {
        if (!user) return;
        setLoading(true);

        // Listener for monthly summary
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const qMonth = query(
            collection(db, `users/${user.uid}/transactions`),
            where("date", ">=", Timestamp.fromDate(startOfMonth)),
            where("date", "<=", Timestamp.fromDate(endOfMonth))
        );
        const unsubscribeMonthly = onSnapshot(qMonth, (snapshot) => {
            let monthlyIncome = 0;
            let monthlyExpense = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.type === 'income') monthlyIncome += data.amount;
                else monthlyExpense += data.amount;
            });
            setSummary(prev => ({ ...prev, monthlyIncome, monthlyExpense }));
        });

        // Listener for total balance from all transactions
        const qAll = query(collection(db, `users/${user.uid}/transactions`));
        const unsubscribeTotal = onSnapshot(qAll, (snapshot) => {
            let totalIncome = 0;
            let totalExpense = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.type === 'income') totalIncome += data.amount;
                else totalExpense += data.amount;
            });
            setSummary(prev => ({ ...prev, totalBalance: totalIncome - totalExpense }));
        });

        // Listener for recent transactions
        const qRecent = query(
            collection(db, `users/${user.uid}/transactions`),
            orderBy("date", "desc"),
            limit(4)
        );
        const unsubscribeRecent = onSnapshot(qRecent, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRecentTransactions(txs);
        });
        
        setLoading(false);

        return () => {
            unsubscribeMonthly();
            unsubscribeTotal();
            unsubscribeRecent();
        };
    }, [user]);

    useEffect(() => {
        const cleanup = fetchHomeScreenData();
        return cleanup;
    }, [fetchHomeScreenData]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><LoadingSpinner /></div>;
    }

    return (
        <div className="p-5 pb-28 bg-slate-50 dark:bg-slate-900 min-h-screen">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Halo, {user.name || user.email.split('@')[0]}!</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-500">
                    {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
                </button>
            </header>

            <main>
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white p-5 rounded-2xl shadow-lg mb-6">
                    <p className="text-sm opacity-80">Total Saldo</p>
                    <p className="text-3xl font-bold tracking-tight">{formatCurrency(summary.totalBalance)}</p>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/20">
                        <div className="flex items-center gap-2">
                            <ArrowDownLeft className="w-4 h-4 text-green-300" />
                            <div>
                                <p className="text-xs opacity-80">Pemasukan Bulan Ini</p>
                                <p className="font-semibold text-sm">{formatCurrency(summary.monthlyIncome)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4 text-red-300" />
                            <div>
                                <p className="text-xs opacity-80">Pengeluaran Bulan Ini</p>
                                <p className="font-semibold text-sm">{formatCurrency(summary.monthlyExpense)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">Transaksi Terakhir</h2>
                    <div className="space-y-2.5">
                        {recentTransactions.length > 0 ? (
                            recentTransactions.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3.5 rounded-xl shadow-sm">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{tx.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(tx.date)}</p>
                                    </div>
                                    <p className={`font-semibold text-base ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                                    </p>
                                </div>
                            ))
                        ) : (
                             <p className="text-center text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">Belum ada transaksi.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

const TransactionListPage = ({ user, setView }) => {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ type: 'all', date: '' });
    const [editingTx, setEditingTx] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchTransactions = useCallback(() => {
        if (!user) return;
        setLoading(true);
        const q = query(collection(db, `users/${user.uid}/transactions`), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTransactions(txs);
            setFilteredTransactions(txs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            setLoading(false);
        });
        return unsubscribe;
    }, [user]);

    useEffect(() => {
        const unsubscribe = fetchTransactions();
        return () => unsubscribe && unsubscribe();
    }, [fetchTransactions]);

    useEffect(() => {
        let filtered = [...transactions];
        if (filter.type !== 'all') {
            filtered = filtered.filter(tx => tx.type === filter.type);
        }
        if (filter.date) {
            const filterDate = new Date(filter.date).toDateString();
            filtered = filtered.filter(tx => tx.date.toDate().toDateString() === filterDate);
        }
        setFilteredTransactions(filtered);
    }, [filter, transactions]);

    const handleDelete = async (txId) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
            try {
                await deleteDoc(doc(db, `users/${user.uid}/transactions`, txId));
            } catch (error) {
                console.error("Error deleting transaction:", error);
                alert("Gagal menghapus transaksi.");
            }
        }
    };

    const handleEdit = (tx) => {
        setEditingTx(tx);
        setIsEditModalOpen(true);
    };
    
    const handleUpdateTransaction = async (updatedTx) => {
        try {
            const txRef = doc(db, `users/${user.uid}/transactions`, updatedTx.id);
            await updateDoc(txRef, {
                name: updatedTx.name, category: updatedTx.category,
                amount: updatedTx.amount, date: updatedTx.date, notes: updatedTx.notes
            });
            setIsEditModalOpen(false);
            setEditingTx(null);
        } catch (error) {
            console.error("Error updating transaction:", error);
            alert("Gagal memperbarui transaksi.");
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen"><LoadingSpinner /></div>;

    return (
        <div className="p-4 pb-24 bg-slate-50 dark:bg-slate-900 min-h-screen">
            <div className="flex items-center mb-6">
                <button onClick={() => setView('home')} className="p-2 mr-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                    <ArrowLeft size={22} className="text-slate-700 dark:text-slate-300" />
                </button>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Riwayat Transaksi</h1>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Jenis</label>
                    <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value 
