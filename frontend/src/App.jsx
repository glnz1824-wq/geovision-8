import React, { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import AuthAndRegister from "./AuthAndRegister";
import { theory8 } from "./data/theory8";
import { tasks8 } from "./data/tasks8";
import "./App.css";

function encodePassword(password) {
  return btoa(unescape(encodeURIComponent(password)));
}

const audioLessons8 = [
  {
    id: "audio-1",
    title: "Аудиоурок 1. Четырёхугольники",
    text: "Четырёхугольник — это геометрическая фигура, состоящая из четырёх вершин и четырёх сторон.",
  },
  {
    id: "audio-2",
    title: "Аудиоурок 2. Параллелограмм",
    text: "Параллелограмм — это четырёхугольник, у которого противоположные стороны попарно параллельны.",
  },
  {
    id: "audio-3",
    title: "Аудиоурок 3. Ромб и квадрат",
    text: "Ромб — это параллелограмм, у которого все стороны равны. Квадрат сочетает свойства прямоугольника и ромба.",
  },
];

const INITIAL_USERS = [
  {
    id: 1,
    full_name: "Гульназ Маратова",
    email: "student@test.com",
    password: encodePassword("1234"),
    role: "Ученик",
    school: "Школа им. Мукая Элебаева",
    student_class: "8-А",
    score: 20,
    completedTasks: ["quad"],
  },
  {
    id: 2,
    full_name: "Бакыт Токтосунов",
    email: "teacher@test.com",
    password: encodePassword("1234"),
    role: "Учитель",
    school: "Школа им. Мукая Элебаева",
    student_class: "Учитель",
    score: 0,
    completedTasks: [],
  },
  {
    id: 3,
    full_name: "Администратор",
    email: "admin@test.com",
    password: encodePassword("admin123"),
    role: "Администратор",
    school: "GeoVision 8",
    student_class: "Система",
    score: 0,
    completedTasks: [],
  },
];

function App() {
  const [usersDatabase, setUsersDatabase] = useState(() => {
    const saved = localStorage.getItem("geo_users_db");
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("geo_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("geo_messages");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            from: "Гульназ Маратова",
            fromEmail: "student@test.com",
            to: "Бакыт Токтосунов",
            text: "Здравствуйте! Подскажите, чему равна сумма внутренних углов четырёхугольника?",
            replies: [],
          },
        ];
  });

  const [theme, setTheme] = useState("beige-theme");
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.5);
  
  const [zoomMode, setZoomMode] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [readerMode, setReaderMode] = useState(false);
  const [currentScreen, setCurrentScreen] = useState("main");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState(theory8[0]?.id || "");
  const [taskStatuses, setTaskStatuses] = useState({});
  const [feedbackText, setFeedbackText] = useState("");
  const [targetTeacher, setTargetTeacher] = useState("");
  const [selectedStudentFilter, setSelectedStudentFilter] = useState("");

  useEffect(() => {
    localStorage.setItem("geo_users_db", JSON.stringify(usersDatabase));
  }, [usersDatabase]);

  useEffect(() => {
    localStorage.setItem("geo_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const isStudent = user?.role === "Ученик";
  const isTeacher = user?.role === "Учитель";
  const isAdmin = user?.role === "Администратор";

  const studentsList = useMemo(
    () => usersDatabase.filter((item) => item.role === "Ученик"),
    [usersDatabase]
  );

  const teachersList = useMemo(
    () => usersDatabase.filter((item) => item.role === "Учитель"),
    [usersDatabase]
  );

  const selectedTopic =
    theory8.find((item) => item.id === selectedTopicId) || theory8[0];

  const filteredTheory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return theory8;

    return theory8.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.short?.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const baseTasks = tasks8 || [];
    if (!q) return baseTasks;

    return baseTasks.filter(
      (item) =>
        item.topic?.toLowerCase().includes(q) ||
        item.question?.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredAudio = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return audioLessons8;

    return audioLessons8.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredMessages = useMemo(() => {
    if (!isTeacher) return messages;
    if (!selectedStudentFilter) return messages;
    return messages.filter((item) => item.from === selectedStudentFilter);
  }, [messages, selectedStudentFilter, isTeacher]);

  const pageUrl = `${window.location.origin}/#${currentScreen}`;

  const dynamicTextStyles = {
    fontSize: `${fontSize}px`,
    lineHeight,
  };

  const ZOOM_SCALE = 2;   
  const LENS_SIZE = 200;  
  const LENS_RADIUS = LENS_SIZE / 2; 

  const magnifierContentStyle = {
    transform: `translate(${LENS_RADIUS - mousePos.x * ZOOM_SCALE}px, ${LENS_RADIUS - mousePos.y * ZOOM_SCALE}px) scale(${ZOOM_SCALE})`,
    pointerEvents: "none"
  };

  function speakText(text) {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "ru-RU";
    speech.rate = 0.9;
    window.speechSynthesis.speak(speech);
  }

  function stopSpeech() {
    window.speechSynthesis?.cancel();
  }

  function goTo(screen) {
    stopSpeech();
    setCurrentScreen(screen);
  }

  useEffect(() => {
    if (!readerMode) return;

    const readElement = (event) => {
      const element = event.target.closest(
        "button, a, input, textarea, select, h1, h2, h3, p, span, td, th, label"
      );
      if (!element) return;

      const text =
        element.getAttribute("aria-label") ||
        element.placeholder ||
        element.innerText ||
        element.value;

      if (text) speakText(text);
    };

    document.addEventListener("pointerover", readElement);
    return () => document.removeEventListener("pointerover", readElement);
  }, [readerMode]);

  function handleLoginOrRegister(data) {
    if (data.mode === "login") {
      const found = usersDatabase.find(
        (item) =>
          item.email.toLowerCase() === data.email.toLowerCase() &&
          item.password === data.password
      );

      if (!found) {
        alert("Неверный логин или пароль");
        return;
      }

      const activeUser = {
        ...found,
        token: `mock-token-${Date.now()}`,
      };

      setUser(activeUser);
      localStorage.setItem("geo_user", JSON.stringify(activeUser));
      setShowAuthModal(false);
      setCurrentScreen("main");
      return;
    }

    const exists = usersDatabase.some(
      (item) => item.email.toLowerCase() === data.email.toLowerCase()
    );

    if (exists) {
      alert("Пользователь с таким email уже существует");
      return;
    }

    const createdUser = {
      id: Date.now(),
      full_name: data.full_name,
      email: data.email,
      password: data.password,
      role: data.role || "Ученик",
      school: data.school,
      student_class: data.student_class,
      score: 0,
      completedTasks: [],
      token: `mock-token-${Date.now()}`,
    };

    setUsersDatabase((prev) => [...prev, createdUser]);
    setUser(createdUser);
    localStorage.setItem("geo_user", JSON.stringify(createdUser));
    setShowAuthModal(false);
    setCurrentScreen("main");
  }

  function logout() {
    localStorage.removeItem("geo_user");
    setUser(null);
    setCurrentScreen("main");
  }

  function checkAnswer(taskId, selectedIndex) {
    if (!user) {
      alert("Сначала войдите в систему");
      return;
    }

    const task = tasks8.find((item) => item.id === taskId);
    if (!task) return;

    if (selectedIndex !== task.correct) {
      setTaskStatuses((prev) => ({ ...prev, [taskId]: "error" }));
      alert("Неверно. Попробуйте ещё раз.");
      return;
    }

    setTaskStatuses((prev) => ({ ...prev, [taskId]: "success" }));

    if (!user.completedTasks?.includes(taskId)) {
      const updatedUser = {
        ...user,
        score: Number(user.score || 0) + 10,
        completedTasks: [...(user.completedTasks || []), taskId],
      };

      setUser(updatedUser);
      localStorage.setItem("geo_user", JSON.stringify(updatedUser));

      setUsersDatabase((prev) =>
        prev.map((item) => (item.email === user.email ? updatedUser : item))
      );
    }

    alert("Правильно! +10 баллов.");
  }

  function sendMessage(event) {
    event.preventDefault();

    if (!user) {
      alert("Сначала войдите в систему");
      return;
    }

    if (!feedbackText.trim()) return;

    const newMessage = {
      id: Date.now(),
      from: user.full_name,
      fromEmail: user.email,
      to: targetTeacher || "Учитель",
      text: feedbackText,
      replies: [],
    };

    setMessages((prev) => [newMessage, ...prev]);
    setFeedbackText("");
    setTargetTeacher("");

    alert("Сообщение отправлено учителю");
  }

  function sendTeacherReply(messageId, replyText) {
    if (!replyText.trim()) return;

    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? {
              ...message,
              replies: [
                ...(message.replies || []),
                {
                  id: Date.now(),
                  author: user.full_name,
                  text: replyText,
                },
              ],
            }
          : message
      )
    );
  }

  function deleteUser(userId) {
    if (!window.confirm("Удалить пользователя?")) return;
    setUsersDatabase((prev) => prev.filter((item) => item.id !== userId));
  }

  function changeUserRole(userId, newRole) {
    setUsersDatabase((prev) =>
      prev.map((item) =>
        item.id === userId ? { ...item, role: newRole } : item
      )
    );
  }

  function sharePage() {
    if (navigator.share) {
      navigator.share({
        title: "GeoVision 8",
        text: "Интерактивный учебник по геометрии 8 класса",
        url: pageUrl,
      });
    } else {
      navigator.clipboard.writeText(pageUrl);
      alert("Ссылка скопирована");
    }
  }

  const renderPageContent = (isMirror = false) => (
    <div className="content-mirror-container">
      <header className="ovz-control-panel">
        <div className="ovz-row">
          <div className="ovz-group">
            <button onClick={() => setTheme("light-theme")}>Светлая</button>
            <button onClick={() => setTheme("dark-theme")}>Тёмная</button>
            <button onClick={() => setTheme("contrast-theme")}>Контраст</button>
            <button onClick={() => setTheme("beige-theme")}>Бежевая</button>
          </div>

          <div className="ovz-group">
            <label>
              Размер: {fontSize}px
              <input
                type="range"
                min="16"
                max="30"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
            </label>

            <label>
              Строки: {lineHeight}
              <input
                type="range"
                min="1.2"
                max="2.2"
                step="0.1"
                value={lineHeight}
                onChange={(e) => setLineHeight(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="ovz-group">
            <button
              className={zoomMode ? "tool-on" : ""}
              onClick={() => setZoomMode((prev) => !prev)}
            >
              🔍 Лупа: {zoomMode ? "ВКЛ" : "ВЫКЛ"}
            </button>

            <button
              className={readerMode ? "tool-on" : ""}
              onClick={() => {
                const next = !readerMode;
                setReaderMode(next);
                next ? speakText("Диктор включен") : stopSpeech();
              }}
            >
              🎙️ Диктор: {readerMode ? "ВКЛ" : "ВЫКЛ"}
            </button>
          </div>
        </div>
      </header>

      <nav className="main-navigation-bar">
        <div className="logo-section" onClick={() => goTo("main")}>
          📐 GeoVision 8
        </div>

        <div className="menu-links">
          <button onClick={() => goTo("main")}>Главная</button>
          <button onClick={() => goTo("theory")}>Теория</button>
          <button onClick={() => goTo("tasks")}>Задания</button>
          <button onClick={() => goTo("audio")}>Аудиоуроки</button>

          {user && !isAdmin && (
            <button onClick={() => goTo("contacts")}>Связь с учителем</button>
          )}

          {user && (
            <button onClick={() => goTo("profile")}>
              {isAdmin
                ? "Админ-панель"
                : isTeacher
                ? "Кабинет учителя"
                : "Кабинет ученика"}
            </button>
          )}
        </div>

        <div className="user-zone">
          {user ? (
            <>
              <span>
                👤 <b>{user.full_name}</b> ({user.role})
              </span>
              <button className="logout-btn" onClick={logout}>
                Выйти
              </button>
            </>
          ) : (
            <button className="login-btn" onClick={() => setShowAuthModal(true)}>
              Вход / Регистрация
            </button>
          )}
        </div>
      </nav>

      <div className="global-search-container">
        <input
          className="search-input"
          placeholder="Поиск по геометрии: ромб, квадрат, параллелограмм..."
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            if (event.target.value.trim()) setCurrentScreen("theory");
          }}
        />
      </div>

      {showAuthModal && (
        <div className="auth-modal">
          <div className="auth-modal-card">
            <button
              className="modal-close"
              onClick={() => setShowAuthModal(false)}
            >
              ×
            </button>

            <AuthAndRegister
              onLoginSuccess={handleLoginOrRegister}
              dynamicTextStyles={{}}
            />
          </div>
        </div>
      )}

      <main className="content-area">
        {currentScreen === "main" && (
          <section className="page-card hero-card">
            <h1>Интерактивный учебник по геометрии 8 класса</h1>
            <p>
              Теория, задания, аудиоуроки, поиск, диктор, лупа, QR-код,
              личный кабинет и связь с учителем.
            </p>

            <button className="primary-btn" onClick={() => goTo("theory")}>
              Начать обучение
            </button>
          </section>
        )}

        {currentScreen === "theory" && (
          <section className="page-card">
            <h2>Теория по геометрии 8 класса</h2>

            <div className="topic-grid">
              {filteredTheory.map((topic) => (
                <div className="topic-card theory-card" key={topic.id}>
                  <h3>{topic.title}</h3>
                  <p>{topic.short}</p>

                  <button
                    className="primary-btn"
                    onClick={() => {
                      setSelectedTopicId(topic.id);
                      goTo("topic");
                    }}
                  >
                    Изучить параграф
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {currentScreen === "topic" && selectedTopic && (
          <section className="page-card">
            <button className="back-btn" onClick={() => goTo("theory")}>
              ← Назад к темам
            </button>

            <h2>{selectedTopic.title}</h2>
            <p className="theory-text">{selectedTopic.content}</p>

            <button
              className="primary-btn"
              onClick={() =>
                speakText(`${selectedTopic.title}. ${selectedTopic.content}`)
              }
            >
              🔊 Озвучить параграф
            </button>
          </section>
        )}

        {currentScreen === "tasks" && (
          <section className="page-card">
            <h2>Практический тренажёр по геометрии</h2>

            {filteredTasks.map((task) => (
              <div className="task-card" key={task.id}>
                <h3>{task.topic || "Геометрия 8 класс"}</h3>
                <p>{task.question}</p>

                {task.options?.map((option, index) => (
                  <button
                    className="answer-btn"
                    key={`${task.id}-${index}`}
                    onClick={() => checkAnswer(task.id, index)}
                  >
                    {index + 1}) {option}
                  </button>
                ))}

                {taskStatuses[task.id] === "success" && (
                  <p className="success-text">✓ Верно!</p>
                )}

                {taskStatuses[task.id] === "error" && (
                  <p className="error-text">✗ Неверно, попробуйте ещё раз.</p>
                )}
              </div>
            ))}
          </section>
        )}

        {currentScreen === "audio" && (
          <section className="page-card">
            <h2>Аудиоуроки по геометрии</h2>

            <div className="topic-grid">
              {filteredAudio.map((lesson) => (
                <div className="topic-card theory-card" key={lesson.id}>
                  <h3>{lesson.title}</h3>
                  <p>{lesson.text}</p>

                  <button
                    className="primary-btn"
                    onClick={() => speakText(lesson.text)}
                  >
                    🔊 Слушать
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

{currentScreen === "contacts" && !isAdmin && (
  <section className="page-card">
    <h2>{isTeacher ? "Сообщения учеников" : "Связь с учителем"}</h2>

    {isStudent && (
      <form className="message-form" onSubmit={sendMessage}>
        <label>
          Выберите учителя:
          {isMirror ? (
            <span style={{ fontWeight: "bold" }}>Выбор учителя</span>
          ) : (
            <select
              value={targetTeacher}
              onChange={(e) => setTargetTeacher(e.target.value)}
              required
            >
              <option value="">-- Выберите учителя --</option>
              {teachersList.map((t) => (
                <option key={t.email} value={t.full_name}>{t.full_name}</option>
              ))}
            </select>
          )}
        </label>

        <label>
          Ваш вопрос:
          {isMirror ? (
            <span style={{ fontWeight: "bold" }}>Поле ввода вопроса</span>
          ) : (
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Введите текст вопроса..."
              required
            />
          )}
        </label>

        {!isMirror && <button className="primary-btn" type="submit">Отправить</button>}
      </form>
    )}

    {isTeacher && (
      <label>
        Фильтр по ученику:
        <select value={selectedStudentFilter} onChange={(e) => setSelectedStudentFilter(e.target.value)}>
          <option value="">Все ученики</option>
          {studentsList.map((s) => <option key={s.id} value={s.full_name}>{s.full_name}</option>)}
        </select>
      </label>
    )}

    <div className="messages-list">
      {filteredMessages.map((msg) => (
        <div className="message-card" key={msg.id}>
          <p><b>{msg.from}:</b> {msg.text}</p>
          {msg.replies?.map((r, i) => <div key={i} className="reply-card"><b>{r.author}:</b> {r.text}</div>)}
          {isTeacher && (
            <div className="reply-row">
              <input id={`reply-${msg.id}`} placeholder="Ответ..." />
              <button onClick={() => {
                const val = document.getElementById(`reply-${msg.id}`).value;
                sendTeacherReply(msg.id, val);
              }}>Ответить</button>
            </div>
          )}
        </div>
      ))}
    </div>
  </section>
)}

        {currentScreen === "profile" && user && (
          <section className="page-card">
            <h2>
              {isAdmin
                ? "Административная панель"
                : isTeacher
                ? "Кабинет учителя" 
                : "Кабинет ученика"}
            </h2>

            <p><b>ФИО:</b> {user.full_name}</p>
            <p><b>Роль:</b> {user.role}</p>
            <p><b>Школа:</b> {user.school}</p>
            <p><b>Класс:</b> {user.student_class}</p>

            {isStudent && (
              <h3>Ваш рейтинг по заданиям: {user.score || 0} баллов</h3>
            )}

            {isTeacher && (
              <>
                <h3>Список учеников</h3>
                <table>
                  <thead>
                    <tr>
                      <th>ФИО</th>
                      <th>Класс</th>
                      <th>Баллы</th>
                      <th>Пройденные задания</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList.map((student) => (
                      <tr key={student.id}>
                        <td>{student.full_name}</td>
                        <td>{student.student_class}</td>
                        <td>{student.score}</td>
                        <td>{student.completedTasks?.length || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {isAdmin && (
              <>
                <h3>Управление пользователями</h3>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>ФИО</th>
                      <th>Email</th>
                      <th>Роль</th>
                      <th>Школа</th>
                      <th>Класс</th>
                      <th>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersDatabase.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.full_name}</td>
                        <td>{item.email}</td>
                        <td>
                          {isMirror ? (
                            <span style={{ fontWeight: "bold" }}>{item.role}</span>
                          ) : (
                            <select
                              value={item.role}
                              onChange={(event) =>
                                changeUserRole(item.id, event.target.value)
                              }
                              style={{ padding: "4px", borderRadius: "4px" }}
                            >
                              <option value="Ученик">Ученик</option>
                              <option value="Учитель">Учитель</option>
                              <option value="Администратор">Администратор</option>
                            </select>
                          )}
                        </td>
                        <td>{item.school}</td>
                        <td>{item.student_class}</td>
                        <td>
                          {item.email !== user.email && (
                            <button
                              className="danger-btn"
                              onClick={() => deleteUser(item.id)}
                            >
                              Удалить
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-content-block">
          <div className="footer-links">
            <button onClick={sharePage}>🔗 Поделиться</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(pageUrl)}`} target="_blank" rel="noreferrer">WhatsApp</a>
            <a href={`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}`} target="_blank" rel="noreferrer">Telegram</a>
            <a href="mailto:geovision8@gmail.com">Gmail</a>
          </div>
          <p className="copyright-text">© 2026 GeoVision 8 — интерактивный учебник по геометрии</p>
        </div>
        <div className="qr-code-widget">
          <QRCodeSVG value={pageUrl} size={96} />
          <small>QR: {currentScreen}</small>
        </div>
      </footer>
    </div>
  );

  return (
    <div className={`app-container ${theme} ${zoomMode ? "magnifier-active" : ""}`} style={dynamicTextStyles}>
      
      <div className="app-main-content-layer">
        {renderPageContent(false)}
      </div>

      {zoomMode && (
        <div 
          className="real-hardware-lens-circle" 
          style={{ 
            left: `${mousePos.x}px`, 
            top: `${mousePos.y}px`,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none"
          }}
        >
          <div className="lens-mirrored-content" style={magnifierContentStyle}>
            {renderPageContent(true)}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;