export async function createProduct(admin, product) {
  const mutation = `
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      title: product.title,
      descriptionHtml: product.descriptionHtml,
      tags: product.tags,
    },
  };

  const response = await admin.graphql(mutation, { variables });
  const data = await response.json();

  if (data.data.productCreate.userErrors.length) {
    throw new Error(
      data.data.productCreate.userErrors.map((e) => e.message).join(", "),
    );
  }

  return data.data.productCreate.product;
}

export async function uploadProductImages(admin, productId, images) {
  return admin.graphql(
    `
    mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media { ... on MediaImage { id } }
        userErrors { field message }
      }
    }
    `,
    {
      variables: {
        productId,
        media: images.map((url) => ({
          mediaContentType: "IMAGE",
          originalSource: url, // ✅ MUST be public HTTPS URL
        })),
      },
    },
  );
}

export async function createVariants(admin, productId, variants) {
  return admin.graphql(
    `
    mutation ProductVariantsBulkCreate(
      $productId: ID!
      $variants: [ProductVariantsBulkInput!]!
    ) {
      productVariantsBulkCreate(productId: $productId, variants: $variants) {
        productVariants { id }
        userErrors { field message }
      }
    }
    `,
    {
      variables: {
        productId,
        variants: variants.map((v) => ({
          price: v.price.toString(),
          optionValues: [
            {
              optionName: "Title",
              name: v.name,
            },
          ],
        })),
      },
    },
  );
}
