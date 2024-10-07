const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');

// Initialize Express app
const app = express();

// GitHub OAuth credentials
const clientId = 'Ov23liTkCCZJuL21XUYV';         // Replace with your GitHub OAuth app's Client ID
const clientSecret = 'fce116e7a619b7018cbe6573e634becc8ba0a610'; // Replace with your GitHub OAuth app's Client Secret
const redirectUri = 'http://localhost:3000/callback'; // Local callback URL for OAuth

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/github_oauth', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => console.log('MongoDB connection error:', err));

// Define a schema and model for storing access tokens
const userSchema = new mongoose.Schema({
  githubId: String,
  accessToken: String,
});

const User = mongoose.model('User', userSchema);

// Store the access token in the MongoDB database
async function storeToken(githubId, accessToken) {
  try {
    const user = await User.findOneAndUpdate(
      { githubId },
      { accessToken },
      { upsert: true, new: true } // Create if it doesn't exist
    );
    console.log('Token stored for user:', user);
  } catch (error) {
    console.error('Error storing token:', error);
  }
}

// Route to initiate the OAuth login (click the "Connect GitHub" button)
app.get('/login', (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo`;
  res.redirect(githubAuthUrl);
});

// OAuth callback route to handle GitHub's redirect with the authorization code
app.get('/callback', async (req, res) => {
  const code = req.query.code;

  try {
    // Exchange the authorization code for an access token
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
    }, {
      headers: {
        Accept: 'application/json',
      },
    });

    const accessToken = response.data.access_token;

    // Fetch GitHub user profile to get their GitHub ID
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const githubId = userResponse.data.id;

    // Store the access token in the database
    await storeToken(githubId, accessToken);

    res.send(`Access Token: ${accessToken}`);
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).send('Authentication failed');
  }
});



const axios = require('axios');

const token = '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';  // Your GitHub token
const owner = 'riyasharma2002';      // Replace with your GitHub username or organization
const repo = 'webhook';             // Replace with your repository name

// GitHub API URL for creating a webhook
const url = `https://api.github.com/repos/${owner}/${repo}/hooks`;

// Webhook payload (this is the JSON you provided)
const payload = {
  "name": "web",
  "config": {
     
    "content_type": "json",  // Set content type to JSON
    "insecure_ssl": "0"  // Set to "1" for insecure HTTP endpoints
  },
  "events": ["pull_request"],  // Listen to pull request events
  "active": true  // Activate the webhook
};

// Send POST request to create the webhook
axios.post(url, payload, {
  headers: {
    Authorization: `Bearer ${token}`,  // Authenticate with the GitHub access token
    'Content-Type': 'application/json'  // Set request content type to JSON
  }
})
.then(response => {
  console.log('Webhook created successfully:', response.data);
})
.catch(error => {
  console.error('Error creating webhook:', error.response ? error.response.data : error.message);
});

// Start the local server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
