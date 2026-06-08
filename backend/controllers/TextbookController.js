import { TextbookModel } from '../models/Textbook.js';

export const getLessons = async (req, res) => {
  try {
    const data = await TextbookModel.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка Model при чтении БД' });
  }
};

export const updateLesson = async (req, res) => {
  const { key, title, content, speech_text } = req.body;
  try {
    const updated = await TextbookModel.update(key, title, content, speech_text);
    res.json({ message: 'Контент успешно обновлен через CMS!', updated });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при обновлении' });
  }
};