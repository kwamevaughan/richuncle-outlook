# Rich Uncle Outlook - Business Management System

A comprehensive business management system built with Next.js, featuring a modern UI with native app-like experiences.

## 🚀 Features

### Core Functionality
- **Sales Management**: Track sales, orders, and customer data
- **Inventory Management**: Manage products, stock levels, and categories
- **User Management**: Role-based access control and user administration
- **Reporting**: Comprehensive analytics and data export capabilities
- **POS System**: Point of sale functionality with real-time updates

### Enhanced User Experience
- **Native App Feel**: Smooth page transitions and loading states
- **Enhanced Modals**: Beautiful modal animations with backdrop blur effects
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark/Light Mode**: Theme switching with system preference detection
- **Real-time Updates**: Live data synchronization across components

## 🎨 UI/UX Enhancements

### Native App Experience
- **Page Transitions**: Smooth navigation with progress bars
- **Loading States**: Skeleton loaders, spinners, and overlays
- **Enhanced Modals**: Smooth open/close animations with glass morphism
- **Progress Indicators**: Top progress bars for navigation feedback

### Modal System
All modals feature smooth opening and closing transitions:
- **SimpleModal**: Enhanced with native app-like animations
- **ExportModal**: Smooth transitions for data export dialogs
- **AddEditModal**: Automatic enhancement through SimpleModal
- **EnhancedModal**: Advanced modal component with additional features

## 🛠️ Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📚 Documentation

- **[Native App Enhancement Guide](NATIVE_APP_ENHANCEMENTS.md)** - Complete guide to the native app features
- **[Enhanced Modal System](ENHANCED_MODAL_SYSTEM.md)** - Detailed documentation for the modal system
- **[GenericTable Enhancement](README.md#generictable-enhancement)** - Status pill automation guide

## 🎯 Key Components

### Enhanced Modal System
```javascript
// Basic usage with enhanced transitions
<SimpleModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="My Modal"
  animationDuration={300}
>
  {/* Modal content */}
</SimpleModal>

// Advanced usage with EnhancedModal
<EnhancedModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Advanced Modal"
  backdropBlur={true}
  hasUnsavedChanges={false}
>
  {/* Modal content */}
</EnhancedModal>
```

### Native App Features
```javascript
// Page transitions with dynamic loading text
<PageTransition
  color="blue"
  showProgressBar={true}
  transitionDuration={300}
  showLoadingText={true}
>
  {/* Page content - automatically shows "Loading [PageName]..." */}
</PageTransition>

// Loading states
<LoadingOverlay
  isVisible={isLoading}
  text="Loading data..."
  backdrop={true}
/>
```

## 🔧 Technical Stack

- **Framework**: Next.js with React
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Hooks and Context API
- **Database**: Supabase for backend services
- **Charts**: Chart.js for data visualization
- **Icons**: Iconify for comprehensive icon library

## 🌟 Recent Enhancements

### Modal System (Latest)
- ✅ Smooth open/close animations
- ✅ Enhanced backdrop blur effects
- ✅ Improved scroll position management
- ✅ Better visual feedback on interactions
- ✅ Animated background elements
- ✅ Glass morphism design

### Native App Features
- ✅ Page transition animations with dynamic loading text
- ✅ Top progress bars
- ✅ Enhanced loading states
- ✅ Smooth navigation feedback
- ✅ Backdrop blur effects
- ✅ Automatic page name detection from navigation

### GenericTable Enhancement
- ✅ Automatic status pill rendering
- ✅ Support for "N/A" status values
- ✅ Customizable status contexts
- ✅ Enhanced reusability

## 📱 Browser Support

- **Modern Browsers**: Full support for all features
- **Backdrop Filter**: Chrome 76+, Safari 9+, Firefox 103+
- **CSS Transforms**: Widely supported across all modern browsers
- **Fallbacks**: Graceful degradation for older browsers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
