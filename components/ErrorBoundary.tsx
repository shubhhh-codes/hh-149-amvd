import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
    errorInfo: undefined,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Optional: Send error to tracking service
    // this.logErrorToService(error, errorInfo);
  }

  // Optional method to log errors to a service
  // private logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
  //   // Implement error tracking/logging
  // }

  private renderErrorDetails() {
    const { error, errorInfo } = this.state;
    
    if (!error) return null;

    return (
      <details 
        className="mt-4 p-3 bg-gray-100 rounded-md text-xs text-gray-700 max-h-48 overflow-auto"
      >
        <summary className="cursor-pointer font-semibold">
          Technical Details
        </summary>
        <div className="mt-2">
          <p><strong>Error:</strong> {error.toString()}</p>
          {errorInfo && (
            <pre className="whitespace-pre-wrap break-words">
              {errorInfo.componentStack}
            </pre>
          )}
        </div>
      </details>
    );
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20 
            }}
            className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border border-purple-100"
          >
            <div className="text-center mb-6">
              <AlertTriangle 
                size={80} 
                className="mx-auto text-red-500 mb-4"
                strokeWidth={1.5}
              />
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Unexpected Error
              </h1>
              <p className="text-gray-600 leading-relaxed">
                We encountered an issue while rendering this page. 
                Don't worry, this isn't your fault.
              </p>
            </div>

            {this.renderErrorDetails()}

            <div className="space-y-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                <RefreshCw size={18} />
                Reload Page
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/'}
                className="w-full flex items-center justify-center gap-2 border border-purple-600 text-purple-600 py-3 px-4 rounded-lg hover:bg-purple-50 transition-colors duration-200"
              >
                <Home size={18} />
                Return Home
              </motion.button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-4">
              If the problem persists, please contact support.
            </p>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;