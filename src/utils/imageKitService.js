// imageKitService.js (Revised)
import ImageKit from "imagekit";

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

export const deleteImage = async (fileId) => {
    if (!fileId) {
        console.warn("No fileId provided for deletion.");
        return;
    }
    try {
        console.log(`Deleting image with fileId: ${fileId}`); // Log the fileId
        await imagekit.deleteFile(fileId);
        console.log(`Image with fileId ${fileId} deleted successfully.`); // Log success
    } catch (error) {
        console.error("Error deleting image:", error); // Log the error
        throw error; // Re-throw the error to bubble it up
    }
};

export const uploadImage = async (file, userName, referralCode) => {
    try {
        const timestamp = Date.now();
        const customFileName = `${userName}_${referralCode}_${timestamp}.${file.name.split('.').pop()}`;

        const response = await imagekit.upload({
          file: file,
          fileName: customFileName,
          useUniqueFileName: false,
          folder: "CategoryImages",
          options: {
            transformation: [
              {
                width: 800,
                height: 600,
                quality: 80,
              },
            ],
          },
        });

        const fileUrl = response.url;
        const fileId = response.fileId;

        return { fileUrl, fileId };
    } catch (error) {
        console.error("Image upload failed:", error);
        throw error;
    }
};

export { imagekit }; // Only export imagekit here
