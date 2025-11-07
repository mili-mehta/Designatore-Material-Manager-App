
import React from 'react';

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-600"></div>
      <p className="text-gray-600 font-medium">Analyzing Materials...</p>
    </div>
  );
};

export default Loader;
