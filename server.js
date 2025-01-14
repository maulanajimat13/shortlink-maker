
const express = require('express');
const fs = require('fs');
const path = require('path');
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
	<meta property="fb:app_id" content="4108838539203518">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${thumbnail}">
        <meta property="og:url" content="${req.protocol}://${req.get('host')}/${id}">
        <meta property="og:type" content="website">
        <!-- Optional: Twitter Meta Tags -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${title}">
        <meta name="twitter:description" content="${description}">
        <meta name="twitter:image" content="${thumbnail}">
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

// Jalankan server di port 3000
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
