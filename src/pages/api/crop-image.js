export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, cropData } = req.body;

    if (!imageUrl || !cropData) {
      return res.status(400).json({ error: 'Image URL and crop data are required' });
    }

    console.log('Attempting to fetch image from:', imageUrl);

    // Try to fetch the image with proper headers
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!imageResponse.ok) {
      console.error('Image fetch failed:', imageResponse.status, imageResponse.statusText);
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    console.log('Successfully fetched image, size:', imageBuffer.byteLength, 'bytes, type:', mimeType);

    // Convert buffer to base64
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    return res.status(200).json({
      success: true,
      croppedImage: dataUrl,
      cropData: cropData
    });

  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({ 
      error: 'Failed to process image',
      details: error.message 
    });
  }
} 