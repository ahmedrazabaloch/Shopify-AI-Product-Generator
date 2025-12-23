import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(image) {
  if (!image) throw new Error("No image provided");

  const base64 =
    image.startsWith("data:image/")
      ? image
      : `data:image/png;base64,${image}`;

  const result = await cloudinary.uploader.upload(base64, {
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
