import { Component } from 'react';
import styles from './ErrorBoundary.module.css';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary] Uncaught render error:', error);
        console.error('[ErrorBoundary] Component stack:', info.componentStack);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className={styles.wrapper}>
                    <div className={styles.card}>
                        <h1 className={styles.title}>Something went wrong</h1>
                        <p className={styles.subtitle}>
                            A rendering error occurred. Check the browser console for the full
                            stack trace.
                        </p>
                        <pre className={styles.message}>
                            {this.state.error?.message || 'Unknown error'}
                        </pre>
                        <button className={styles.reloadBtn} onClick={this.handleReload}>
                            Reload page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
