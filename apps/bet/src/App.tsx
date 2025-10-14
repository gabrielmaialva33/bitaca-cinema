import { useState, useEffect, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth';
import CoinWallet from './components/CoinWallet';
import DailyBonus from './components/DailyBonus';
import BettingInterface from './components/BettingInterface';
import AgeGate from './components/AgeGate';
import HorrorBackground3D from './components/HorrorBackground3D';

// Firebase config (same as Play app)
const firebaseConfig = {
  apiKey: "AIzaSyBSkRy1LyKbBXvyvoOCZx5t0bIDldTityk",
  authDomain: "abitaca-8451c.firebaseapp.com",
  projectId: "abitaca-8451c",
  storageBucket: "abitaca-8451c.firebasestorage.app",
  messagingSenderId: "31455523643",
  appId: "1:31455523643:web:3f8590a2e5181ee9ef3d1e",
  measurementId: "G-3RHX80J2V7"
};

// Initialize Firebase
let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ageVerified, setAgeVerified] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Check age verification from localStorage
    const verified = localStorage.getItem('bet_age_verified');
    if (verified === 'true') {
      setAgeVerified(true);
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Show login if not authenticated
      if (!currentUser && verified === 'true') {
        setShowLogin(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAgeConfirm = () => {
    localStorage.setItem('bet_age_verified', 'true');
    setAgeVerified(true);
    setShowLogin(true);
  };

  const handleGoogleSignIn = async () => {
    if (!auth) {
      alert('Firebase não inicializado corretamente. Por favor, recarregue a página.');
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Check if email is Gmail
      if (!result.user.email?.endsWith('@gmail.com')) {
        alert('⚠️ Apenas contas Gmail são permitidas!');
        await auth.signOut();
        return;
      }
      setShowLogin(false);
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      alert('Erro ao fazer login com Google. Tente novamente.');
    }
  };

  // Show age gate first
  if (!ageVerified) {
    return <AgeGate onConfirm={handleAgeConfirm} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show Google login if not authenticated
  if (showLogin || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark p-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">🎲 Bitaca Bet</h1>
            <p className="text-gray-400">Entre com sua conta Google</p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Entrar com Google</span>
          </button>

          <p className="text-xs text-gray-500 text-center mt-6">
            ⚠️ Apenas contas @gmail.com são aceitas
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-dark text-white relative">
        {/* 3D Horror Background */}
        <Suspense fallback={null}>
          <HorrorBackground3D />
        </Suspense>

        {/* Header */}
        <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-primary">🎲 Bitaca Bet</h1>
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">{user.email}</span>
                <a href="/play.html" className="btn-secondary text-sm">
                  ← Voltar ao Play
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Wallet Section */}
            <div className="lg:col-span-1">
              <CoinWallet userId={user.uid} />
            </div>

            {/* Daily Bonus Section */}
            <div className="lg:col-span-2">
              <DailyBonus userId={user.uid} />
            </div>
          </div>

          {/* Betting Interface */}
          <BettingInterface userId={user.uid} />
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 mt-12">
          <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
            <p>© 2025 Bitaca Bet | Underground, Visceral, Democrático</p>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
