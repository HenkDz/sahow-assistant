import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  feature?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isOffline: boolean;
}

export class OfflineErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isOffline: !navigator.onLine
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isOffline: !navigator.onLine
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('OfflineErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidMount() {
    const handleOnline = () => {
      this.setState({ isOffline: false });
    };

    const handleOffline = () => {
      this.setState({ isOffline: true });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Store cleanup function
    this.cleanup = () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  componentWillUnmount() {
    if (this.cleanup) {
      this.cleanup();
    }
  }

  private cleanup?: () => void;

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { feature = 'feature' } = this.props;
      const { error, isOffline } = this.state;

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  {isOffline ? 'Offline Error' : 'Something went wrong'}
                </h2>
                
                <p className="text-sm text-gray-600 mb-4">
                  {isOffline 
                    ? `The ${feature} feature encountered an error while offline. Please check your connection and try again.`
                    : `The ${feature} feature is temporarily unavailable.`
                  }
                </p>

                {error && (
                  <details className="text-left mb-4">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      Error details
                    </summary>
                    <pre className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded overflow-auto">
                      {error.message}
                    </pre>
                  </details>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={this.handleRetry}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    Refresh App
                  </button>
                </div>

                {isOffline && (
                  <p className="text-xs text-gray-500 mt-4">
                    Some features may be limited while offline. Connect to the internet for full functionality.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default OfflineErrorBoundary;
