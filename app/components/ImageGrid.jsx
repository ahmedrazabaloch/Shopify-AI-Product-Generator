import { InlineStack, Thumbnail, BlockStack, Text } from "@shopify/polaris";
import PropTypes from "prop-types";

export function ImageGrid({ images }) {
  if (!images || images.length === 0) {
    return (
      <BlockStack gap="200">
        <Text as="p" variant="bodyMd" tone="subdued">
          No images generated
        </Text>
      </BlockStack>
    );
  }

  return (
    <BlockStack gap="300">
      <Text as="h3" variant="headingSm">
        Product Images ({images.length})
      </Text>
      <InlineStack gap="300" wrap>
        {images.map((img, i) => (
          <Thumbnail
            key={i}
            source={img}
            alt={`Product image ${i + 1}`}
            size="large"
          />
        ))}
      </InlineStack>
    </BlockStack>
  );
}

ImageGrid.propTypes = {
  images: PropTypes.array,
};
