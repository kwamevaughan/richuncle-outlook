import React from 'react';
import { componentClasses } from '@/utils/darkMode';

const DarkModeWrapper = ({ 
  children, 
  className = "", 
  type = "div",
  ...props 
}) => {
  const Component = type;
  
  return (
    <Component 
      className={`${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

// Pre-configured components
export const DarkModeCard = ({ children, className = "", ...props }) => (
  <DarkModeWrapper 
    className={`${componentClasses.card} ${className}`}
    {...props}
  >
    {children}
  </DarkModeWrapper>
);

export const DarkModeInput = ({ className = "", ...props }) => (
  <input 
    className={`${componentClasses.formInput} ${className}`}
    {...props}
  />
);

export const DarkModeSelect = ({ children, className = "", ...props }) => (
  <select 
    className={`${componentClasses.formSelect} ${className}`}
    {...props}
  >
    {children}
  </select>
);

export const DarkModeLabel = ({ children, className = "", ...props }) => (
  <label 
    className={`${componentClasses.formLabel} ${className}`}
    {...props}
  >
    {children}
  </label>
);

export const DarkModeButton = ({ 
  children, 
  variant = "primary", 
  className = "", 
  ...props 
}) => (
  <button 
    className={`${componentClasses.button[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default DarkModeWrapper; 