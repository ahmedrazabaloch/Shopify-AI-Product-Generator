import {
  Modal,
  TextField,
  InlineStack,
  BlockStack,
  Card,
  Tag,
  Thumbnail,
  Button,
  Text,
  Divider,
} from "@shopify/polaris";
import { Form, useNavigation } from "react-router";
import { useState } from "react";
import PropTypes from "prop-types";

export function ProductPreviewModal({ product, onClose }) {
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState(product.title);
  const [tags, setTags] = useState(product.tags.join(", "));
  const [variants, setVariants] = useState(
    product.variants && product.variants.length > 0
      ? product.variants
      : [{ option1: "Default", price: "0.00", compareAtPrice: "" }]
  );

  const navigation = useNavigation();
  const saving =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "save";

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const updateVariant = (index, field, value) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      { option1: `Variant ${variants.length + 1}`, price: "0.00", compareAtPrice: "" },
    ]);
  };

  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="AI Product Preview"
      primaryAction={{
        content: "Save to Shopify",
        loading: saving,
        disabled: saving,
        onAction: () => {
          document.getElementById("save-product-form").requestSubmit();
        },
      }}
      secondaryActions={[{ content: "Cancel", onAction: handleClose }]}
    >
      <Modal.Section>
        <Form method="post" id="save-product-form">
          <input type="hidden" name="intent" value="save" />

          <input
            type="hidden"
            name="product"
            value={JSON.stringify({
              ...product,
              title,
              tags: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
              variants,
            })}
          />

          <BlockStack gap="400">
            <TextField
              label="Product Title"
              value={title}
              onChange={setTitle}
              autoComplete="off"
            />

            <TextField
              label="Tags (comma separated)"
              value={tags}
              onChange={setTags}
              helpText="Separate tags with commas"
            />

            <InlineStack gap="200" wrap>
              {tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
            </InlineStack>

            <Divider />

            {product.images?.length > 0 && (
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Product Images ({product.images.length})
                </Text>
                <InlineStack gap="300" wrap>
                  {product.images.map((img, i) => (
                    <Thumbnail
                      key={i}
                      source={img}
                      alt={`Product image ${i + 1}`}
                      size="large"
                    />
                  ))}
                </InlineStack>
              </BlockStack>
            )}

            <Divider />

            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingSm">
                  Variants ({variants.length})
                </Text>
                <Button size="slim" onClick={addVariant}>
                  Add Variant
                </Button>
              </InlineStack>

              <Card>
                <BlockStack gap="300">
                  {variants.map((variant, index) => (
                    <Card key={index}>
                      <BlockStack gap="300">
                        <InlineStack align="space-between">
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            Variant {index + 1}
                          </Text>
                          {variants.length > 1 && (
                            <Button
                              size="slim"
                              variant="plain"
                              tone="critical"
                              onClick={() => removeVariant(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </InlineStack>

                        <TextField
                          label="Option Name"
                          value={variant.option1 || ""}
                          onChange={(value) => updateVariant(index, "option1", value)}
                          placeholder="e.g. Small, Medium, Large"
                        />

                        <InlineStack gap="300">
                          <div style={{ flex: 1 }}>
                            <TextField
                              label="Price"
                              type="number"
                              value={variant.price || ""}
                              onChange={(value) => updateVariant(index, "price", value)}
                              prefix="$"
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <TextField
                              label="Compare At Price"
                              type="number"
                              value={variant.compareAtPrice || ""}
                              onChange={(value) =>
                                updateVariant(index, "compareAtPrice", value)
                              }
                              prefix="$"
                              placeholder="Optional"
                            />
                          </div>
                        </InlineStack>
                      </BlockStack>
                    </Card>
                  ))}
                </BlockStack>
              </Card>
            </BlockStack>

            <Divider />

            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">
                Product Description
              </Text>
              <Card>
                <div
                  dangerouslySetInnerHTML={{
                    __html: product.descriptionHtml,
                  }}
                  style={{ lineHeight: "1.6" }}
                />
              </Card>
            </BlockStack>
          </BlockStack>
        </Form>
      </Modal.Section>
    </Modal>
  );
}

ProductPreviewModal.propTypes = {
  product: PropTypes.object.isRequired,
  onClose: PropTypes.func,
};

