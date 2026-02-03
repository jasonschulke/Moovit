#!/usr/bin/env node

/**
 * Fetch icons from The Noun Project API
 *
 * Usage:
 *   node scripts/fetch-icons.js search "kettlebell"
 *   node scripts/fetch-icons.js download <icon-id> <filename>
 *
 * Examples:
 *   node scripts/fetch-icons.js search "dumbbell"
 *   node scripts/fetch-icons.js download 12345 dumbbell.png
 */

const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = '5dcb17261325437194abe7a685039139';
const API_SECRET = '170921c9c16349a28d46893bcc804080';
const BASE_URL = 'api.thenounproject.com';

// Initialize OAuth 1.0a
const oauth = OAuth({
  consumer: {
    key: API_KEY,
    secret: API_SECRET,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  },
});

function makeRequest(endpoint, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = `https://${BASE_URL}${endpoint}`;
    const requestData = {
      url,
      method,
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData));

    const options = {
      hostname: BASE_URL,
      path: endpoint,
      method,
      headers: {
        'Authorization': authHeader.Authorization,
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function searchIcons(term, limit = 10) {
  console.log(`\nSearching for "${term}"...\n`);

  try {
    const result = await makeRequest(`/v2/icon?query=${encodeURIComponent(term)}&limit=${limit}`);

    if (result.icons && result.icons.length > 0) {
      console.log(`Found ${result.icons.length} icons:\n`);
      result.icons.forEach((icon, idx) => {
        console.log(`${idx + 1}. ID: ${icon.id}`);
        console.log(`   Term: ${icon.term}`);
        console.log(`   Creator: ${icon.creator?.name || 'Unknown'}`);
        console.log(`   Preview: ${icon.thumbnail_url}`);
        console.log('');
      });
    } else {
      console.log('No icons found.');
      if (result.error) {
        console.log('Error:', result.error);
      }
    }
  } catch (error) {
    console.error('Error searching icons:', error.message);
  }
}

async function downloadIcon(iconId, filename) {
  console.log(`\nFetching icon ${iconId}...\n`);

  try {
    const result = await makeRequest(`/v2/icon/${iconId}`);

    if (result.icon) {
      const icon = result.icon;
      console.log(`Icon: ${icon.term}`);
      console.log(`Creator: ${icon.creator?.name || 'Unknown'}`);

      // Get the preview URL (or full URL if available)
      const imageUrl = icon.preview_url_84 || icon.preview_url || icon.thumbnail_url;

      if (!imageUrl) {
        console.log('No download URL available for this icon.');
        console.log('Available URLs:', JSON.stringify(icon, null, 2));
        return;
      }

      console.log(`Downloading from: ${imageUrl}`);

      // Download the image
      const outputPath = path.join(__dirname, '..', 'public', filename);
      await downloadFile(imageUrl, outputPath);

      console.log(`\nSaved to: ${outputPath}`);
      console.log('\nAttribution (required for free use):');
      console.log(`  "${icon.term}" by ${icon.creator?.name || 'Unknown'} from The Noun Project`);
    } else {
      console.log('Icon not found.');
      if (result.error) {
        console.log('Error:', result.error);
      }
    }
  } catch (error) {
    console.error('Error fetching icon:', error.message);
  }
}

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);

    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

async function getIconInfo(iconId) {
  console.log(`\nFetching icon ${iconId} info...\n`);

  try {
    const result = await makeRequest(`/v2/icon/${iconId}`);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// CLI
const [,, command, ...args] = process.argv;

switch (command) {
  case 'search':
    if (!args[0]) {
      console.log('Usage: node fetch-icons.js search <term> [limit]');
      process.exit(1);
    }
    searchIcons(args[0], args[1] || 10);
    break;

  case 'download':
    if (!args[0] || !args[1]) {
      console.log('Usage: node fetch-icons.js download <icon-id> <filename>');
      process.exit(1);
    }
    downloadIcon(args[0], args[1]);
    break;

  case 'info':
    if (!args[0]) {
      console.log('Usage: node fetch-icons.js info <icon-id>');
      process.exit(1);
    }
    getIconInfo(args[0]);
    break;

  default:
    console.log(`
The Noun Project Icon Fetcher

Commands:
  search <term> [limit]     Search for icons by term
  download <id> <filename>  Download an icon to public folder
  info <id>                 Get full icon info (JSON)

Examples:
  node scripts/fetch-icons.js search "kettlebell"
  node scripts/fetch-icons.js search "dumbbell" 20
  node scripts/fetch-icons.js download 12345 my-icon.png
  node scripts/fetch-icons.js info 12345
`);
}
