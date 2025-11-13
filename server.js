const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const Busboy = require('busboy');
const axios = require('axios');
require('dotenv').config();

// Initialize Firebase Admin
let adminInitialized = false;
try {
  const serviceAccount = process.env.FIREBASE_ADMIN_PRIVATE_KEY ? {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  } : null;

  if (serviceAccount && serviceAccount.privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_ADMIN_STORAGE_BUCKET
    });
    adminInitialized = true;
    console.log('✅ Firebase Admin initialized successfully');
  } else {
    console.log('⚠️ Firebase Admin not configured - running in demo mode');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error);
}

// Create mock admin object for development if not initialized
if (!adminInitialized) {
  admin = {
    firestore: () => ({ 
      collection: () => ({
        doc: () => ({
          get: () => Promise.resolve({ exists: false, data: () => null }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve(),
          delete: () => Promise.resolve()
        }),
        add: () => Promise.resolve({ id: 'mock-id' }),
        get: () => Promise.resolve({ docs: [], forEach: () => {} }),
        where: () => ({ orderBy: () => ({ limit: () => ({ get: () => Promise.resolve({ docs: [] }) }) }) }),
        orderBy: () => ({ offset: () => ({ limit: () => ({ get: () => Promise.resolve({ docs: [] }) }) }) }),
        count: () => ({ get: () => Promise.resolve({ data: () => ({ count: 0 }) }) })
      })
    }),
    storage: () => ({ 
      bucket: () => ({
        file: () => ({
          save: () => Promise.resolve(),
          makePublic: () => Promise.resolve()
        })
      }) 
    }),
    auth: () => ({ verifyIdToken: () => Promise.resolve({}) })
  };
}

const app = express();
const port = process.env.PORT || 3000;

const db = admin.firestore ? admin.firestore() : null;
const bucket = admin.storage ? admin.storage().bucket() : null;

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from current directory
app.use(express.static(__dirname));

// Helper function for safe date conversion
function safeDateToString(dateValue) {
  if (!dateValue) {
    return new Date().toISOString();
  }
  
  try {
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      // Firestore timestamp
      return dateValue.toDate().toISOString();
    } else if (typeof dateValue === 'string') {
      // Already a string - validate it's a proper date string
      const testDate = new Date(dateValue);
      return isNaN(testDate.getTime()) ? new Date().toISOString() : dateValue;
    } else if (dateValue instanceof Date) {
      // Date object
      return dateValue.toISOString();
    } else {
      // Fallback
      return new Date().toISOString();
    }
  } catch (error) {
    console.error('Date conversion error:', error);
    return new Date().toISOString();
  }
}

// AdSense Helper Functions
function generateAdSenseCode() {
  const clientId = process.env.ADSENSE_CLIENT_ID || 'ca-pub-5992381116749724';
  
  return `
    <!-- Google AdSense Auto Ads -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}" crossorigin="anonymous"></script>
    <script>
      (adsbygoogle = window.adsbygoogle || []).push({
        google_ad_client: "${clientId}",
        enable_page_level_ads: true,
        overlays: {bottom: true}
      });
    </script>
  `;
}

function generateManualAdPlacement(adUnit = 'default') {
  return `
    <!-- Manual Ad Placement -->
    <div class="ad-container">
      <div class="ad-label">Advertisement</div>
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5992381116749724" crossorigin="anonymous"></script>
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="ca-pub-5992381116749724"
           data-ad-slot="YOUR_AD_SLOT_ID"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
      <script>
           (adsbygoogle = window.adsbygoogle || []).push({});
      </script>
    </div>
  `;
}

// Migration function for existing prompts
async function migrateExistingPromptsForAdSense() {
  try {
    console.log('🔄 Starting AdSense migration for existing prompts...');
    
    if (db && db.collection) {
      // Get all existing prompts
      const snapshot = await db.collection('uploads').get();
      let migratedCount = 0;
      
      // Process each prompt
      for (const doc of snapshot.docs) {
        const promptData = doc.data();
        
        // Check if this prompt needs migration
        if (!promptData.adsenseMigrated) {
          // Mark prompts as migrated
          await db.collection('uploads').doc(doc.id).update({
            adsenseMigrated: true,
            migratedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString() // Force cache refresh
          });
          
          migratedCount++;
          console.log(`✅ Migrated prompt: ${doc.id}`);
        }
      }
      
      console.log(`🎉 AdSense migration completed! Migrated ${migratedCount} prompts.`);
      return migratedCount;
    } else {
      console.log('🎭 Development mode: Mock prompts will use new AdSense templates');
      return mockPrompts.length;
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

// SEO Optimization Class
class SEOOptimizer {
  static generateSEOTitle(promptTitle) {
    const keywords = this.extractKeywords(promptTitle);
    const baseTitle = `AI Prompt: ${promptTitle} - Prompt Seen`;
    return keywords.length > 0 ? `${keywords.slice(0, 3).join(', ')} | ${baseTitle}` : baseTitle;
  }

  static generateMetaDescription(promptText, title) {
    const cleanText = promptText.replace(/[^\w\s]/gi, ' ').substring(0, 155);
    return `${cleanText}... Explore this AI-generated image and learn prompt engineering techniques.`;
  }

  static extractKeywords(text) {
    if (!text) return [];
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word));
    
    return [...new Set(words)];
  }

  static generateSlug(title) {
    if (!title) return 'untitled-prompt';
    return title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 60);
  }

  static generateStructuredData(prompt) {
    return {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "name": prompt.title || 'Untitled Prompt',
      "description": prompt.metaDescription || 'AI-generated prompt',
      "image": prompt.imageUrl || 'https://via.placeholder.com/800x400/4e54c8/white?text=AI+Image',
      "author": {
        "@type": "Person",
        "name": prompt.userName || "Prompt Seen User"
      },
      "datePublished": prompt.createdAt || new Date().toISOString(),
      "keywords": (prompt.keywords || ['AI', 'prompt']).join(', '),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://www.promptseen.co/prompt/${prompt.id || 'unknown'}`
      }
    };
  }
}

// News-specific SEO Optimizer
class NewsSEOOptimizer {
  static generateNewsTitle(title) {
    return `${title || 'AI News'} - Prompt Seen News`;
  }

  static generateNewsDescription(content) {
    if (!content) return 'Latest AI news and updates from Prompt Seen.';
    const cleanContent = content.replace(/[^\w\s]/gi, ' ').substring(0, 150);
    return `${cleanContent}... Read more AI prompt news and updates.`;
  }

  static generateNewsSlug(title) {
    const baseSlug = (title || 'ai-news').toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 60);
    return baseSlug + '-' + Date.now();
  }

  static generateNewsStructuredData(news) {
    return {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": news.title || 'AI News',
      "description": news.metaDescription || 'Latest AI news and updates',
      "image": news.imageUrl || 'https://www.promptseen.co/logo.png',
      "datePublished": news.createdAt || new Date().toISOString(),
      "dateModified": news.updatedAt || new Date().toISOString(),
      "author": {
        "@type": "Person",
        "name": news.author || "Prompt Seen Editor"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Prompt Seen",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.promptseen.co/logo.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://www.promptseen.co/news/${news.id || 'unknown'}`
      }
    };
  }
}

// Sitemap Generator Class
class SitemapGenerator {
  static generateSitemap(urls) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    urls.forEach(url => {
      xml += `<url>\n`;
      xml += `  <loc>${this.escapeXml(url.loc)}</loc>\n`;
      if (url.lastmod) xml += `  <lastmod>${url.lastmod}</lastmod>\n`;
      if (url.changefreq) xml += `  <changefreq>${url.changefreq}</changefreq>\n`;
      if (url.priority) xml += `  <priority>${url.priority}</priority>\n`;
      xml += `</url>\n`;
    });
    
