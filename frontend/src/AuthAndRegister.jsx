import React, { useState, useEffect } from "react";

export default function AuthAndRegister({ onLoginSuccess, dynamicTextStyles = {} }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [school, setSchool] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [role, setRole] = useState("Ученик");

  // Математическая капча
  const [captchaNum1, setCaptchaNum1] = useState(6);
  const [captchaNum2, setCaptchaNum2] = useState(2);
  const [userCaptchaAnswer, setUserCaptchaAnswer] = useState("");

  useEffect(() => {
    setCaptchaNum1(Math.floor(Math.random() * 8) + 2);
    setCaptchaNum2(Math.floor(Math.random() * 7) + 1);
    setUserCaptchaAnswer("");
  }, [isLoginMode]);

  function handleSubmit(e) {
    e.preventDefault();

    const correctAnswer = captchaNum1 + captchaNum2;
    if (Number(userCaptchaAnswer) !== correctAnswer) {
      alert(`Неверный ответ на капчу! Сколько будет ${captchaNum1} + ${captchaNum2}? Попробуйте еще раз.`);
      return;
    }

    if (!email.trim() || !password.trim()) {
      alert("Заполните логин и пароль");
      return;
    }

    const encodedPassword = btoa(unescape(encodeURIComponent(password)));

    if (isLoginMode) {
      onLoginSuccess({
        mode: "login",
        email,
        password: encodedPassword,
      });
    } else {
      if (!fullName.trim() || !school.trim() || !studentClass.trim()) {
        alert("Пожалуйста, заполните все поля регистрации");
        return;
      }
      onLoginSuccess({
        mode: "register",
        full_name: fullName,
        email,
        password: encodedPassword,
        role,
        school,
        student_class: studentClass,
      });
    }
  }

  return (
    <div className="auth-modern-card" style={dynamicTextStyles}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        {isLoginMode ? "Авторизация в системе" : "Регистрация нового профиля"}
      </h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        
        {!isLoginMode && (
          <>
            <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              ФИО полностью:
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Например: Эмма Киперова"
                required
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              Ваша роль в системе:
              <select value={role} onChange={(e) => setRole(e.target.value)} required>
                <option value="Ученик">Ученик</option>
                <option value="Учитель">Учитель</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              Наименование школы:
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Например: Школа №1"
                required
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              Класс:
              <input
                type="text"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                placeholder={role === "Учитель" ? "Например: Учитель математики" : "Например: 8-Б"}
                required
              />
            </label>
          </>
        )}

        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          Электронная почта (Email):
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@test.com"
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          Пароль аккаунта:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        <div style={{
          background: "rgba(0,0,0,0.04)",
          padding: "10px",
          borderRadius: "6px",
          marginTop: "10px"
        }}>
          <p style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "bold" }}>
            Защита от роботов (Капча):
          </p>
          <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "16px", letterSpacing: "1px" }}>
              {captchaNum1} + {captchaNum2} =
            </span>
            <input
              type="number"
              value={userCaptchaAnswer}
              onChange={(e) => setUserCaptchaAnswer(e.target.value)}
              placeholder="Ответ"
              style={{ width: "80px", padding: "6px" }}
              required
            />
          </label>
        </div>

        <button className="primary-btn" type="submit" style={{ marginTop: "15px", padding: "10px" }}>
          {isLoginMode ? "Войти в кабинет" : "Завершить регистрацию"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: "15px" }}>
        <button
          onClick={() => setIsLoginMode(!isLoginMode)}
          style={{
            background: "none",
            border: "none",
            color: "#2563eb",
            textDecoration: "underline",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          {isLoginMode ? "У вас еще нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Авторизоваться"}
        </button>
      </div>
    </div>
  );
}