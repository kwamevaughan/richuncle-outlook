import React from 'react';

// Global dark mode wrapper that automatically applies dark mode classes
const GlobalDarkMode = ({ children, className = "", ...props }) => {
  return (
    <div 
      className={`dark-mode-wrapper ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Higher-order component to wrap any component with dark mode
export const withDarkMode = (Component) => {
  return (props) => (
    <GlobalDarkMode>
      <Component {...props} />
    </GlobalDarkMode>
  );
};

// Auto-apply dark mode to common HTML elements
export const DarkModeProvider = ({ children }) => {
  React.useEffect(() => {
    // Auto-apply dark mode classes to common elements
    const applyDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      
      if (isDark) {
        // Auto-apply dark mode to inputs, buttons, etc.
        document.querySelectorAll('input, select, textarea').forEach(el => {
          if (!el.classList.contains('dark-mode-applied')) {
            el.classList.add('dark-mode-applied');
          }
        });
        
        // Auto-apply to buttons
        document.querySelectorAll('button').forEach(el => {
          if (!el.classList.contains('dark-mode-applied')) {
            el.classList.add('dark-mode-applied');
          }
        });
      }
    };

    // Apply on mount and when dark mode changes
    applyDarkMode();
    
    // Watch for dark mode changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          applyDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
};

export default GlobalDarkMode; 