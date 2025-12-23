// // app/services/bigmodel.server.js

// const BIGMODEL_API_URL =
//   "https://open.bigmodel.cn/api/paas/v4/chat/completions";

// export async function generateProductWithAI({ title }) {
//   if (process.env.NODE_ENV !== "production") {
//     return {
//       title,
//       description_html: "<p>AI generated description</p>",
//       features: ["Fast", "Reliable", "AI Powered"],
//       tags: ["AI", "SaaS", "Automation"],
//       variants: [{ name: "Basic", price: 29 }],
//       seo: {
//         title,
//         description: "AI generated SEO description",
//       },
//     };
//   }

//   const apiKey = process.env.BIGMODEL_API_KEY;

//   if (!apiKey) {
//     throw new Error("BIGMODEL_API_KEY is missing");
//   }

//   const prompt = `
// You are an AI that generates Shopify product data.

// Rules:
// - Respond ONLY with valid JSON
// - No markdown
// - No explanations
// - No backticks

// Product details:
// Title: "${title}"
// Tone: ${tone}
// Image style: ${imageStyle}
// Pricing strategy: ${pricing}

// Generate:
// - High-converting HTML description
// - Feature bullets
// - SEO title and description
// - 3–4 product variants
// - Prices based on pricing strategy
// - Tags

// JSON schema:
// {
//   "title": string,
//   "description_html": string,
//   "features": string[],
//   "tags": string[],
//   "variants": { "name": string, "price": number }[],
//   "seo": { "title": string, "description": string }
// }
// `;

//   const response = await fetch(BIGMODEL_API_URL, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${apiKey}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       model: "glm-4",
//       messages: [
//         { role: "system", content: "You generate structured product data." },
//         { role: "user", content: prompt },
//       ],
//       temperature: 0.7,
//     }),
//   });

//   if (!response.ok) {
//     const errorText = await response.text();
//     throw new Error(`BigModel API error: ${errorText}`);
//   }

//   const data = await response.json();
//   let content = data.choices?.[0]?.message?.content;

//   if (!content) {
//     throw new Error("Empty AI response");
//   }

//   // 🧹 Safety cleanup (important)
//   content = content
//     .replace(/```json/g, "")
//     .replace(/```/g, "")
//     .trim();

//   let parsed;
//   try {
//     parsed = JSON.parse(content);
//   } catch (err) {
//     console.error("AI RAW OUTPUT:", content);
//     throw new Error("AI did not return valid JSON");
//   }

//   return parsed;
// }

export async function generateProductWithAI({ title }) {
  // DEV MODE (mocked AI – KEEP THIS)
  // if (process.env.NODE_ENV !== "production") {
  //   return {
  //     title,
  //     description_html: "<p>AI generated description</p>",
  //     features: ["Fast", "Reliable", "AI Powered"],
  //     tags: ["AI", "SaaS", "Automation"],
  //     variants: [{ name: "Basic", price: 29 }],
  //     seo: {
  //       title,
  //       description: "AI generated SEO description",
  //     },
  //   };
  // }

  // REAL AI (production)
  const apiKey = process.env.BIGMODEL_API_KEY;
  if (!apiKey) {
    throw new Error("BIGMODEL_API_KEY is missing");
  }

  const prompt = `
You are an AI that generates Shopify product data.

Rules:
- Respond ONLY with valid JSON
- No markdown
- No explanations
- No backticks

JSON schema:
{
  "title": string,
  "description_html": string,
  "features": string[],
  "tags": string[],
  "variants": { "name": string, "price": number }[],
  "seo": { "title": string, "description": string }
}

Product title: "${title}"
`;

  const response = await fetch(
    "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "glm-4",
        messages: [
          { role: "system", content: "You generate Shopify product data." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content;

  content = content.replace(/```json|```/g, "").trim();

  return JSON.parse(content);
}
