export const MAX_TOPIC_IMAGE_SIZE = 4 * 1024 * 1024;
export const TOPIC_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

export function validateTopicImage(file) {
  if (!file || typeof file.arrayBuffer !== 'function') return 'Please choose an image file.';
  if (!TOPIC_IMAGE_TYPES.includes(file.type)) return 'Choose a JPEG, PNG, GIF, WebP, or AVIF image.';
  if (!file.size) return 'The image file is empty.';
  if (file.size > MAX_TOPIC_IMAGE_SIZE) return 'Images must be 4 MB or smaller.';
  return null;
}
