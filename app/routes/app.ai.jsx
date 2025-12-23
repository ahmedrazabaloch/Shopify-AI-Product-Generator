import { Form, useActionData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import { generateProductWithAI } from "../bigmodel.server";

/* LOADER */
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

/* ACTION */
export const action = async ({ request }) => {
  const formData = await request.formData();
  const title = formData.get("title");

  if (!title) {
    return { error: "Product title is required" };
  }

  const aiProduct = await generateProductWithAI({ title });
  return { aiProduct };
};

/* PAGE */
export default function AIProductGenerator() {
  const actionData = useActionData();
  const navigation = useNavigation();

  const isLoading =
    navigation.state === "submitting" ||
    navigation.state === "loading";

  return (
    <s-page heading="AI Product Generator">
      <s-card>
        <Form method="post" action="/app/ai">
          <s-block-stack gap="base">
            <s-text-field
              label="Product title"
              name="title"
              placeholder="e.g. AI SaaS Pricing Tool"
              required
            />

            <s-button
              submit
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
            >
              Generate product with AI
            </s-button>
          </s-block-stack>
        </Form>
      </s-card>

      {isLoading && (
        <s-banner tone="info">
          Generating product with AI… please wait.
        </s-banner>
      )}

      {actionData?.error && (
        <s-banner tone="critical">{actionData.error}</s-banner>
      )}

      {actionData?.aiProduct && (
        <AIPreview product={actionData.aiProduct} />
      )}
    </s-page>
  );
}

/* PREVIEW */
function AIPreview({ product }) {
  return (
    <s-card>
      <s-block-stack gap="base">
        <s-heading>{product.title}</s-heading>
      </s-block-stack>
    </s-card>
  );
}
