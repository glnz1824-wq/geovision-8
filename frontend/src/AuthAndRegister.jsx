import React, { useMemo, useState } from "react";

function AuthAndRegister({ onLoginSuccess, dynamicTextStyles }) {
  const [isRegister, setIsRegister] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("student@test.com");
  const [password, setPassword] = useState("1234");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Ученик");
  const [school, setSchool] = useState("Школа им. Мукая Элебаева");
  const [studentClass, setStudentClass] = useState("8-А");
  const [showPassword, setShowPassword] = useState(false);

  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  const captcha = useMemo(() => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    return { a, b, answer: a + b };
  }, [captchaKey, isRegister]);

  const resetCaptcha = () => {
    setCaptchaAnswer("");
    setCaptchaKey((prev) => prev + 1);
  };

  const submitForm = async (event) => {
    event.preventDefault();

    if (Number(captchaAnswer) !== captcha.answer) {
      alert("Капча решена неверно");
      resetCaptcha();
      return;
    }

    if (isRegister && password.length < 6) {
      alert("Пароль должен быть минимум 6 символов");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      alert("Пароли не совпадают");
      return;
    }

    const url = isRegister
      ? "http://localhost:5000/api/register"
      : "http://localhost:5000/api/login";

    const body = isRegister
      ? {
          full_name: fullName,
          email,
          password,
          role,
          school,
          student_class: studentClass,
        }
      : { email, password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Ошибка");
        resetCaptcha();
        return;
      }

      localStorage.setItem("geo_token", data.token);
      localStorage.setItem("geo_user", JSON.stringify(data.user));

      onLoginSuccess(data.user, data.token);
    } catch {
      alert("Backend не запущен. Запусти: cd backend → node server.js");
    }
  };

  return (
    <div className="auth-page" style={dynamicTextStyles}>
      <div className="auth-card">
        <div className="auth-icon">{isRegister ? "📝" : "🔐"}</div>

        <h2>{isRegister ? "Регистрация" : "Вход в систему"}</h2>
        <p className="auth-subtitle">GeoVision 8 · геометрия 8 класс</p>

        <form onSubmit={submitForm} className="auth-form">
          {isRegister && (
            <label>
              ФИО пользователя
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Например: Айгерим Осмонова"
                required
              />
            </label>
          )}

          <label>
            Электронная почта
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Пароль
            <div className="password-line">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </label>

          {isRegister && (
            <>
              <label>
                Подтвердите пароль
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </label>

              <label>
                Роль
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="Ученик">Ученик</option>
                  <option value="Учитель">Учитель</option>
                </select>
              </label>

              <label>
                Учебное заведение
                <input
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  required
                />
              </label>

              <label>
                Класс
                <input
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  required
                />
              </label>
            </>
          )}

          <label>
            Капча: {captcha.a} + {captcha.b} = ?
            <input
              type="number"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              placeholder="Введите ответ"
              required
            />
          </label>

          <button className="auth-submit" type="submit">
            {isRegister ? "Зарегистрироваться" : "Войти"}
          </button>
        </form>

        <button
          className="auth-switch"
          type="button"
          onClick={() => {
            setIsRegister((prev) => !prev);
            resetCaptcha();
            setConfirmPassword("");
          }}
        >
          {isRegister ? "Уже есть профиль? Войти" : "Нет профиля? Регистрация"}
        </button>

        <div className="auth-security">
          🛡 Капча · JWT-токен · bcrypt-кодирование пароля
        </div>
      </div>
    </div>
  );
}

export default AuthAndRegister;