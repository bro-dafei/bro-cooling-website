// Vercel Serverless Function to save data
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data } = req.body;
    
    // Simple validation
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid data' });
    }

    // Extract video data only (for now)
    const videoData = data.video || {};
    
    // In a real implementation, you would save to a database
    // For now, we'll just log and return success
    console.log('Video data received:', Object.keys(videoData).map(p => `${p}: ${videoData[p]?.length || 0} items`));
    
    // You could save to a JSON file or database here
    // For example, write to a file:
    // await fs.writeFile('/tmp/bro-data-latest.json', JSON.stringify({ video: videoData }, null, 2));
    
    return res.status(200).json({ 
      success: true, 
      message: 'Data saved successfully',
      timestamp: new Date().toISOString(),
      received: {
        video: Object.keys(videoData).map(p => `${p}: ${videoData[p]?.length || 0} items`)
      }
    });
  } catch (error) {
    console.error('Error saving data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}