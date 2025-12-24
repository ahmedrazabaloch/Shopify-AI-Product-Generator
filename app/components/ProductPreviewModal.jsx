// import {
//   Modal,
//   Text,
//   Thumbnail,
//   Tag,
//   InlineStack,
//   BlockStack,
//   Card,
//   Button,
// } from "@shopify/polaris";
// import { useState } from "react";

// export function ProductPreviewModal({ product, onClose }) {
//   const [open, setOpen] = useState(true);

//   const handleClose = () => {
//     setOpen(false);
//     onClose?.();
//   };

//   return (
//     <Modal
//       open={open}
//       onClose={handleClose}
//       title="AI Product Preview"
//       primaryAction={{
//         content: "Save to Shopify",
//         disabled: true, // will enable later
//       }}
//       secondaryActions={[
//         {
//           content: "Cancel",
//           onAction: handleClose,
//         },
//       ]}
//     >
//       <Modal.Section>
//         <BlockStack gap="400">
//           {/* Title */}
//           <Text variant="headingMd">{product.title}</Text>

//           {/* Description */}
//           <div
//             dangerouslySetInnerHTML={{
//               __html: product.descriptionHtml,
//             }}
//           />

//           {/* Images */}
//           {product.images?.length > 0 && (
//             <InlineStack gap="200">
//               {product.images.map((img, index) => (
//                 <Thumbnail
//                   key={index}
//                   source={img}
//                   alt={`Product image ${index + 1}`}
//                 />
//               ))}
//             </InlineStack>
//           )}

//           {/* Tags */}
//           {product.tags?.length > 0 && (
//             <InlineStack gap="200">
//               {product.tags.map((tag) => (
//                 <Tag key={tag}>{tag}</Tag>
//               ))}
//             </InlineStack>
//           )}

//           {/* Variants */}
//           <Card>
//             <BlockStack gap="200">
//               {product.variants.map((variant, index) => (
//                 <Text key={index}>
//                   {variant.title} — ${variant.price}
//                 </Text>
//               ))}
//             </BlockStack>
//           </Card>
//         </BlockStack>
//       </Modal.Section>
//     </Modal>
//   );
// }


/* =========================
   New Code Added
========================= */


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
import { Form } from "react-router";
import { useState } from "react";

export function ProductPreviewModal({ product, onClose }) {
  const [open, setOpen] = useState(true);

  // Editable state
  const [title, setTitle] = useState(product.title);
  const [price, setPrice] = useState(product.variants[0]?.price || "0.00");
  const [tags, setTags] = useState(product.tags.join(", "));

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
        onAction: () => {
          document.getElementById("save-product-form").requestSubmit();
        },
      }}
      secondaryActions={[
        { content: "Cancel", onAction: handleClose },
      ]}
    >
      <Modal.Section>
        <Form method="post" id="save-product-form">
          <input type="hidden" name="intent" value="save" />

          {/* 🔐 Final product payload */}
          <input
            type="hidden"
            name="product"
            value={JSON.stringify({
              ...product,
              title,
              tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
              variants: [
                {
                  ...product.variants[0],
                  price,
                },
              ],
            })}
          />

          <BlockStack gap="400">
            {/* Title */}
            <TextField
              label="Product title"
              value={title}
              onChange={setTitle}
              autoComplete="off"
            />

            {/* Price */}
            <TextField
              label="Price"
              type="number"
              value={price}
              onChange={setPrice}
              prefix="$"
            />

            {/* Tags */}
            <TextField
              label="Tags (comma separated)"
              value={tags}
              onChange={setTags}
            />

            {/* Images */}
            {product.images?.length > 0 && (
              <InlineStack gap="200">
                {product.images.map((img, i) => (
                  <Thumbnail key={i} source={img} alt="Product image" />
                ))}
              </InlineStack>
            )}

            {/* Preview Tags */}
            <InlineStack gap="200">
              {tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
            </InlineStack>

            {/* Description */}
            <Card>
              <div
                dangerouslySetInnerHTML={{
                  __html: product.descriptionHtml,
                }}
              />
            </Card>
          </BlockStack>
        </Form>
      </Modal.Section>
    </Modal>
  );
}
