import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { supabase } from './services/supabase';

// Pages (to be created)
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Dashboard from './pages/Dashboard';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-primary-500/30">
        <Routes>
          <Route path="/" element={session ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          <Route path="/login" element={<div className="flex items-center justify-center min-h-screen">Login Page Placeholder</div>} />
          <Route path="/register" element={<div className="flex items-center justify-center min-h-screen">Register Page Placeholder</div>} />
          <Route path="/dashboard" element={session ? <div className="p-8">Dashboard Placeholder</div> : <Navigate to="/login" />} />
        </Routes>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
