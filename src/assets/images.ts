// Logo SVG as a constant
export const LOGO_SVG = `
<svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="white"/>
  <path d="M96 10C54.57 10 20 44.57 20 86V106C20 147.43 54.57 182 96 182C137.43 182 172 147.43 172 106V86C172 44.57 137.43 10 96 10Z" fill="#34A853"/>
  <path d="M58 72L134 50" stroke="white" stroke-width="12" stroke-linecap="round"/>
  <path d="M58 122L134 100" stroke="white" stroke-width="12" stroke-linecap="round"/>
  <text x="50%" y="50%" fill="white" font-size="64" font-weight="bold" font-family="Arial" text-anchor="middle" dominant-baseline="middle">$</text>
</svg>`;

// Image URLs
export const IMAGES = {
  // Share image for social media
  SHARE_IMAGE: 'https://www.billsplit.me/share-image.jpg',
  
  // Favicons and app icons
  FAVICON: '/favicon.ico',
  FAVICON_SVG: '/favicon.svg',
  FAVICON_192: '/favicon-192.png',
  APPLE_TOUCH_ICON: '/apple-touch-icon.png',
  
  // Theme color
  THEME_COLOR: '#22C55E'
} as const;