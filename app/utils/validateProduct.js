export function validateProduct(product) {
  if (!product?.title) return "Missing product title";
  if (!product?.descriptionHtml) return "Missing description";
  if (!product?.variants?.length) return "At least one variant required";
  return null;
}
