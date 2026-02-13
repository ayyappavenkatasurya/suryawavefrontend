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
    <div className={twMerge("relative overflow-hidden bg-white", containerClassName, className)}>
      {/* Placeholder / Blur Effect */}
      <div 
        className={clsx(
          "absolute inset-0 flex items-center justify-center bg-white transition-opacity duration-700",
          loaded ? "opacity-0" : "opacity-100"
        )}
      >
        {/* Removed bg-gray-300 to remove the grey box effect */}
        {!error && <div className="w-full h-full animate-pulse bg-gray-50" />}
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
          // Changed blur logic to prevent hard edges during transition
          loaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-sm",
          className
        )}
        {...props}
      />
    </div>
  );
};