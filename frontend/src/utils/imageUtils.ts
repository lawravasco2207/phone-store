/**
 * Generates a placeholder image URL using a reliable external placeholder service
 * @param width Width of the placeholder image
 * @param height Height of the placeholder image
 * @param text Text to display on the placeholder (will be URL encoded)
 * @returns URL string for the placeholder image
 */
export function getPlaceholderImage(
  width: number = 400, 
  height: number = 400, 
  text: string = 'Product'
): string {
  return `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates a placeholder image URL for a specific product
 * @param product Product object or product name
 * @param width Width of the placeholder image
 * @param height Height of the placeholder image
 * @returns URL string for the product-specific placeholder image
 */
export function getProductPlaceholder(
  product: { name?: string } | string,
  width: number = 400,
  height: number = 400
): string {
  const productName = typeof product === 'string' 
    ? product 
    : (product.name || 'Product');
    
  return getPlaceholderImage(width, height, productName);
}

export default {
  getPlaceholderImage,
  getProductPlaceholder
};
