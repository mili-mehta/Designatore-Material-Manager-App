import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
       const isConfigError = this.state.error?.message.includes("FATAL ERROR: Supabase keys are not configured");

      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center">
            <h1 className="text-2xl font-bold text-red-700">Application Error</h1>
            <p className="mt-2 text-gray-600">Something went wrong, and the application could not start.</p>
            
            {isConfigError ? (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left text-sm text-yellow-800">
                    <h2 className="font-bold mb-2">Configuration Issue Detected</h2>
                    <p className="mb-2">The application cannot find its connection keys for the database. This is the final step to get your app running!</p>
                    <p className="font-semibold">Please follow these steps carefully:</p>
                    <ol className="list-decimal list-inside space-y-2 mt-2">
                        <li>In the file explorer on the left, find and open the file named <code className="bg-yellow-200 p-1 rounded">config.ts</code>.</li>
                        <li>You will see placeholder text inside this file.</li>
                        <li>Replace the placeholder text with your actual keys from your Supabase project dashboard (under Settings &gt; API).</li>
                    </ol>
                    <pre className="mt-3 p-3 bg-gray-800 text-white rounded-md text-xs whitespace-pre-wrap">
                        {`// BEFORE:\nexport const SUPABASE_CONFIG = {\n  url: "YOUR_SUPABASE_URL_HERE",\n  anonKey: "YOUR_SUPABASE_ANON_KEY_HERE"\n};` +
                         `\n\n// AFTER (EXAMPLE):\nexport const SUPABASE_CONFIG = {\n  url: "https://xyz.supabase.co",\n  anonKey: "ey..."\n};`}
                    </pre>
                     <p className="mt-3">After saving the <code className="bg-yellow-200 p-1 rounded">config.ts</code> file, you must <strong className="font-bold">refresh the entire page</strong> to apply the changes.</p>
                </div>
            ) : (
                 <div className="mt-4 p-3 bg-gray-100 rounded-md text-left text-xs text-gray-700 whitespace-pre-wrap">
                    <p className="font-semibold">Error Details:</p>
                    <code>{this.state.error?.stack || this.state.error?.message}</code>
                </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
