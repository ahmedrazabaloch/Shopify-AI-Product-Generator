import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(image) {
  if (!image) throw new Error("No image provided");
  // Accept either remote URLs or base64/data URLs
  let source = image;
  if (typeof image === "string") {
    if (image.startsWith("http://") || image.startsWith("https://")) {
      source = image; // Cloudinary can fetch remote URLs directly
    } else if (image.startsWith("data:image/")) {
      source = image; // Already a data URL
    } else {
      source = `data:image/png;base64,${image}`; // Raw base64
    }
  }

  const result = await cloudinary.uploader.upload(source, {
    folder: "ai-products",
    resource_type: "image",
    format: "png",               // 🔥 FORCE image format
    transformation: [
      { quality: "auto" },
      { fetch_format: "png" },
    ],
  });

  return result.secure_url;
}
