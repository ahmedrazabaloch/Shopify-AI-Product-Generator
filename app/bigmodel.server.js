// import { uploadImage } from "./lib/cloudinary.server";

// /* =========================
//    CONSTANTS
// ========================= */
// const BIGMODEL_TEXT_URL =
//   "https://open.bigmodel.cn/api/paas/v4/chat/completions";

// const HF_IMAGE_URL =
//   "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0";

// /* =========================
//    HUGGING FACE IMAGE HELPER
// ========================= */

// async function generateImageWithHF(prompt) {
//   const res = await fetch(HF_IMAGE_URL, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       inputs: prompt,
//     }),
//   });

//   if (!res.ok) {
//     const err = await res.text();
//     throw new Error("HF image generation failed: " + err);
//   }

//   // Hugging Face returns raw image bytes
//   const buffer = await res.arrayBuffer();
//   return Buffer.from(buffer).toString("base64");
// }

// /* =========================
//    MAIN FUNCTION
// ========================= */

// export async function generateProductWithAI({
//   title,
//   tone = "seo",
//   pricing = "medium",
// }) {
//   const bigModelKey = process.env.BIGMODEL_API_KEY;
//   if (!bigModelKey) throw new Error("BIGMODEL_API_KEY missing");

//   /* =========================
//      1️⃣ TEXT GENERATION (BigModel)
//   ========================= */

//   const textPrompt = `
// Return ONLY valid JSON.
// NO markdown.
// NO backticks.
// NO explanation.

// Product title: "${title}"
// Tone: ${tone}
// Pricing: ${pricing}

// JSON format:
// {
//   "description_html": "<p>...</p>",
//   "variants": [{ "name": "", "price": 0 }],
//   "tags": [],
//   "seo": { "title": "", "description": "" },
//   "image_prompt": "short visual description"
// }
// `;

//   const textRes = await fetch(BIGMODEL_TEXT_URL, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${bigModelKey}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       model: "glm-4-flash",
//       messages: [{ role: "user", content: textPrompt }],
//       temperature: 0.7,
//     }),
//   });

//   if (!textRes.ok) {
//     throw new Error("BigModel text request failed");
//   }

//   const textData = await textRes.json();

//   let raw =
//     textData?.choices?.[0]?.message?.content ||
//     textData?.data?.content ||
//     textData?.output?.text;

//   if (!raw) {
//     console.error("❌ BigModel full response:", textData);
//     throw new Error("BigModel returned empty text response");
//   }

//   raw = raw.replace(/```json|```/gi, "").trim();

//   let aiText;
//   try {
//     aiText = JSON.parse(raw);
//   } catch (err) {
//     console.error("❌ AI RAW OUTPUT:", raw);
//     throw new Error("AI did not return valid JSON");
//   }

//   /* =========================
//      2️⃣ IMAGE GENERATION (Hugging Face)
//   ========================= */

//   let uploadedImages = [];
//   const imagePrompt =
//     aiText.image_prompt?.trim() ||
//     `Professional studio product photo of ${title}, white background, soft lighting, realistic, high quality, e-commerce ready`;

//   try {
//     for (let i = 0; i < 2; i++) {
//       const base64Image = await generateImageWithHF(imagePrompt);
//       const imageUrl = await uploadImage(base64Image);
//       uploadedImages.push(imageUrl);
//     }
//   } catch (err) {
//     console.warn("⚠️ Hugging Face image generation skipped:", err.message);
//   }

//   /* =========================
//      3️⃣ FALLBACK IMAGES
//   ========================= */

//   if (!uploadedImages.length) {
//     uploadedImages = [
//       "https://picsum.photos/600/600?random=101",
//       "https://picsum.photos/600/600?random=102",
//     ];
//   }

//   /* =========================
//      4️⃣ FINAL PRODUCT OBJECT
//   ========================= */

//   return {
//     title,
//     description_html: aiText.description_html,
//     variants: aiText.variants,
//     tags: aiText.tags,
//     seo: aiText.seo,
//     images: uploadedImages,
//   };
// }

import { uploadImage } from "./lib/cloudinary.server";

/* =========================
   CONSTANTS
========================= */
const BIGMODEL_TEXT_URL =
  "https://open.bigmodel.cn/api/paas/v4/chat/completions";

const HF_IMAGE_URL =
  "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0";

/* =========================
   IMAGE GENERATION
========================= */
async function generateImageWithHF(prompt) {
  const res = await fetch(HF_IMAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: prompt }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

/* =========================
   MAIN AI FUNCTION
========================= */
export async function generateProductWithAI({
  title,
  tone = "seo",
  pricing = "medium",
}) {
  if (!title?.trim()) {
    throw new Error("Product title is required for AI generation");
  }

  if (!process.env.BIGMODEL_API_KEY) {
    throw new Error("BIGMODEL_API_KEY missing");
  }

  /* =========================
     1️⃣ TEXT GENERATION
  ========================= */

  const prompt = `
Return ONLY valid JSON.
No markdown.
No explanation.
- tags MUST be an array of 5 to 7 relevant ecommerce keywords
- tags must NOT be empty
- tags must be lowercase strings

{
  "descriptionHtml": "<p>...</p>",
  "variants": [{ "title": "Default", "price": "19.99" }],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seo": { "title": "", "description": "" },
  "imagePrompt": ""
}

Product title: "${title}"
Tone: ${tone}
Pricing: ${pricing}
`;

  const textRes = await fetch(BIGMODEL_TEXT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BIGMODEL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "glm-4-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!textRes.ok) {
    throw new Error("BigModel text request failed");
  }

  const textData = await textRes.json();

  let raw =
    textData?.choices?.[0]?.message?.content ??
    textData?.data?.content ??
    textData?.output?.text;

  if (!raw) {
    console.error("❌ BigModel response:", textData);
    throw new Error("Empty AI response");
  }

  raw = raw.replace(/```json|```/gi, "").trim();

  let ai;
  try {
    ai = JSON.parse(raw);
  } catch {
    console.error("❌ AI RAW:", raw);
    throw new Error("Invalid AI JSON");
  }

  /* =========================
     2️⃣ IMAGE GENERATION
  ========================= */

  let images = [];

  const imagePrompt =
    ai.imagePrompt ||
    `Professional studio photo of ${title}, white background, ecommerce, high quality`;

  try {
    images = await Promise.all(
      Array.from({ length: 2 }).map(async () => {
        const base64 = await generateImageWithHF(imagePrompt);
        return uploadImage(base64);
      }),
    );
  } catch (err) {
    console.warn("⚠️ Image generation failed:", err.message);
  }

  if (!images.length) {
    images = [
      "https://picsum.photos/600/600?random=101",
      "https://picsum.photos/600/600?random=102",
    ];
  }

  /* =========================
     3️⃣ FINAL NORMALIZED PRODUCT
  ========================= */

  return {
    title,
    descriptionHtml:
      ai.descriptionHtml || `<p>High quality ${title} generated by AI.</p>`,
    variants:
      ai.variants?.length > 0
        ? ai.variants.map((v) => ({
            title: v.title || "Default",
            price: String(v.price || "0.00"),
          }))
        : [{ title: "Default", price: "0.00" }],
    tags: ai.tags || [],
    seo: {
      title: ai.seo?.title || title,
      description: ai.seo?.description || `Buy premium ${title} at best price.`,
    },
    images,
  };
}
