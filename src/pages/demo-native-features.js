 import React, { useState } from "react";
 import MainLayout from "@/layouts/MainLayout";
 import TopProgressBar from "@/components/TopProgressBar";
 import PageTransition from "@/components/PageTransition";
 import {
   Skeleton,
   CardSkeleton,
   TableSkeleton,
   Spinner,
   PulseDots,
   Shimmer,
   ContentLoader,
   LoadingOverlay,
 } from "@/components/LoadingStates";

 export default function DemoNativeFeatures() {
   const [showProgress, setShowProgress] = useState(false);
   const [progressValue, setProgressValue] = useState(0);
   const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
   const [selectedColor, setSelectedColor] = useState("blue");

   const colors = [
     "blue",
     "green",
     "red",
     "yellow",
     "purple",
     "indigo",
     "pink",
     "gray",
   ];

   const simulateProgress = () => {
     setShowProgress(true);
     setProgressValue(0);

     const interval = setInterval(() => {
       setProgressValue((prev) => {
         if (prev >= 100) {
           clearInterval(interval);
           setTimeout(() => setShowProgress(false), 500);
           return 100;
         }
         return prev + Math.random() * 15;
       });
     }, 100);
   };

   return (
     <MainLayout showProgressBar={true} progressColor={selectedColor}>
       <div className="max-w-6xl mx-auto p-6">
         <div className="mb-8">
           <h1 className="text-3xl font-bold text-gray-900 mb-4">
             🚀 Native App Features Demo
           </h1>
           <p className="text-gray-600 text-lg">
             Experience the enhanced native app feel with smooth transitions,
             progress bars, and loading states.
           </p>
         </div>

         {/* Color Selector */}
         <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200">
           <h2 className="text-xl font-semibold mb-4">
             🎨 Progress Bar Colors
           </h2>
           <div className="flex flex-wrap gap-3">
             {colors.map((color) => (
               <button
                 key={color}
                 onClick={() => setSelectedColor(color)}
                 className={`px-4 py-2 rounded-lg font-medium transition-all ${
                   selectedColor === color
                     ? `bg-${color}-500 text-white shadow-lg`
                     : `bg-${color}-100 text-${color}-700 hover:bg-${color}-200`
                 }`}
               >
                 {color.charAt(0).toUpperCase() + color.slice(1)}
               </button>
             ))}
           </div>
         </div>

         {/* Top Progress Bar Demo */}
         <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200">
           <h2 className="text-xl font-semibold mb-4">📊 Top Progress Bar</h2>
           <div className="space-y-4">
             <button
               onClick={simulateProgress}
               className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
             >
               Simulate Progress
             </button>

             {showProgress && (
               <div className="p-4 bg-gray-50 rounded-lg">
                 <p className="text-sm text-gray-600 mb-2">
                   Progress: {Math.round(progressValue)}%
                 </p>
                 <TopProgressBar
                   isLoading={showProgress}
                   progress={progressValue}
                   color={selectedColor}
                   height="4px"
                   showSpinner={true}
                   autoComplete={false}
                 />
               </div>
             )}
           </div>
         </div>

         {/* Loading States Demo */}
         <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200">
           <h2 className="text-xl font-semibold mb-4">⏳ Loading States</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {/* Spinner */}
             <div className="text-center p-4 border border-gray-200 rounded-lg">
               <h3 className="font-medium mb-3">Spinner</h3>
               <Spinner size="lg" text="Loading..." color={selectedColor} />
             </div>

             {/* Pulse Dots */}
             <div className="text-center p-4 border border-gray-200 rounded-lg">
               <h3 className="font-medium mb-3">Pulse Dots</h3>
               <PulseDots />
             </div>

             {/* Shimmer */}
             <div className="text-center p-4 border border-gray-200 rounded-lg">
               <h3 className="font-medium mb-3">Shimmer</h3>
               <Shimmer width="w-32" height="h-4" />
             </div>
           </div>
         </div>

         {/* Skeleton Loading Demo */}
         <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200">
           <h2 className="text-xl font-semibold mb-4">🦴 Skeleton Loading</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Text Skeleton */}
             <div>
               <h3 className="font-medium mb-3">Text Skeleton</h3>
               <Skeleton lines={4} height="h-4" />
             </div>

             {/* Card Skeleton */}
             <div>
               <h3 className="font-medium mb-3">Card Skeleton</h3>
               <CardSkeleton />
             </div>
           </div>

           {/* Table Skeleton */}
           <div className="mt-6">
             <h3 className="font-medium mb-3">Table Skeleton</h3>
             <TableSkeleton rows={3} columns={4} />
           </div>
         </div>

         {/* Content Loader Demo */}
         <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200">
           <h2 className="text-xl font-semibold mb-4">📦 Content Loader</h2>
           <div className="space-y-4">
             <div className="flex gap-4">
               <button
                 onClick={() => setShowLoadingOverlay(true)}
                 className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
               >
                 Show Loading Overlay
               </button>
               <button
                 onClick={() => setShowLoadingOverlay(false)}
                 className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
               >
                 Hide Loading Overlay
               </button>
             </div>

             <ContentLoader
               type="card"
               count={2}
               className="max-w-md"
               showHeader={true}
             />
           </div>
         </div>

         {/* Page Transition Demo */}
         <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200">
           <h2 className="text-xl font-semibold mb-4">🔄 Page Transitions</h2>
           <p className="text-gray-600 mb-4">
             Navigate to other pages to see smooth transitions in action.
           </p>
           <div className="flex gap-4">
             <a
               href="/reports"
               className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
             >
               Go to Reports
             </a>
             <a
               href="/dashboard"
               className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
             >
               Go to Dashboard
             </a>
           </div>
         </div>

         {/* Loading Overlay */}
         {showLoadingOverlay && (
           <LoadingOverlay
             isVisible={true}
             text="Processing demo request..."
             backdrop={true}
           />
         )}
       </div>
     </MainLayout>
   );
 }