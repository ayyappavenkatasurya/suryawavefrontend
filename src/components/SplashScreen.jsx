import React from 'react';
import { motion } from 'framer-motion';

export const SplashScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
    >
      {/* Logo Animation */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative"
      >
        <img 
          src="/logo.png" 
          alt="Surya Wave" 
          className="w-24 h-24 md:w-32 md:h-32 object-contain" 
        />
        
        {/* Pulse Effect behind logo */}
        <motion.div
          className="absolute inset-0 bg-blue-100 rounded-full -z-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            repeatType: "loop" 
          }}
        />
      </motion.div>

      {/* Text Animation */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-6 text-center"
      >
        <h1 className="text-3xl font-bold text-google-blue">
          Surya<span className="text-gray-800">wave</span>
        </h1>
        <p className="text-sm text-gray-500 mt-2 font-medium tracking-wide">
          Quality Digital Services
        </p>
      </motion.div>

      {/* Loading Bar (Optional) */}
      <motion.div 
        className="absolute bottom-20 w-48 h-1 bg-gray-100 rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.div 
          className="h-full bg-google-blue"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
};