// Vercel Serverless Function for auto-deploy
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, commitMessage = 'Auto-deploy from editor' } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Get GitHub token from environment variable
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'GitHub token not configured' });
    }

    // GitHub API endpoints
    const owner = 'bro-dafei';
    const repo = 'bro-cooling-website';
    const path = 'bro-data.json';
    
    // 1. Get current file SHA
    const getFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const getResponse = await fetch(getFileUrl, {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'bro-cooling-website'
      }
    });

    let sha = null;
    if (getResponse.ok) {
      const fileInfo = await getResponse.json();
      sha = fileInfo.sha;
    }

    // 2. Update file
    const updateUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'bro-cooling-website',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: commitMessage,
        content: content,
        sha: sha
      })
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error('GitHub API error:', error);
      return res.status(500).json({ 
        error: 'Failed to update GitHub repository',
        details: error 
      });
    }

    // 3. Trigger Vercel deployment (optional)
    // Vercel will auto-deploy on push
    
    return res.status(200).json({ 
      success: true, 
      message: 'Data deployed successfully',
      commit: commitMessage
    });

  } catch (error) {
    console.error('Deployment error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}