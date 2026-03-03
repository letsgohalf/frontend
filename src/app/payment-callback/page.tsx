'use client';

import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

export default function PaymentCallbackPage() {
  useEffect(() => {
    // Try to close the tab automatically after a short delay
    const timer = setTimeout(() => {
      window.close();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Payment Received
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          You can close this tab and return to LetsGoHalf.
        </p>
      </div>
    </div>
  );
}
