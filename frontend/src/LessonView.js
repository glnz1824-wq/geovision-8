import React, { useContext, useState } from 'react';
import { AccessibilityContext } from './AccessibilityContext';

const LessonView = ({ lesson }) => {
    // Извлекаем состояние лупы из контекста (добавьте magnifierActive в ваш AccessibilityContext, если его там еще нет)
    const { fontSize, contrastTheme, magnifierActive } = useContext(AccessibilityContext);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Функция синтеза речи для озвучивания учебника
    const toggleSpeech = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            if (!lesson || !lesson.content) return;
            
            const utterance = new SpeechSynthesisUtterance(lesson.content);
            utterance.lang = 'ru-RU'; // Читаем на русском языке
            
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            
            setIsSpeaking(true);
            window.speechSynthesis.speak(utterance);
        }
    };

    if (!lesson) {
        return <div style={{ padding: '20px' }}>Загрузка учебных материалов...</div>;
    }

    return (
        /* ВАЖНО: Динамически добавляем класс 'magnifier-active', если режим лупы включен в контексте.
          Благодаря этому CSS-правила сработают только тогда, когда пользователь активирует лупу на панели ОВЗ.
        */
        <div 
            className={`lesson-container theme-${contrastTheme} size-${fontSize} ${magnifierActive ? 'magnifier-active' : ''}`} 
            style={{ padding: '20px' }}
        >
            <h2>{lesson.title}</h2>
            
            <button 
                onClick={toggleSpeech} 
                className="audio-btn" 
                aria-label="Прослушать текст параграфа"
                style={{ padding: '12px 24px', margin: '15px 0', cursor: 'pointer', display: 'block', fontWeight: 'bold' }}
            >
                {isSpeaking ? '🛑 Остановить чтение' : '🔊 Прослушать аудио-версию'}
            </button>
            
            <div className="lesson-text" style={{ marginTop: '20px', lineHeight: '1.8' }}>
                <p>{lesson.content}</p>
            </div>

            {lesson.qr_code_url && (
                <div className="qr-section" style={{ marginTop: '30px' }}>
                    <img src={lesson.qr_code_url} alt="QR-код для быстрой мобильной навигации" style={{ maxWidth: '140px' }} />
                </div>
            )}
        </div>
    );
};

export default LessonView;