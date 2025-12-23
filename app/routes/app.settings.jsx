import { Form } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const formData = await request.formData();

  const settings = {
    tone: formData.get("tone"),
    imageStyle: formData.get("imageStyle"),
    pricing: formData.get("pricing"),
  };

  // For now we just return it (session-based)
  return { settings, saved: true };
};

export default function SettingsPage() {
  return (
    <s-page heading="AI Preferences">
      <s-card>
        <Form method="post">
          <s-block-stack gap="base">
            <s-select
              label="Product tone"
              name="tone"
              options={[
                { label: "Luxury", value: "luxury" },
                { label: "Simple", value: "simple" },
                { label: "Fun", value: "fun" },
                { label: "SEO-rich", value: "seo" },
              ]}
            />

            <s-select
              label="Image style"
              name="imageStyle"
              options={[
                { label: "Studio", value: "studio" },
                { label: "3D", value: "3d" },
                { label: "Lifestyle", value: "lifestyle" },
              ]}
            />

            <s-select
              label="Pricing strategy"
              name="pricing"
              options={[
                { label: "Low", value: "low" },
                { label: "Medium", value: "medium" },
                { label: "Premium", value: "premium" },
              ]}
            />

            <s-button submit variant="primary">
              Save preferences
            </s-button>
          </s-block-stack>
        </Form>
      </s-card>
    </s-page>
  );
}
