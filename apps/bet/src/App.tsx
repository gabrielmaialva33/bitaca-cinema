import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth';
import CoinWallet from './components/CoinWallet';
import DailyBonus from './components/DailyBonus';
import BettingInterface from './components/BettingInterface';
import AgeGate from './components/AgeGate';

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Redirect to login if not authenticated
      if (!currentUser) {
        window.location.href = '/login.html?redirect=/bet';
      }
    });

    return () => unsubscribe();
  }, []);

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

  if (!user) {
    return null; // Will redirect
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-dark text-white">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
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
