export const UPLOAD_MEDIA_MUTATION = `
  mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
    productCreateMedia(productId: $productId, media: $media) {
      media {
        ... on MediaImage {
          id
          image {
            url
            altText
          }
        }
      }
      mediaUserErrors {
        field
        message
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function uploadProductImages(admin, productId, images) {
  if (!images || images.length === 0) {
    return [];
  }

  const variables = {
    productId,
    media: images.map((url, index) => ({
      mediaContentType: "IMAGE",
      originalSource: url,
      alt: `Product image ${index + 1}`,
    })),
  };

  const response = await admin.graphql(UPLOAD_MEDIA_MUTATION, { variables });
  const data = await response.json();

  const errors = [
    ...(data.data.productCreateMedia.userErrors || []),
    ...(data.data.productCreateMedia.mediaUserErrors || []),
  ];

  if (errors.length) {
    console.error("Media upload errors:", errors);
    throw new Error(errors.map((e) => e.message).join(", "));
  }

  return data.data.productCreateMedia.media;
}
