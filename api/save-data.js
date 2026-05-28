// Vercel Serverless Function to save data to GitHub
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'bro-dafei';
const REPO_NAME = 'bro-cooling-website';
const FILE_PATH = 'bro-data.json';
const BRANCH = 'main';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GitHub token not configured' });
  }

  try {
    const { data } = req.body;
    
    // Simple validation
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid data' });
    }

    // 1. Get current file SHA
    const getFileRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    let sha = null;
    if (getFileRes.ok) {
      const fileInfo = await getFileRes.json();
      sha = fileInfo.sha;
    }

    // 2. Create new content
    const newContent = JSON.stringify(data, null, 2);
    const contentBase64 = Buffer.from(newContent).toString('base64');

    // 3. Update file
    const updateRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `chore: auto-sync admin data ${new Date().toISOString().split('T')[0]}`,
          content: contentBase64,
          sha: sha,
          branch: BRANCH
        })
      }
    );

    const result = await updateRes.json();

    if (!updateRes.ok) {
      console.error('GitHub API error:', result);
      return res.status(500).json({ 
        error: 'Failed to update GitHub file',
        details: result.message 
      });
    }

    console.log('Auto-sync successful:', result.commit.sha);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Data saved and synced to GitHub',
      timestamp: new Date().toISOString(),
      commit: result.commit.sha,
      received: {
        sections: Object.keys(data).join(', ')
      }
    });
  } catch (error) {
    console.error('Error saving data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}