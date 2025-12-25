import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  EmptyState,
  DataTable,
} from "@shopify/polaris";
import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { getProductGenerationStats, getProductGenerations } from "../db.server";

/* ================= LOADER ================= */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const stats = await getProductGenerationStats(session.shop);
  const recentGenerations = await getProductGenerations(session.shop, 5);

  return { stats, recentGenerations };
};

/* ================= PAGE ================= */
export default function AppIndex() {
  const { stats, recentGenerations } = useLoaderData();
  const navigate = useNavigate();

  const rows = recentGenerations.map((gen) => [
    gen.title,
    gen.status === "published" ? "✅ Published" : "📝 Draft",
    new Date(gen.createdAt).toLocaleDateString(),
  ]);

  return (
    <Page title="AI Product Generator Dashboard">
      <BlockStack gap="500">
        {/* Stats Cards */}
        <InlineStack gap="400">
          <div style={{ flex: 1 }}>
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Total Generated
                </Text>
                <Text as="h2" variant="heading2xl">
                  {stats.total}
                </Text>
              </BlockStack>
            </Card>
          </div>
          <div style={{ flex: 1 }}>
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Published
                </Text>
                <Text as="h2" variant="heading2xl">
                  {stats.published}
                </Text>
              </BlockStack>
            </Card>
          </div>
          <div style={{ flex: 1 }}>
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Success Rate
                </Text>
                <Text as="h2" variant="heading2xl">
                  {stats.total > 0
                    ? Math.round((stats.published / stats.total) * 100)
                    : 0}
                  %
                </Text>
              </BlockStack>
            </Card>
          </div>
        </InlineStack>

        {/* CTA Card */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingLg">
              Generate AI Products
            </Text>
            <Text as="p" variant="bodyMd">
              Create complete products with AI-generated descriptions, images, variants,
              and pricing in seconds.
            </Text>
            <InlineStack gap="300">
              <Button variant="primary" onClick={() => navigate("/app/ai")}>
                Generate New Product
              </Button>
              <Button onClick={() => navigate("/app/settings")}>
                AI Settings
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Recent Generations */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingLg">
              Recent Generations
            </Text>
            {recentGenerations.length > 0 ? (
              <DataTable
                columnContentTypes={["text", "text", "text"]}
                headings={["Product Title", "Status", "Created"]}
                rows={rows}
                hoverable
              />
            ) : (
              <EmptyState
                heading="No products generated yet"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Start by generating your first AI product!</p>
              </EmptyState>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}

