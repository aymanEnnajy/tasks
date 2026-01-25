import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';
import { TaskHoverProvider } from './context/TaskHoverContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyTasks from './pages/MyTasks';
import Analytics from './pages/Analytics';
import Schedule from './pages/Schedule';
import Account from './pages/Account';
import Articles from './pages/Articles';
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 shadow-[0_0_20px_rgba(14,165,233,0.3)]"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    return children;
};

function App() {
    return (
        <AuthProvider>
            <SearchProvider>
                <TaskHoverProvider>
                    <Router>
                        <div className="h-screen bg-slate-900 text-slate-100 selection:bg-primary-500/30 font-sans antialiased flex flex-col">
                            <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/dashboard" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <Dashboard />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/tasks" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <MyTasks />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/analytics" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <Analytics />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/schedule" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <Schedule />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/account" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <Account />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/articles" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <Articles />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/" element={<Navigate to="/dashboard" />} />
                        </Routes>

                        <Toaster
                            position="bottom-right"
                            toastOptions={{
                                duration: 4000,
                                className: 'glass border-white/5',
                                style: {
                                    background: 'rgba(30, 41, 59, 0.95)',
                                    color: '#f1f5f9',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '16px',
                                    padding: '12px 20px',
                                },
                            }}
                        />
                    </div>
                </Router>
                </TaskHoverProvider>
            </SearchProvider>
        </AuthProvider>
    );
}

export default App;
