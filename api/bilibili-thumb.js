// Vercel Serverless Function to get Bilibili video thumbnail
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bvid } = req.query;
  
  if (!bvid) {
    return res.status(400).json({ error: 'Missing bvid parameter' });
  }

  try {
    // Fetch video info from Bilibili API
    const apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://www.bilibili.com'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Bilibili API error: ${response.status}` 
      });
    }

    const data = await response.json();
    
    if (data.code !== 0) {
      return res.status(404).json({ 
        error: `Video not found: ${data.message}` 
      });
    }

    const thumbnailUrl = data.data.pic;
    
    // Return the thumbnail URL
    return res.status(200).json({
      bvid,
      thumbnail: thumbnailUrl,
      title: data.data.title
    });

  } catch (error) {
    console.error('Error fetching Bilibili thumbnail:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}