// Vercel Serverless Function to get Douyin video thumbnail
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    let videoId = null;

    // Step 1: If it's a short link (v.douyin.com), follow redirect to get video ID
    if (url.includes('v.douyin.com')) {
      const redirectResp = await fetch(url, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const finalUrl = redirectResp.url;
      const match = finalUrl.match(/\/video\/(\d+)/);
      videoId = match ? match[1] : null;
    } else {
      // Direct video URL
      const match = url.match(/\/video\/(\d+)/);
      videoId = match ? match[1] : null;
    }

    if (!videoId) {
      return res.status(400).json({ error: 'Cannot extract video ID from URL' });
    }

    // Step 2: Fetch iesdouyin share page (server-rendered, contains cover data)
    const shareUrl = `https://www.iesdouyin.com/share/video/${videoId}/`;
    const shareResp = await fetch(shareUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Referer': 'https://www.iesdouyin.com/'
      }
    });

    if (!shareResp.ok) {
      return res.status(shareResp.status).json({
        error: `iesdouyin page error: ${shareResp.status}`
      });
    }

    const html = await shareResp.text();

    // Step 3: Extract cover URL from the JSON data in the page
    const coverMatch = html.match(/"cover"\s*:\s*\{[^}]*?"url_list"\s*:\s*\["([^"]+)"/);
    if (!coverMatch) {
      return res.status(404).json({ error: 'Cannot extract cover URL from page' });
    }

    // Fix unicode escapes in URL
    let coverUrl = coverMatch[1].replace(/\\u002F/g, '/');

    return res.status(200).json({
      video_id: videoId,
      thumbnail: coverUrl
    });

  } catch (error) {
    console.error('Error fetching Douyin thumbnail:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}