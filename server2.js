const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
const DATA_FILE = path.join(__dirname, 'data.json'); // Lokasi file data.json

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Endpoint untuk menyimpan data link pendek
app.post('/save-data', (req, res) => {
  const { id, data } = req.body;

  // Validasi input
  if (!id || !data || !data.url || !data.title) {
    return res.status(400).json({ message: 'Invalid data format' });
  }

  // Baca data yang sudah ada
  let fileData = {};
  if (fs.existsSync(DATA_FILE)) {
    try {
      fileData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (err) {
      return res.status(500).json({ message: 'Failed to read data file' });
    }
  }

  // Tambahkan link baru ke data
  fileData[id] = data;

  // Simpan data ke file
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(fileData, null, 2));
    res.json({ message: 'Data saved successfully', shortId: id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to write data file' });
  }
});

// Endpoint untuk redirect berdasarkan ID pendek
app.get('/:id', (req, res) => {
  const id = req.params.id;

  // Pastikan file data.json ada
  if (!fs.existsSync(DATA_FILE)) {
    return res.status(404).send('<h2>Link not found</h2>');
  }

  // Baca data dari file
  const fileData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  // Cari data berdasarkan ID pendek
  if (fileData[id]) {
    const { url, title, description, thumbnail } = fileData[id];
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <!-- Open Graph Meta Tags -->
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${thumbnail}">
        <meta property="og:url" content="${req.protocol}://${req.get('host')}/${id}">
        <meta property="og:type" content="website">
        <!-- Redirect Script -->
        <script>window.location.href = "${url}";</script>
      </head>
      <body>
        <p>Redirecting to <a href="${url}">${url}</a>...</p>
      </body>
      </html>
    `);
  } else {
    res.status(404).send('<h2>Link not found</h2>');
  }
});

// Konfigurasi HTTPS
const sslOptions = {
  key: fs.readFileSync('/etc/ssl/private/private.key'),       // Ganti dengan path ke file private key
  cert: fs.readFileSync('/etc/ssl/certificate.crt'), // Ganti dengan path ke file sertifikat SSL
  ca: fs.readFileSync('/etc/ssl/ca_bundle.crt'),           // Opsional, jika ada CA
};

// Jalankan server HTTPS
https.createServer(sslOptions, app).listen(443, () => {
  console.log('HTTPS server running on https://localhost');
});

// Redirect HTTP ke HTTPS (Opsional)
http.createServer((req, res) => {
  res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
  res.end();
}).listen(80, () => {
  console.log('HTTP to HTTPS redirect running on http://localhost');
});

