import {
  Page,
  Card,
  Button,
  TextField,
  Banner,
  InlineStack,
  BlockStack,
} from "@shopify/polaris";
import { useState, useEffect } from "react";
import { Form, useActionData, useNavigation, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { generateProductWithAI } from "../bigmodel.server";
import { ProductPreviewModal } from "../components/ProductPreviewModal";
import { createProduct } from "../lib/shopifyGraphql";
import { uploadProductImages } from "../graphql/uploadMedia";
import { getAISettings, saveProductGeneration } from "../db.server";

/* ================= LOADER ================= */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await getAISettings(session.shop);

  return {
    settings: settings || {
      tone: "seo",
      imageStyle: "studio",
      imageCount: 3,
      pricingStrategy: "medium",
    },
  };
};

/* ================= ACTION ================= */
export const action = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    /* ================= GENERATE ================= */
    if (intent === "generate") {
      const query = formData.get("query");

      if (!query?.trim()) {
        return { error: "Product title is required" };
      }

      const settings = await getAISettings(session.shop);

      const aiProduct = await generateProductWithAI({
        title: query,
        tone: settings?.tone || "seo",
        pricing: settings?.pricingStrategy || "medium",
        imageStyle: settings?.imageStyle || "studio",
        imageCount: settings?.imageCount || 3,
      });

      // Save to history
      await saveProductGeneration(session.shop, query);

      return { aiProduct };
    }

    /* ================= SAVE ================= */
    if (intent === "save") {
      const product = JSON.parse(formData.get("product"));

      // Validation
      if (!product.title) {
        return { error: "Product title is required" };
      }
      if (!product.descriptionHtml || product.descriptionHtml.trim() === "") {
        return { error: "Description is required" };
      }

      // Step 1: Create the product with variants and pricing
      const createdProduct = await createProduct(admin, product);

      // Step 2: Upload images if available
      if (product.images && product.images.length > 0) {
        try {
          console.log(`📸 Starting image upload: ${product.images.length} images`);
          console.log(`📸 Image types:`, product.images.map((img) => 
            typeof img === "string" ? (img.startsWith("http") ? "URL" : "BASE64") : "unknown"
          ));
          await uploadProductImages(admin, createdProduct.id, product.images);
          console.log(`✅ Uploaded ${product.images.length} images to product ${createdProduct.id}`);
        } catch (imgError) {
          console.error("⚠️ Image upload failed:", imgError.message);
          // Continue even if images fail - product is created with text/descriptions
        }
      } else {
        console.log("⚠️ No images provided for product");
      }

      // Step 3: Update generation status
      await saveProductGeneration(session.shop, product.title, createdProduct.id);

      return { success: true };
    }

    return null;
  } catch (err) {
    console.error("ACTION ERROR:", err);
    return { error: err.message || "Something went wrong" };
  }
};

/* ================= PAGE ================= */
export default function AIProducts() {
  const { settings } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const loading = navigation.state === "submitting";
  const [showPreview, setShowPreview] = useState(false);

  const [query, setQuery] = useState("");

  useEffect(() => {
    if (actionData?.aiProduct) {
      setShowPreview(true);
    }
    if (actionData?.success) {
      setShowPreview(false);
      setQuery("");
    }
  }, [actionData]);

  return (
    <Page
      title="AI Product Generator"
      subtitle="Enter a product title and let AI generate everything else"
    >
      <BlockStack gap="500">
        {actionData?.success && (
          <Banner tone="success" onDismiss={() => {}}>
            Product created successfully! 🎉
          </Banner>
        )}

        {actionData?.error && (
          <Banner tone="critical" onDismiss={() => {}}>
            {actionData.error}
          </Banner>
        )}

        <Card>
          <Form method="post">
            <input type="hidden" name="intent" value="generate" />

            <BlockStack gap="400">
              <TextField
                label="Product Title"
                placeholder="e.g. Wireless Headphones, Smart Watch, Yoga Mat"
                value={query}
                onChange={setQuery}
                autoComplete="off"
                helpText="AI will generate description, images, variants, and pricing"
              />

              <input type="hidden" name="query" value={query} />

              <InlineStack align="end" gap="300">
                <Button
                  submit
                  variant="primary"
                  loading={loading}
                  disabled={!query.trim() || loading}
                >
                  Generate with AI
                </Button>
              </InlineStack>
            </BlockStack>
          </Form>
        </Card>

        <Card>
          <BlockStack gap="200">
            <strong>Current AI Settings:</strong>
            <p>• Tone: {settings.tone.toUpperCase()}</p>
            <p>• Image Style: {settings.imageStyle.toUpperCase()}</p>
            <p>• Images: {settings.imageCount}</p>
            <p>• Pricing: {settings.pricingStrategy.toUpperCase()}</p>
          </BlockStack>
        </Card>
      </BlockStack>

      {actionData?.aiProduct && showPreview && (
        <ProductPreviewModal
          product={actionData.aiProduct}
          onClose={() => setShowPreview(false)}
        />
      )}
    </Page>
  );
}

