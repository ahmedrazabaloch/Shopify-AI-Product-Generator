export const CREATE_PRODUCT_MUTATION = `
  mutation productCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
        handle
        variants(first: 1) {
          edges {
            node {
              id
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function createProduct(admin, product) {
  // Create the product first (Shopify creates a default variant automatically)
  const variables = {
    input: {
      title: product.title,
      descriptionHtml: product.descriptionHtml,
      tags: product.tags,
      vendor: product.vendor || "AI Generated",
      productType: product.productType || "AI Product",
      status: "ACTIVE",
    },
  };

  const response = await admin.graphql(CREATE_PRODUCT_MUTATION, { variables });
  const data = await response.json();

  if (data.data.productCreate.userErrors.length) {
    throw new Error(
      data.data.productCreate.userErrors.map((e) => e.message).join(", ")
    );
  }

  const createdProduct = data.data.productCreate.product;

  const hasCustomVariants = product.variants?.length > 0;

  // If we have our own variants, add them (default variant remains)
  if (hasCustomVariants) {
    await createAdditionalVariants(admin, createdProduct.id, product.variants);
  }

  return createdProduct;
}

export const CREATE_VARIANTS_MUTATION = `
  mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkCreate(productId: $productId, variants: $variants) {
      productVariants {
        id
        title
        price
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function createAdditionalVariants(admin, productId, variants) {
  if (!variants || variants.length === 0) {
    return null;
  }

  const variables = {
    productId,
    variants: variants.map((v) => ({
      price: v.price?.toString() || "0.00",
      compareAtPrice: v.compareAtPrice ? v.compareAtPrice.toString() : null,
      optionValues: [
        {
          optionName: "Title",
          name: v.option1 || "Default",
        },
      ],
    })),
  };

  const response = await admin.graphql(CREATE_VARIANTS_MUTATION, { variables });
  const data = await response.json();

  const userErrors = data?.data?.productVariantsBulkCreate?.userErrors || [];
  if (userErrors.length) {
    const message = userErrors.map((e) => e.message).join(", ");
    throw new Error(`Variant creation failed: ${message}`);
  }

  return data?.data?.productVariantsBulkCreate?.productVariants || [];
}

export async function createVariants(admin, productId, variants) {
  return createAdditionalVariants(admin, productId, variants);
}
