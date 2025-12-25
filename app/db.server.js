import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient();

export default prisma;

/* ================= AI SETTINGS ================= */
export async function getAISettings(shop) {
  try {
    const settings = await prisma.aISettings.findUnique({
      where: { shop },
    });
    return settings;
  } catch (error) {
    console.error("Error getting AI settings:", error);
    return null;
  }
}

export async function saveAISettings(data) {
  try {
    const settings = await prisma.aISettings.upsert({
      where: { shop: data.shop },
      update: {
        tone: data.tone,
        imageStyle: data.imageStyle,
        imageCount: data.imageCount,
        pricingStrategy: data.pricingStrategy,
      },
      create: {
        shop: data.shop,
        tone: data.tone,
        imageStyle: data.imageStyle,
        imageCount: data.imageCount,
        pricingStrategy: data.pricingStrategy,
      },
    });
    return settings;
  } catch (error) {
    console.error("Error saving AI settings:", error);
    throw error;
  }
}

/* ================= PRODUCT GENERATION HISTORY ================= */
export async function saveProductGeneration(shop, title, productId = null) {
  try {
    const generation = await prisma.productGeneration.create({
      data: {
        shop,
        title,
        productId,
        status: productId ? "published" : "generated",
      },
    });
    return generation;
  } catch (error) {
    console.error("Error saving product generation:", error);
    return null;
  }
}

export async function getProductGenerations(shop, limit = 10) {
  try {
    const generations = await prisma.productGeneration.findMany({
      where: { shop },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return generations;
  } catch (error) {
    console.error("Error getting product generations:", error);
    return [];
  }
}

export async function getProductGenerationStats(shop) {
  try {
    const total = await prisma.productGeneration.count({
      where: { shop },
    });
    const published = await prisma.productGeneration.count({
      where: { shop, status: "published" },
    });
    return { total, published };
  } catch (error) {
    console.error("Error getting stats:", error);
    return { total: 0, published: 0 };
  }
}
