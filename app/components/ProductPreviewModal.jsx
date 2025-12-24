import {
  Modal,
  TextField,
  InlineStack,
  BlockStack,
  Card,
  Tag,
  Thumbnail,
  Button,
} from "@shopify/polaris";
import { Form, useNavigation } from "react-router";
import { useState } from "react";

export function ProductPreviewModal({ product, onClose }) {
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState(product.title);
  const [price, setPrice] = useState(product.variants[0]?.price || "0.00");
  const [tags, setTags] = useState(product.tags.join(", "));
  const navigation = useNavigation();
  const saving =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "save";

  const handleClose = () => {
    setOpen(false);
    onClose?.();
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
              variants: [
                {
                  ...product.variants[0],
                  price,
                },
              ],
            })}
          />

          <BlockStack gap="400">
            <TextField
              label="Product title"
              value={title}
              onChange={setTitle}
              autoComplete="off"
            />

            <TextField
              label="Price"
              type="number"
              value={price}
              onChange={setPrice}
              prefix="$"
            />

            <TextField
              label="Tags (comma separated)"
              value={tags}
              onChange={setTags}
            />
            {product.images?.length > 0 && (
              <InlineStack gap="200">
                {product.images.map((img, i) => (
                  <Thumbnail key={i} source={img} alt="Product image" />
                ))}
              </InlineStack>
            )}

          
            <InlineStack gap="200">
              {tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
            </InlineStack>

            <Card>
              <div style={{ lineHeight: "1.6" }}>
                <div
                  dangerouslySetInnerHTML={{
                    __html: product.descriptionHtml,
                  }}
                />
              </div>
            </Card>
          </BlockStack>
        </Form>
      </Modal.Section>
    </Modal>
  );
}
