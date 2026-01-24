import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

const SESSION_KEY = 'daily_task_session';
const SESSION_EXPIRY_DAYS = 20;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);
    const [dbUserId, setDbUserId] = useState(null);

    useEffect(() => {
        const initAuth = () => {
            const savedSession = localStorage.getItem(SESSION_KEY);
            if (savedSession) {
                try {
                    const { user: savedUser, role: savedRole, dbUserId: savedId, expiry } = JSON.parse(savedSession);

                    // Check if session is expired
                    if (new Date().getTime() < expiry) {
                        setUser(savedUser);
                        setRole(savedRole);
                        setDbUserId(savedId);
                    } else {
                        localStorage.removeItem(SESSION_KEY);
                    }
                } catch (err) {
                    console.error("Session restoration failed:", err);
                    localStorage.removeItem(SESSION_KEY);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const saveSession = (userData, roleData, idData) => {
        const expiry = new Date().getTime() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        const sessionData = {
            user: userData,
            role: roleData,
            dbUserId: idData,
            expiry
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        setUser(userData);
        setRole(roleData);
        setDbUserId(idData);
    };

    const register = async (email, password, metadata) => {
        try {
            // 1. Check if user already exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (existingUser) {
                return { data: null, error: { message: 'Email already registered.' } };
            }

            // 2. Insert new user directly into the users table
            const { data: newUser, error } = await supabase
                .from('users')
                .insert({
                    email,
                    username: metadata.username || email.split('@')[0],
                    password_hash: password, // As requested, direct storage to bypass auth limits
                    role: 'USER'
                })
                .select()
                .single();

            if (error) throw error;

            if (newUser) {
                saveSession({ email: newUser.email, user_metadata: { username: newUser.username } }, newUser.role, newUser.id);
                return { data: { user: newUser }, error: null };
            }
        } catch (err) {
            console.error("Registration error:", err);
            return { data: null, error: err };
        }
    };

    const login = async (email, password) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('password_hash', password)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                saveSession({ email: data.email, user_metadata: { username: data.username } }, data.role, data.id);
                return { data: { user: data }, error: null };
            } else {
                return { data: null, error: { message: 'Invalid email or password.' } };
            }
        } catch (err) {
            console.error("Login error:", err);
            return { data: null, error: err };
        }
    };

    const logout = async () => {
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
        setRole(null);
        setDbUserId(null);
    };

    const updateUserMetadata = (metadata) => {
        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession) {
            const sessionData = JSON.parse(savedSession);
            sessionData.user.user_metadata = { ...sessionData.user.user_metadata, ...metadata };
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
            setUser({ ...user, user_metadata: sessionData.user.user_metadata });
        }
    };

    const value = {
        signUp: register,
        signIn: login,
        signOut: logout,
        updateUserMetadata,
        user,
        dbUserId,
        role,
        loading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};
