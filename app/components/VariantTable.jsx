import { DataTable, Card, BlockStack, Text } from "@shopify/polaris";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";

export function VariantTable({ variants }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (variants && variants.length > 0) {
      setRows(
        variants.map((v, idx) => [
          idx + 1,
          v.option1 || "Default",
          `$${v.price || "0.00"}`,
          v.compareAtPrice ? `$${v.compareAtPrice}` : "-",
        ])
      );
    }
  }, [variants]);

  return (
    <BlockStack gap="300">
      <Text as="h3" variant="headingSm">
        Variants ({variants?.length || 0})
      </Text>
      <Card>
        <DataTable
          columnContentTypes={["numeric", "text", "numeric", "numeric"]}
          headings={["#", "Option", "Price", "Compare At"]}
          rows={rows}
          hoverable
        />
      </Card>
    </BlockStack>
  );
}

VariantTable.propTypes = {
  variants: PropTypes.array,
};
