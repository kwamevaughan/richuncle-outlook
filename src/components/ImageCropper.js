import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

export default function ImageCropper({
  imageSrc,
  onCrop,
  onCancel,
  aspectRatio = 1, // 1 for square
  cropSize = 200,
  showZoom = true,
  showRotate = true
}) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Load image and get dimensions
  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        setImageLoaded(true);
        
        // Calculate proper fit and position
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const containerWidth = containerRect.width;
          const containerHeight = containerRect.height;
          
          // Calculate scale to fit image within crop area
          const imageAspectRatio = img.width / img.height;
          const cropAspectRatio = cropSize / cropSize; // 1 for square
          
          let fitScale = 1;
          if (imageAspectRatio > cropAspectRatio) {
            // Image is wider than crop area
            fitScale = cropSize / img.width;
          } else {
            // Image is taller than crop area
            fitScale = cropSize / img.height;
          }
          
          // Ensure minimum scale for visibility
          fitScale = Math.max(fitScale, 0.5);
          
          // Calculate position: center horizontally, top vertically
          const scaledImageWidth = img.width * fitScale;
          const scaledImageHeight = img.height * fitScale;
          
          const centerX = (cropSize - scaledImageWidth) / 2;
          const topY = 0; // Position at top instead of center
          
          setScale(fitScale);
          setPosition({ x: centerX, y: topY });
        }
      };
      img.src = imageSrc;
    }
  }, [imageSrc, cropSize]);

  // Handle mouse/touch events for dragging
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    const cropRect = {
      left: rect.left + (rect.width - cropSize) / 2,
      top: rect.top + (rect.height - cropSize) / 2
    };
    setDragStart({
      x: e.clientX - cropRect.left - position.x,
      y: e.clientY - cropRect.top - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const rect = containerRef.current.getBoundingClientRect();
    const cropRect = {
      left: rect.left + (rect.width - cropSize) / 2,
      top: rect.top + (rect.height - cropSize) / 2
    };
    const newX = e.clientX - cropRect.left - dragStart.x;
    const newY = e.clientY - cropRect.top - dragStart.y;
    
    // Calculate bounds based on scaled image size
    const scaledImageWidth = imageDimensions.width * scale;
    const scaledImageHeight = imageDimensions.height * scale;
    
    // Constrain movement so image doesn't go outside crop area
    const minX = cropSize - scaledImageWidth;
    const maxX = 0;
    const minY = cropSize - scaledImageHeight;
    const maxY = 0;
    
    setPosition({
      x: Math.max(minX, Math.min(newX, maxX)),
      y: Math.max(minY, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle zoom
  const handleZoomChange = (e) => {
    setScale(parseFloat(e.target.value));
  };

  // Handle rotation
  const handleRotate = (direction) => {
    setRotation(prev => prev + (direction === 'left' ? -90 : 90));
  };

  // Reset transformations
  const handleReset = () => {
    setRotation(0);
    
    // Recalculate proper fit and position
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect && imageDimensions.width && imageDimensions.height) {
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      // Calculate scale to fit image within crop area
      const imageAspectRatio = imageDimensions.width / imageDimensions.height;
      const cropAspectRatio = cropSize / cropSize; // 1 for square
      
      let fitScale = 1;
      if (imageAspectRatio > cropAspectRatio) {
        // Image is wider than crop area
        fitScale = cropSize / imageDimensions.width;
      } else {
        // Image is taller than crop area
        fitScale = cropSize / imageDimensions.height;
      }
      
      // Ensure minimum scale for visibility
      fitScale = Math.max(fitScale, 0.5);
      
      // Calculate position: center horizontally, top vertically
      const scaledImageWidth = imageDimensions.width * fitScale;
      const scaledImageHeight = imageDimensions.height * fitScale;
      
      const centerX = (cropSize - scaledImageWidth) / 2;
      const topY = 0; // Position at top instead of center
      
      setScale(fitScale);
      setPosition({ x: centerX, y: topY });
    }
  };

  // Apply crop with CORS-safe approach
  const handleApplyCrop = async () => {
    if (!imageRef.current) return;

    try {
      // Calculate the visible area of the image within the crop circle
      const scaledImageWidth = imageDimensions.width * scale;
      const scaledImageHeight = imageDimensions.height * scale;
      
      // The crop area is a circle, so we need to calculate what's visible
      // Position is relative to the top-left of the crop area
      const imageLeft = position.x;
      const imageTop = position.y;
      const imageRight = position.x + scaledImageWidth;
      const imageBottom = position.y + scaledImageHeight;
      
      // Calculate the crop circle bounds (assuming cropSize x cropSize area)
      const cropRadius = cropSize / 2;
      const cropCenterX = cropSize / 2;
      const cropCenterY = cropSize / 2;
      
      // Calculate the visible portion of the image within the crop circle
      // For simplicity, we'll crop a square area that fits within the circle
      const cropLeft = Math.max(0, cropCenterX - cropRadius);
      const cropTop = Math.max(0, cropCenterY - cropRadius);
      const cropRight = Math.min(cropSize, cropCenterX + cropRadius);
      const cropBottom = Math.min(cropSize, cropCenterY + cropRadius);
      
      // Calculate the intersection between the image and crop area
      const visibleLeft = Math.max(cropLeft, imageLeft);
      const visibleTop = Math.max(cropTop, imageTop);
      const visibleRight = Math.min(cropRight, imageRight);
      const visibleBottom = Math.min(cropBottom, imageBottom);
      
      // Convert visible area back to original image coordinates
      const sourceX = (visibleLeft - imageLeft) / scale;
      const sourceY = (visibleTop - imageTop) / scale;
      const sourceWidth = (visibleRight - visibleLeft) / scale;
      const sourceHeight = (visibleBottom - visibleTop) / scale;
      
      // Ensure we don't go outside the original image bounds
      const finalSourceX = Math.max(0, Math.min(sourceX, imageDimensions.width - sourceWidth));
      const finalSourceY = Math.max(0, Math.min(sourceY, imageDimensions.height - sourceHeight));
      const finalSourceWidth = Math.min(sourceWidth, imageDimensions.width - finalSourceX);
      const finalSourceHeight = Math.min(sourceHeight, imageDimensions.height - finalSourceY);
      
      // Prepare crop data
      const cropData = {
        x: Math.round(finalSourceX),
        y: Math.round(finalSourceY),
        width: Math.round(finalSourceWidth),
        height: Math.round(finalSourceHeight),
        scale: scale,
        rotation: rotation,
        originalWidth: imageDimensions.width,
        originalHeight: imageDimensions.height,
        // Additional data for debugging
        scaledImageWidth: scaledImageWidth,
        scaledImageHeight: scaledImageHeight,
        position: position,
        cropSize: cropSize
      };

      console.log('Attempting client-side cropping with data:', cropData);

      // Try client-side cropping first
      await performClientSideCropDirect(imageSrc, cropData);

    } catch (error) {
      console.error('Error in handleApplyCrop:', error);
      handleFallbackCrop();
    }
  };

  // Perform client-side cropping directly (with CORS handling)
  const performClientSideCropDirect = async (imageSrc, cropData) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to crop size
      canvas.width = 200; // Profile picture size
      canvas.height = 200;
      
      // Create image from source
      const img = new Image();
      
      // Set crossOrigin to anonymous to handle CORS
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          console.log('Image loaded successfully, performing crop');
          console.log('Crop data:', cropData);
          
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Apply transformations
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((cropData.rotation * Math.PI) / 180);
          
          // Calculate the destination size to fit the crop area
          const aspectRatio = cropData.width / cropData.height;
          let destWidth, destHeight;
          
          if (aspectRatio > 1) {
            // Image is wider than tall
            destWidth = 200;
            destHeight = 200 / aspectRatio;
          } else {
            // Image is taller than wide
            destWidth = 200 * aspectRatio;
            destHeight = 200;
          }
          
          // Draw the cropped portion
          ctx.drawImage(
            img,
            cropData.x, cropData.y, cropData.width, cropData.height,
            -destWidth / 2, -destHeight / 2, destWidth, destHeight
          );
          
          ctx.restore();
          
          // Pass crop data instead of file for transformation-based approach
          const finalCropData = {
            x: cropData.x,
            y: cropData.y,
            width: cropData.width,
            height: cropData.height,
            scale: cropData.scale,
            rotation: cropData.rotation,
            originalWidth: cropData.originalWidth,
            originalHeight: cropData.originalHeight
          };
          
          console.log('Crop successful, passing crop data:', finalCropData);
          onCrop(finalCropData);
          resolve();
          
        } catch (error) {
          console.error('Error during client-side cropping:', error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('Failed to load image for client-side cropping:', error);
        reject(new Error('Failed to load image for client-side cropping'));
      };
      
      // Load the image from source
      img.src = imageSrc;
    });
  };

  // Fallback method when canvas operations fail due to CORS
  const handleFallbackCrop = () => {
    console.log('Using fallback image processing');
    
    // For external images (like from ImageKit), we can't apply transformations due to CORS
    // So we'll just pass the original image and let the user know
    if (imageSrc.startsWith('http') && !imageSrc.startsWith(window.location.origin)) {
      // This is an external image - we can't crop it due to CORS
      // Show a message to the user
      alert('Note: Image repositioning is limited for external images due to browser security restrictions. The original image will be used.');
      onCrop(null); // Pass null to indicate no cropping was applied
    } else {
      // For local images, try to fetch and create a file
      fetch(imageSrc)
        .then(response => response.blob())
        .then(blob => {
          const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
          onCrop(file);
        })
        .catch(error => {
          console.error('Fallback crop failed:', error);
          onCrop(null);
        });
    }
  };

  if (!imageSrc) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Reposition Image</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <Icon icon="mdi:close" className="w-6 h-6" />
          </button>
        </div>

        {/* Image Container */}
        <div className="p-4">
          <div
            ref={containerRef}
            className="relative bg-gray-100 rounded-lg overflow-hidden mx-auto"
            style={{ width: cropSize + 40, height: cropSize + 40 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Crop Overlay */}
            <div
              className="absolute border-2 border-white shadow-lg pointer-events-none"
              style={{
                left: position.x,
                top: position.y,
                width: cropSize,
                height: cropSize,
                borderRadius: '50%'
              }}
            >
              {/* Corner indicators */}
              <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full"></div>
              <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"></div>
              <div className="absolute bottom-2 left-2 w-2 h-2 bg-white rounded-full"></div>
              <div className="absolute bottom-2 right-2 w-2 h-2 bg-white rounded-full"></div>
            </div>

            {/* Image */}
            {imageLoaded && (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                className="absolute cursor-move"
                style={{
                  left: position.x,
                  top: position.y,
                  width: imageDimensions.width * scale,
                  height: imageDimensions.height * scale,
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                  maxWidth: 'none',
                  maxHeight: 'none'
                }}
                draggable={false}
              />
            )}
          </div>

          {/* Controls */}
          <div className="mt-6 space-y-4">
            {/* Zoom Control */}
            {showZoom && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zoom
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={handleZoomChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>50%</span>
                  <span>{Math.round(scale * 100)}%</span>
                  <span>300%</span>
                </div>
              </div>
            )}

            {/* Rotation Controls */}
            {showRotate && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => handleRotate('left')}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Rotate left"
                >
                  <Icon icon="mdi:rotate-left" className="w-5 h-5" />
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => handleRotate('right')}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Rotate right"
                >
                  <Icon icon="mdi:rotate-right" className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyCrop}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
} 