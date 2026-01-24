import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
                setUser(session?.user ?? null);
                if (session?.user) {
                    fetchUserRole(session.user.email);
                }
            } catch (err) {
                console.error("Supabase connection error:", err);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserRole(session.user.email);
            } else {
                setRole(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserRole = async (email) => {
        try {
            const { data } = await supabase.from('users').select('role').eq('email', email).single();
            if (data) setRole(data.role);
            else setRole('USER');
        } catch (err) {
            setRole('USER');
        }
    };

    const register = async (email, password, metadata) => {
        return await supabase.auth.signUp({ email, password, options: { data: metadata } });
    };

    const login = async (email, password) => {
        return await supabase.auth.signInWithPassword({ email, password });
    };

    const logout = async () => {
        return await supabase.auth.signOut();
    };

    const value = {
        signUp: register,
        signIn: login,
        signOut: logout,
        user,
        role,
        loading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};
