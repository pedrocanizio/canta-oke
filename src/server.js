const http = require("http");
const os = require("os");

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const details of iface) {
      if (details.family === "IPv4" && !details.internal) {
        return details.address;
      }
    }
  }
  return "localhost";
}

const songs = [
  { code: "001", title: "Song One", artist: "Artist A" },
  { code: "002", title: "Song Two", artist: "Artist B" },
];

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });

  let html = `<h1>Karaoke Song List</h1><ul>`;
  songs.forEach(song => {
    html += `<li><strong>${song.code}</strong>: ${song.title} - ${song.artist}</li>`;
  });
  html += `</ul>`;

  res.end(html);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://${getLocalIP()}:${PORT}`);
});
