import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const LoadingSpinner = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 30);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 via-white to-indigo-100">
      <div className="p-6 rounded-3xl shadow-xl backdrop-blur-md bg-white/40 border border-white/30 flex flex-col items-center gap-4">
        {/* Circular Spinner */}
        <div className="relative w-20 h-20">
          <svg className="absolute w-full h-full" viewBox="0 0 36 36">
            <path
              className="text-blue-200"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <motion.path
              className="text-blue-500"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: progress / 100 }}
              transition={{ duration: 0.3 }}
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-semibold text-blue-900">
            {progress}%
          </div>
        </div>

        <p className="text-blue-900 font-semibold text-lg animate-pulse tracking-wide">
          Loading...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
