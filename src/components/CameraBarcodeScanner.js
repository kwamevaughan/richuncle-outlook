import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { BrowserMultiFormatReader } from "@zxing/browser";

const CameraBarcodeScanner = ({
  isOpen,
  onClose,
  onScanSuccess,
  mode = "light",
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [stream, setStream] = useState(null);
  const scanIntervalRef = useRef(null);
  const [codeReader, setCodeReader] = useState(null);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [showTips, setShowTips] = useState(false);
  const [readerError, setReaderError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");

  // Initialize camera and start scanning
  useEffect(() => {
    if (isOpen) {
      try {
        // Initialize the code reader with error handling
        const reader = new BrowserMultiFormatReader();
        setCodeReader(reader);
        setReaderError(null);
        setDebugInfo("Code reader initialized successfully");
        initializeCamera();
      } catch (err) {
        console.error("Failed to initialize code reader:", err);
        setReaderError(
          "Failed to initialize barcode reader. Please refresh and try again.",
        );
        setError("Scanner initialization failed");
        setDebugInfo(`Init error: ${err.message}`);
      }
    }

    return () => {
      cleanup();
    };
  }, [isOpen, selectedDeviceId]);

  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  };

  const initializeCamera = async () => {
    try {
      setError(null);

      // Get available video devices
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(
        (device) => device.kind === "videoinput",
      );
      setDevices(videoDevices);

      // Select back camera if available, otherwise first camera
      const backCamera = videoDevices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear") ||
          device.label.toLowerCase().includes("environment"),
      );

      const deviceId =
        selectedDeviceId || backCamera?.deviceId || videoDevices[0]?.deviceId;

      if (!deviceId) {
        setDebugInfo("No camera devices found");
        throw new Error("No camera devices found");
      }

      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: selectedDeviceId ? undefined : "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);
      setDebugInfo(
        `Camera initialized: ${deviceId ? "specific device" : "default device"}`,
      );

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsScanning(true);
          startScanning();
        };
      }
    } catch (err) {
      console.error("Camera initialization error:", err);
      setError(err.message || "Failed to access camera");
      setDebugInfo(`Camera error: ${err.name} - ${err.message}`);
      toast.error("Failed to access camera. Please check permissions.");
    }
  };

  const startScanning = () => {
    if (!videoRef.current || !codeReader) {
      setDebugInfo("Cannot start scanning - missing video or reader");
      return;
    }

    // Clear any existing interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    // Reset scan attempts
    setScanAttempts(0);
    setDebugInfo("Scanning started - looking for barcodes...");

    // Start interval-based scanning with ZXing
    scanIntervalRef.current = setInterval(async () => {
      if (isScanning) {
        await scanForBarcode();
      }
    }, 300); // Reduced interval for more responsive scanning
  };

  const handleBarcodeResult = (result) => {
    if (result && result.getText()) {
      const barcodeText = result.getText();
      console.log("Barcode detected:", barcodeText);
      setDebugInfo(
        `Barcode found: ${barcodeText} (length: ${barcodeText.length})`,
      );

      // Validate barcode (basic check)
      if (barcodeText.length < 3) {
        console.log("Barcode too short, continuing scan");
        setDebugInfo(
          `Barcode too short (${barcodeText.length} chars), continuing...`,
        );
        return;
      }

      // Provide haptic feedback on mobile devices
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]); // Short vibration pattern
      }

      // Success! Found barcode
      toast.success(`✅ Barcode scanned: ${barcodeText}`);

      // Stop scanning and cleanup
      setIsScanning(false);
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }

      // Visual feedback - flash the screen green briefly
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(34, 197, 94, 0.3);
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(overlay);
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 200);

      // Call success handler
      onScanSuccess(barcodeText);
    }
  };

  const scanForBarcode = async () => {
    if (!videoRef.current || !codeReader || !isScanning) {
      setDebugInfo("Scan skipped - missing requirements");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      setDebugInfo("Video not ready, waiting...");
      return;
    }

    // Increment attempts counter at the start of each scan attempt
    setScanAttempts((prev) => {
      const newCount = prev + 1;
      setDebugInfo(`Scanning attempt ${newCount}...`);
      return newCount;
    });

    try {
      // Draw video frame to canvas for processing
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Try different ZXing methods for better compatibility
      let result = null;
      let scanMethod = "";

      try {
        // Method 1: Try decodeFromImageData
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        result = await codeReader.decodeFromImageData(imageData);
        scanMethod = "imageData";
      } catch (decodeError) {
        try {
          // Method 2: Try decodeFromCanvas if imageData fails
          result = await codeReader.decodeFromCanvas(canvas);
          scanMethod = "canvas";
        } catch (canvasError) {
          try {
            // Method 3: Try direct video decode
            result = await codeReader.decodeFromVideoElement(video);
            scanMethod = "video";
          } catch (videoError) {
            // All methods failed - this is expected when no barcode is present
            throw videoError;
          }
        }
      }

      if (result && result.getText) {
        setDebugInfo(`✅ Barcode found using ${scanMethod} method!`);
        handleBarcodeResult(result);
      }
    } catch (err) {
      // Handle specific ZXing errors
      if (
        err.name === "NotFoundException" ||
        err.message?.includes("No barcode found") ||
        err.message?.includes("not found") ||
        err.message?.includes("No code found")
      ) {
        // No barcode found in this frame, continue scanning
        setLastScanTime(Date.now());
        setDebugInfo(`No barcode detected (attempt ${scanAttempts + 1})`);
      } else if (
        err.message &&
        err.message.includes("No MultiFormat Readers")
      ) {
        console.error("ZXing reader configuration error:", err);
        setError("Scanner configuration error. Please refresh and try again.");
        setDebugInfo("❌ Scanner configuration error");
      } else {
        // Log other errors but continue scanning
        console.log("Scanning attempt failed:", err.message);
        setDebugInfo(`⚠️ Scan error: ${err.message.substring(0, 50)}...`);
      }
    }
  };

  // Additional method for manual barcode detection from canvas (optional)
  const scanFromCanvas = async () => {
    if (!canvasRef.current || !codeReader) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = await codeReader.decodeFromImageData(imageData);
      if (result && result.getText) {
        handleBarcodeResult(result);
      }
    } catch (err) {
      if (
        err.name !== "NotFoundException" &&
        !err.message?.includes("No barcode found") &&
        !err.message?.includes("not found")
      ) {
        console.error("Canvas barcode scanning error:", err);
      }
    }
  };

  const switchCamera = async (deviceId) => {
    setSelectedDeviceId(deviceId);
    cleanup();
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div
        className={`relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden ${
          mode === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            mode === "dark"
              ? "border-gray-700 bg-gray-800"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Icon
                icon="material-symbols:camera-alt-rounded"
                className="w-6 h-6 text-white"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold">Barcode Scanner</h2>
              <p className="text-sm text-gray-500">Point camera at barcode</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Camera switch button */}
            {devices.length > 1 && (
              <button
                onClick={() => {
                  const currentIndex = devices.findIndex(
                    (d) => d.deviceId === selectedDeviceId,
                  );
                  const nextDevice =
                    devices[(currentIndex + 1) % devices.length];
                  switchCamera(nextDevice.deviceId);
                }}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Switch camera"
              >
                <Icon
                  icon="material-symbols:flip-camera-android"
                  className="w-5 h-5"
                />
              </button>
            )}

            {/* Close button */}
            <button
              onClick={handleClose}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Close scanner"
            >
              <Icon icon="material-symbols:close" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scanner area */}
        <div className="relative">
          {error || readerError ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Icon
                icon="material-symbols:error-outline"
                className="w-16 h-16 text-red-500 mb-4"
              />
              <h3 className="text-lg font-semibold mb-2">
                {readerError ? "Scanner Error" : "Camera Error"}
              </h3>
              <p className="text-gray-500 mb-4">{error || readerError}</p>
              <button
                onClick={initializeCamera}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Video feed */}
              <div className="relative bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 sm:h-80 object-cover"
                />

                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Scanning frame */}
                    <div className="w-64 h-32 border-4 border-white rounded-lg relative">
                      <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-green-400"></div>
                      <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-green-400"></div>
                      <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-green-400"></div>
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-green-400"></div>

                      {/* Scanning line animation */}
                      {isScanning && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-bounce"></div>
                      )}
                      
                      {/* Manual scan button */}
                      <button
                        onClick={scanFromCanvas}
                        className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
                        title="Manual scan"
                      >
                        <Icon icon="material-symbols:qr-code-scanner" className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Status indicator */}
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
                      {isScanning ? (
                        <>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span>
                            {scanAttempts === 0 
                              ? "Starting scan..." 
                              : `Scanning... (${scanAttempts} attempts)`
                            }
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                          <span>Initializing camera...</span>
                        </>
                      )}
                    </div>

                    {/* Debug info */}
                    {debugInfo && (
                      <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-xs text-gray-300 bg-black bg-opacity-75 px-3 py-1 rounded-full max-w-sm text-center">
                        {debugInfo}
                      </div>
                    )}
                    
                    {/* Scan progress indicator */}
                    {scanAttempts > 0 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                        {scanAttempts > 50 ? "50+" : scanAttempts}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Hidden canvas for image processing */}
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </>
          )}
        </div>

        {/* Footer with instructions */}
        <div
          className={`p-4 border-t ${
            mode === "dark"
              ? "border-gray-700 bg-gray-800"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Icon icon="material-symbols:info-outline" className="w-4 h-4" />
              <span>
                {scanAttempts > 20
                  ? "Having trouble? Try better lighting or closer distance"
                  : "Hold steady and ensure barcode is clearly visible"}
              </span>
              {scanAttempts > 15 && (
                <button
                  onClick={() => setShowTips(true)}
                  className="ml-2 text-blue-600 hover:text-blue-700 underline text-xs"
                >
                  Show tips
                </button>
              )}
            </div>

            {/* Supported formats */}
            <div className="flex flex-wrap gap-1 text-xs text-gray-400">
              <span className="bg-gray-100 px-2 py-1 rounded">QR</span>
              <span className="bg-gray-100 px-2 py-1 rounded">Code128</span>
              <span className="bg-gray-100 px-2 py-1 rounded">EAN-13</span>
              <span className="bg-gray-100 px-2 py-1 rounded">UPC-A</span>
            </div>

            {/* Manual input fallback */}
            <button
              onClick={() => {
                handleClose();
                toast("Switched to manual barcode entry");
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
            >
              Enter manually instead
            </button>
          </div>
        </div>

        {/* Scanning Tips Modal */}
        {showTips && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Scanning Tips
                </h3>
                <button
                  onClick={() => setShowTips(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Icon icon="material-symbols:close" className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <Icon
                    icon="material-symbols:light-mode"
                    className="w-5 h-5 text-yellow-500 mt-0.5"
                  />
                  <div>
                    <strong>Good lighting:</strong> Ensure barcode is well-lit,
                    avoid shadows
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Icon
                    icon="material-symbols:center-focus-strong"
                    className="w-5 h-5 text-blue-500 mt-0.5"
                  />
                  <div>
                    <strong>Focus & distance:</strong> Hold 4-8 inches away,
                    keep steady
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Icon
                    icon="material-symbols:straighten"
                    className="w-5 h-5 text-green-500 mt-0.5"
                  />
                  <div>
                    <strong>Angle:</strong> Keep camera parallel to barcode
                    surface
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Icon
                    icon="material-symbols:cleaning"
                    className="w-5 h-5 text-purple-500 mt-0.5"
                  />
                  <div>
                    <strong>Clean surface:</strong> Wipe barcode if dirty or
                    scratched
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowTips(false)}
                className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraBarcodeScanner;
