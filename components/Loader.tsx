
import React, { useState, useEffect } from 'react';

const Loader = () => {
  const [showLongerMessage, setShowLongerMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLongerMessage(true);
    }, 5000); // Show message after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 text-center">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-600"></div>
      <p className="text-gray-600 font-medium">Analyzing Materials...</p>
      {showLongerMessage && (
        <p className="text-sm text-gray-500 max-w-sm">
          This can take a moment, especially for complex requests. We appreciate your patience!
        </p>
      )}
    </div>
  );
};

export default Loader;