const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const path = require("path"); 
require("dotenv").config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

// 1. Сначала подключаем статику (ваш фронтенд)
app.use(express.static(path.join(__dirname, 'dist')));

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "geovision8",
  password: process.env.DB_PASSWORD || "1234",
  port: Number(process.env.DB_PORT) || 5432,
});

const SECRET = process.env.JWT_SECRET || "geovision8_secret_key";
const ROLES = { STUDENT: "Ученик", TEACHER: "Учитель", ADMIN: "Администратор" };
const MAX_TASK_POINTS = 100;

// Функции-помощники
function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: "2h" });
}

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return res.status(401).json({ message: "Нет токена" });
  try {
    req.user = jwt.verify(header.split(" ")[1], SECRET);
    next();
  } catch (e) { return res.status(401).json({ message: "Неверный токен" }); }
}

function teacherOrAdmin(req, res, next) {
  if (req.user && (req.user.role === ROLES.TEACHER || req.user.role === ROLES.ADMIN)) return next();
  return res.status(403).json({ message: "Нет доступа" });
}

// 2. Ваши API маршруты
app.post("/api/register", async (req, res) => { /* ваш код регистрации */ });
app.post("/api/login", async (req, res) => { /* ваш код входа */ });
app.get("/api/users", auth, teacherOrAdmin, async (req, res) => { /* ваш код пользователей */ });
app.post("/api/feedback", auth, async (req, res) => { /* ваш код feedback */ });
app.get("/api/feedback", auth, teacherOrAdmin, async (req, res) => { /* ваш код feedback get */ });
app.post("/api/results", auth, async (req, res) => { /* ваш код сохранения результатов */ });
app.get("/api/results", auth, async (req, res) => { /* ваш код получения результатов */ });

// 3. Последним ставим обработчик фронтенда (React SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 10000;
const path = require("path");

// Раздача статических файлов из папки dist
app.use(express.static(path.join(__dirname, 'dist')));

// Перенаправление всех остальных запросов на index.html (для работы React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});