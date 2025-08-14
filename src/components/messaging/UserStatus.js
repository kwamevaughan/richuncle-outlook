export default function UserStatus({ 
  userId, 
  isOnline, 
  lastSeen, 
  formatLastSeen, 
  size = "sm",
  showText = false,
  className = ""
}) {
  const sizeClasses = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3"
  };

  const textSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative">
        <div 
          className={`${sizeClasses[size]} rounded-full border border-white shadow-sm ${
            isOnline 
              ? 'bg-green-500' 
              : 'bg-gray-400'
          }`}
          title={isOnline ? 'Online' : `Last seen: ${formatLastSeen ? formatLastSeen(lastSeen) : 'Unknown'}`}
        />
        {isOnline && (
          <div 
            className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-green-500 animate-ping opacity-75`}
            style={{ animationDuration: '2s' }}
          />
        )}
      </div>
      
      {showText && (
        <span className={`ml-2 ${textSizeClasses[size]} ${
          isOnline ? 'text-green-600' : 'text-gray-500'
        }`}>
          {isOnline ? 'Online' : (formatLastSeen ? formatLastSeen(lastSeen) : 'Offline')}
        </span>
      )}
    </div>
  );
}