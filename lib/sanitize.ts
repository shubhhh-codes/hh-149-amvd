/**
 * Lightweight string sanitizer.
 * Removes <script> tags entirely along with their content.
 * Strips out all other HTML tags.
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove script tags and their content
  let cleaned = input.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '');
  
  // Remove all other HTML tags
  cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, '');
  
  return cleaned.trim();
}
