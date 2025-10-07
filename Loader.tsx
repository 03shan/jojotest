
import React from 'react';

const Loader = ({ message }: { message: string }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex flex-col items-center justify-center z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-400"></div>
      <p className="mt-4 text-white text-lg font-semibold">{message}</p>
    </div>
  );
};

export default Loader;
