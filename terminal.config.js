window.TERMINAL_CONFIG = {
  identity: {
    banner: "ARCHIVE_OS v1.0",
    handle: "shaunak@archive",
    location: "DEL/IND",
    whoami: [
      "Class 12 student and independent developer.",
      "Interested in building digital experiences and exploring ideas beyond technology.",
    ],
  },
  quickChips: ["help", "projects", "dossier coding", "scan"],
  commands: {
    help: "List built-in and custom commands",
    whoami: "Show identity and current focus",
    stack: "Read the skills in IDENTITY.LOG",
    projects: "Browse the project archive",
    milestones: "Filter MILESTONES.LOG by year or tag",
    dossier: "Open a FIELD NOTES brief",
    scan: "Sweep three archive highlights",
    now: "Read the LISTENING TO widget",
    theme: "Switch the terminal accent",
    go: "Scroll to a portfolio section",
    open: "Open a portfolio section (alias for go)",
    clear: "Reset the terminal output",
  },
  customCommandHelp: "Custom response from terminal.config.js",
  projectMetadata: {
    "pre-order": {
      stack: ["HTML", "CSS", "Jinja2", "Flask", "Python", "MongoDB"],
      repository: "https://github.com/wtf-shaun/preorder_appweb",
      year: "2026",
      status: "LIVE",
    },
    radar: {
      stack: ["Canvas", "Vanilla JS", "HTML", "CSS"],
      repository: "https://github.com/wtf-shaun/radar-screensaver",
      year: "2026",
      status: "LIVE",
    },
    airwave: {
      stack: ["HTML", "CSS", "JavaScript", "Spotify SDK", "PeerJS"],
      repository: "https://github.com/wtf-shaun/airwave-fm",
      year: "2026",
      status: "LIVE",
    },
  },
  dossiers: {
    acting: {
      title: "Stage & screen",
      status: "FIELD NOTE",
      notes: ["Character, performance, and live storytelling.", "Selected productions are indexed in MILESTONES.LOG."],
    },
    coding: {
      title: "Independent development",
      status: "FIELD NOTE",
      notes: ["Web development and interactive experiences.", "Run `stack` for the skills listed in IDENTITY.LOG."],
    },
    geopolitics: {
      title: "Defence & geopolitics",
      status: "FIELD NOTE",
      notes: ["Maps, strategy, defence, and global affairs.", "An ongoing area of curiosity and learning."],
    },
    debates: {
      title: "Debates",
      status: "FIELD NOTE",
      notes: ["Ideas, perspectives, and clear argument.", "A space to question assumptions and think critically."],
    },
  },
  customCommands: {
    motto: "Build. Observe. Question.",
    gear: "No gear list has been published yet.",
    playlist: { text: "Open the listening archive", url: "https://open.spotify.com/playlist/3JI917qJjuKYbghg5Y2q23?si=483f41af865f4658" },
    "easter-egg": "You found the archive's hidden channel. Keep exploring.",
  },
  themes: {
    archive: { label: "Archive green", accent: "#00ff41", soft: "#16ff65", border: "rgba(43,151,77,.52)", glow: "rgba(0,255,65,.14)", background: "#020603" },
    "radar-green": { label: "Radar green", accent: "#8cff00", soft: "#c5ff57", border: "rgba(140,255,0,.45)", glow: "rgba(140,255,0,.16)", background: "#050900" },
    amber: { label: "Amber", accent: "#ffbf47", soft: "#ffe0a0", border: "rgba(255,191,71,.44)", glow: "rgba(255,191,71,.16)", background: "#0b0803" },
  },
};
