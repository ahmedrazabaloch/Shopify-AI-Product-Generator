export async function createShopifyProduct(admin, product) {
  const mutation = `#graphql
    mutation productCreate($input: ProductCreateInput!) {
      productCreate(input: $input) {
        product {
          id
          title
          handle
          status
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
      descriptionHtml: product.description_html,
      tags: product.tags,
      seo: {
        title: product.seo.title,
        description: product.seo.description,
      },
    },
  };

  const response = await admin.graphql(mutation, { variables });
  const json = await response.json();

  const errors = json.data.productCreate.userErrors;
  if (errors.length) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }

  return json.data.productCreate.product;
}