    xml += `</urlset>`;
    return xml;
  }

  static generateNewsSitemap(newsUrls) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n`;
    
    newsUrls.forEach(url => {
      xml += `<url>\n`;
      xml += `  <loc>${this.escapeXml(url.loc)}</loc>\n`;
      xml += `  <news:news>\n`;
      xml += `    <news:publication>\n`;
      xml += `      <news:name>Prompt Seen</news:name>\n`;
      xml += `      <news:language>en</news:language>\n`;
      xml += `    </news:publication>\n`;
      xml += `    <news:publication_date>${new Date(url.lastmod).toISOString().split('T')[0]}</news:publication_date>\n`;
      xml += `    <news:title>${this.escapeXml(url.title || 'AI News')}</news:title>\n`;
      xml += `  </news:news>\n`;
      xml += `</url>\n`;
    });
    
    xml += `</urlset>`;
    return xml;
  }

  static escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }
}

// Mock data for development
const mockPrompts = [
  {
    id: 'demo-1',
    title: 'Fantasy Landscape with Mountains',
    promptText: 'Create a fantasy landscape with majestic mountains, floating islands, and a mystical waterfall, digital art, highly detailed, epic composition',
    imageUrl: 'https://via.placeholder.com/800x400/4e54c8/white?text=Fantasy+Landscape',
    userName: 'Demo User',
    likes: 42,
    views: 156,
    uses: 23,
    keywords: ['fantasy', 'landscape', 'mountains', 'digital art'],
    category: 'art',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seoScore: 85,
    adsenseMigrated: true
  },
  {
    id: 'demo-2',
    title: 'Cyberpunk City Street',
    promptText: 'Cyberpunk city street at night, neon signs, rainy pavement, futuristic vehicles, Blade Runner style, cinematic lighting',
    imageUrl: 'https://via.placeholder.com/800x400/8f94fb/white?text=Cyberpunk+City',
    userName: 'Demo User',
    likes: 67,
    views: 289,
    uses: 45,
    keywords: ['cyberpunk', 'city', 'neon', 'futuristic'],
    category: 'art',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seoScore: 92,
    adsenseMigrated: true
  },
  {
    id: 'demo-3',
    title: 'Professional Portrait Photography',
    promptText: 'Professional portrait photography, natural lighting, soft shadows, high detail, 85mm lens, studio quality, professional model',
    imageUrl: 'https://via.placeholder.com/800x400/20bf6b/white?text=Portrait+Photo',
    userName: 'Demo User',
    likes: 34,
    views: 189,
    uses: 12,
    keywords: ['photography', 'portrait', 'professional', 'studio'],
    category: 'photography',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seoScore: 78,
    adsenseMigrated: true
  }
];

// Generate mock news
function generateMockNews(count) {
  const news = [];
  const categories = ['ai-news', 'prompt-tips', 'industry-updates', 'tutorials'];
  const authors = ['AI News Team', 'Prompt Master', 'Tech Editor', 'Community Manager'];
  
  for (let i = 1; i <= count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const author = authors[Math.floor(Math.random() * authors.length)];
    
    news.push({
      id: `news-${i}`,
      title: `Breaking: New AI Prompt Technique Revolutionizes ${category.replace('-', ' ')}`,
      content: `This is a detailed news article about the latest developments in AI prompt engineering. The content discusses new techniques, tools, and best practices that are transforming how we interact with artificial intelligence. This breakthrough promises to make AI more accessible and effective for creators worldwide.`,
      excerpt: `Discover the latest breakthrough in AI prompt engineering that's changing how creators interact with artificial intelligence...`,
      imageUrl: `https://picsum.photos/800/400?random=${i}`,
      author: author,
      category: category,
      tags: ['ai', 'prompts', 'innovation', 'technology'],
      views: Math.floor(Math.random() * 1000),
      likes: Math.floor(Math.random() * 100),
      shares: Math.floor(Math.random() * 50),
      isBreaking: i <= 3,
      isFeatured: i <= 2,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date(Date.now() - i * 3600000).toISOString()
    });
  }
  
  return news;
}

// Initialize global mock news
global.mockNews = generateMockNews(10);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Prompt Seen API',
    mode: db ? 'production' : 'development',
    adsense: {
      enabled: true,
      clientId: process.env.ADSENSE_CLIENT_ID || 'ca-pub-5992381116749724',
      migration: 'available at /admin/migrate-adsense'
    }
  });
});

