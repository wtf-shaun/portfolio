const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || `http://localhost:${PORT}/auth/callback`;
const ROOT_DIR = __dirname;
const TOKENS_PATH = path.join(ROOT_DIR, '.spotify-tokens.json');
const AUTH_STATES = new Map();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function readTokens() {
  try {
    const content = fs.readFileSync(TOKENS_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function writeTokens(tokens) {
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

function buildSpotifyAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: 'user-read-currently-playing user-read-playback-state',
    state,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function refreshAccessToken(tokens) {
  if (!CLIENT_ID || !CLIENT_SECRET || !tokens.refresh_token) {
    return null;
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
    }).toString(),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const nextTokens = {
    ...tokens,
    access_token: payload.access_token,
    expires_at: Date.now() + Number(payload.expires_in || 3600) * 1000,
  };

  if (payload.refresh_token) {
    nextTokens.refresh_token = payload.refresh_token;
  }

  writeTokens(nextTokens);
  return payload.access_token;
}

async function getValidAccessToken(tokens) {
  if (!tokens?.access_token) {
    return null;
  }

  const expiresAt = Number(tokens.expires_at || 0);
  if (expiresAt > Date.now() + 30_000) {
    return tokens.access_token;
  }

  return refreshAccessToken(tokens);
}

async function getCurrentlyPlaying() {
  const tokens = readTokens();
  if (!tokens) {
    return {
      connected: false,
      isPlaying: false,
      trackName: '',
      artistNames: [],
      albumArt: '',
      externalUrl: '',
      message: 'Spotify is not connected yet.',
    };
  }

  let accessToken = await getValidAccessToken(tokens);
  if (!accessToken) {
    return {
      connected: false,
      isPlaying: false,
      trackName: '',
      artistNames: [],
      albumArt: '',
      externalUrl: '',
      message: 'Spotify access token is unavailable.',
    };
  }

  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 204) {
    return {
      connected: true,
      isPlaying: false,
      trackName: '',
      artistNames: [],
      albumArt: '',
      externalUrl: '',
      message: 'Nothing is playing right now.',
    };
  }

  if (response.status === 401) {
    const refreshedAccessToken = await refreshAccessToken(tokens);
    if (!refreshedAccessToken) {
      return {
        connected: false,
        isPlaying: false,
        trackName: '',
        artistNames: [],
        albumArt: '',
        externalUrl: '',
        message: 'Spotify session expired. Please reconnect.',
      };
    }

    const retry = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${refreshedAccessToken}`,
      },
    });

    if (retry.status === 204) {
      return {
        connected: true,
        isPlaying: false,
        trackName: '',
        artistNames: [],
        albumArt: '',
        externalUrl: '',
        message: 'Nothing is playing right now.',
      };
    }

    const retryPayload = await retry.json();
    if (!retry.ok || !retryPayload?.item) {
      return {
        connected: true,
        isPlaying: false,
        trackName: '',
        artistNames: [],
        albumArt: '',
        externalUrl: '',
        message: retryPayload?.error?.message || 'Spotify is connected, but no track is playing.',
      };
    }

    return {
      connected: true,
      isPlaying: retryPayload.is_playing,
      trackName: retryPayload.item.name || '',
      artistNames: (retryPayload.item.artists || []).map((artist) => artist.name),
      albumArt: retryPayload.item.album?.images?.[0]?.url || '',
      externalUrl: retryPayload.item.external_urls?.spotify || '',
      message: retryPayload.is_playing ? 'Listening now' : 'Spotify is connected',
    };
  }

  const payload = await response.json();
  if (!response.ok || !payload?.item) {
    return {
      connected: true,
      isPlaying: false,
      trackName: '',
      artistNames: [],
      albumArt: '',
      externalUrl: '',
      message: payload?.error?.message || 'No track is currently playing.',
    };
  }

  return {
    connected: true,
    isPlaying: payload.is_playing,
    trackName: payload.item.name || '',
    artistNames: (payload.item.artists || []).map((artist) => artist.name),
    albumArt: payload.item.album?.images?.[0]?.url || '',
    externalUrl: payload.item.external_urls?.spotify || '',
    message: payload.is_playing ? 'Listening now' : 'Spotify is connected',
  };
}

function serveFile(res, relativePath) {
  const safePath = path.resolve(ROOT_DIR, relativePath.replace(/^\//, ''));
  if (!safePath.startsWith(ROOT_DIR)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  fs.readFile(safePath, (error, content) => {
    if (error) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  if (req.method === 'GET' && pathname === '/auth/spotify') {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      sendJson(res, 500, { error: 'Spotify client credentials are missing. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET before connecting.' });
      return;
    }

    const state = randomUUID();
    AUTH_STATES.set(state, Date.now());
    res.writeHead(302, { Location: buildSpotifyAuthUrl(state) });
    res.end();
    return;
  }

  if (req.method === 'GET' && pathname === '/auth/callback') {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      sendJson(res, 500, { error: 'Spotify client credentials are missing.' });
      return;
    }

    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code || !state || !AUTH_STATES.has(state)) {
      sendHtml(res, 400, '<h1>Spotify auth failed</h1><p>Missing or invalid OAuth state.</p>');
      return;
    }

    AUTH_STATES.delete(state);

    try {
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
        }).toString(),
      });

      const tokenJson = await tokenResponse.json();
      if (!tokenResponse.ok) {
        sendHtml(res, 400, `<h1>Spotify auth failed</h1><p>${tokenJson.error_description || tokenJson.error || 'Unknown Spotify error'}</p>`);
        return;
      }

      const tokenData = {
        access_token: tokenJson.access_token,
        refresh_token: tokenJson.refresh_token,
        expires_at: Date.now() + Number(tokenJson.expires_in || 3600) * 1000,
      };
      writeTokens(tokenData);
      sendHtml(res, 200, `
        <html><head><meta charset="utf-8" /><title>Spotify connected</title></head>
        <body style="font-family:monospace;background:#030604;color:#edf5ee;display:grid;place-items:center;min-height:100vh;">
          <main style="max-width:600px;border:1px solid rgba(0,255,65,.5);padding:24px;background:#050b07;">
            <p style="color:#00ff41;letter-spacing:.12em;text-transform:uppercase;margin:0 0 12px;">Spotify connected</p>
            <h1 style="margin:0 0 12px;">Your portfolio is now linked to your Spotify account.</h1>
            <p style="margin:0;color:#9ab2a3;">You can close this tab and refresh the portfolio page to see the current track.</p>
          </main>
        </body></html>
      `);
      return;
    } catch (error) {
      sendHtml(res, 500, '<h1>Spotify auth failed</h1><p>Unexpected error while exchanging the Spotify code.</p>');
      return;
    }
  }

  if (req.method === 'GET' && pathname === '/api/spotify') {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      sendJson(res, 503, {
        connected: false,
        isPlaying: false,
        trackName: '',
        artistNames: [],
        albumArt: '',
        externalUrl: '',
        message: 'Spotify is not configured yet.',
      });
      return;
    }

    const currentTrack = await getCurrentlyPlaying();
    sendJson(res, currentTrack.connected || currentTrack.message === 'Spotify is not connected yet.' ? 200 : 200, currentTrack);
    return;
  }

  if (req.method === 'GET' && pathname === '/') {
    serveFile(res, 'index.html');
    return;
  }

  if (req.method === 'GET') {
    serveFile(res, pathname);
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
});

server.listen(PORT, () => {
  console.log(`Portfolio server running at http://localhost:${PORT}`);
  console.log('Spotify integration uses SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.');
});
