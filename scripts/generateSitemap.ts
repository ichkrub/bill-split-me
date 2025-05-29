import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

const BASE_URL = 'https://www.billsplit.me';

// Static routes with their configurations
const staticRoutes = [
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  { url: '/how-it-works', changefreq: 'weekly', priority: 0.9 },
  { url: '/blog', changefreq: 'daily', priority: 0.8 },
  { url: '/privacy-policy', changefreq: 'monthly', priority: 0.5 },
];

async function generateSitemap() {
  try {
    // Fetch all blog posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const today = new Date().toISOString().split('T')[0];

    // Generate XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static routes
    staticRoutes.forEach(({ url, changefreq, priority }) => {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}${url}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${changefreq}</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Add blog posts
    posts?.forEach((post) => {
      const postDate = new Date(post.created_at).toISOString().split('T')[0];
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}/blog/${post.slug}</loc>\n`;
      xml += `    <lastmod>${postDate}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += '</urlset>';

    // Write to file
    const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    fs.writeFileSync(outputPath, xml);
    console.log('✅ Sitemap generated successfully!');

  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();
