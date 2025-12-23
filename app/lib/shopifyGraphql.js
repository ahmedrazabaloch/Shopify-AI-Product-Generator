export async function createProduct(admin, product) {
  const response = await admin.graphql(
    `
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
        }
        userErrors {
          field
          message
        }
      }
    }
    `,
    {
      variables: {
        input: {
          title: product.title,
          descriptionHtml: product.description_html,
          tags: product.tags,
          seo: {
            title: product.seo.title,
            description: product.seo.description,
          },
        },
      },
    },
  );

  return response.json();
}

export async function createVariants(admin, productId, variants) {
  return admin.graphql(
    `
    mutation ProductVariantsBulkCreate(
      $productId: ID!
      $variants: [ProductVariantsBulkInput!]!
    ) {
      productVariantsBulkCreate(
        productId: $productId
        variants: $variants
      ) {
        productVariants {
          id
          title
        }
        userErrors {
          field
          message
        }
      }
    }
    `,
    {
      variables: {
        productId,
        variants: variants.map((v) => ({
          title: v.name,
          price: v.price.toString(),
        })),
      },
    },
  );
}
