export async function generateProductWithAI({
  title,
  tone,
  imageStyle,
  pricing,
}) {
  /* ======================
     DEV MODE (STABLE)
  ====================== */
  if (process.env.NODE_ENV !== "production") {
    return {
      title,
      description_html: `
        <p><strong>${title}</strong> is a premium AI-generated product designed for modern businesses.</p>
        <ul>
          <li>Fast & reliable</li>
          <li>SEO optimized</li>
          <li>Easy to scale</li>
        </ul>
      `,
      images: [
        "https://picsum.photos/600/600?random=11",
        "https://picsum.photos/600/600?random=12",
        "https://picsum.photos/600/600?random=13",
      ],
      variants: [
        { name: "Basic", price: 29 },
        { name: "Pro", price: 59 },
      ],
      tags: ["AI", "Automation", "SaaS"],
      seo: {
        title: `${title} – AI Powered Product`,
        description: `Buy ${title} with AI-generated features and optimized pricing.`,
      },
    };
  }

  /* ======================
     PRODUCTION (REAL AI)
  ====================== */

  // 🔥 Example only – keep your provider here
  // MUST return image URLs (DALL·E, Replicate, etc.)

  return {
    title,
    description_html: "<p>Real AI description</p>",
    images: ["https://generated-image-url-1", "https://generated-image-url-2"],
    variants: [{ name: "Standard", price: 49 }],
    tags: ["AI"],
    seo: {
      title,
      description: "SEO optimized AI product",
    },
  };
}
