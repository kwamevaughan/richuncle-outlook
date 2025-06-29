import { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { uploadImage } from "../utils/imageKitService";
import toast from "react-hot-toast";

export default function CategoryImageUpload({ value, onChange }) {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      const toastId = toast.loading("Uploading image...");
      try {
        // You can pass dummy userName/referralCode or make these props if needed
        const { fileUrl } = await uploadImage(file, "category", "category");
        onChange(fileUrl);
        toast.success("Image uploaded!", { id: toastId });
      } catch (err) {
        toast.error("Image upload failed", { id: toastId });
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-16 h-16 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border dark:border-gray-700">
        {value ? (
          <img src={value} alt="Preview" className="object-cover w-full h-full" />
        ) : (
          <Icon icon="mdi:image-outline" className="w-8 h-8 text-gray-400" />
        )}
      </div>
      <button
        type="button"
        className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 text-xs disabled:opacity-60"
        onClick={() => fileInput.current.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
        ) : (
          <Icon icon="mdi:upload" className="w-4 h-4" />
        )}
        {uploading ? "Uploading..." : "Upload"}
      </button>
      <input
        type="file"
        accept="image/*"
        ref={fileInput}
        className="hidden"
        onChange={handleFile}
        disabled={uploading}
      />
    </div>
  );
} 