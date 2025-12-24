import {
  Page,
  Card,
  Button,
  TextField,
  Banner,
  InlineStack,
} from "@shopify/polaris";
import { useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import { generateProductWithAI } from "../bigmodel.server";
import { ProductPreviewModal } from "../components/ProductPreviewModal";
import { createProduct } from "../lib/shopifyGraphql";

/* ================= LOADER ================= */
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

/* ================= ACTION (TEMP SAFE) ================= */
// export const action = async ({ request }) => {
//   try {
//     const formData = await request.formData();
//     const intent = formData.get("intent");

//     if (intent === "generate") {
//       const query = formData.get("query");

//       if (!query || !query.trim()) {
//         return { error: "Search query is required" };
//       }

//       let aiProduct;

//       try {
//         // ✅ REAL AI CALL (SAFE)
//         aiProduct = await generateProductWithAI({
//           title: query,
//         });
//       } catch (aiError) {
//         console.error("❌ AI FAILED:", aiError);

//         // 🔁 FALLBACK (NO CRASH)
//         aiProduct = {
//           title: query,
//           descriptionHtml: `<p>AI failed. Temporary product for ${query}</p>`,
//           images: [],
//           tags: [],
//           variants: [{ title: "Default", price: "0.00" }],
//         };
//       }

//       return { aiProduct };
//     }

//     return null;
//   } catch (err) {
//     console.error("🔥 ACTION CRASHED:", err);
//     return { error: "Internal server error" };
//   }
// };
export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    /* ================= GENERATE ================= */
    if (intent === "generate") {
      const query = formData.get("query");

      if (!query?.trim()) {
        return { error: "Search query is required" };
      }

      const aiProduct = await generateProductWithAI({
        title: query,
      });

      return { aiProduct };
    }

    /* ================= SAVE ================= */
    if (intent === "save") {
      const product = JSON.parse(formData.get("product"));

      // 🔐 Validation
      if (!product.title) {
        return { error: "Product title is required" };
      }

      await createProduct(admin, product);

      return { success: true };
    }

    return null;
  } catch (err) {
    console.error("ACTION ERROR:", err);
    return { error: "Something went wrong" };
  }
};

/* ================= PAGE ================= */
export default function AIProducts() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const loading = navigation.state === "submitting";
  const [showPreview, setShowPreview] = useState(false);

  const [query, setQuery] = useState("");

  return (
    <Page title="AI Product Generator">
      {actionData?.success && (
        <Banner tone="success">Product created successfully 🎉</Banner>
      )}
      {actionData?.error && <Banner tone="critical">{actionData.error}</Banner>}

      <Card>
        <Form method="post">
          <input type="hidden" name="intent" value="generate" />

          <TextField
            label="Search product idea"
            placeholder="e.g. Wireless Headphones"
            value={query}
            onChange={setQuery}
            autoComplete="off"
          />

          <input type="hidden" name="query" value={query} />

          <InlineStack align="end" gap="300">
            <Button
              submit
              loading={loading}
              disabled={!query.trim()}
              onClick={() => setShowPreview(true)}
            >
              Generate with AI
            </Button>
          </InlineStack>
        </Form>
      </Card>

      {/* {actionData?.aiProduct && (
        <pre style={{ marginTop: 16 }}>
          {JSON.stringify(actionData.aiProduct, null, 2)}
        </pre>
      )} */}
      {actionData?.aiProduct && showPreview && (
        <ProductPreviewModal
          product={actionData.aiProduct}
          onClose={() => setShowPreview(false)}
        />
      )}
    </Page>
  );
}
