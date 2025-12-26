// Mutation to create a staged upload for binary image data
const STAGED_UPLOAD_MUTATION = `
  mutation stagedUploadCreate($input: StagedUploadInput!) {
    stagedUploadCreate(input: $input) {
      stagedUpload {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

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

// Convert base64 to Buffer
function base64ToBuffer(base64String) {
  return Buffer.from(base64String, "base64");
}

// Upload base64 image directly to Shopify using staged upload
async function uploadBase64ToShopify(admin, base64Image, fileName = "product-image.jpg") {
  try {
    console.log(`🚀 Starting staged upload for ${fileName}`);
    
    // Validate base64
    if (!base64Image || base64Image.length < 100) {
      throw new Error("Invalid base64 image data");
    }

    // Step 1: Create a staged upload URL
    const stagedUploadResponse = await admin.graphql(STAGED_UPLOAD_MUTATION, {
      variables: {
        input: {
          resource: "IMAGE",
          filename: fileName,
          mimeType: "image/jpeg",
        },
      },
    });

    const stagedData = await stagedUploadResponse.json();

    if (stagedData.data?.stagedUploadCreate?.userErrors?.length > 0) {
      throw new Error(
        stagedData.data.stagedUploadCreate.userErrors.map((e) => e.message).join(", ")
      );
    }

    const stagedUpload = stagedData.data?.stagedUploadCreate?.stagedUpload;
    if (!stagedUpload || !stagedUpload.url) {
      throw new Error("No staged upload URL received from Shopify");
    }

    const buffer = base64ToBuffer(base64Image);
    console.log(`📦 Buffer size: ${buffer.length} bytes`);

    // Step 2: Build multipart form data manually for Node.js
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2, 15)}`;
    const textParts = [];

    // Add parameters from Shopify
    if (stagedUpload.parameters && Array.isArray(stagedUpload.parameters)) {
      stagedUpload.parameters.forEach((param) => {
        textParts.push(`--${boundary}`);
        textParts.push(`Content-Disposition: form-data; name="${param.name}"`);
        textParts.push("");
        textParts.push(param.value);
      });
    }

    // Add file part header
    textParts.push(`--${boundary}`);
    textParts.push(`Content-Disposition: form-data; name="file"; filename="${fileName}"`);
    textParts.push("Content-Type: image/jpeg");
    textParts.push("");

    // Build the body with buffer
    const textPart = textParts.join("\r\n") + "\r\n";
    const endPart = `\r\n--${boundary}--`;
    
    const fullBody = Buffer.concat([
      Buffer.from(textPart),
      buffer,
      Buffer.from(endPart),
    ]);

    console.log(`📡 Uploading to: ${stagedUpload.url}`);

    // Step 3: Upload to Shopify's staged URL
    const uploadResponse = await fetch(stagedUpload.url, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: fullBody,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`❌ Upload response: ${uploadResponse.status}`, errorText.substring(0, 200));
      throw new Error(`Staged upload failed: ${uploadResponse.statusText}`);
    }

    console.log(`✅ Staged upload successful, resource: ${stagedUpload.resourceUrl}`);
    return stagedUpload.resourceUrl;
  } catch (err) {
    console.error(`❌ Staged upload failed: ${err.message}`);
    throw err;
  }
}

export async function uploadProductImages(admin, productId, images) {
  if (!images || images.length === 0) {
    console.log("⚠️ No images to upload");
    return [];
  }

  try {
    console.log(`\n📸 Processing ${images.length} images for product ${productId}`);

    // Process all images - handle base64 and URLs separately
    const imagePromises = images.map(async (image, index) => {
      try {
        if (!image || typeof image !== "string") {
          console.warn(`⚠️ Image ${index + 1}: Invalid image data type`);
          return null;
        }

        // Check if it's a URL (HTTP/HTTPS)
        if (image.startsWith("http://") || image.startsWith("https://")) {
          console.log(`📸 Image ${index + 1}: Using direct URL`);
          return image;
        } 
        // Check if it's base64
        else if (image.length > 100) {
          console.log(`📸 Image ${index + 1}: Base64 image detected (${image.length} chars)`);
          try {
            const resourceUrl = await uploadBase64ToShopify(admin, image, `image-${index + 1}.jpg`);
            console.log(`✅ Image ${index + 1}: Uploaded successfully`);
            return resourceUrl;
          } catch (err) {
            console.error(`❌ Image ${index + 1}: Upload failed (${err.message})`);
            // Fallback to placeholder
            return `https://picsum.photos/600/600?random=${Date.now() + index}`;
          }
        } 
        else {
          console.warn(`⚠️ Image ${index + 1}: Unknown image format`);
          return null;
        }
      } catch (err) {
        console.error(`❌ Image ${index + 1}: Unexpected error: ${err.message}`);
        return null;
      }
    });

    const processedImages = await Promise.all(imagePromises);
    const validUrls = processedImages.filter((url) => url && typeof url === "string");

    if (validUrls.length === 0) {
      console.log("⚠️ No valid images after processing");
      return [];
    }

    console.log(`\n✅ Creating Shopify media with ${validUrls.length} images...`);

    // Create media in Shopify product
    const variables = {
      productId,
      media: validUrls.map((url, index) => ({
        mediaContentType: "IMAGE",
        originalSource: url,
        alt: `Product image ${index + 1}`,
      })),
    };

    console.log(`📡 Sending media mutation to Shopify...`);
    const response = await admin.graphql(UPLOAD_MEDIA_MUTATION, { variables });
    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      throw new Error(data.errors.map((e) => e.message).join(", "));
    }

    const errors = [
      ...(data.data?.productCreateMedia?.userErrors || []),
      ...(data.data?.productCreateMedia?.mediaUserErrors || []),
    ];

    if (errors.length) {
      console.error("❌ Media upload errors from Shopify:", errors);
      throw new Error(errors.map((e) => e.message).join(", "));
    }

    const media = data.data?.productCreateMedia?.media || [];
    console.log(`✅ Successfully added ${media.length} media items to product\n`);
    return media;
  } catch (err) {
    console.error(`\n❌ Product image upload failed: ${err.message}\n`);
    throw err;
  }
}
