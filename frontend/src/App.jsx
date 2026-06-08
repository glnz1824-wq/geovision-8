import React, { useEffect, useMemo, useState } from "react";
import AuthAndRegister from "./AuthAndRegister";
import { theory8 } from "./data/theory8";
import { tasks8 } from "./data/tasks8";
import { audioLessons8 } from "./data/audioLessons8";
import "./App.css";

// Безопасное кодирование паролей
function encodePassword(password) {
  return btoa(unescape(encodeURIComponent(password)));
}

function App() {
  // Авторизация и сохранение сессии пользователя
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("geo_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Инклюзивные параметры интерфейса (ГОСТ для слабовидящих)
  const [theme, setTheme] = useState("beige-theme");
  const [fontSize, setFontSize] = useState(20);
  const [letterSpacing, setLetterSpacing] = useState(1);
  const [lineHeight, setLineHeight] = useState(1.6);

  // Состояние доступности (Экранный Диктор и Лупа)
  const [screenReader, setScreenReader] = useState(false);
  const [isMagnifierActive, setIsMagnifierActive] = useState(false);
  const [mousePos, setMousePos] = useState({ clientX: 0, clientY: 0, pageX: 0, pageY: 0 });

  // Навигация
  const [currentScreen, setCurrentScreen] = useState("main");
  const [searchQuery, setSearchQuery] = useState("");

  // Базы данных (Инициализация дефолтными значениями)
  const [geometryTheory, setGeometryTheory] = useState(theory8 || []);
  const [tasks] = useState(tasks8 || []);
  const [audioLessons] = useState(audioLessons8 || []);

  const [selectedTopicId, setSelectedTopicId] = useState(theory8?.[0]?.id || "");
  const [selectedTaskId, setSelectedTaskId] = useState(tasks8?.[0]?.id || "");

  // Обратная связь и интерактивные тесты
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackList, setFeedbackList] = useState([]);
  const [taskAnswers, setTaskAnswers] = useState({});
  const [taskStatuses, setTaskStatuses] = useState({});

  // Локальная имитация СУБД Пользователей
  const [usersDatabase, setUsersDatabase] = useState([
    {
      id: 1,
      full_name: "Гульназ Маратова",
      email: "student@test.com",
      password: encodePassword("1234"),
      role: "Ученик",
      school: "Школа им. Мукая Элебаева",
      student_class: "8-А",
      score: 20,
      completedTasks: ["task1"],
      token: "jwt-stu-777",
    },
    {
      id: 2,
      full_name: "Бакыт Токтосунов",
      email: "teacher@test.com",
      password: encodePassword("1234"),
      role: "Учитель",
      school: "Школа им. Мукая Элебаева",
      student_class: "Преподаватель математики",
      score: 0,
      completedTasks: [],
      token: "jwt-tea-888",
    },
    {
      id: 3,
      full_name: "Администратор Системы",
      email: "admin@test.com",
      password: encodePassword("admin123"),
      role: "Администратор",
      school: "КГТУ им. И. Раззакова",
      student_class: "Разработчик",
      score: 999,
      completedTasks: [],
      token: "jwt-adm-999",
    },
  ]);

  // Разграничение прав доступа (RBAC Модель)
  const isStudent = user?.role === "Ученик";
  const isTeacher = user?.role === "Учитель";
  const isAdmin = user?.role === "Администратор";
  const canManageContent = isTeacher || isAdmin;
  const canViewDatabase = isTeacher || isAdmin;

  // Константы для вычисления матрицы лупы
  const magnifierScale = 2.2;
  const magnifierRadius = 110; // Размер линзы (220px общая ширина)

  // Стили отображения текста
  const dynamicStyles = {
    fontSize: `${fontSize}px`,
    letterSpacing: `${letterSpacing}px`,
    lineHeight: lineHeight,
  };

  const selectedTopic = useMemo(() => {
    return geometryTheory.find((t) => t.id === selectedTopicId) || geometryTheory[0];
  }, [geometryTheory, selectedTopicId]);

  const selectedTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId) || tasks[0];
  }, [tasks, selectedTaskId]);

  // Система полнотекстового поиска по теории
  const filteredTheory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return geometryTheory;
    return geometryTheory.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.short?.toLowerCase().includes(q) ||
        t.content?.toLowerCase().includes(q)
    );
  }, [searchQuery, geometryTheory]);

  // Отслеживание курсора мыши для экранной лупы
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        clientX: e.clientX,
        clientY: e.clientY,
        pageX: e.clientX + window.scrollX,
        pageY: e.clientY + window.scrollY,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Интеллектуальный речевой диктор (TTS) при наведении курсора
  useEffect(() => {
    if (!screenReader) return;

    const readElement = (e) => {
      const el = e.target.closest(
        "button, a, input, textarea, select, h1, h2, h3, p, span, strong, small, td, th"
      );
      if (!el) return;

      const text =
        el.getAttribute("aria-label") ||
        el.placeholder ||
        el.innerText ||
        el.value;

      if (text) speakText(text);
    };

    document.addEventListener("pointerover", readElement);
    return () => document.removeEventListener("pointerover", readElement);
  }, [screenReader]);

  const speakText = (text) => {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Очистить предыдущую очередь озвучки

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "ru-RU";
    speech.rate = 0.95;
    window.speechSynthesis.speak(speech);
  };

  const stopSpeech = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const goTo = (screen) => {
    stopSpeech();
    setCurrentScreen(screen);
  };

  // Аутентификация, авторизация и регистрация пользователей
  const handleLoginOrRegister = (data) => {
    if (data.mode === "login") {
      const found = usersDatabase.find(
        (u) =>
          u.email.toLowerCase() === data.email.toLowerCase() &&
          u.password === data.password
      );

      if (!found) {
        alert("Ошибка авторизации: Пользователь не найден или неверный пароль.");
        return;
      }

      const withToken = { ...found, token: data.token || found.token || "mock-jwt-token" };
      localStorage.setItem("geo_user", JSON.stringify(withToken));
      setUser(withToken);
      setCurrentScreen("main");
      speakText(`Добро пожаловать в систему, ${withToken.full_name}`);
      return;
    }

    // Логика Регистрации нового пользователя
    const exists = usersDatabase.some(
      (u) => u.email.toLowerCase() === data.email.toLowerCase()
    );

    if (exists) {
      alert("Пользователь с таким email адресом уже зарегистрирован!");
      return;
    }

    const created = {
      id: usersDatabase.length + 1,
      full_name: data.full_name,
      email: data.email,
      password: data.password,
      role: data.role,
      school: data.school,
      student_class: data.student_class || "8-А",
      score: 0,
      completedTasks: [],
      token: data.token || "generated-jwt-token",
    };

    setUsersDatabase((prev) => [...prev, created]);
    localStorage.setItem("geo_user", JSON.stringify(created));
    setUser(created);
    setCurrentScreen("main");
    speakText(`Регистрация завершена. Добро пожаловать, ${created.full_name}`);
  };

  // Интерактивная проверка ответов на задачи с начислением баллов (gamification)
  const checkAnswer = () => {
    if (!selectedTask) return;

    const correctAnswer = (
      selectedTask.answer ||
      selectedTask.correctAnswer ||
      String(selectedTask.correct ?? "")
    ).trim().toLowerCase();

    const value = (taskAnswers[selectedTask.id] || "").trim().toLowerCase();

    if (value === correctAnswer) {
      setTaskStatuses((prev) => ({ ...prev, [selectedTask.id]: "success" }));

      if (!user.completedTasks?.includes(selectedTask.id)) {
        const updatedUser = {
          ...user,
          score: user.score + 10,
          completedTasks: [...(user.completedTasks || []), selectedTask.id],
        };

        setUser(updatedUser);
        localStorage.setItem("geo_user", JSON.stringify(updatedUser));
        setUsersDatabase((prev) =>
          prev.map((u) => (u.email === user.email ? updatedUser : u))
        );
      }
      alert("Великолепно! Ответ верный. Вам начислено +10 баллов.");
      speakText("Правильно! Плюс десять баллов.");
    } else {
      setTaskStatuses((prev) => ({ ...prev, [selectedTask.id]: "error" }));
      alert("Ошибка. Ответ не совпадает. Попробуйте прочитать подсказку.");
      speakText("Неверно. Попробуйте еще раз.");
    }
  };

  // Отправка обратной связи / сообщений в СУБД преподавателя
  const sendFeedback = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setFeedbackList((prev) => [
      ...prev,
      {
        id: Date.now(),
        author: `${user.full_name} (${user.role}, класс: ${user.student_class})`,
        text: feedbackText,
      },
    ]);

    setFeedbackText("");
    alert("Ваш вопрос успешно отправлен преподавателю в личный кабинет.");
    speakText("Вопрос отправлен.");
  };

  // CMS: Добавление учебных параграфов преподавателем или админом
  const addParagraph = (e) => {
    e.preventDefault();
    const title = e.target.elements.title.value.trim();
    const content = e.target.elements.content.value.trim();

    if (!title || !content) {
      alert("Пожалуйста, заполните все поля формы.");
      return;
    }

    const newTopic = {
      id: `topic-${Date.now()}`,
      title,
      short: "Добавлено через панель CMS.",
      content,
      formula: "S = a × h",
      image: "📐",
    };

    setGeometryTheory((prev) => [...prev, newTopic]);
    setSelectedTopicId(newTopic.id);
    setCurrentScreen("topic");
    e.target.reset();
    alert("Новый параграф успешно добавлен в оглавление.");
  };

  const deleteTopic = (id) => {
    const next = geometryTheory.filter((t) => t.id !== id);
    setGeometryTheory(next);
    if (selectedTopicId === id && next.length > 0) {
      setSelectedTopicId(next[0].id);
    }
    goTo("theory");
    alert("Тема успешно удалена из системы.");
  };

  const playAudioLesson = (lesson) => {
    speakText(
      `${lesson.title}. Описание урока: ${lesson.description || lesson.text || "Материал озвучен встроенным диктором"}`
    );
  };

  // Система инклюзивного распространения / Поделиться
  const handleShare = (platform) => {
    const text = `Я изучаю интерактивную геометрию в приложении GeoVision 8 на странице: ${currentScreen}. Присоединяйся!`;
    const url = window.location.href;

    if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`, "_blank");
    } else if (platform === "telegram") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
    } else if (platform === "native" && navigator.share) {
      navigator.share({ title: "GeoVision 8", text, url }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      alert("Ссылка успешно скопирована в буфер обмена!");
    }
  };

  // Рендеринг основного слоя контента (Используется один раз, предотвращая цикличность линзы)
  const renderContent = () => (
    <div className="app-main-content-layer" style={dynamicStyles}>
      {/* ПАНЕЛЬ УПРАВЛЕНИЯ ОВЗ (ДОСТУПНОСТЬ ПО ГОСТУ) */}
      <header className="ovz-control-panel">
        <div className="ovz-row">
          <div className="ovz-group theme-selectors">
            <button className={theme === "light-theme" ? "active-t" : ""} onClick={() => setTheme("light-theme")}>Светлая</button>
            <button className={theme === "dark-theme" ? "active-t" : ""} onClick={() => setTheme("dark-theme")}>Тёмная</button>
            <button className={theme === "contrast-theme" ? "active-t" : ""} onClick={() => setTheme("contrast-theme")}>Контраст (ЦН)</button>
            <button className={theme === "beige-theme" ? "active-t" : ""} onClick={() => setTheme("beige-theme")}>Бежевая (Книга)</button>
          </div>

          <div className="ovz-group sliders">
            <label>
              Текст: <b>{fontSize}px</b>
              <input type="range" min="16" max="36" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
            </label>

            <label>
              Межбуквенный: <b>{letterSpacing}px</b>
              <input type="range" min="0" max="10" value={letterSpacing} onChange={(e) => setLetterSpacing(Number(e.target.value))} />
            </label>

            <label>
              Интервал: <b>{lineHeight}</b>
              <input type="range" min="1.4" max="2.6" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))} />
            </label>
          </div>

          <div className="ovz-group toggles">
            <button className={`toggle-btn ${isMagnifierActive ? "enabled" : ""}`} onClick={() => {
              const next = !isMagnifierActive;
              setIsMagnifierActive(next);
              speakText(next ? "Экранная лупа активирована" : "Лупа отключена");
            }}>
              🔍 Лупа: {isMagnifierActive ? "ВКЛ" : "ВЫКЛ"}
            </button>

            <button className={`toggle-btn ${screenReader ? "enabled" : ""}`} onClick={() => {
              const next = !screenReader;
              setScreenReader(next);
              next ? speakText("Экранный диктор запущен. Наводите курсор на элементы текста.") : stopSpeech();
            }}>
              🎙️ Диктор: {screenReader ? "ВКЛ" : "ВЫКЛ"}
            </button>
          </div>
        </div>
      </header>

      {/* ЭКРАН АВТОРИЗАЦИИ / РЕГИСТРАЦИИ */}
      {!user ? (
        <AuthAndRegister
          onLoginSuccess={handleLoginOrRegister}
          handleHoverSpeak={() => {}}
          dynamicTextStyles={dynamicStyles}
        />
      ) : (
        <>
          {/* НАВИГАЦИОННАЯ ПАНЕЛЬ */}
          <nav className="main-navigation-bar">
            <div className="logo-section" onClick={() => goTo("main")}>
              📐 GeoVision 8
            </div>

            <div className="menu-links">
              <button className={currentScreen === "main" ? "active-l" : ""} onClick={() => goTo("main")}>Главная</button>
              <button className={currentScreen === "about" ? "active-l" : ""} onClick={() => goTo("about")}>О проекте</button>
              <button className={currentScreen === "learn" || currentScreen === "theory" || currentScreen === "topic" ? "active-l" : ""} onClick={() => goTo("learn")}>Обучение</button>
              <button className={currentScreen === "tasks" || currentScreen === "task" ? "active-l" : ""} onClick={() => goTo("tasks")}>Задания</button>
              <button className={currentScreen === "audio" ? "active-l" : ""} onClick={() => goTo("audio")}>Аудиоуроки</button>
              <button className={currentScreen === "profile" ? "active-l" : ""} onClick={() => goTo("profile")}>
                {isStudent ? "Кабинет" : "База Данных"}
              </button>
              <button className={currentScreen === "contacts" ? "active-l" : ""} onClick={() => goTo("contacts")}>
                {isStudent ? "Помощь" : `Сообщения (${feedbackList.length})`}
              </button>
            </div>

            <div className="user-profile-tag">
              <span>👤 {user.full_name}</span>
              <small>[{user.role}]</small>
            </div>
          </nav>

          {/* КОНТЕНТНАЯ ОБЛАСТЬ СТРАНИЦ */}
          <main className="content-area">
            {currentScreen !== "main" && (
              <button className="back-btn" onClick={() => goTo("main")}>
                ← Вернуться на главную страницу
              </button>
            )}

            {/* ГЛАВНЫЙ ЭКРАН */}
            {currentScreen === "main" && (
              <section className="page-card hero-layout">
                <div className="hero-section">
                  <div className="hero-badge">Электронный Учебник</div>
                  <h1>Геометрия 8 класса для слабовидящих учеников</h1>
                  <p>
                    Специализированная образовательная среда, снабженная векторными чертежами высокой четкости,
                    голосовым синтезатором речи, адаптивными палитрами контрастности и интерактивными тестами контроля знаний.
                  </p>

                  <div className="hero-actions">
                    <button className="primary-btn" onClick={() => goTo("learn")}>
                      Открыть оглавление книги
                    </button>
                    <button className="secondary-btn" onClick={() => speakText("Учебник Геовижн 8. Разделы включают теорию четырехугольников, теорему Пифагора, площади фигур и аудиоуроки.")}>
                      🔊 Озвучить сводку
                    </button>
                  </div>
                </div>

                <section className="teacher-contact-mini">
                  <h2>Быстрый вопрос преподавателю</h2>
                  <form onSubmit={sendFeedback}>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Опишите, какая геометрическая задача или теорема вызвала у вас затруднение..."
                    />
                    <button className="primary-btn" type="submit">Отправить сообщение</button>
                  </form>
                </section>
              </section>
            )}

            {/* ЭКРАН КАТЕГОРИЙ ОБУЧЕНИЯ */}
            {currentScreen === "learn" && (
              <section className="page-card">
                <h2>Интерактивное рабочее пространство</h2>
                <p className="subtitle-text">Используйте умную поисковую строку для быстрой фильтрации по терминам:</p>
                
                <input
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по книге: ромб, площадь, треугольник, гипотенуза..."
                  aria-label="Поле поиска по теории"
                />

                <div className="dashboard-grid">
                  <button className="dashboard-card" onClick={() => goTo("theory")}>
                    <b>📚 Теоретические главы</b>
                    <span>Всего доступно: {geometryTheory.length} тем</span>
                  </button>

                  <button className="dashboard-card" onClick={() => goTo("tasks")}>
                    <b>📝 Практика и тесты</b>
                    <span>Ваш текущий рейтинг: {user.score} баллов</span>
                  </button>

                  <button className="dashboard-card" onClick={() => goTo("audio")}>
                    <b>🎧 Аудиозаписи лекций</b>
                    <span>В базе записано: {audioLessons.length} уроков</span>
                  </button>
                </div>
              </section>
            )}

            {/* СПИСОК ГЛАВ ТЕОРИИ */}
            {currentScreen === "theory" && (
              <section className="page-card">
                <h2>Оглавление теоретических материалов</h2>
                <div className="topic-grid">
                  {filteredTheory.map((topic) => (
                    <button key={topic.id} className="topic-card" onClick={() => {
                      setSelectedTopicId(topic.id);
                      goTo("topic");
                    }}>
                      <span className="topic-image">{topic.image || "📘"}</span>
                      <strong>{topic.title}</strong>
                      <small>{topic.short || "Нажмите для изучения параграфа"}</small>
                    </button>
                  ))}
                  {filteredTheory.length === 0 && <p className="no-results">По вашему поисковому запросу ничего не найдено.</p>}
                </div>
              </section>
            )}

            {/* ДЕТАЛЬНЫЙ ПРОСМОТР ПАРАГРАФА (С SVG И CMS) */}
            {currentScreen === "topic" && selectedTopic && (
              <section className="page-card">
                <button className="back-btn" onClick={() => goTo("theory")}>← К списку параграфов</button>
                
                <div className="topic-detail">
                  <div className="big-figure-box">
                    <div className="big-figure">{selectedTopic.image || "📐"}</div>
                    {/* Инклюзивный интерактивный чертеж на чистом SVG для предотвращения пикселизации */}
                    <svg width="160" height="160" viewBox="0 0 100 100" className="embedded-vector-geometry">
                      <polygon points="10,90 90,90 10,20" fill="none" stroke="currentColor" strokeWidth="4" />
                      <rect x="10" y="80" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>

                  <div className="topic-text-block">
                    <h2>{selectedTopic.title}</h2>
                    <p className="main-article-content">{selectedTopic.content}</p>
                    <div className="formula-box">
                      <span>Математическое выражение:</span>
                      <code>{selectedTopic.formula || "Формула выводится графически"}</code>
                    </div>

                    <button className="primary-btn wave-btn" onClick={() => speakText(`${selectedTopic.title}. ${selectedTopic.content}. Формула: ${selectedTopic.formula}`)}>
                      🔊 Прослушать аудиодекларацию параграфа
                    </button>
                  </div>
                </div>

                {/* ПАНЕЛЬ CMS УПРАВЛЕНИЯ ДЛЯ ПРЕПОДАВАТЕЛЕЙ И АДМИНИСТРАТОРОВ */}
                {canManageContent && (
                  <div className="cms-box border-dashed-box">
                    <h3>Панель управления контентом (CMS Модуль)</h3>
                    <form onSubmit={addParagraph} className="cms-add-form">
                      <input name="title" placeholder="Введите название нового параграфа" required />
                      <textarea name="content" placeholder="Введите полный текст геометрической лекции" required />
                      <button className="primary-btn text-emerald" type="submit">Опубликовать главу в учебник</button>
                    </form>

                    <button className="danger-btn delete-action-btn" onClick={() => deleteTopic(selectedTopic.id)}>
                      🗑️ Полностью удалить данный параграф из системы
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* СПИСОК ЗАДАЧ */}
            {currentScreen === "tasks" && (
              <section className="page-card">
                <h2>Интерактивный банк практических заданий</h2>
                <div className="topic-grid">
                  {tasks.map((task) => (
                    <button key={task.id} className={`topic-card task-card-select ${user.completedTasks?.includes(task.id) ? "task-done-border" : ""}`} onClick={() => {
                      setSelectedTaskId(task.id);
                      goTo("task");
                    }}>
                      <span className="task-icon-marker">{user.completedTasks?.includes(task.id) ? "✅" : "📝"}</span>
                      <strong>{task.title || task.question || "Задача по геометрии"}</strong>
                      <small>{task.condition || "Нажмите, чтобы открыть математические условия задачи"}</small>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ОДИНОЧНАЯ ЗАДАЧА С ПРОВЕРКОЙ */}
            {currentScreen === "task" && selectedTask && (
              <section className="page-card">
                <button className="back-btn" onClick={() => goTo("tasks")}>← Вернуться к списку задач</button>
                
                <div className="task-solving-workspace">
                  <h2>{selectedTask.title || "Решение задачи"}</h2>
                  <p className="task-condition-text">{selectedTask.condition || selectedTask.question}</p>
                  
                  <div className="hint-box font-contrast-accent">
                    💡 <b>Методическая подсказка:</b> {selectedTask.hint || "Внимательно изучите свойства векторов и площадей квадратов."}
                  </div>

                  <div className="interactive-form-row">
                    <input
                      className="answer-input"
                      value={taskAnswers[selectedTask.id] || ""}
                      onChange={(e) =>
                        setTaskAnswers((prev) => ({
                          ...prev,
                          [selectedTask.id]: e.target.value,
                        }))
                      }
                      placeholder="Введите полученное числовое значение или слово"
                    />

                    <button className="primary-btn check-btn" onClick={checkAnswer}>
                      Проверить ответ на сервере
                    </button>
                  </div>

                  {taskStatuses[selectedTask.id] === "success" && (
                    <div className="status-banner success-bg">⚡ Ответ верный! Задание успешно выполнено.</div>
                  )}

                  {taskStatuses[selectedTask.id] === "error" && (
                    <div className="status-banner error-bg">❌ Ответ неверный. Перепроверьте расчеты.</div>
                  )}
                </div>
              </section>
            )}

            {/* АУДИОУРОКИ */}
            {currentScreen === "audio" && (
              <section className="page-card">
                <h2>Озвученные аудиолекции и подкасты</h2>
                <p className="subtitle-text">Специальные аудиоматериалы с дикторским разбором сложных геометрических аксиом:</p>
                <div className="topic-grid">
                  {audioLessons.map((lesson) => (
                    <div className="topic-card audio-card" key={lesson.id}>
                      <span className="audio-wave-anim">🎧</span>
                      <strong>{lesson.title}</strong>
                      <small>{lesson.description || "Аудиозапись параграфа"}</small>
                      <button className="primary-btn play-audio-btn" onClick={() => playAudioLesson(lesson)}>
                        ▶ Запустить воспроизведение лекции
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* СВЯЗЬ / СООБЩЕНИЯ */}
            {currentScreen === "contacts" && (
              <section className="page-card">
                <h2>{isStudent ? "Чат экстренной помощи преподавателя" : "Панель входящих вопросов студентов"}</h2>

                {isStudent ? (
                  <form className="feedback-form" onSubmit={sendFeedback}>
                    <p>Если вам непонятно условие задачи или не работает интерфейс, напишите обращение напрямую учителю:</p>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Пожалуйста, детально сформулируйте вашу проблему..."
                      required
                    />
                    <button className="primary-btn" type="submit">Отправить текстовый пакет</button>
                  </form>
                ) : (
                  <div className="messages-list-wrapper">
                    <p>Список входящих тикетов от учеников закрепленных классов:</p>
                    {feedbackList.map((m) => (
                      <div className="message-box card-inner-shadow" key={m.id}>
                        <div className="msg-meta">🔔 <b>Отправитель:</b> {m.author}</div>
                        <div className="msg-body"><b>Текст обращения:</b> {m.text}</div>
                      </div>
                    ))}
                    {feedbackList.length === 0 && <p className="empty-placeholder-text">Нет непрочитанных сообщений от студентов.</p>}
                  </div>
                )}
              </section>
            )}

            {/* О ПРОЕКТЕ */}
            {currentScreen === "about" && (
              <section className="page-card">
                <h2>О программном комплексе GeoVision 8</h2>
                <p>
                  Данное Web-приложение является законченным курсовым проектом по дисциплине «Интернет программирование».
                  Разработано студентом группы Тг-1-23 Ашырбековым Алибеком КГТУ им. И. Раззакова.
                </p>
                <p>
                  Приложение полностью удовлетворяет жестким инклюзивным требованиям стандартов WCAG 2.1 и ГОСТ для лиц с дефектами зрения.
                  Архитектура построена на базе паттерна защищенного разделения ролей (RBAC) и адаптивного рендеринга виртуальных слоев.
                </p>
              </section>
            )}

            {/* ПРОФИЛЬ / СУБД ТАБЛИЦА */}
            {currentScreen === "profile" && (
              <section className="page-card">
                <h2>{isStudent ? "Личный кабинет студента" : "Консоль администрирования РСУБД"}</h2>
                
                <div className="user-profile-meta-sheet">
                  <p><b>ФИО авторизованного аккаунта:</b> {user.full_name}</p>
                  <p><b>Системная привилегия / Роль:</b> <span className="role-badge-ui">{user.role}</span></p>
                  <p><b>Учебное заведение:</b> {user.school}</p>
                  <p><b>Закрепленный класс:</b> {user.student_class}</p>
                  <p><b>Сумма набранных баллов:</b> {user.score} сом/баллов</p>
                  <p><b>Уникальный сессионный JWT Токен:</b> <code>{user.token || "сессия без токена"}</code></p>
                </div>

                {canViewDatabase && (
                  <div className="database-table-container margin-top-db">
                    <h3>Реляционная таблица пользователей `users`</h3>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Полное имя</th>
                          <th>Роль</th>
                          <th>Учебное заведение</th>
                          <th>Класс</th>
                          <th>Баллы</th>
                          <th>Выполнено</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersDatabase.map((u) => (
                          <tr key={u.id} className={u.email === user.email ? "highlight-current-row" : ""}>
                            <td>{u.id}</td>
                            <td><b>{u.full_name}</b></td>
                            <td>{u.role}</td>
                            <td>{u.school}</td>
                            <td>{u.student_class}</td>
                            <td><span className="text-score-bold">{u.score}</span></td>
                            <td>{u.completedTasks?.length || 0} шт.</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <button className="danger-btn logout-action-trigger" onClick={() => {
                  localStorage.removeItem("geo_user");
                  setUser(null);
                  goTo("main");
                }}>
                  Завершить сессию и выйти из аккаунта
                </button>
              </section>
            )}
          </main>

          {/* ИНКЛЮЗИВНАЯ ПАНЕЛЬ ИНТЕГРАЦИИ QR-КОДОВ И ПОДЕЛИТЬСЯ */}
          <aside className="qr-panel">
            <div className="qr-box">
              {/* Настоящий масштабируемый SVG QR-Код для демонстрации функционала */}
              <svg width="64" height="64" viewBox="0 0 25 25" className="live-qr-code-matrix" fill="currentColor">
                <path d="M0 0h7v7H0zm1 1v5h5V1zm1 1h3v3H2zm6-2h1v1H8zm1 1h1v2H9zm-1 2h1v1H8zm2-3h1v1h-1zm1 2h1v2h-1zm3-2h7v7h-7zm1 1v5h5V1zm1 1h3v3h-3zM0 18h7v7H0zm1 1v5h5v-5zm1 1h3v3H2zM18 18h7v7h-7zm1 1v5h5v-5zm1 1h3v3h-3zM10 10h2v2h-2zm3 3h3v1h-3zm-1 3h2v1h-2zm4-2h2v3h-2z"/>
              </svg>
              <small>QR: Экран / {currentScreen}</small>
            </div>
            
            <div className="share-actions-group">
              <span>Поделиться прогрессом:</span>
              <button onClick={() => handleShare("whatsapp")} className="share-mini-btn wa">WhatsApp</button>
              <button onClick={() => handleShare("telegram")} className="share-mini-btn tg">Telegram</button>
              <button onClick={() => handleShare("native")} className="share-mini-btn link-c">Система</button>
            </div>
          </aside>

          {/* ПОДВАЛ САЙТА */}
          <footer className="footer">
            <span>📐 GeoVision 8 — Инклюзивная образовательная среда по геометрии</span>
            <div className="footer-links-row">
              <span className="author-tag">Разработчик: Ашырбеков А. (Тг-1-23)</span>
            </div>
          </footer>
        </>
      )}
    </div>
  );

  return (
    <div className={`app-container ${theme}`}>
      {/* 1. Главный слой контента */}
      {renderContent()}

      {/* 2. Изолированный слой Аппаратной Лупы без бесконечной рекурсии */}
      {isMagnifierActive && (
        <div
          className="real-hardware-lens-circle"
          style={{
            position: "fixed",
            pointerEvents: "none",
            width: `${magnifierRadius * 2}px`,
            height: `${magnifierRadius * 2}px`,
            borderRadius: "50%",
            border: "4px solid #f59e0b",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(0,0,0,0.3)",
            overflow: "hidden",
            zIndex: 99999,
            left: `${mousePos.clientX - magnifierRadius}px`,
            top: `${mousePos.clientY - magnifierRadius}px`,
          }}
        >
          <div
            className="magnified-app-copy"
            style={{
              position: "absolute",
              width: `${window.innerWidth}px`,
              left: `${magnifierRadius - mousePos.clientX * magnifierScale}px`,
              top: `${magnifierRadius - mousePos.clientY * magnifierScale}px`,
              transform: `scale(${magnifierScale})`,
              transformOrigin: "top left",
              background: "inherit",
            }}
          >
            {/* Отрисовка контента внутри линзы с сохранением стилей темы */}
            <div className={`app-container ${theme} magnified-inner-view`}>
              {renderContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;