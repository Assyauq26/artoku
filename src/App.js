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
    Sun
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
                    <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                        className="w-full mt-1 p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 dark:text-slate-200">
                        <option value="all">Semua</option>
                        <option value="income">Pemasukan</option>
                        <option value="expense">Pengeluaran</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tanggal</label>
                    <input type="date" value={filter.date} onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                        className="w-full mt-1 p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 dark:text-slate-200" />
                </div>
            </div>

            <div className="space-y-3">
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(tx => (
                        <div key={tx.id} className="bg-white dark:bg-slate-800 p-3.5 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{tx.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{tx.category} &bull; {formatDateTime(tx.date)}</p>
                                    {tx.notes && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">"{tx.notes}"</p>}
                                </div>
                                <p className={`font-semibold text-base ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                                </p>
                            </div>
                            <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                <button onClick={() => handleEdit(tx)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-full"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(tx.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-full"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">Tidak ada transaksi yang cocok.</p>
                )}
            </div>
            
            {editingTx && (
                <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Transaksi">
                    <AddTransactionForm user={user} setView={setView} existingTransaction={editingTx} onTransactionUpdated={handleUpdateTransaction} />
                </Modal>
            )}
        </div>
    );
};

const AddTransactionForm = ({ user, setView, existingTransaction, onTransactionUpdated }) => {
    const formatTimeForInput = (date) => date.toTimeString().slice(0, 5);
    const formatDateForInput = (date) => date.toISOString().split('T')[0];

    const [type, setType] = useState(existingTransaction?.type || 'expense');
    const [name, setName] = useState(existingTransaction?.name || '');
    const [category, setCategory] = useState(existingTransaction?.category || '');
    const [amount, setAmount] = useState(existingTransaction?.amount || 0);
    const [displayAmount, setDisplayAmount] = useState(existingTransaction ? formatNumberWithSeparators(existingTransaction.amount) : '');
    const [date, setDate] = useState(existingTransaction ? formatDateForInput(existingTransaction.date.toDate()) : formatDateForInput(new Date()));
    const [time, setTime] = useState(existingTransaction ? formatTimeForInput(existingTransaction.date.toDate()) : formatTimeForInput(new Date()));
    const [notes, setNotes] = useState(existingTransaction?.notes || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAmountChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        setAmount(rawValue ? parseInt(rawValue, 10) : 0);
        setDisplayAmount(formatNumberWithSeparators(rawValue));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !category || amount <= 0) {
            setError("Harap isi semua kolom wajib.");
            return;
        }
        setLoading(true);
        setError('');

        const combinedDateTime = new Date(`${date}T${time}`);

        const transactionData = {
            type, name, category,
            amount: amount,
            date: Timestamp.fromDate(combinedDateTime),
            notes,
        };

        try {
            if (existingTransaction) {
                 await onTransactionUpdated({ ...transactionData, id: existingTransaction.id });
            } else {
                await addDoc(collection(db, `users/${user.uid}/transactions`), transactionData);
                setView('home');
            }
        } catch (err) {
            setError("Gagal menyimpan transaksi.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {!existingTransaction && (
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200 dark:bg-slate-700 rounded-full">
                    <button type="button" onClick={() => setType('expense')} className={`w-full py-2 rounded-full font-semibold transition text-sm ${type === 'expense' ? 'bg-red-500 text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}>Pengeluaran</button>
                    <button type="button" onClick={() => setType('income')} className={`w-full py-2 rounded-full font-semibold transition text-sm ${type === 'income' ? 'bg-green-500 text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}>Pemasukan</button>
                </div>
            )}
            
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-center text-xs">{error}</p>}

            <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1 text-sm">Nama Transaksi</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
            </div>
            <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1 text-sm">Kategori</label>
                <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
            </div>
            <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1 text-sm">Nominal</label>
                <input type="text" inputMode="numeric" value={displayAmount} onChange={handleAmountChange} className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
            </div>
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1 text-sm">Tanggal</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
                </div>
                <div className="w-2/5">
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1 text-sm">Waktu</label>
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
                </div>
            </div>
            <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1 text-sm">Catatan (Opsional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" rows="3"></textarea>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-300 flex justify-center items-center text-sm">
                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : (existingTransaction ? 'Simpan Perubahan' : 'Simpan Transaksi')}
            </button>
        </form>
    );
};

const AddTransactionPage = ({ user, setView }) => {
    return (
        <div className="p-4 pb-24 bg-slate-50 dark:bg-slate-900 min-h-screen">
            <div className="flex items-center mb-6">
                <button onClick={() => setView('home')} className="p-2 mr-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                    <ArrowLeft size={22} className="text-slate-700 dark:text-slate-300" />
                </button>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Buat Transaksi Baru</h1>
            </div>
            <AddTransactionForm user={user} setView={setView} />
        </div>
    );
};

const DebtPage = ({ user, setView, setSelectedDebt }) => {
    const [debts, setDebts] = useState([]);
    const [monthlyTotalDebt, setMonthlyTotalDebt] = useState(0);
    const [monthlyPaidDebt, setMonthlyPaidDebt] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [debtToPay, setDebtToPay] = useState(null);
    const [balance, setBalance] = useState(0);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    const fetchDebtsAndBalance = useCallback(() => {
        if (!user) return;
        setLoading(true);
        
        const unsubDebts = onSnapshot(collection(db, `users/${user.uid}/debts`), (snapshot) => {
            const debtsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            debtsData.sort((a, b) => a.name.localeCompare(b.name));
            setDebts(debtsData);

            let totalDueThisMonth = 0;
            let totalConsideredPaidThisMonth = 0;
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            debtsData.forEach(debt => {
                const isPaidOff = debt.paidInstallments >= debt.tenor;
                if (isPaidOff) return;

                const startDate = debt.startDate.toDate();
                
                for (let i = 0; i < debt.tenor; i++) {
                    const installmentDate = new Date(startDate);
                    installmentDate.setMonth(startDate.getMonth() + i);

                    if (installmentDate.getMonth() === currentMonth && installmentDate.getFullYear() === currentYear) {
                        totalDueThisMonth += debt.monthlyInstallment;
                        const installmentNumber = i + 1;
                        if (debt.paidInstallments >= installmentNumber) {
                            totalConsideredPaidThisMonth += debt.monthlyInstallment;
                        }
                        break; 
                    }
                }
            });

            setMonthlyTotalDebt(totalDueThisMonth);
            setMonthlyPaidDebt(totalConsideredPaidThisMonth); 
        });

        const unsubTx = onSnapshot(collection(db, `users/${user.uid}/transactions`), (snapshot) => {
            let totalIncome = 0, totalExpense = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.type === 'income') totalIncome += data.amount;
                else totalExpense += data.amount;
            });
            setBalance(totalIncome - totalExpense);
        });

        setLoading(false);
        return () => { unsubDebts(); unsubTx(); };
    }, [user]);

    useEffect(() => {
        const cleanup = fetchDebtsAndBalance();
        return cleanup;
    }, [fetchDebtsAndBalance]);
    
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    };

    const handlePayInstallment = (debt) => {
        if (balance < debt.monthlyInstallment) {
            showNotification("Saldo tidak mencukupi untuk membayar angsuran.", 'error');
            return;
        }
        setDebtToPay(debt);
        setIsConfirmModalOpen(true);
    };

    const confirmPayment = async () => {
        if (!debtToPay) return;
        
        try {
            await addDoc(collection(db, `users/${user.uid}/transactions`), {
                name: `Bayar Hutang: ${debtToPay.name}`, category: 'Pembayaran Hutang',
                amount: debtToPay.monthlyInstallment, type: 'expense', date: Timestamp.now(),
                notes: `Angsuran ke-${debtToPay.paidInstallments + 1}`
            });

            const debtRef = doc(db, `users/${user.uid}/debts`, debtToPay.id);
            await updateDoc(debtRef, {
                paidInstallments: debtToPay.paidInstallments + 1
            });
            
            showNotification("Pembayaran berhasil!");
        } catch (error) {
            console.error("Error processing payment:", error);
            showNotification("Gagal memproses pembayaran.", 'error');
        } finally {
            setIsConfirmModalOpen(false);
            setDebtToPay(null);
        }
    };

    const handleAddDebt = async (debtData) => {
        try {
            await addDoc(collection(db, `users/${user.uid}/debts`), debtData);
            setIsAddModalOpen(false);
        } catch (error) {
            console.error("Error adding debt:", error);
            alert("Gagal menambahkan hutang.");
        }
    };

    const handleDebtClick = (debt) => {
        setSelectedDebt(debt);
        setView('debtDetail');
    };

    if (loading) return <div className="flex items-center justify-center h-screen"><LoadingSpinner /></div>;

    const totalDebtAmount = debts.reduce((sum, d) => sum + d.totalAmount, 0);
    const totalPaidAmount = debts.reduce((sum, d) => sum + (d.paidInstallments * d.monthlyInstallment), 0);
    const totalRemainingDebt = totalDebtAmount - totalPaidAmount;
    const totalProgress = totalDebtAmount > 0 ? (totalPaidAmount / totalDebtAmount) * 100 : 0;
    
    const monthlyRemainingDebt = monthlyTotalDebt - monthlyPaidDebt;
    const monthlyProgress = monthlyTotalDebt > 0 ? (monthlyPaidDebt / monthlyTotalDebt) * 100 : 0;

    return (
        <div className="p-4 pb-24 bg-slate-50 dark:bg-slate-900 min-h-screen">
            {notification.show && (
                <div className={`fixed top-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 text-sm ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {notification.message}
                </div>
            )}
             <div className="flex items-center mb-6">
                <button onClick={() => setView('home')} className="p-2 mr-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                    <ArrowLeft size={22} className="text-slate-700 dark:text-slate-300" />
                </button>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Manajemen Hutang</h1>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-md space-y-2">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Hutang Bulan Ini</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(monthlyTotalDebt)}</p>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full" style={{ width: `${monthlyProgress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{Math.round(monthlyProgress)}% dibayar</span>
                        <span>Kurang: {formatCurrency(monthlyRemainingDebt < 0 ? 0 : monthlyRemainingDebt)}</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-md space-y-2">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Total Hutang Berjalan</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{formatCurrency(totalRemainingDebt)}</p>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full" style={{ width: `${totalProgress}%` }}></div>
                    </div>
                     <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{Math.round(totalProgress)}% lunas</span>
                        <span>Sisa: {formatCurrency(totalRemainingDebt)}</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Daftar Hutang</h2>
                <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-indigo-700 transition text-sm flex items-center gap-1">
                    <Plus size={16}/> Tambah
                </button>
            </div>

            <div className="space-y-3">
                {debts.length > 0 ? debts.map(debt => {
                    const progress = (debt.paidInstallments / debt.tenor) * 100;
                    const remainingDebt = debt.totalAmount - (debt.paidInstallments * debt.monthlyInstallment);
                    const isPaidOff = debt.paidInstallments >= debt.tenor;

                    return (
                        <div key={debt.id} className="bg-white dark:bg-slate-800 p-3.5 rounded-xl shadow-sm cursor-pointer transition-all hover:ring-2 hover:ring-indigo-400" onClick={() => handleDebtClick(debt)}>
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">{debt.name}</h3>
                                {isPaidOff && <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">LUNAS</span>}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Angsuran: {formatCurrency(debt.monthlyInstallment)} / bulan</p>
                            
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 my-2">
                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span>{debt.paidInstallments}/{debt.tenor} bulan</span>
                                <span>Sisa: {formatCurrency(remainingDebt)}</span>
                            </div>
                            
                            {!isPaidOff && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePayInstallment(debt); }}
                                    className="w-full mt-3 bg-green-500 text-white font-bold py-2 rounded-lg hover:bg-green-600 transition text-sm"
                                >
                                    Bayar Angsuran
                                </button>
                            )}
                        </div>
                    )
                }) : (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">Anda tidak memiliki hutang. Selamat!</p>
                )}
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Hutang Baru">
                <AddDebtForm onAddDebt={handleAddDebt} />
            </Modal>
            
            <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Konfirmasi Pembayaran">
                {debtToPay && (
                    <div>
                        <p className="text-slate-700 dark:text-slate-300 mb-4 text-sm">Anda akan membayar angsuran untuk <span className="font-bold">{debtToPay.name}</span> sebesar <span className="font-bold">{formatCurrency(debtToPay.monthlyInstallment)}</span>. Lanjutkan?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsConfirmModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 text-sm">Batal</button>
                            <button onClick={confirmPayment} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">Ya, Bayar</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const AddDebtForm = ({ onAddDebt }) => {
    const [formData, setFormData] = useState({
        name: '', totalAmount: 0, monthlyInstallment: 0, tenor: '', startDate: '', dueDate: '', paidInstallments: ''
    });
    const [displayValues, setDisplayValues] = useState({ totalAmount: '', monthlyInstallment: '' });
    const [loading, setLoading] = useState(false);

    const handleCurrencyChange = (e) => {
        const { name, value } = e.target;
        const rawValue = value.replace(/\D/g, '');
        
        setFormData(prev => ({ ...prev, [name]: rawValue ? parseInt(rawValue, 10) : 0 }));
        setDisplayValues(prev => ({ ...prev, [name]: formatNumberWithSeparators(rawValue) }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        const debtData = {
            ...formData,
            tenor: parseInt(formData.tenor),
            dueDate: parseInt(formData.dueDate),
            paidInstallments: parseInt(formData.paidInstallments) || 0,
            startDate: Timestamp.fromDate(new Date(formData.startDate)),
        };
        onAddDebt(debtData).finally(() => setLoading(false));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Nama Hutang (e.g., KPR Rumah)" className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
            <input name="totalAmount" type="text" inputMode="numeric" value={displayValues.totalAmount} onChange={handleCurrencyChange} placeholder="Jumlah Pinjaman" className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
            <input name="monthlyInstallment" type="text" inputMode="numeric" value={displayValues.monthlyInstallment} onChange={handleCurrencyChange} placeholder="Nilai Angsuran per Bulan" className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
            <input name="tenor" type="number" value={formData.tenor} onChange={handleChange} placeholder="Tenor (dalam bulan)" className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
            <input name="paidInstallments" type="number" value={formData.paidInstallments} onChange={handleChange} placeholder="Cicilan Sudah Dibayar (e.g., 3)" className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" />
            <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">Tanggal Mulai Cicilan</label>
                <input name="startDate" type="date" value={formData.startDate} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
            </div>
            <input name="dueDate" type="number" min="1" max="31" value={formData.dueDate} onChange={handleChange} placeholder="Tanggal Jatuh Tempo (1-31)" className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-300 text-sm">
                {loading ? 'Menyimpan...' : 'Simpan Hutang'}
            </button>
        </form>
    );
};

const DebtDetailPage = ({ user, debt, setView, onUpdate }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (!debt) {
        return (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 min-h-screen">
                <p className="text-sm text-slate-600 dark:text-slate-400">Hutang tidak ditemukan.</p>
                <button onClick={() => setView('debts')} className="text-indigo-600 mt-4 text-sm">Kembali ke daftar</button>
            </div>
        );
    }
    
    const handleDelete = async () => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus hutang "${debt.name}"? Aksi ini tidak dapat dibatalkan.`)) {
            try {
                await deleteDoc(doc(db, `users/${user.uid}/debts`, debt.id));
                setView('debts');
            } catch (error) {
                console.error("Error deleting debt:", error);
                alert("Gagal menghapus hutang.");
            }
        }
    };
    
    const handleUpdate = async (updatedData) => {
        try {
            const debtRef = doc(db, `users/${user.uid}/debts`, debt.id);
            await updateDoc(debtRef, updatedData);
            onUpdate({ ...debt, ...updatedData });
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Error updating debt:", error);
            alert("Gagal memperbarui hutang.");
        }
    };

    const isPaidOff = debt.paidInstallments >= debt.tenor;

    return (
        <div className="p-4 pb-24 bg-slate-50 dark:bg-slate-900 min-h-screen">
            <div className="flex items-center mb-6">
                <button onClick={() => setView('debts')} className="p-2 mr-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                    <ArrowLeft size={22} className="text-slate-700 dark:text-slate-300" />
                </button>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 truncate">{debt.name}</h1>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-md mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Status</span>
                    <span className={`font-semibold ${isPaidOff ? 'text-green-600' : 'text-yellow-600'}`}>{isPaidOff ? 'Lunas' : 'Belum Lunas'}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Sisa Hutang</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(debt.totalAmount - (debt.paidInstallments * debt.monthlyInstallment))}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Angsuran / Bulan</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(debt.monthlyInstallment)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Jatuh Tempo</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Tanggal {debt.dueDate} setiap bulan</span>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t dark:border-slate-700">
                    <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 font-semibold rounded-lg hover:bg-yellow-200 text-xs">
                        <Edit size={14} /> Edit
                    </button>
                    <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 font-semibold rounded-lg hover:bg-red-200 text-xs">
                        <Trash2 size={14} /> Hapus
                    </button>
                </div>
            </div>

            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">Jadwal Cicilan</h2>
            <div className="space-y-2">
                {Array.from({ length: debt.tenor }, (_, i) => {
                    const installmentNumber = i + 1;
                    const isPaid = installmentNumber <= debt.paidInstallments;
                    const installmentDate = new Date(debt.startDate.toDate());
                    installmentDate.setMonth(installmentDate.getMonth() + i);

                    return (
                        <div key={i} className={`flex justify-between items-center p-3 rounded-lg ${isPaid ? 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800'}`}>
                            <div>
                                <p className="font-semibold text-sm text-slate-800 dark:text-slate-300">Angsuran ke-{installmentNumber}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">{formatDate(installmentDate)}</p>
                            </div>
                            <span className={`font-semibold text-xs px-2.5 py-1 rounded-full ${isPaid ? 'bg-green-200 dark:bg-green-500/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                {isPaid ? 'Lunas' : 'Belum Dibayar'}
                            </span>
                        </div>
                    );
                })}
            </div>
            
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Hutang">
                <EditDebtForm existingDebt={debt} onUpdateDebt={handleUpdate} />
            </Modal>
        </div>
    );
};

const EditDebtForm = ({ existingDebt, onUpdateDebt }) => {
    const [formData, setFormData] = useState({
        name: existingDebt.name, 
        totalAmount: existingDebt.totalAmount,
        monthlyInstallment: existingDebt.monthlyInstallment, 
        tenor: existingDebt.tenor,
        startDate: existingDebt.startDate.toDate().toISOString().split('T')[0],
        dueDate: existingDebt.dueDate,
        paidInstallments: existingDebt.paidInstallments || 0
    });
    const [displayValues, setDisplayValues] = useState({
        totalAmount: formatNumberWithSeparators(existingDebt.totalAmount),
        monthlyInstallment: formatNumberWithSeparators(existingDebt.monthlyInstallment)
    });
    const [loading, setLoading] = useState(false);

    const handleCurrencyChange = (e) => {
        const { name, value } = e.target;
        const rawValue = value.replace(/\D/g, '');
        
        setFormData(prev => ({ ...prev, [name]: rawValue ? parseInt(rawValue, 10) : 0 }));
        setDisplayValues(prev => ({ ...prev, [name]: formatNumberWithSeparators(rawValue) }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        const updatedData = {
            ...formData,
            tenor: parseInt(formData.tenor),
            dueDate: parseInt(formData.dueDate),
            paidInstallments: parseInt(formData.paidInstallments) || 0,
            startDate: Timestamp.fromDate(new Date(formData.startDate)),
        };
        onUpdateDebt(updatedData).finally(() => setLoading(false));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Nama Hutang" className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
            <input name="totalAmount" type="text" inputMode="numeric" value={displayValues.totalAmount} onChange={handleCurrencyChange} placeholder="Jumlah Pinjaman" className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
            <input name="monthlyInstallment" type="text" inputMode="numeric" value={displayValues.monthlyInstallment} onChange={handleCurrencyChange} placeholder="Angsuran per Bulan" className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
            <input name="tenor" type="number" value={formData.tenor} onChange={handleChange} placeholder="Tenor (bulan)" className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
            <input name="paidInstallments" type="number" value={formData.paidInstallments} onChange={handleChange} placeholder="Cicilan Sudah Dibayar" className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" />
            <input name="startDate" type="date" value={formData.startDate} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
            <input name="dueDate" type="number" min="1" max="31" value={formData.dueDate} onChange={handleChange} placeholder="Tanggal Jatuh Tempo" className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg text-sm">
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
        </form>
    );
};


const ProfilePage = ({ user, setView, onUserUpdate }) => {
    const [name, setName] = useState(user.name || '');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleNameUpdate = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        try {
            await setDoc(doc(db, "users", user.uid), { name }, { merge: true });
            onUserUpdate({ ...user, name });
            setIsEditingName(false);
            setMessage({ type: 'success', text: 'Nama berhasil diperbarui.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Gagal memperbarui nama.' });
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        try {
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            setIsChangingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setMessage({ type: 'success', text: 'Password berhasil diganti.' });
        } catch (error) {
            let errorMessage;
            switch (error.code) {
                case 'auth/wrong-password':
                    errorMessage = 'Password saat ini yang Anda masukkan salah.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password baru harus terdiri dari minimal 6 karakter.';
                    break;
                default:
                    errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';
                    console.error(error);
                    break;
            }
            setMessage({ type: 'error', text: errorMessage });
        }
    };

    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-900 min-h-screen">
            <div className="flex items-center mb-6">
                <button onClick={() => setView('home')} className="p-2 mr-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                    <ArrowLeft size={22} className="text-slate-700 dark:text-slate-300" />
                </button>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Profil Pengguna</h1>
            </div>

            {message.text && (
                <div className={`p-3 rounded-lg mb-4 text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md space-y-5">
                <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">Edit Nama</h2>
                    {!isEditingName ? (
                        <div className="flex justify-between items-center">
                            <p className="text-slate-600 dark:text-slate-400 text-sm">{name}</p>
                            <button onClick={() => setIsEditingName(true)} className="text-indigo-600 font-semibold text-sm">Edit</button>
                        </div>
                    ) : (
                        <form onSubmit={handleNameUpdate} className="space-y-3">
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" />
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm">Simpan</button>
                                <button type="button" onClick={() => setIsEditingName(false)} className="flex-1 bg-slate-200 dark:bg-slate-600 py-2 rounded-lg text-sm text-slate-800 dark:text-slate-200">Batal</button>
                            </div>
                        </form>
                    )}
                </div>

                <hr className="dark:border-slate-700"/>

                <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">Ganti Password</h2>
                    {!isChangingPassword ? (
                        <button onClick={() => setIsChangingPassword(true)} className="w-full text-left text-indigo-600 font-semibold text-sm">Ganti Password</button>
                    ) : (
                        <form onSubmit={handlePasswordChange} className="space-y-3">
                            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Password Saat Ini" className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Password Baru" className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200" required />
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm">Ganti</button>
                                <button type="button" onClick={() => setIsChangingPassword(false)} className="flex-1 bg-slate-200 dark:bg-slate-600 py-2 rounded-lg text-sm text-slate-800 dark:text-slate-200">Batal</button>
                            </div>
                        </form>
                    )}
                </div>

                <hr className="dark:border-slate-700"/>

                <button onClick={() => signOut(auth)} className="w-full bg-red-500 text-white font-bold py-2.5 rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-2 text-sm">
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </div>
    );
};


// --- Komponen Utama Aplikasi ---

export default function App() {
    return (
        <ThemeProvider>
            <MainApp />
        </ThemeProvider>
    );
}

function MainApp() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState(window.location.hash.substring(1) || 'home');
    const [selectedDebt, setSelectedDebt] = useState(null);
    
    // Sinkronisasi state 'view' dengan URL hash untuk navigasi browser
    useEffect(() => {
        const currentHash = window.location.hash.substring(1);
        if (view !== currentHash && view) {
            window.history.pushState({ view }, '', `#${view}`);
        } else if (!view && currentHash) {
             window.history.pushState({ view: 'home' }, '', `#home`);
        }
    }, [view]);

    // Listener untuk tombol kembali/maju di browser
    useEffect(() => {
        const handlePopState = (event) => {
            const newView = window.location.hash.substring(1) || 'home';
            setView(newView);
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                if (userDoc.exists()) {
                    setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userDoc.data() });
                } else {
                    const newUser = { uid: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.email.split('@')[0] };
                    await setDoc(doc(db, "users", firebaseUser.uid), newUser);
                    setUser(newUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleUserUpdate = (updatedUser) => setUser(updatedUser);
    const handleDebtUpdate = (updatedDebt) => setSelectedDebt(updatedDebt);

    const renderView = () => {
        switch (view) {
            case 'home': return <HomeScreen user={user} setView={setView} />;
            case 'add': return <AddTransactionPage user={user} setView={setView} />;
            case 'debts': return <DebtPage user={user} setView={setView} setSelectedDebt={setSelectedDebt} />;
            case 'profile': return <ProfilePage user={user} setView={setView} onUserUpdate={handleUserUpdate} />;
            case 'transactions': return <TransactionListPage user={user} setView={setView} />;
            case 'debtDetail': return <DebtDetailPage user={user} debt={selectedDebt} setView={setView} onUpdate={handleDebtUpdate} />;
            default: return <HomeScreen user={user} setView={setView} />;
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-50 dark:bg-slate-900 h-screen flex justify-center items-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!user) {
        return <LoginPage setView={setView} />;
    }

    return (
        <div className="bg-black sm:bg-slate-200 flex justify-center">
            <div className="w-full max-w-sm min-h-screen bg-slate-50 dark:bg-slate-900 font-sans relative">
                <main className="h-full">
                    {renderView()}
                </main>
                
                <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700" style={{borderTopLeftRadius: '24px', borderTopRightRadius: '24px'}}>
                    <div className="flex justify-around items-center h-16 px-2 relative">
                        {/* Navigasi Kiri */}
                        <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-16 ${view === 'home' ? 'text-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500'}`}>
                            <Home size={22} strokeWidth={view === 'home' ? 2.5 : 2}/>
                            <span className="text-xs font-semibold">Home</span>
                        </button>
                        <button onClick={() => setView('transactions')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-16 ${view === 'transactions' ? 'text-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500'}`}>
                            <FileText size={22} strokeWidth={view === 'transactions' ? 2.5 : 2}/>
                            <span className="text-xs font-semibold">Riwayat</span>
                        </button>
                        
                        {/* Placeholder untuk tombol tengah */}
                        <div className="w-14"></div>

                        {/* Navigasi Kanan */}
                        <button onClick={() => setView('debts')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-16 ${['debts', 'debtDetail'].includes(view) ? 'text-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500'}`}>
                            <Landmark size={22} strokeWidth={['debts', 'debtDetail'].includes(view) ? 2.5 : 2}/>
                            <span className="text-xs font-semibold">Hutang</span>
                        </button>
                        <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-16 ${view === 'profile' ? 'text-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500'}`}>
                            <User size={22} strokeWidth={view === 'profile' ? 2.5 : 2}/>
                            <span className="text-xs font-semibold">Profil</span>
                        </button>
                    </div>
                     {/* Tombol Tambah Transaksi di Tengah */}
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                        <button onClick={() => setView('add')} className="bg-indigo-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 active:scale-95">
                            <Plus size={28} />
                        </button>
                    </div>
                </nav>
            </div>
        </div>
    );
}
