/* eslint-disable react/prop-types */

import {
  Form,
  useActionData,
  useNavigation,
  useLoaderData,
} from "react-router";
import { authenticate } from "../shopify.server";
import { generateProductWithAI } from "../bigmodel.server";
// import { createProduct, createVariants } from "../lib/shopifyGraphql";
import { createProduct } from "../lib/shopifyGraphql";

/* ================= LOADER ================= */
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return {
    settings: {
      tone: "seo",
      imageStyle: "studio",
      pricing: "medium",
    },
  };
};

/* ================= ACTION ================= */
export const action = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "generate") {
    const title = formData.get("title");
    const tone = formData.get("tone");
    const imageStyle = formData.get("imageStyle");
    const pricing = formData.get("pricing");

    const aiProduct = await generateProductWithAI({
      title,
      tone,
      imageStyle,
      pricing,
    });

    return { aiProduct };
  }

  if (intent === "publish") {
    const raw = formData.get("product");
    if (!raw) return { error: "Missing product data" };

    const product = JSON.parse(raw);
    const { admin } = await authenticate.admin(request);

    const result = await createProduct(admin, product);

    const errors = result.data.productCreate.userErrors;
    if (errors.length) {
      return { error: errors[0].message };
    }

    return {
      success: true,
      productId: result.data.productCreate.product.id,
    };
  }

  return null;
};

/* ================= PAGE ================= */
export default function AIProductGenerator() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const { settings } = useLoaderData();

  const isLoading = navigation.state === "submitting";

  return (
    <s-page heading="AI Product Generator">
      <s-card>
        <Form method="post">
          <input type="hidden" name="intent" value="generate" />
          <input type="hidden" name="tone" value={settings.tone} />
          <input type="hidden" name="imageStyle" value={settings.imageStyle} />
          <input type="hidden" name="pricing" value={settings.pricing} />
          <s-block-stack gap="base">
            <s-text-field
              label="Product title"
              name="title"
              placeholder="e.g. AI SaaS Pricing Tool"
              required
            />

            <s-button type="submit" variant="primary" loading={isLoading}>
              Generate product with AI
            </s-button>
          </s-block-stack>
        </Form>
      </s-card>

      {isLoading && (
        <s-card>
          <s-block-stack gap="base">
            <s-skeleton-display-text size="large" />
            <s-skeleton-body-text lines={4} />
            <s-skeleton-body-text lines={2} />
          </s-block-stack>
        </s-card>
      )}

      {actionData?.error && (
        <s-banner tone="critical" title="Something went wrong">
          <p>{actionData.error}</p>
        </s-banner>
      )}

      {actionData?.success && (
        <s-banner tone="success">
          Product created successfully in Shopify 🎉
        </s-banner>
      )}

      {!isLoading && !actionData?.aiProduct && !actionData?.error && (
        <s-card>
          <s-empty-state
            heading="Generate a product using AI"
            action={{ content: "Enter a product title above" }}
          >
            <p>
              Type a product name and let AI generate description, variants, and
              tags for you.
            </p>
          </s-empty-state>
        </s-card>
      )}

      {actionData?.aiProduct && (
        <s-block-stack gap="base">
          <AIPreview
            product={actionData.aiProduct}
            published={actionData?.success}
          />
        </s-block-stack>
      )}
    </s-page>
  );
}

/* ================= PREVIEW ================= */
function AIPreview({ product, published = false }) {
  return (
    <s-card>
      <s-block-stack gap="base">
        <s-heading>{product.title}</s-heading>

        <div dangerouslySetInnerHTML={{ __html: product.description_html }} />

        <s-heading level="3">Variants</s-heading>
        <s-data-table
          columnContentTypes={["text", "numeric"]}
          headings={["Variant", "Price"]}
          rows={product.variants.map((v) => [v.name, `$${v.price}`])}
        />

        <s-heading level="3">Tags</s-heading>
        <s-inline-stack gap="tight">
          {product.tags.map((tag) => (
            <s-badge key={tag}>{tag}</s-badge>
          ))}
        </s-inline-stack>

        <s-heading level="3">SEO</s-heading>
        <s-text>
          <strong>Title:</strong> {product.seo.title}
        </s-text>
        <s-text>
          <strong>Description:</strong> {product.seo.description}
        </s-text>

        {!published && (
          <Form method="post">
            <input type="hidden" name="intent" value="publish" />
            <input
              type="hidden"
              name="product"
              value={JSON.stringify(product)}
            />

            <s-button type="submit" variant="primary">
              Save to Shopify
            </s-button>
          </Form>
        )}

        {published && (
          <s-banner tone="success">
            Product created successfully in Shopify 🎉
          </s-banner>
        )}
      </s-block-stack>
    </s-card>
  );
}
