import { uploadImage } from "./lib/cloudinary.server";

const BIGMODEL_TEXT_URL =
  "https://open.bigmodel.cn/api/paas/v4/chat/completions";

const BIGMODEL_IMAGE_URL =
  "https://open.bigmodel.cn/api/paas/v4/images/generations";

export async function generateProductWithAI({
  title,
  tone = "seo",
  pricing = "medium",
}) {
  const apiKey = process.env.BIGMODEL_API_KEY;
  if (!apiKey) throw new Error("BIGMODEL_API_KEY missing");

  /* =========================
     1️⃣ TEXT GENERATION
  ========================= */
  const textPrompt = `
Return ONLY valid JSON.
NO markdown.
NO backticks.
NO explanation.

Product title: "${title}"
Tone: ${tone}
Pricing: ${pricing}

JSON format:
{
  "description_html": "<p>...</p>",
  "variants": [{ "name": "", "price": 0 }],
  "tags": [],
  "seo": { "title": "", "description": "" },
  "image_prompt": "short visual description"
}
`;

  const textRes = await fetch(BIGMODEL_TEXT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "glm-4.5",
      messages: [{ role: "user", content: textPrompt }],
      temperature: 0.7,
    }),
  });

  const textData = await textRes.json();

  console.log(JSON.stringify( textData?.choices?.[0]?.message?.content,null,2));
  

  let raw = textData?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("BigModel returned empty text response");

  // 🔥 CLEAN markdown fences
  raw = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let aiText;
  try {
    aiText = JSON.parse(raw);
  } catch (err) {
    console.error("❌ AI RAW OUTPUT:", raw);
    throw new Error("AI did not return valid JSON");
  }

  /* =========================
     2️⃣ IMAGE GENERATION
  ========================= */

  let uploadedImages = [];

  try {
    const imageRes = await fetch(BIGMODEL_IMAGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "cogview-3-plus",
        prompt: aiText.image_prompt,
        size: "1024x1024",
        n: 2,
      }),
    });

    const imageData = await imageRes.json();

    console.log("🧠 BigModel image response:-->", imageData);

    if (Array.isArray(imageData?.data)) {
      for (const img of imageData.data) {
        if (img?.b64_json) {
          try {
            const url = await uploadImage(img.b64_json);
            uploadedImages.push(url);
          } catch (err) {
            console.warn("⚠️ Cloudinary upload failed");
          }
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ Image generation skipped:", err.message);
  }

  /* =========================
   3️⃣ FALLBACK IMAGES
========================= */

  if (!uploadedImages.length) {
    uploadedImages = [
      "https://picsum.photos/600/600?random=101",
      "https://picsum.photos/600/600?random=102",
    ];
  }

  /* =========================
     4️⃣ FINAL PRODUCT OBJECT
  ========================= */
  return {
    title,
    description_html: aiText.description_html,
    variants: aiText.variants,
    tags: aiText.tags,
    seo: aiText.seo,
    images: uploadedImages,
  };
}
