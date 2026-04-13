// src/components/ErrorBoundary.jsx
// Catches render errors so a single broken component never blanks the whole site
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '28px 20px',
          background: 'rgba(240,64,96,.06)',
          border: '1px solid rgba(240,64,96,.25)',
          borderRadius: 16,
          margin: '20px 0',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
          <div style={{
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 700,
            fontSize: 16,
            color: 'var(--red)',
            marginBottom: 8,
          }}>
            Something went wrong
          </div>
          <div style={{ color: 'var(--t3)', fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: 'rgba(16,217,126,.1)',
              border: '1px solid rgba(16,217,126,.3)',
              borderRadius: 10,
              padding: '8px 20px',
              color: 'var(--grn)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ↻ Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
