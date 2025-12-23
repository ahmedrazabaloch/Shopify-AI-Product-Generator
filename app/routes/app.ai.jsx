import {
  Form,
  useActionData,
  useNavigation,
  useLoaderData,
} from "react-router";
import { authenticate } from "../shopify.server";
import { generateProductWithAI } from "../bigmodel.server";
import {
  createProduct,
  uploadProductImages,
  createVariants,
} from "../lib/shopifyGraphql";

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
  const { admin } = await authenticate.admin(request);

  if (intent === "generate") {
    const title = formData.get("title");
    const aiProduct = await generateProductWithAI({ title });
    return { aiProduct };
  }

  if (intent === "save") {
    const product = JSON.parse(formData.get("product"));

    const created = await createProduct(admin, product);

    if (product.images?.length) {
      await uploadProductImages(admin, created.id, product.images);
    }

    if (product.variants?.length) {
      await createVariants(admin, created.id, product.variants);
    }

    return { success: true };
  }

  return null;
};

/* ================= PAGE ================= */
export default function AIProductGenerator() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const { settings } = useLoaderData();

  return (
    <s-page heading="AI Product Generator">
      <s-card>
        <Form method="post">
          <input type="hidden" name="intent" value="generate" />
          <s-text-field label="Product title" name="title" required />
          <s-button type="submit" loading={navigation.state === "submitting"}>
            Generate with AI
          </s-button>
        </Form>
      </s-card>

      {actionData?.aiProduct && <AIPreview product={actionData.aiProduct} />}

      {actionData?.success && (
        <s-banner tone="success">Product created 🎉</s-banner>
      )}
    </s-page>
  );
}

/* ================= PREVIEW ================= */
function AIPreview({ product }) {
  return (
    <s-card>
      <s-heading>{product.title}</s-heading>

      <div dangerouslySetInnerHTML={{ __html: product.description_html }} />

      <s-inline-stack gap="base">
        {product.images.map((img) => (
          <img key={img} src={img} width="120" />
        ))}
      </s-inline-stack>

      <Form method="post">
        <input type="hidden" name="intent" value="save" />
        <input type="hidden" name="product" value={JSON.stringify(product)} />
        <s-button type="submit">Save to Shopify</s-button>
      </Form>
    </s-card>
  );
}
