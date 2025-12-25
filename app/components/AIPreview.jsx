import { BlockStack, Card, Text, Divider } from "@shopify/polaris";
import PropTypes from "prop-types";
import { ImageGrid } from "./ImageGrid";
import { VariantTable } from "./VariantTable";

export function AIPreview({ product }) {
  if (!product) {
    return null;
  }

  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingLg">
            {product.title}
          </Text>
          <Divider />
          <div
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            style={{ lineHeight: "1.6" }}
          />
        </BlockStack>
      </Card>

      <ImageGrid images={product.images} />

      <VariantTable variants={product.variants} />

      {product.tags && product.tags.length > 0 && (
        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm">
              Tags
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              {product.tags.join(", ")}
            </Text>
          </BlockStack>
        </Card>
      )}
    </BlockStack>
  );
}

AIPreview.propTypes = {
  product: PropTypes.object,
};
