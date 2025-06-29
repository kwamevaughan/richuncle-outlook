import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    const now = Date.now();
    const timeSinceLastError = now - this.state.lastErrorTime;
    
    // Check if it's a DOM manipulation error
    if (error.message && (
      error.message.includes('insertBefore') || 
      error.message.includes('Node') ||
      error.message.includes('child of this node')
    )) {
      console.warn('DOM manipulation error detected, attempting recovery...');
      
      // If we've had multiple errors in a short time, force a page refresh
      if (this.state.errorCount > 2 && timeSinceLastError < 5000) {
        console.warn('Multiple DOM errors detected, forcing page refresh...');
        if (typeof window !== 'undefined') {
          window.location.reload();
          return;
        }
      }
      
      // Otherwise, try to recover by forcing a re-render
      setTimeout(() => {
        this.setState(prevState => ({
          hasError: false, 
          error: null,
          errorCount: prevState.errorCount + 1,
          lastErrorTime: now
        }));
      }, 100);
    } else {
      // For other errors, increment the count but don't auto-recover
      this.setState(prevState => ({
        errorCount: prevState.errorCount + 1,
        lastErrorTime: now
      }));
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // Reset error count if component has been stable for a while
    if (this.state.lastErrorTime && Date.now() - this.state.lastErrorTime > 30000) {
      this.setState({ errorCount: 0 });
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">
            We encountered an error while loading this content.
          </p>
          <button
            onClick={() => {
              this.setState({ 
                hasError: false, 
                error: null,
                errorCount: 0,
                lastErrorTime: 0
              });
              // Force a page refresh if needed
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 