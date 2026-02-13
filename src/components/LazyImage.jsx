// frontend/src/components/LazyImage.jsx

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const LazyImage = ({ src, alt, className, containerClassName, ...props }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    // ✅ FIXED: Changed bg-white to bg-transparent to remove the visible box background
    <div className={twMerge("relative overflow-hidden bg-transparent", containerClassName, className)}>
      {/* Placeholder / Blur Effect - Only visible while loading */}
      <div 
        className={clsx(
          "absolute inset-0 flex items-center justify-center bg-gray-50 transition-opacity duration-700",
          loaded ? "opacity-0" : "opacity-100"
        )}
      >
        {!error && <div className="w-full h-full animate-pulse" />}
        {error && <FontAwesomeIcon icon={faImage} className="text-gray-200 text-2xl" />}
      </div>

      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={twMerge(
          "w-full h-full object-cover transition-all duration-700 ease-in-out",
          loaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-sm",
          className
        )}
        {...props}
      />
    </div>
  );
};