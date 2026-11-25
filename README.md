# portfolio

This is a single-page portfolio built as a desktop-style archive. It includes draggable windows and optional Spotify integration.

## Run locally

```bash
node server.js
```

Then open http://localhost:3000.

## Spotify integration

To show the current song on the page, create a Spotify app at https://developer.spotify.com/dashboard/ and set these environment variables before starting the server:

```bash
set SPOTIFY_CLIENT_ID=your_client_id
set SPOTIFY_CLIENT_SECRET=your_client_secret
set SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback
node server.js
```

On the page, click the Spotify card and complete the OAuth flow. The app stores the access token in `.spotify-tokens.json` so it can call the Spotify `currently-playing` endpoint.

The page falls back gracefully when Spotify is not configured.

## Terminal customization

Edit [`terminal.config.js`](./terminal.config.js) to change the terminal banner, quick commands, FIELD NOTES dossiers, custom commands, project stack tags, and accent themes. Custom commands accept either a response string or an object with `text` and `url` fields. Project names, descriptions, demo links, milestones, profile skills, and the listening status are read from the page's existing archive widgets.

Open TERMINAL.EXE from the taskbar or command palette. Use `help` to see commands; `↑`/`↓` recalls history, `Tab` completes commands and arguments, and `Ctrl`/`⌘` + `L` clears the output.
