import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Login.module.css';

const loginSchema = z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
    fullName: z.string().min(2, 'Name is required'),
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Honor the redirect destination set by <ProtectedRoute>
    const redirectTo = new URLSearchParams(location.search).get('redirect') || '/';
    const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/';

    const loginForm = useForm({
        resolver: zodResolver(loginSchema),
    });

    const signupForm = useForm({
        resolver: zodResolver(signupSchema),
    });

    const activeForm = isLogin ? loginForm : signupForm;
    const activeErrors = activeForm.formState.errors;

    async function handleLogin(data) {
        setError('');
        setSubmitting(true);
        try {
            const { error: err } = await signIn(data.email, data.password);
            if (err) throw err;
            navigate(safeRedirect, { replace: true });
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleSignup(data) {
        setError('');
        setSuccess('');
        setSubmitting(true);
        try {
            const { error: err } = await signUp(data.email, data.password, {
                full_name: data.fullName,
            });
            if (err) throw err;
            setSuccess('Account created! Check your email for verification.');
        } catch (err) {
            setError(err.message || 'Signup failed');
        } finally {
            setSubmitting(false);
        }
    }

    function switchTab(login) {
        setError('');
        setSuccess('');
        setIsLogin(login);
    }

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logo}>
                        JERSEY<span className={styles.logoAccent}>STORE</span>
                    </div>
                    <p className={styles.subtitle}>
                        {isLogin ? 'Welcome back' : 'Create your account'}
                    </p>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${isLogin ? styles.active : ''}`}
                        onClick={() => switchTab(true)}
                    >
                        Sign In
                    </button>
                    <button
                        className={`${styles.tab} ${!isLogin ? styles.active : ''}`}
                        onClick={() => switchTab(false)}
                    >
                        Sign Up
                    </button>
                </div>

                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}

                {isLogin ? (
                    <form
                        className={styles.form}
                        onSubmit={loginForm.handleSubmit(handleLogin)}
                    >
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                {...loginForm.register('email')}
                                type="email"
                                className={`form-input ${activeErrors.email ? 'form-input--error' : ''}`}
                                placeholder="you@example.com"
                            />
                            {activeErrors.email && (
                                <span className="form-error">{activeErrors.email.message}</span>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                {...loginForm.register('password')}
                                type="password"
                                className={`form-input ${activeErrors.password ? 'form-input--error' : ''}`}
                                placeholder="••••••••"
                            />
                            {activeErrors.password && (
                                <span className="form-error">{activeErrors.password.message}</span>
                            )}
                        </div>
                        <button type="submit" className={styles.submitBtn} disabled={submitting}>
                            {submitting ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                ) : (
                    <form
                        className={styles.form}
                        onSubmit={signupForm.handleSubmit(handleSignup)}
                    >
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                {...signupForm.register('fullName')}
                                className={`form-input ${activeErrors.fullName ? 'form-input--error' : ''}`}
                                placeholder="John Doe"
                            />
                            {activeErrors.fullName && (
                                <span className="form-error">{activeErrors.fullName.message}</span>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                {...signupForm.register('email')}
                                type="email"
                                className={`form-input ${activeErrors.email ? 'form-input--error' : ''}`}
                                placeholder="you@example.com"
                            />
                            {activeErrors.email && (
                                <span className="form-error">{activeErrors.email.message}</span>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                {...signupForm.register('password')}
                                type="password"
                                className={`form-input ${activeErrors.password ? 'form-input--error' : ''}`}
                                placeholder="••••••••"
                            />
                            {activeErrors.password && (
                                <span className="form-error">{activeErrors.password.message}</span>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input
                                {...signupForm.register('confirmPassword')}
                                type="password"
                                className={`form-input ${activeErrors.confirmPassword ? 'form-input--error' : ''}`}
                                placeholder="••••••••"
                            />
                            {activeErrors.confirmPassword && (
                                <span className="form-error">{activeErrors.confirmPassword.message}</span>
                            )}
                        </div>
                        <button type="submit" className={styles.submitBtn} disabled={submitting}>
                            {submitting ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
