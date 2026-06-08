const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "geovision8",
  password: process.env.DB_PASSWORD || "1234",
  port: Number(process.env.DB_PORT) || 5432,
});

const SECRET = process.env.JWT_SECRET || "geovision8_secret_key";

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    SECRET,
    { expiresIn: "2h" }
  );
}

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Нет токена или неверный формат" });
  }

  try {
    const token = header.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Токен отсутствует" });
    }
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Неверный или просроченный токен" });
  }
}

function teacherOrAdmin(req, res, next) {
  if (req.user && (req.user.role === "Учитель" || req.user.role === "Администратор")) {
    return next();
  }
  return res.status(403).json({ message: "Нет доступа" });
}

app.get("/", (req, res) => {
  res.json({
    message: "GeoVision 8 backend работает",
  });
});

app.post("/api/register", async (req, res) => {
  try {
    const { full_name, email, password, role, school, student_class } = req.body;

    if (!full_name || !email || !password || !role || !school) {
      return res.status(400).json({ message: "Заполните все поля" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (role === "Администратор") {
      return res.status(403).json({
        message: "Администратор создается только в базе данных",
      });
    }

    const exists = await pool.query("SELECT id FROM users WHERE email = $1", [
      normalizedEmail,
    ]);

    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "Такой email уже существует" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users 
       (full_name, email, password_hash, role, school, student_class, score)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, full_name, email, role, school, student_class, score`,
      [full_name, normalizedEmail, passwordHash, role, school, student_class || "8-А", 0]
    );

    const user = result.rows[0];
    const token = createToken(user);

    return res.json({ user, token });
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    return res.status(500).json({ message: "Ошибка регистрации" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Введите email и пароль" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      normalizedEmail,
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Пользователь не найден" });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(400).json({ message: "Неверный пароль" });
    }

    const token = createToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        school: user.school,
        student_class: user.student_class,
        score: user.score,
      },
    });
  } catch (error) {
    console.error("Ошибка входа:", error);
    return res.status(500).json({ message: "Ошибка входа" });
  }
});

app.get("/api/users", auth, teacherOrAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, school, student_class, score 
       FROM users 
       ORDER BY score DESC, id`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Ошибка получения пользователей:", error);
    return res.status(500).json({ message: "Ошибка получения пользователей" });
  }
});

app.post("/api/feedback", auth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Введите сообщение" });
    }

    await pool.query(
      `INSERT INTO feedbacks (user_id, message) 
       VALUES ($1, $2)`,
      [req.user.id, message.trim()]
    );

    return res.json({ message: "Сообщение отправлено" });
  } catch (error) {
    console.error("Ошибка отправки сообщения:", error);
    return res.status(500).json({ message: "Ошибка отправки сообщения" });
  }
});

app.get("/api/feedback", auth, teacherOrAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT feedbacks.id, users.full_name, users.student_class, feedbacks.message
       FROM feedbacks
       JOIN users ON users.id = feedbacks.user_id
       ORDER BY feedbacks.id DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Ошибка получения сообщений:", error);
    return res.status(500).json({ message: "Ошибка получения сообщений" });
  }
});

// ИСПРАВЛЕННЫЙ ЭНДПОИНТ С ЗАЩИТОЙ ОТ НАКРУТКИ БАЛЛОВ
app.post("/api/results", auth, async (req, res) => {
  try {
    const { task_id, points } = req.body;

    if (!task_id) {
      return res.status(400).json({ message: "Не указан task_id" });
    }

    const safePoints = Math.max(0, Number(points) || 0); // Исключаем отрицательные баллы

    // Проверяем, решал ли уже пользователь эту задачу
    const existingResult = await pool.query(
      "SELECT id, points FROM results WHERE user_id = $1 AND task_id = $2",
      [req.user.id, task_id]
    );

    if (existingResult.rows.length > 0) {
      const previousPoints = existingResult.rows[0].points;

      // Обновляем результат только если новый балл выше предыдущего
      if (safePoints > previousPoints) {
        const diff = safePoints - previousPoints;

        await pool.query(
          "UPDATE results SET points = $1 WHERE user_id = $2 AND task_id = $3",
          [safePoints, req.user.id, task_id]
        );

        // Начисляем только разницу, чтобы не дублировать баллы
        await pool.query("UPDATE users SET score = score + $1 WHERE id = $2", [
          diff,
          req.user.id,
        ]);

        return res.json({ message: "Результат обновлен, добавлены новые баллы" });
      }

      return res.json({ message: "Результат сохранен (предыдущий балл был выше)" });
    } else {
      // Если решает впервые — просто сохраняем и прибавляем баллы целиком
      await pool.query(
        `INSERT INTO results (user_id, task_id, points) 
         VALUES ($1, $2, $3)`,
        [req.user.id, task_id, safePoints]
      );

      await pool.query("UPDATE users SET score = score + $1 WHERE id = $2", [
        safePoints,
        req.user.id,
      ]);

      return res.json({ message: "Результат успешно сохранен" });
    }
  } catch (error) {
    console.error("Ошибка сохранения результата:", error);
    return res.status(500).json({ message: "Ошибка сохранения результата" });
  }
});

app.get("/api/results", auth, async (req, res) => {
  try {
    let result;

    if (req.user.role === "Учитель" || req.user.role === "Администратор") {
      result = await pool.query(
        `SELECT results.id, users.full_name, users.student_class, results.task_id, results.points
         FROM results
         JOIN users ON users.id = results.user_id
         ORDER BY results.id DESC`
      );
    } else {
      result = await pool.query(
        `SELECT id, task_id, points 
         FROM results 
         WHERE user_id = $1 
         ORDER BY id DESC`,
        [req.user.id]
      );
    }

    return res.json(result.rows);
  } catch (error) {
    console.error("Ошибка получения результатов:", error);
    return res.status(500).json({ message: "Ошибка получения результатов" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend запущен: http://localhost:${PORT}`);
});