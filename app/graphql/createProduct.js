export const CREATE_PRODUCT_MUTATION = `
  mutation productCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function createProduct(admin, product) {
  const variables = {
    input: {
      title: product.title,
      descriptionHtml: product.descriptionHtml,
      tags: product.tags,
      vendor: product.vendor || "AI Generated",
      productType: product.productType || "AI Product",
      status: "DRAFT",
    },
  };

  const response = await admin.graphql(CREATE_PRODUCT_MUTATION, { variables });
  const data = await response.json();

  if (data.data.productCreate.userErrors.length) {
    throw new Error(
      data.data.productCreate.userErrors.map((e) => e.message).join(", ")
    );
  }

  return data.data.productCreate.product;
}

export const CREATE_VARIANTS_MUTATION = `
  mutation ProductVariantsBulkCreate(
    $productId: ID!
    $variants: [ProductVariantsBulkInput!]!
  ) {
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

export async function createVariants(admin, productId, variants) {
  if (!variants || variants.length === 0) {
    return null;
  }

  const variables = {
    productId,
    variants: variants.map((v) => ({
      price: v.price.toString(),
      compareAtPrice: v.compareAtPrice ? v.compareAtPrice.toString() : null,
      optionValues: [
        {
          optionName: "Size",
          name: v.option1 || "Default",
        },
      ],
    })),
  };

  const response = await admin.graphql(CREATE_VARIANTS_MUTATION, { variables });
  const data = await response.json();

  if (data.data.productVariantsBulkCreate.userErrors.length) {
    throw new Error(
      data.data.productVariantsBulkCreate.userErrors.map((e) => e.message).join(", ")
    );
  }

  return data.data.productVariantsBulkCreate.productVariants;
}
