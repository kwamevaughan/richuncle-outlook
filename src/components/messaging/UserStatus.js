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
    xs: "w-2 h-2",
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
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
          className={`${sizeClasses[size]} rounded-full ${
            isOnline 
              ? 'bg-green-500' 
              : 'bg-gray-400'
          }`}
          title={isOnline ? 'Online' : `Last seen: ${formatLastSeen ? formatLastSeen(lastSeen) : 'Unknown'}`}
        />
        {isOnline && (
          <div 
            className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-green-500 animate-ping opacity-75`}
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