const express = require("express");
const cors = require("cors");
const path = require("path"); // Импортируем path ОДИН раз
require("dotenv").config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

// Раздача статики (папка dist должна лежать в папке backend)
app.use(express.static(path.join(__dirname, 'dist')));

// --- Ваши API маршруты ---
// ... (оставьте ваши app.post и app.get)

// В самом конце - обработчик фронтенда
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});