// Removed Cloudinary import - images now uploaded directly to Shopify

/* =========================
   CONSTANTS
========================= */
const BIGMODEL_TEXT_URL =
  "https://open.bigmodel.cn/api/paas/v4/chat/completions";

const HF_IMAGE_URL =
  "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0";

/* =========================
   IMAGE GENERATION (SAFE)
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
  imageStyle = "studio",
  imageCount = 3,
}) {
  if (!title?.trim()) {
    throw new Error("Product title is required for AI generation");
  }

  if (!process.env.BIGMODEL_API_KEY) {
    throw new Error("BIGMODEL_API_KEY missing");
  }

  /* =========================
     TONE DESCRIPTIONS
  ========================= */
  const toneDescriptions = {
    seo: "SEO-optimized, keyword-rich, persuasive",
    luxury: "luxury, premium, sophisticated, exclusive",
    simple: "simple, clean, straightforward, minimal",
    fun: "fun, playful, energetic, casual",
    professional: "professional, technical, detailed, formal",
  };

  const toneDesc = toneDescriptions[tone] || toneDescriptions.seo;

  /* =========================
     1️⃣ TEXT GENERATION
  ========================= */

  const prompt = `
Return ONLY valid JSON.
NO markdown.
NO explanations.

STRICT REQUIREMENTS:
- descriptionHtml MUST be valid HTML and at least 2 paragraphs
- Use ${toneDesc} tone
- tags MUST be an array of 5–7 lowercase ecommerce keywords
- tags must NOT be empty
- variants MUST have at least 2-3 options with different names (e.g., Small/Medium/Large or Basic/Premium/Deluxe)
- variants[].price MUST be a string number
- variants[].option1 MUST be the variant name
- imagePrompt MUST be a short visual description with ${imageStyle} style

PRICE RANGE RULES:
- low: 9.99–19.99
- medium: 19.99–49.99
- premium: 49.99–99.99

JSON FORMAT:
{
  "descriptionHtml": "<p>...</p>",
  "variants": [
    { "option1": "Small", "price": "19.99", "compareAtPrice": "29.99" },
    { "option1": "Medium", "price": "29.99", "compareAtPrice": "39.99" },
    { "option1": "Large", "price": "39.99", "compareAtPrice": "49.99" }
  ],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seo": { "title": "", "description": "" },
  "imagePrompt": ""
}

Product title: "${title}"
Tone: ${tone}
Pricing: ${pricing}
Image Style: ${imageStyle}
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
    console.error("❌ AI RAW OUTPUT:", raw);
    throw new Error("Invalid AI JSON");
  }

  /* =========================
     PRICE FALLBACK
  ========================= */
  const priceFallback =
    pricing === "low" ? "14.99" : pricing === "premium" ? "79.99" : "29.99";

  /* =========================
     IMAGE GENERATION (NON-BLOCKING)
  ========================= */
  let images = [];

  const imageStylePrompts = {
    studio: "professional studio product photography, white background, clean lighting",
    "3d": "3D rendered product, high quality CGI, realistic materials",
    lifestyle: "lifestyle product photography, natural setting, in-use context",
    minimal: "minimalist white background, simple composition, clean aesthetic",
  };

  const stylePrompt = imageStylePrompts[imageStyle] || imageStylePrompts.studio;

  const imagePrompt =
    ai.imagePrompt || `${stylePrompt}, ${title}, high quality, ecommerce photo`;

  try {
    // Attempt to generate images
    const generatedImages = await Promise.all(
      Array.from({ length: Math.min(imageCount, 3) }).map(async () => {
        const base64 = await generateImageWithHF(imagePrompt);
        return base64;
      }),
    );
    
    // Only use if we got valid data
    if (generatedImages.length > 0 && generatedImages.every(img => img && img.length > 100)) {
      images = generatedImages;
      console.log(`✅ Generated ${images.length} AI images`);
    } else {
      throw new Error("Generated images invalid");
    }
  } catch (err) {
    console.warn(`⚠️ Image generation failed: ${err.message}. Using placeholder images.`);
    // Use reliable placeholder URLs that Shopify can fetch directly
    images = Array.from({ length: imageCount }).map(
      (_, i) => `https://picsum.photos/600/600?random=${Date.now() + i}`,
    );
    console.log(`📸 Using ${images.length} placeholder images as fallback`);
  }

  /* =========================
     DESCRIPTION NORMALIZATION (CRITICAL)
  ========================= */
  const descriptionHtml =
    typeof ai.descriptionHtml === "string" &&
    ai.descriptionHtml.replace(/<[^>]+>/g, "").trim().length > 20
      ? ai.descriptionHtml
      : `<p><strong>${title}</strong> is a premium product generated by AI.</p>
         <p>Designed for performance, reliability, and everyday use.</p>`;

  /* =========================
     VARIANTS NORMALIZATION
  ========================= */
  let variants = [];
  if (ai.variants?.length > 0) {
    variants = ai.variants.map((v) => ({
      option1: v.option1 || v.title || "Default",
      price:
        String(v.price).trim() && Number(v.price) > 0
          ? String(v.price)
          : priceFallback,
      compareAtPrice: v.compareAtPrice || "",
    }));
  } else {
    variants = [{ option1: "Default", price: priceFallback, compareAtPrice: "" }];
  }

  /* =========================
     FINAL PRODUCT OBJECT
  ========================= */
  return {
    title,
    descriptionHtml,
    variants,
    tags: Array.isArray(ai.tags) ? ai.tags : [],
    seo: {
      title: ai.seo?.title || title,
      description:
        ai.seo?.description || `Buy premium ${title} at the best price.`,
    },
    images,
  };
}

