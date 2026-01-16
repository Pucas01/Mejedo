// Configuration for all idols
export const idols = {
  ado: {
    id: "ado",
    name: "Ado",
    fullName: "Ado (アド)",
    theme: "ado", // Uses ado theme (blue)
    color: "#4169e1",
    spotifyId: "6mEQK9m2krja6X1cfsAjfl",
    birthDate: "October 24, 2002",
    origin: "Tokyo, Japan",
    genres: "J-Pop, Rock, Electronic",
    bio: `Ado is a Japanese singer. In 2020, at the age of 17, she made her debut with the digital single "Usseewa", which peaked at number 1 on Billboard Japan Hot 100, Oricon Digital Singles Chart, and the Oricon Streaming Chart. The song reached 100 million plays on Billboard Japan after 17 weeks from charting-in, which was the sixth fastest in history and the youngest for a solo singer.

In 2022, her song "New Genesis" was used as the theme song for the anime film One Piece Film: Red, and topped Apple Music's Global Top 100 charts. She became the first Japanese female artist to achieve this. In the same year, her song "Show" was featured in the opening theme of the anime series Oshi no Ko.`,
    externalLinks: [
      { name: "YouTube", url: "https://www.youtube.com/@Ado1024" },
      { name: "Spotify", url: "https://open.spotify.com/artist/6mEQK9m2krja6X1cfsAjfl" },
      { name: "Twitter", url: "https://twitter.com/ado1024imokenp" },
    ],
    backgroundImage: "/ado/ado_notsit.webp",
    hasTours: true,
    hasAwards: true,
    hasDiscography: true,
    hasPerformances: true,
  },
  miku: {
    id: "miku",
    name: "Miku",
    fullName: "Hatsune Miku (初音ミク)",
    theme: "miku", 
    color: "#39c5bb",
    spotifyId: "6pNgnvzBa6Bthsv8SrZJYl",
    birthDate: "August 31, 2007",
    origin: "Virtual, Japan",
    genres: "Vocaloid, J-Pop, Electronic",
    bio: `Hatsune Miku is a Vocaloid software voicebank developed by Crypton Future Media and its official moe anthropomorphism, a 16-year-old girl with long, turquoise twintails. She uses Yamaha Corporation's Vocaloid 2, Vocaloid 3, and Vocaloid 4 singing synthesizing technologies. She also uses Crypton Future Media's Piapro Studio, a singing synthesizer VSTi Plugin.

Miku's popularity has resulted in her involvement in commercial advertising campaigns and the release of various themed merchandise. Her music has been used in multiple rhythm games and she has been featured in concerts as a projected hologram. Hatsune Miku has become a cultural phenomenon, inspiring countless songs, artworks, and performances worldwide.`,
    externalLinks: [
      { name: "Official Site", url: "https://ec.crypton.co.jp/pages/prod/virtualsinger/cv01" },
      { name: "Spotify", url: "https://open.spotify.com/artist/4oslVJbo2HrGQzz8m3z4bm" },
      { name: "Twitter", url: "https://twitter.com/cfm_miku" },
    ],
    backgroundImage: "/miku/miku.webp",
    hasTours: false,
    hasAwards: false,
    hasDiscography: true,
    hasPerformances: true,
  },
};

export const getIdol = (idolId) => {
  return idols[idolId] || idols.ado;
};

export const getIdolList = () => {
  return Object.values(idols);
};
