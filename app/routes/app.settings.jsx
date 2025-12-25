import {
  Page,
  Card,
  Select,
  BlockStack,
  Banner,
  Text,
} from "@shopify/polaris";
import { useState } from "react";
import { Form, useLoaderData, useActionData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import { getAISettings, saveAISettings } from "../db.server";

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
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();

    const settings = {
      shop: session.shop,
      tone: formData.get("tone"),
      imageStyle: formData.get("imageStyle"),
      imageCount: parseInt(formData.get("imageCount")),
      pricingStrategy: formData.get("pricingStrategy"),
    };

    await saveAISettings(settings);

    return { success: true };
  } catch (error) {
    console.error("Settings save error:", error);
    return { error: error.message };
  }
};

/* ================= PAGE ================= */
export default function SettingsPage() {
  const { settings } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const loading = navigation.state === "submitting";

  const [tone, setTone] = useState(settings.tone);
  const [imageStyle, setImageStyle] = useState(settings.imageStyle);
  const [imageCount, setImageCount] = useState(String(settings.imageCount));
  const [pricingStrategy, setPricingStrategy] = useState(settings.pricingStrategy);

  const toneOptions = [
    { label: "SEO Optimized (Recommended)", value: "seo" },
    { label: "Luxury & Premium", value: "luxury" },
    { label: "Simple & Clean", value: "simple" },
    { label: "Fun & Playful", value: "fun" },
    { label: "Professional", value: "professional" },
  ];

  const imageStyleOptions = [
    { label: "Studio Photography", value: "studio" },
    { label: "3D Render", value: "3d" },
    { label: "Lifestyle & Context", value: "lifestyle" },
    { label: "Minimalist White Background", value: "minimal" },
  ];

  const imageCountOptions = [
    { label: "1 Image", value: "1" },
    { label: "2 Images", value: "2" },
    { label: "3 Images (Recommended)", value: "3" },
    { label: "4 Images", value: "4" },
    { label: "5 Images", value: "5" },
  ];

  const pricingOptions = [
    { label: "Budget Friendly (Low)", value: "low" },
    { label: "Market Average (Medium)", value: "medium" },
    { label: "Premium Pricing (High)", value: "premium" },
  ];

  return (
    <Page
      title="AI Settings"
      subtitle="Customize how AI generates your products"
      primaryAction={{
        content: "Save Settings",
        loading,
        onAction: () => document.getElementById("settings-form").requestSubmit(),
      }}
    >
      <BlockStack gap="500">
        {actionData?.success && (
          <Banner tone="success" onDismiss={() => {}}>
            Settings saved successfully!
          </Banner>
        )}

        {actionData?.error && (
          <Banner tone="critical">
            Error: {actionData.error}
          </Banner>
        )}

        <Form method="post" id="settings-form">
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Content Generation
                </Text>
                
                <Select
                  label="Product Description Tone"
                  options={toneOptions}
                  value={tone}
                  onChange={setTone}
                  helpText="Choose the writing style for AI-generated descriptions"
                />
                <input type="hidden" name="tone" value={tone} />

                <Select
                  label="Pricing Strategy"
                  options={pricingOptions}
                  value={pricingStrategy}
                  onChange={setPricingStrategy}
                  helpText="Default pricing level for generated products"
                />
                <input type="hidden" name="pricingStrategy" value={pricingStrategy} />
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Image Generation
                </Text>

                <Select
                  label="Image Style"
                  options={imageStyleOptions}
                  value={imageStyle}
                  onChange={setImageStyle}
                  helpText="Visual style for AI-generated product images"
                />
                <input type="hidden" name="imageStyle" value={imageStyle} />

                <Select
                  label="Number of Images"
                  options={imageCountOptions}
                  value={imageCount}
                  onChange={setImageCount}
                  helpText="How many images to generate per product"
                />
                <input type="hidden" name="imageCount" value={imageCount} />
              </BlockStack>
            </Card>
          </BlockStack>
        </Form>
      </BlockStack>
    </Page>
  );
}