// AdSense Migration Endpoint
app.get('/admin/migrate-adsense', async (req, res) => {
  try {
    console.log('🚀 Starting AdSense migration via admin endpoint...');
    
    const migratedCount = await migrateExistingPromptsForAdSense();
    
    res.json({
      success: true,
      message: `🎉 Successfully migrated ${migratedCount} prompts for AdSense monetization`,
      migratedCount: migratedCount,
      timestamp: new Date().toISOString(),
      nextSteps: [
        'All existing prompts now use AdSense-enabled templates',
        'New uploads automatically include AdSense',
        'Visit prompt pages to verify ads are displaying',
        'Check Google AdSense dashboard for impressions'
      ]
    });
  } catch (error) {
    console.error('❌ Migration endpoint error:', error);
    res.status(500).json({ 
      error: 'Migration failed', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Dynamic Robots.txt - FIXED HTTPS VERSION
app.get('/robots.txt', (req, res) => {
  const domain = req.get('host');
  
  // Better HTTPS detection
  let protocol = 'https';
  
  // Check multiple ways to detect HTTPS
  if (req.secure) {
    protocol = 'https';
  } else if (req.headers['x-forwarded-proto'] === 'https') {
    protocol = 'https';
  } else if (req.headers['x-forwarded-protocol'] === 'https') {
    protocol = 'https';
  } else if (req.headers['x-forwarded-ssl'] === 'on') {
    protocol = 'https';
  } else if (req.headers['x-url-scheme'] === 'https') {
    protocol = 'https';
  } else {
    // Fallback: check if host contains your domain (likely production)
    if (domain.includes('promptseen.co')) {
      protocol = 'https';
    } else {
      protocol = req.protocol; // Use whatever Express detects
    }
  }
  
  // FORCE HTTPS for production domain
  if (domain.includes('promptseen.co')) {
    protocol = 'https';
  }
  
  const currentBaseUrl = `${protocol}://${domain}`;
  
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/
Disallow: /api/
Disallow: /cdn-cgi/
Disallow: /*.php$
Disallow: /*.json$
Disallow: /*?*
Disallow: /*/comments/
Disallow: /search/

# Explicitly allow important pages
Allow: /promptconverter.html
Allow: /howitworks.html
Allow: /login.html

# Block duplicate index pages
Disallow: /index.html
Disallow: /home.html
Disallow: /main.html

# Allow image crawling for Google Images
Allow: /*.jpg$
Allow: /*.jpeg$
Allow: /*.png$
Allow: /*.gif$
Allow: /*.webp$

# Google AdsBot
User-agent: AdsBot-Google
Allow: /

# Google Image Bot
User-agent: Googlebot-Image
Allow: /
Disallow: /api/

# Google News Bot
User-agent: Googlebot-News
Allow: /news/
Allow: /sitemap-news.xml
Crawl-delay: 1

# Regular Googlebot
User-agent: Googlebot
Allow: /
Disallow: /api/
Crawl-delay: 2

# Bing Bot
User-agent: Bingbot
Allow: /
Disallow: /api/
Crawl-delay: 2

# Block AI scrapers
User-agent: ChatGPT-User
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: FacebookBot
Disallow: /

User-agent: Applebot
Disallow: /api/

# Sitemaps - Use HTTPS always for production
Sitemap: https://www.promptseen.co/sitemap.xml
Sitemap: https://www.promptseen.co/sitemap-posts.xml
Sitemap: https://www.promptseen.co/sitemap-news.xml
Sitemap: https://www.promptseen.co/sitemap-pages.xml

# Crawl delay for all other bots
User-agent: *
Crawl-delay: 3`;

  res.set('Content-Type', 'text/plain');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(robotsTxt);
});
// Dynamic Sitemap Index
app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
    
    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-pages.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-posts.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-news.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemapIndex);
    
  } catch (error) {
    console.error('❌ Sitemap index error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Pages Sitemap (static pages)
app.get('/sitemap-pages.xml', async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
    
    const pages = [
      {
        loc: baseUrl + '/',
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '1.0'
      },
      {
        loc: 'https://www.promptseen.co/promptconverter.html',
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: '0.8'
      },
      {
        loc: 'https://www.promptseen.co/howitworks.html',
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: '0.8'
      },
      {
        loc: 'https://www.promptseen.co/login.html',
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: '0.5'
      },
      {
        loc: baseUrl + '/admin/migrate-adsense',
        lastmod: new Date().toISOString(),
        changefreq: 'yearly',
        priority: '0.1'
      }
    ];

    const sitemap = SitemapGenerator.generateSitemap(pages);
    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
    
  } catch (error) {
    console.error('❌ Pages sitemap error:', error);
    res.status(500).send('Error generating pages sitemap');
  }
});

// Posts Sitemap (dynamic prompts)
app.get('/sitemap-posts.xml', async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
    let prompts = [];

    if (db) {
      // Production mode - fetch from Firestore
      const snapshot = await db.collection('uploads')
        .orderBy('updatedAt', 'desc')
        .limit(1000)
        .get();

      prompts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          updatedAt: safeDateToString(data.updatedAt)
        };
      });
    } else {
      // Development mode - use mock data
      prompts = mockPrompts;
    }

    const urls = prompts.map(prompt => ({
      loc: `${baseUrl}/prompt/${prompt.id}`,
      lastmod: prompt.updatedAt || prompt.createdAt || new Date().toISOString(),
      changefreq: 'weekly',
      priority: '0.8'
    }));

    // Add category pages
    const categories = ['art', 'photography', 'design', 'writing', 'other'];
    categories.forEach(category => {
      urls.push({
        loc: `${baseUrl}/category/${category}`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: '0.6'
      });
    });

    const sitemap = SitemapGenerator.generateSitemap(urls);
    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
    
  } catch (error) {
    console.error('❌ Posts sitemap error:', error);
    const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
    const fallbackUrls = [
      {
        loc: baseUrl + '/',
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '1.0'
      }
    ];
    const sitemap = SitemapGenerator.generateSitemap(fallbackUrls);
    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  }
});

// News Sitemap
app.get('/sitemap-news.xml', async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
    let news = [];

    if (db && db.collection) {
      const snapshot = await db.collection('news')
        .orderBy('publishedAt', 'desc')
        .limit(1000)
        .get();

      news = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          updatedAt: safeDateToString(data.updatedAt)
        };
      });
    } else {
      news = global.mockNews;
    }

    const newsUrls = news.map(newsItem => ({
      loc: `${baseUrl}/news/${newsItem.id}`,
      lastmod: newsItem.updatedAt || newsItem.publishedAt || new Date().toISOString(),
      title: newsItem.title
    }));

    const sitemap = SitemapGenerator.generateNewsSitemap(newsUrls);
    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
    
  } catch (error) {
    console.error('❌ News sitemap error:', error);
    res.status(500).send('Error generating news sitemap');
  }
});

// News upload endpoint
app.post('/api/upload-news', async (req, res) => {
  console.log('📰 News upload request received');
  
  const busboy = Busboy({ headers: req.headers });
  const fields = {};
  let fileBuffer = null;
  let fileName = null;
  let fileType = null;

  busboy.on('field', (fieldname, val) => {
    fields[fieldname] = val;
    console.log(`📝 News field ${fieldname}: ${val ? val.substring(0, 50) : 'null'}...`);
  });

  busboy.on('file', (fieldname, file, info) => {
    if (fieldname !== 'image') {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }

    const { filename, encoding, mimeType } = info;
    console.log(`📁 News image upload: ${filename}, type: ${mimeType}`);
    
    fileName = filename;
    fileType = mimeType;
    
    const chunks = [];
    file.on('data', (data) => {
      chunks.push(data);
    });

    file.on('end', () => {
      fileBuffer = Buffer.concat(chunks);
      
      if (fileBuffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size exceeds 5MB limit' });
      }
    });
  });

  busboy.on('finish', async () => {
    try {
      // Validate required fields
      if (!fields.title || !fields.content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      let imageUrl = 'https://via.placeholder.com/800x400/4e54c8/white?text=Prompt+Seen+News';

      if (fileBuffer && bucket) {
        // Upload to Firebase Storage
        const fileExtension = fileName.split('.').pop();
        const newFileName = `news/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const file = bucket.file(newFileName);

        await file.save(fileBuffer, {
          metadata: {
            contentType: fileType,
            metadata: {
              uploadedBy: fields.author || 'editor',
              uploadedAt: new Date().toISOString()
            }
          }
        });

        await file.makePublic();
        imageUrl = `https://storage.googleapis.com/${bucket.name}/${newFileName}`;
        console.log('✅ News image uploaded to Firebase Storage:', imageUrl);
      }

      // Generate SEO metadata for news
      const newsTitle = NewsSEOOptimizer.generateNewsTitle(fields.title);
      const metaDescription = NewsSEOOptimizer.generateNewsDescription(fields.content);
      const slug = NewsSEOOptimizer.generateNewsSlug(fields.title);
      const keywords = SEOOptimizer.extractKeywords(fields.title + ' ' + fields.content);

      // Create news data
      const newsData = {
        title: fields.title,
        content: fields.content,
        excerpt: fields.excerpt || (fields.content ? fields.content.substring(0, 200) + '...' : ''),
        imageUrl: imageUrl,
        author: fields.author || 'Prompt Seen Editor',
        category: fields.category || 'ai-news',
        tags: fields.tags ? fields.tags.split(',').map(tag => tag.trim()) : [],
        keywords: keywords,
        seoTitle: newsTitle,
        metaDescription: metaDescription,
        slug: slug,
        isBreaking: fields.isBreaking === 'true',
        isFeatured: fields.isFeatured === 'true',
        views: 0,
        likes: 0,
        shares: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
      };

      let docRef;
      
      if (db && db.collection) {
        docRef = await db.collection('news').add(newsData);
        console.log('✅ News saved to Firestore with ID:', docRef.id);
      } else {
        docRef = { id: 'news-' + Date.now() };
        // Add to mock news array
        global.mockNews.unshift({
          id: docRef.id,
          ...newsData
        });
        console.log('🎭 Development mode: Mock news created with ID:', docRef.id);
      }

      const responseData = {
        id: docRef.id,
        ...newsData,
        newsUrl: `/news/${docRef.id}`
      };

      res.json({
        success: true,
        news: responseData,
        message: 'News published successfully!'
      });

    } catch (error) {
      console.error('❌ News upload error:', error);
      res.status(500).json({ 
        error: 'News publication failed', 
        details: error.message
      });
    }
  });

  req.pipe(busboy);
});

// Get news articles
app.get('/api/news', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    
    let news = [];

    if (db && db.collection) {
      let query = db.collection('news').orderBy('publishedAt', 'desc');
      
      if (category && category !== 'all') {
        query = query.where('category', '==', category);
      }

      const snapshot = await query.get();
      news = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        newsUrl: `/news/${doc.id}`
      }));
    } else {
      news = global.mockNews;
      
      if (category && category !== 'all') {
        news = news.filter(item => item.category === category);
      }
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNews = news.slice(startIndex, endIndex);

    res.json({
      news: paginatedNews,
      currentPage: page,
      totalPages: Math.ceil(news.length / limit),
      totalCount: news.length,
      hasMore: endIndex < news.length
    });

  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Individual news page
app.get('/news/:id', async (req, res) => {
  try {
    const newsId = req.params.id;
    console.log(`📄 Serving news page for ID: ${newsId}`);
    
    let newsData;

    if (db && db.collection) {
      const doc = await db.collection('news').doc(newsId).get();
      
      if (!doc.exists) {
        return sendNewsNotFound(res, newsId);
      }

      const news = doc.data();
      newsData = createNewsData(news, doc.id);
      
      // Update view count
      await db.collection('news').doc(newsId).update({
        views: (news.views || 0) + 1,
        updatedAt: new Date().toISOString()
      });
    } else {
      const mockNews = global.mockNews.find(n => n.id === newsId) || global.mockNews[0];
      newsData = createNewsData(mockNews, newsId);
    }

    const html = generateNewsHTML(newsData);
    res.set('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('❌ Error serving news page:', error);
    sendNewsErrorPage(res, error);
  }
});

// Engagement API Endpoints

// Track view count
app.post('/api/prompt/:id/view', async (req, res) => {
  try {
    const promptId = req.params.id;
    
    if (db && db.collection) {
      // Production mode - update in Firestore
      const promptRef = db.collection('uploads').doc(promptId);
      const promptDoc = await promptRef.get();
      
      if (promptDoc.exists) {
        const currentViews = promptDoc.data().views || 0;
        await promptRef.update({
          views: currentViews + 1,
          updatedAt: new Date().toISOString()
        });
      }
    } else {
      // Development mode - update mock data
      const prompt = mockPrompts.find(p => p.id === promptId);
      if (prompt) {
        prompt.views = (prompt.views || 0) + 1;
        prompt.updatedAt = new Date().toISOString();
      }
    }
    
    res.json({ success: true, message: 'View counted' });
  } catch (error) {
    console.error('Error counting view:', error);
    res.status(500).json({ error: 'Failed to count view' });
  }
});

// Like/Unlike prompt
app.post('/api/prompt/:id/like', async (req, res) => {
  try {
    const promptId = req.params.id;
    const { userId, action } = req.body; // action: 'like' or 'unlike'
    
    if (db && db.collection) {
      const promptRef = db.collection('uploads').doc(promptId);
      const promptDoc = await promptRef.get();
      
      if (promptDoc.exists) {
        const currentLikes = promptDoc.data().likes || 0;
        
        if (action === 'like') {
          await promptRef.update({
            likes: currentLikes + 1,
            updatedAt: new Date().toISOString()
          });
        } else {
          await promptRef.update({
            likes: Math.max(0, currentLikes - 1),
            updatedAt: new Date().toISOString()
          });
        }
      }
    } else {
      // Development mode
      const prompt = mockPrompts.find(p => p.id === promptId);
      if (prompt) {
        if (action === 'like') {
          prompt.likes = (prompt.likes || 0) + 1;
        } else {
          prompt.likes = Math.max(0, (prompt.likes || 1) - 1);
        }
        prompt.updatedAt = new Date().toISOString();
      }
    }
    
    res.json({ success: true, action });
  } catch (error) {
    console.error('Error updating like:', error);
    res.status(500).json({ error: 'Failed to update like' });
  }
});

// Track prompt use
app.post('/api/prompt/:id/use', async (req, res) => {
  try {
    const promptId = req.params.id;
    const { userId } = req.body;
    
    if (db && db.collection) {
      const promptRef = db.collection('uploads').doc(promptId);
      const promptDoc = await promptRef.get();
      
      if (promptDoc.exists) {
        const currentUses = promptDoc.data().uses || 0;
        await promptRef.update({
          uses: currentUses + 1,
          updatedAt: new Date().toISOString()
        });
      }
    } else {
      // Development mode
      const prompt = mockPrompts.find(p => p.id === promptId);
      if (prompt) {
        prompt.uses = (prompt.uses || 0) + 1;
        prompt.updatedAt = new Date().toISOString();
      }
    }
    
    res.json({ success: true, message: 'Use counted' });
  } catch (error) {
    console.error('Error counting use:', error);
    res.status(500).json({ error: 'Failed to count use' });
  }
});

// Get user engagement status for a prompt
app.get('/api/prompt/:id/user-engagement', async (req, res) => {
  try {
    const promptId = req.params.id;
    const userId = req.query.userId;
    
    // For now, return default values since we're not tracking per-user in development
    res.json({ userLiked: false, userUsed: false });
  } catch (error) {
    console.error('Error fetching user engagement:', error);
    res.json({ userLiked: false, userUsed: false });
  }
});

// Search API endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { q: query, category, sort, page = 1, limit = 12 } = req.query;
    
    let prompts = [];

    if (db && db.collection) {
      // Production mode - search in Firestore
      let firestoreQuery = db.collection('uploads');
      
      // Basic text search
      if (query) {
        // This is a simple implementation - for production, consider using Algolia or Elasticsearch
        const snapshot = await firestoreQuery.get();
        prompts = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: safeDateToString(data.createdAt),
            promptUrl: `/prompt/${doc.id}`
          };
        }).filter(prompt => {
          const searchTerm = query.toLowerCase();
          const title = (prompt.title || '').toLowerCase();
          const promptText = (prompt.promptText || '').toLowerCase();
          const keywords = prompt.keywords || [];
          
          return title.includes(searchTerm) ||
                 promptText.includes(searchTerm) ||
                 keywords.some(keyword => 
                   keyword.toLowerCase().includes(searchTerm)
                 );
        });
      } else {
        const snapshot = await firestoreQuery.get();
        prompts = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: safeDateToString(data.createdAt),
            promptUrl: `/prompt/${doc.id}`
          };
        });
      }
    } else {
      // Development mode - search in mock data
      prompts = mockPrompts.filter(prompt => {
        let matches = true;
        
        if (query) {
          const searchTerm = query.toLowerCase();
          const title = (prompt.title || '').toLowerCase();
          const promptText = (prompt.promptText || '').toLowerCase();
          const keywords = prompt.keywords || [];
          
          matches = matches && (
            title.includes(searchTerm) ||
            promptText.includes(searchTerm) ||
            keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
          );
        }
        
        if (category && category !== 'all') {
          matches = matches && prompt.category === category;
        }
        
        return matches;
      });
    }
    
    // Apply sorting
    prompts = sortPrompts(prompts, sort);
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPrompts = prompts.slice(startIndex, endIndex);
    
    res.json({
      prompts: paginatedPrompts,
      totalCount: prompts.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(prompts.length / limit),
      hasMore: endIndex < prompts.length
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      details: error.message 
    });
  }
});

// Helper function for sorting
function sortPrompts(prompts, sortBy) {
  const sorted = [...prompts];
  
  switch (sortBy) {
    case 'popular':
      return sorted.sort((a, b) => {
        const aScore = (a.likes || 0) + (a.views || 0);
        const bScore = (b.likes || 0) + (b.views || 0);
        return bScore - aScore;
      });
    case 'likes':
      return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    case 'views':
      return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
    case 'recent':
    default:
      return sorted.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });
  }
}

// Upload endpoint
app.post('/api/upload', async (req, res) => {
  console.log('📤 Upload request received');
  
  // Handle file upload with Busboy
  const busboy = Busboy({ headers: req.headers });
  const fields = {};
  let fileBuffer = null;
  let fileName = null;
  let fileType = null;

  busboy.on('field', (fieldname, val) => {
    fields[fieldname] = val;
    console.log(`📝 Field ${fieldname}: ${val ? val.substring(0, 50) : 'null'}...`);
  });

  busboy.on('file', (fieldname, file, info) => {
    if (fieldname !== 'image') {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }

    const { filename, encoding, mimeType } = info;
    console.log(`📁 File upload: ${filename}, type: ${mimeType}`);
    
    fileName = filename;
    fileType = mimeType;
    
    const chunks = [];
    file.on('data', (data) => {
      chunks.push(data);
    });

    file.on('end', () => {
      fileBuffer = Buffer.concat(chunks);
      
      // Validate file size (5MB limit)
      if (fileBuffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size exceeds 5MB limit' });
      }
    });
  });

  busboy.on('finish', async () => {
    try {
      // Validate required fields
      if (!fields.title || !fields.promptText) {
        return res.status(400).json({ error: 'Title and prompt text are required' });
      }

      if (!fileBuffer) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(fileType)) {
        return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' });
      }

      let imageUrl;

      if (bucket) {
        // Production mode - upload to Firebase Storage
        const fileExtension = fileName.split('.').pop();
        const newFileName = `prompts/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const file = bucket.file(newFileName);

        await file.save(fileBuffer, {
          metadata: {
            contentType: fileType,
            metadata: {
              uploadedBy: fields.userId || 'anonymous',
              uploadedAt: new Date().toISOString()
            }
          }
        });

        // Make the file publicly accessible
        await file.makePublic();
        imageUrl = `https://storage.googleapis.com/${bucket.name}/${newFileName}`;
        
        console.log('✅ Image uploaded to Firebase Storage:', imageUrl);
      } else {
        // Development mode - use placeholder
        imageUrl = 'https://via.placeholder.com/800x400/4e54c8/white?text=Uploaded+Image';
        console.log('🎭 Development mode: Using placeholder image');
      }

      // Generate SEO metadata
      const seoTitle = SEOOptimizer.generateSEOTitle(fields.title);
      const metaDescription = SEOOptimizer.generateMetaDescription(fields.promptText, fields.title);
      const keywords = SEOOptimizer.extractKeywords(fields.title + ' ' + fields.promptText);
      const slug = SEOOptimizer.generateSlug(fields.title);

      // Create prompt data - NEW UPLOADS AUTOMATICALLY GET ADSENSE
      const promptData = {
        title: fields.title,
        promptText: fields.promptText,
        imageUrl: imageUrl,
        category: fields.category || 'general',
        userName: fields.userName || 'Anonymous User',
        likes: 0,
        views: 0,
        uses: 0,
        keywords: keywords,
        seoTitle: seoTitle,
        metaDescription: metaDescription,
        slug: slug,
        seoScore: Math.floor(Math.random() * 30) + 70,
        adsenseMigrated: true, // ✅ New uploads automatically marked as migrated
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let docRef;
      
      if (db && db.collection) {
        // Production mode - save to Firestore
        docRef = await db.collection('uploads').add(promptData);
        console.log('✅ Prompt saved to Firestore with ID:', docRef.id);
      } else {
        // Development mode - generate mock ID
        docRef = { id: 'demo-' + Date.now() };
        mockPrompts.unshift({
          id: docRef.id,
          ...promptData
        });
        console.log('🎭 Development mode: Mock prompt created with ID:', docRef.id);
      }

      // Add ID and URL to response
      const responseData = {
        id: docRef.id,
        ...promptData,
        promptUrl: `/prompt/${docRef.id}`
      };

      res.json({
        success: true,
        upload: responseData,
        message: 'Upload successful! Your creation is now live with AdSense monetization.'
      });

    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({ 
        error: 'Upload failed', 
        details: error.message,
        mode: db ? 'production' : 'development'
      });
    }
  });

  busboy.on('error', (error) => {
    console.error('❌ Busboy error:', error);
    res.status(500).json({ error: 'File upload processing failed' });
  });

  // Pipe the request to busboy
  req.pipe(busboy);
});

// API Routes - Get uploads with user engagement data
app.get('/api/uploads', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const userId = req.query.userId;
    
    if (db && db.collection) {
      const snapshot = await db.collection('uploads')
        .orderBy('createdAt', 'desc')
        .get();

      const allUploads = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        allUploads.push({ 
          id: doc.id, 
          ...data,
          createdAt: safeDateToString(data.createdAt),
          updatedAt: safeDateToString(data.updatedAt),
          userLiked: false,
          userUsed: false,
          promptUrl: `/prompt/${doc.id}`
        });
      });

      // Manual pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const uploads = allUploads.slice(startIndex, endIndex);

      res.json({
        uploads,
        currentPage: page,
        totalPages: Math.ceil(allUploads.length / limit),
        totalCount: allUploads.length,
        adsenseInfo: {
          migrated: allUploads.filter(u => u.adsenseMigrated).length,
          total: allUploads.length,
          percentage: Math.round((allUploads.filter(u => u.adsenseMigrated).length / allUploads.length) * 100) || 0
        }
      });
    } else {
      // Development mode with mock data
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const uploads = mockPrompts.slice(startIndex, endIndex).map(prompt => ({
        ...prompt,
        userLiked: false,
        userUsed: false,
        promptUrl: `/prompt/${prompt.id}`
      }));
      
      res.json({
        uploads,
        currentPage: page,
        totalPages: Math.ceil(mockPrompts.length / limit),
        totalCount: mockPrompts.length,
        adsenseInfo: {
          migrated: mockPrompts.filter(u => u.adsenseMigrated).length,
          total: mockPrompts.length,
          percentage: 100
        }
      });
    }
  } catch (error) {
    console.error('Error fetching uploads:', error);
    // Fallback to mock data
    res.json({
      uploads: mockPrompts.map(prompt => ({
        ...prompt,
        userLiked: false,
        userUsed: false,
        promptUrl: `/prompt/${prompt.id}`
      })),
      currentPage: 1,
      totalPages: 1,
      totalCount: mockPrompts.length,
      adsenseInfo: {
        migrated: mockPrompts.length,
        total: mockPrompts.length,
        percentage: 100
      }
    });
  }
});

// Individual prompt pages for SEO - UPDATED TO ALWAYS USE WWW VERSION
app.get('/prompt/:id', async (req, res) => {
  try {
    const promptId = req.params.id;
    console.log(`📄 Serving prompt page for ID: ${promptId} with WWW version`);
    
    let promptData;

    if (db && db.collection && promptId !== 'demo-1' && promptId !== 'demo-2' && promptId !== 'demo-3') {
      // Production mode - fetch from Firestore
      const doc = await db.collection('uploads').doc(promptId).get();
      
      if (!doc.exists) {
        return sendPromptNotFound(res, promptId);
      }

      const prompt = doc.data();
      promptData = createPromptData(prompt, doc.id);
      
      // Update view count
      await db.collection('uploads').doc(promptId).update({
        views: (prompt.views || 0) + 1,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Development mode - use mock data
      const mockPrompt = mockPrompts.find(p => p.id === promptId) || mockPrompts[0];
      promptData = createPromptData(mockPrompt, promptId);
    }

    // ✅ This will ALWAYS use the WWW version template for ALL prompts
    const html = generatePromptHTML(promptData);
    res.set('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('❌ Error serving prompt page:', error);
    sendErrorPage(res, error);
  }
});

// Category pages for SEO
app.get('/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
    
    const html = generateCategoryHTML(category, baseUrl);
    res.set('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('❌ Error serving category page:', error);
    sendErrorPage(res, error);
  }
});

// Helper functions
function createNewsData(news, id) {
  const safeNews = news || {};
  return {
    id: id || 'unknown',
    title: safeNews.title || 'AI News Update',
    content: safeNews.content || 'No content available.',
    excerpt: safeNews.excerpt || (safeNews.content ? safeNews.content.substring(0, 200) + '...' : ''),
    imageUrl: safeNews.imageUrl || 'https://via.placeholder.com/800x400/4e54c8/white?text=Prompt+Seen+News',
    author: safeNews.author || 'Prompt Seen Editor',
    category: safeNews.category || 'ai-news',
    tags: safeNews.tags || ['ai', 'news'],
    views: safeNews.views || 0,
    likes: safeNews.likes || 0,
    shares: safeNews.shares || 0,
    isBreaking: safeNews.isBreaking || false,
    isFeatured: safeNews.isFeatured || false,
    createdAt: safeDateToString(safeNews.createdAt),
    publishedAt: safeDateToString(safeNews.publishedAt),
    seoTitle: safeNews.seoTitle || safeNews.title || 'AI News - Prompt Seen',
    metaDescription: safeNews.metaDescription || (safeNews.content ? 
      safeNews.content.substring(0, 155) + '...' : 
      'Latest AI news and prompt engineering updates from Prompt Seen.')
  };
}

function createPromptData(prompt, id) {
  // Safe fallbacks for all properties
  const safePrompt = prompt || {};
  
  return {
    id: id || 'unknown',
    title: safePrompt.title || 'Untitled Prompt',
    seoTitle: safePrompt.seoTitle || safePrompt.title || 'AI Prompt - Prompt Seen',
    metaDescription: safePrompt.metaDescription || (safePrompt.promptText ? 
      safePrompt.promptText.substring(0, 155) + '...' : 
      'Explore this AI-generated image and learn prompt engineering techniques.'),
    imageUrl: safePrompt.imageUrl || 'https://via.placeholder.com/800x400/4e54c8/white?text=Prompt+Seen+AI+Image',
    promptText: safePrompt.promptText || 'No prompt text available.',
    userName: safePrompt.userName || 'Anonymous',
    likes: safePrompt.likes || 0,
    views: safePrompt.views || 0,
    uses: safePrompt.uses || 0,
    keywords: safePrompt.keywords || ['AI', 'prompt', 'image generation'],
    createdAt: safeDateToString(safePrompt.createdAt),
    seoScore: safePrompt.seoScore || 0,
    adsenseMigrated: safePrompt.adsenseMigrated || false
  };
}

function generateNewsHTML(newsData) {
  const adsenseCode = generateAdSenseCode();
  
  // FORCE WWW VERSION
  const baseUrl = 'https://www.promptseen.co';
  const newsUrl = `${baseUrl}/news/${newsData.id}`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${newsData.seoTitle}</title>
    <meta name="description" content="${newsData.metaDescription}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    
    <!-- Google AdSense Auto Ads -->
    ${adsenseCode}
    
    <!-- News-specific meta tags -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${newsUrl}">
    <meta property="article:published_time" content="${newsData.publishedAt}">
    <meta property="article:modified_time" content="${newsData.updatedAt}">
    <meta property="article:author" content="${newsData.author}">
    <meta property="article:section" content="${newsData.category}">
    ${(newsData.tags || []).map(tag => `<meta property="article:tag" content="${tag}">`).join('')}
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${newsUrl}" />
    
    <!-- Google News specific tags -->
    <meta name="news_keywords" content="${(newsData.tags || []).join(', ')}">
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f7fa; padding: 20px; }
        .news-article { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .news-header { text-align: center; margin-bottom: 30px; }
        .news-title { font-size: 2.5rem; color: #2d334a; margin-bottom: 15px; line-height: 1.3; }
        .news-meta { color: #666; margin-bottom: 20px; font-size: 1rem; }
        .news-image { width: 100%; height: 400px; object-fit: cover; border-radius: 10px; margin-bottom: 30px; }
        .news-content { line-height: 1.8; font-size: 1.1rem; }
        .news-content p { margin-bottom: 20px; }
        .breaking-badge { background: #ff6b6b; color: white; padding: 8px 20px; border-radius: 25px; font-weight: bold; display: inline-block; margin-bottom: 15px; }
        .back-link { display: inline-block; margin-top: 30px; color: #4e54c8; text-decoration: none; font-weight: 600; }
        .back-link:hover { text-decoration: underline; }
        
        /* Ad Container Styles */
        .ad-container {
            margin: 25px 0;
            text-align: center;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        .ad-label {
            font-size: 0.8rem;
            color: #6c757d;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        @media (max-width: 768px) {
            body { padding: 10px; }
            .news-article { padding: 20px; }
            .news-title { font-size: 1.8rem; }
            .news-image { height: 250px; }
        }
    </style>
</head>
<body>
    <!-- Auto Ads will be placed here automatically by Google -->
    
    <article class="news-article">
        <header class="news-header">
            ${newsData.isBreaking ? '<span class="breaking-badge">BREAKING NEWS</span>' : ''}
            <h1 class="news-title">${newsData.title}</h1>
            <div class="news-meta">
                By ${newsData.author} | ${new Date(newsData.publishedAt).toLocaleDateString()} | 
                ${newsData.views} views | ${newsData.category}
            </div>
        </header>
        
        <!-- Top Ad Placement -->
        <div class="ad-container">
            <div class="ad-label">Advertisement</div>
            <!-- Auto ads will populate here -->
        </div>
        
        <img src="${newsData.imageUrl}" alt="${newsData.title}" class="news-image">
        
        <!-- Middle Ad Placement -->
        <div class="ad-container">
            <div class="ad-label">Advertisement</div>
            <!-- Auto ads will populate here -->
        </div>
        
        <div class="news-content">
            ${(newsData.content || '').split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
        </div>
        
        <!-- Bottom Ad Placement -->
        <div class="ad-container">
            <div class="ad-label">Advertisement</div>
            <!-- Auto ads will populate here -->
        </div>
        
        <a href="https://www.promptseen.co/" class="back-link">← Back to Prompt Seen</a>
    </article>

    <!-- CLIENT-SIDE REDIRECT SCRIPT FOR NEWS PAGES -->
    <script>
        // Force www version for all news pages
        (function() {
            const currentHost = window.location.hostname;
            const currentProtocol = window.location.protocol;
            const currentPath = window.location.pathname;
            const currentSearch = window.location.search;
            const currentHash = window.location.hash;
            
            // If accessed via non-www, redirect to www
            if (currentHost === 'promptseen.co') {
                const targetUrl = \`https://www.promptseen.co\${currentPath}\${currentSearch}\${currentHash}\`;
                
                // Only redirect if we're not already on www
                if (window.location.href !== targetUrl) {
                    console.log('Redirecting to www version:', targetUrl);
                    window.location.replace(targetUrl);
                    return; // Stop execution for redirect
                }
            }
        })();
    </script>
</body>
</html>`;
}

function generatePromptHTML(promptData) {
  const adsenseCode = generateAdSenseCode();
  
  // FORCE WWW VERSION IN ALL LINKS AND META TAGS
  const baseUrl = 'https://www.promptseen.co';
  const promptUrl = `${baseUrl}/prompt/${promptData.id}`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${promptData.seoTitle}</title>
    <meta name="description" content="${promptData.metaDescription}">
    <meta name="keywords" content="${(promptData.keywords || []).join(', ')}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    
    <!-- Google AdSense Auto Ads -->
    ${adsenseCode}
    
    <!-- Open Graph - USING WWW VERSION -->
    <meta property="og:title" content="${promptData.seoTitle}">
    <meta property="og:description" content="${promptData.metaDescription}">
    <meta property="og:image" content="${promptData.imageUrl}">
    <meta property="og:url" content="${promptUrl}">
    <meta property="og:type" content="article">
    
    <!-- Twitter Card - USING WWW VERSION -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${promptData.seoTitle}">
    <meta name="twitter:description" content="${promptData.metaDescription}">
    <meta name="twitter:image" content="${promptData.imageUrl}">
    
    <!-- Canonical URL - FORCE WWW -->
    <link rel="canonical" href="${promptUrl}" />
    
    <!-- Structured Data - USING WWW VERSION -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "name": "${promptData.title || 'Untitled Prompt'}",
      "description": "${promptData.metaDescription || 'AI-generated prompt'}",
      "image": "${promptData.imageUrl || 'https://via.placeholder.com/800x400/4e54c8/white?text=AI+Image'}",
      "author": {
        "@type": "Person",
        "name": "${promptData.userName || 'Prompt Seen User'}"
      },
      "datePublished": "${promptData.createdAt || new Date().toISOString()}",
      "keywords": "${(promptData.keywords || ['AI', 'prompt']).join(', ')}",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "${promptUrl}"
      }
    }
    </script>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; line-height: 1.6; color: #2d334a; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        
        /* Ad Container Styles */
        .ad-container {
            margin: 20px 0;
            text-align: center;
            background: #f8f9fa;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        .ad-label {
            font-size: 0.8rem;
            color: #6c757d;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        h1 { color: #4e54c8; margin-bottom: 20px; font-size: 2rem; line-height: 1.3; }
        .user-info { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; color: #666; font-size: 0.9rem; }
        .prompt-image { width: 100%; height: 400px; object-fit: cover; border-radius: 10px; margin-bottom: 20px; background: #f0f4f8; }
        .prompt-content { background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0; }
        .prompt-content h2 { margin-bottom: 15px; color: #2d334a; font-size: 1.4rem; }
        .prompt-text { white-space: pre-wrap; font-family: 'Courier New', monospace; background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #4e54c8; font-size: 1rem; line-height: 1.5; }
        .prompt-meta { display: flex; gap: 30px; margin: 25px 0; padding: 20px; background: #f8f9fa; border-radius: 10px; flex-wrap: wrap; }
        .meta-item { display: flex; align-items: center; gap: 8px; }
        .meta-item strong { color: #4e54c8; font-weight: 600; }
        .engagement-buttons { display: flex; gap: 15px; margin: 20px 0; flex-wrap: wrap; }
        .engagement-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border: 2px solid #4e54c8; border-radius: 25px; background: white; cursor: pointer; transition: all 0.3s ease; text-decoration: none; color: inherit; }
        .engagement-btn:hover { background: #4e54c8; color: white; transform: translateY(-2px); }
        .engagement-btn.liked { background: #ff6b6b; border-color: #ff6b6b; color: white; }
        .engagement-btn.used { background: #20bf6b; border-color: #20bf6b; color: white; }
        .back-link { display: inline-flex; align-items: center; gap: 8px; margin-top: 20px; color: #4e54c8; text-decoration: none; padding: 12px 25px; border: 2px solid #4e54c8; border-radius: 30px; transition: all 0.3s ease; font-weight: 600; }
        .back-link:hover { background: #4e54c8; color: white; transform: translateY(-2px); }
        .seo-score { display: inline-block; padding: 5px 12px; background: #20bf6b; color: white; border-radius: 20px; font-size: 0.8rem; font-weight: 600; margin-left: 10px; }
        @media (max-width: 768px) {
            body { padding: 10px; }
            .container { padding: 20px; }
            h1 { font-size: 1.5rem; }
            .prompt-image { height: 300px; }
            .prompt-meta { flex-direction: column; gap: 15px; padding: 15px; }
            .prompt-content { padding: 20px; }
            .engagement-buttons { flex-direction: column; }
        }
    </style>
</head>
<body>
    <!-- Auto Ads will be placed here automatically by Google -->
    
    <div class="container">
        <div class="user-info">
            <i class="fas fa-user-circle"></i>
            <span>Created by: ${promptData.userName}</span>
            ${promptData.seoScore ? `<span class="seo-score">Prompt seen: ${promptData.seoScore}/100</span>` : ''}
            ${promptData.adsenseMigrated ? `<span style="font-size: 0.7rem; background: #4e54c8; color: white; padding: 2px 8px; border-radius: 10px; margin-left: 5px;">AdSense</span>` : ''}
        </div>
        
        <h1>${promptData.title}</h1>
        
        <!-- Top Ad Placement -->
        <div class="ad-container">
            <div class="ad-label">Advertisement</div>
            <!-- Auto ads will populate here -->
        </div>
        
        <img src="${promptData.imageUrl}" 
             alt="${promptData.title} - AI Generated Image" 
             class="prompt-image"
             onerror="this.src='https://via.placeholder.com/800x400/4e54c8/white?text=Image+Not+Available'"
             id="promptImage">
        
        <div class="prompt-content">
            <h2><i class="fas fa-magic"></i> Prompt Used:</h2>
            <div class="prompt-text">${promptData.promptText}</div>
        </div>
        
        <!-- Middle Ad Placement -->
        <div class="ad-container">
            <div class="ad-label">Advertisement</div>
            <!-- Auto ads will populate here -->
        </div>
        
        <div class="prompt-meta">
            <div class="meta-item" data-type="likes">
                <i class="fas fa-heart" style="color: #ff6b6b;"></i>
                <strong>Likes:</strong> <span class="likes-count">${promptData.likes}</span>
            </div>
            <div class="meta-item" data-type="views">
                <i class="fas fa-eye" style="color: #4e54c8;"></i>
                <strong>Views:</strong> <span class="views-count">${promptData.views}</span>
            </div>
            <div class="meta-item" data-type="uses">
                <i class="fas fa-download" style="color: #20bf6b;"></i>
                <strong>Uses:</strong> <span class="uses-count">${promptData.uses}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-calendar" style="color: #8f94fb;"></i>
                <strong>Created:</strong> ${new Date(promptData.createdAt).toLocaleDateString()}
            </div>
        </div>
        
        <div class="engagement-buttons">
            <button class="engagement-btn like-btn" onclick="handleLike('${promptData.id}')">
                <i class="far fa-heart"></i> Like
            </button>
            <button class="engagement-btn use-btn" onclick="handleUse('${promptData.id}')">
                <i class="fas fa-download"></i> Mark as Used
            </button>
            <button class="engagement-btn share-btn" onclick="handleShare('${promptData.id}')">
                <i class="fas fa-share"></i> Share
            </button>
        </div>
        
        <!-- Bottom Ad Placement -->
        <div class="ad-container">
            <div class="ad-label">Advertisement</div>
            <!-- Auto ads will populate here -->
        </div>
        
        <!-- BACK LINK USING WWW VERSION -->
        <a href="https://www.promptseen.co/" class="back-link">
            <i class="fas fa-arrow-left"></i> Back to Prompt Seen
        </a>
    </div>
    
    <script>
        // Image loading animation
        document.addEventListener('DOMContentLoaded', function() {
            const img = document.getElementById('promptImage');
            if (img) {
                if (img.complete && img.naturalHeight !== 0) {
                    img.style.opacity = '1';
                } else {
                    img.onload = function() {
                        this.style.opacity = '1';
                    };
                    img.style.transition = 'opacity 0.5s ease';
                    img.style.opacity = '0';
                }
            }
            
            // Track view - USING WWW VERSION IN API CALLS
            fetch('https://www.promptseen.co/api/prompt/${promptData.id}/view', { method: 'POST' })
                .then(() => {
                    // Update view count
                    const viewsCount = document.querySelector('.views-count');
                    if (viewsCount) {
                        viewsCount.textContent = parseInt(viewsCount.textContent) + 1;
                    }
                })
                .catch(console.error);
        });
        
        async function handleLike(promptId) {
            try {
                const likeBtn = document.querySelector('.like-btn');
                const likesCount = document.querySelector('.likes-count');
                const isLiked = likeBtn.classList.contains('liked');
                const action = isLiked ? 'unlike' : 'like';
                
                // USING WWW VERSION IN API CALLS
                const response = await fetch('https://www.promptseen.co/api/prompt/' + promptId + '/like', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        userId: 'anonymous', 
                        action: action
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    
                    if (result.action === 'like') {
                        likeBtn.innerHTML = '<i class="fas fa-heart"></i> Liked';
                        likeBtn.classList.add('liked');
                        likesCount.textContent = parseInt(likesCount.textContent) + 1;
                    } else {
                        likeBtn.innerHTML = '<i class="far fa-heart"></i> Like';
                        likeBtn.classList.remove('liked');
                        likesCount.textContent = parseInt(likesCount.textContent) - 1;
                    }
                }
            } catch (error) {
                console.error('Like error:', error);
                alert('Failed to update like. Please try again.');
            }
        }
        
        async function handleUse(promptId) {
            try {
                const useBtn = document.querySelector('.use-btn');
                const usesCount = document.querySelector('.uses-count');
                
                // USING WWW VERSION IN API CALLS
                const response = await fetch('https://www.promptseen.co/api/prompt/' + promptId + '/use', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: 'anonymous' })
                });
                
                if (response.ok) {
                    useBtn.innerHTML = '<i class="fas fa-check"></i> Used';
                    useBtn.classList.add('used');
                    usesCount.textContent = parseInt(usesCount.textContent) + 1;
                    alert('Prompt marked as used!');
                }
            } catch (error) {
                console.error('Use error:', error);
                alert('Failed to mark as used. Please try again.');
            }
        }
        
        function handleShare(promptId) {
            // USING WWW VERSION FOR SHARING
            const promptUrl = 'https://www.promptseen.co/prompt/' + promptId;
            
            if (navigator.share) {
                try {
                    navigator.share({
                        title: '${promptData.title}',
                        text: '${(promptData.promptText || '').substring(0, 100)}...',
                        url: promptUrl
                    });
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        navigator.clipboard.writeText(promptUrl).then(() => {
                            alert('Link copied to clipboard!');
                        });
                    }
                }
            } else {
                navigator.clipboard.writeText(promptUrl).then(() => {
                    alert('Link copied to clipboard!');
                });
            }
        }
    </script>

    <!-- ENHANCED CLIENT-SIDE REDIRECT - FORCE WWW IF SOMEONE ACCESSES NON-WWW -->
    <script>
        // Force www version for all prompt pages
        (function() {
            const currentHost = window.location.hostname;
            const currentProtocol = window.location.protocol;
            const currentPath = window.location.pathname;
            const currentSearch = window.location.search;
            const currentHash = window.location.hash;
            
            // If accessed via non-www, redirect to www
            if (currentHost === 'promptseen.co') {
                const targetUrl = \`https://www.promptseen.co\${currentPath}\${currentSearch}\${currentHash}\`;
                
                // Only redirect if we're not already on www
                if (window.location.href !== targetUrl) {
                    console.log('Redirecting to www version:', targetUrl);
                    window.location.replace(targetUrl);
                    return; // Stop execution for redirect
                }
            }
            
            // If we're on www, ensure all internal links use www
            document.addEventListener('DOMContentLoaded', function() {
                // Update any relative links to absolute www links
                const links = document.querySelectorAll('a[href^="/"]');
                links.forEach(link => {
                    if (link.href.startsWith('/')) {
                        link.href = 'https://www.promptseen.co' + link.getAttribute('href');
                    }
                });
            });
        })();
    </script>
</body>
</html>`;
}

// Helper function to generate category page HTML
function generateCategoryHTML(category, baseUrl) {
  const categoryNames = {
    'art': 'AI Art',
    'photography': 'AI Photography', 
    'design': 'AI Design',
    'writing': 'AI Writing',
    'other': 'Other AI Creations'
  };
  
  const categoryName = categoryNames[category] || 'AI Prompts';
  const description = `Explore ${categoryName} prompts and AI-generated content. Discover the best prompt engineering techniques for ${categoryName.toLowerCase()}.`;

  const adsenseCode = generateAdSenseCode();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${categoryName} Prompts - Prompt Seen</title>
    <meta name="description" content="${description}">
    <meta name="robots" content="index, follow">
    
    <!-- Google AdSense Auto Ads -->
    ${adsenseCode}
    
    <!-- Open Graph -->
    <meta property="og:title" content="${categoryName} Prompts - Prompt Seen">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://www.promptseen.co/category/${category}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://www.promptseen.co/category/${category}" />
    
    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "${categoryName} Prompts",
      "description": "${description}",
      "url": "https://www.promptseen.co/category/${category}",
      "mainEntity": {
        "@type": "ItemList",
        "name": "${categoryName} AI Prompts"
      }
    }
    </script>
    
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background: #f5f7fa; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); text-align: center; }
        h1 { color: #4e54c8; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; margin-bottom: 30px; }
        .back-link { color: #4e54c8; text-decoration: none; padding: 12px 25px; border: 2px solid #4e54c8; border-radius: 30px; display: inline-block; }
        .back-link:hover { background: #4e54c8; color: white; }
        
        /* Ad Container Styles */
        .ad-container {
            margin: 25px 0;
            text-align: center;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        .ad-label {
            font-size: 0.8rem;
            color: #6c757d;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
    </style>
</head>
<body>
    <!-- Auto Ads will be placed here automatically by Google -->
    
    <div class="container">
        <!-- Top Ad Placement -->
        <div class="ad-container">
            <div class="ad-label">Advertisement</div>
            <!-- Auto ads will populate here -->
        </div>
        
        <h1>${categoryName} Prompts</h1>
        <p>${description}</p>
        <p>This category page is automatically generated for SEO purposes. The actual ${categoryName.toLowerCase()} content is available on our main showcase page.</p>
        
        <!-- Middle Ad Placement -->
        <div class="ad-container">
            <div class="ad-label">Advertisement</div>
            <!-- Auto ads will populate here -->
        </div>
        
        <a href="https://www.promptseen.co/" class="back-link">← Back to Prompt Showcase</a>
        
        <!-- Bottom Ad Placement -->
        <div class="ad-container">
            <div class="ad-label">Advertisement</div>
            <!-- Auto ads will populate here -->
        </div>
    </div>

    <!-- CLIENT-SIDE REDIRECT SCRIPT FOR CATEGORY PAGES -->
    <script>
        // Client-side redirect for category pages
        (function() {
            const currentHost = window.location.hostname;
            const currentPath = window.location.pathname;
            
            // Only run on production domain
            if (currentHost === 'promptseen.co') {
                const targetHost = 'www.promptseen.co';
                const targetUrl = \`https://\${targetHost}\${currentPath}\${window.location.search}\${window.location.hash}\`;
                
                console.log('Redirecting category page to:', targetUrl);
                window.location.replace(targetUrl);
            }
        })();
    </script>
</body>
</html>`;
}

// Helper function for 404 page
function sendPromptNotFound(res, promptId) {
  res.status(404).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Prompt Not Found - Prompt Seen</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background: #f5f7fa; text-align: center; }
        .container { max-width: 600px; margin: 50px auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        h1 { color: #ff6b6b; margin-bottom: 20px; }
        a { color: #4e54c8; text-decoration: none; padding: 12px 25px; border: 2px solid #4e54c8; border-radius: 30px; display: inline-block; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Prompt Not Found</h1>
        <p>The prompt you're looking for doesn't exist or may have been removed.</p>
        <p><small>Prompt ID: ${promptId}</small></p>
        <a href="https://www.promptseen.co/">← Return to Prompt Seen</a>
    </div>
</body>
</html>`);
}

function sendNewsNotFound(res, newsId) {
  res.status(404).send(`
<!DOCTYPE html>
<html>
<head>
    <title>News Not Found - Prompt Seen</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background: #f5f7fa; text-align: center; }
        .container { max-width: 600px; margin: 50px auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        h1 { color: #ff6b6b; margin-bottom: 20px; }
        a { color: #4e54c8; text-decoration: none; padding: 12px 25px; border: 2px solid #4e54c8; border-radius: 30px; display: inline-block; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>News Article Not Found</h1>
        <p>The news article you're looking for doesn't exist or may have been removed.</p>
        <p><small>News ID: ${newsId}</small></p>
        <a href="https://www.promptseen.co/">← Return to Prompt Seen</a>
    </div>
</body>
</html>`);
}

// Helper function for error page
function sendErrorPage(res, error) {
  res.status(500).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Error - Prompt Seen</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background: #f5f7fa; text-align: center; }
        .container { max-width: 600px; margin: 50px auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        h1 { color: #ff6b6b; margin-bottom: 20px; }
        a { color: #4e54c8; text-decoration: none; padding: 12px 25px; border: 2px solid #4e54c8; border-radius: 30px; display: inline-block; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Error Loading Prompt</h1>
        <p>There was an error loading this prompt. Please try again later.</p>
        <a href="https://www.promptseen.co/">← Return to Home</a>
    </div>
</body>
</html>`);
}

function sendNewsErrorPage(res, error) {
  res.status(500).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Error - Prompt Seen News</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background: #f5f7fa; text-align: center; }
        .container { max-width: 600px; margin: 50px auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        h1 { color: #ff6b6b; margin-bottom: 20px; }
        a { color: #4e54c8; text-decoration: none; padding: 12px 25px; border: 2px solid #4e54c8; border-radius: 30px; display: inline-block; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Error Loading News</h1>
        <p>There was an error loading this news article. Please try again later.</p>
        <a href="https://www.promptseen.co/">← Return to Home</a>
    </div>
</body>
</html>`);
}

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Simple 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <html>
      <head><title>Page Not Found</title></head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="https://www.promptseen.co/">Return to Home</a>
      </body>
    </html>
  `);
});

// Start server
app.listen(port, async () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Base URL: http://localhost:${port}`);
  console.log(`📰 News routes: http://localhost:${port}/news/:id`);
  console.log(`🗞️  News API: http://localhost:${port}/api/news`);
  console.log(`📤 News upload: http://localhost:${port}/api/upload-news`);
  console.log(`🗺️  News sitemap: http://localhost:${port}/sitemap-news.xml`);
  console.log(`🔗 Prompt routes: http://localhost:${port}/prompt/:id`);
  console.log(`📤 Upload endpoint: http://localhost:${port}/api/upload`);
  console.log(`❤️  Engagement endpoints:`);
  console.log(`   → Views: http://localhost:${port}/api/prompt/:id/view`);
  console.log(`   → Likes: http://localhost:${port}/api/prompt/:id/like`);
  console.log(`   → Uses: http://localhost:${port}/api/prompt/:id/use`);
  console.log(`🔍 Search: http://localhost:${port}/api/search`);
  console.log(`🗺️  Sitemap: http://localhost:${port}/sitemap.xml`);
  console.log(`🤖 Robots.txt: http://localhost:${port}/robots.txt`);
  console.log(`❤️  Health check: http://localhost:${port}/health`);
  console.log(`💰 AdSense Client ID: ${process.env.ADSENSE_CLIENT_ID || 'ca-pub-5992381116749724'}`);
  console.log(`🔄 AdSense Migration: http://localhost:${port}/admin/migrate-adsense`);
  
  // Auto-migrate on startup (optional - remove if you want manual control)
  if (process.env.AUTO_MIGRATE_ADSENSE === 'true') {
    console.log('🔄 Auto-migrating existing prompts for AdSense...');
    try {
      const migratedCount = await migrateExistingPromptsForAdSense();
      console.log(`✅ Auto-migration completed: ${migratedCount} prompts migrated`);
    } catch (error) {
      console.error('❌ Auto-migration failed:', error);
    }
  }
  
  if (!db || !db.collection) {
    console.log(`🎭 Running in DEVELOPMENT mode with mock data`);
    console.log(`📰 Sample news articles:`);
    global.mockNews.slice(0, 3).forEach(news => {
      console.log(`   → http://localhost:${port}/news/${news.id}`);
    });
    console.log(`📝 Sample prompts:`);
    mockPrompts.forEach(prompt => {
      console.log(`   → http://localhost:${port}/prompt/${prompt.id}`);
    });
  }
});