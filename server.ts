import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory for backend file-based database
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

function ensureDbExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(
        {
          habits: null,
          records: {},
          weeklyReviews: {},
          lastUpdated: new Date().toISOString(),
        },
        null,
        2
      )
    );
  }
}

function readDb() {
  ensureDbExists();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read db file:', err);
    return { habits: null, records: {}, weeklyReviews: {} };
  }
}

function writeDb(data: any) {
  ensureDbExists();
  try {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({ ...data, lastUpdated: new Date().toISOString() }, null, 2)
    );
  } catch (err) {
    console.error('Failed to write db file:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Backend Database API Endpoints
  app.get('/api/db', (_req, res) => {
    const data = readDb();
    res.json(data);
  });

  app.post('/api/sync', (req, res) => {
    try {
      const { habits, records, weeklyReviews } = req.body;
      const current = readDb();
      const updated = {
        habits: habits || current.habits,
        records: { ...current.records, ...(records || {}) },
        weeklyReviews: { ...current.weeklyReviews, ...(weeklyReviews || {}) },
      };
      writeDb(updated);
      res.json({ success: true, count: Object.keys(updated.records).length });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Sync failed' });
    }
  });

  app.post('/api/record', (req, res) => {
    try {
      const record = req.body;
      if (!record || !record.date) {
        return res.status(400).json({ error: 'Missing record date' });
      }
      const current = readDb();
      current.records[record.date] = record;
      writeDb(current);
      res.json({ success: true, date: record.date });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API endpoint for AI Coach Weekly/Monthly Report Review
  app.post('/api/ai-report', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY 未配置，无法调用云端 AI 分析。系统已自动生成本地智能复盘建议。',
        });
      }

      const { reportType, periodTitle, stats, habits, reflection } = req.body;
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `你是一位专业且温暖的个人成长与习惯养成教练。请针对用户的${reportType === 'weekly' ? '周报' : '月度总结'}打卡数据（重点是日常锻炼和读书计划）进行深度复盘与点评。
时间周期：${periodTitle}

核心统计数据：
- 综合打卡完成率：${stats?.completionRate ?? 0}%
- 连续打卡天数：${stats?.streak ?? 0} 天
- 锻炼统计：累计 ${stats?.totalExerciseMinutes ?? 0} 分钟，达标 ${stats?.exerciseDays ?? 0} 天
- 读书统计：累计 ${stats?.totalReadingMinutes ?? 0} 分钟，累计阅读 ${stats?.totalReadingPages ?? 0} 页，达标 ${stats?.readingDays ?? 0} 天
- 用户本期自我感受与反思：${reflection || '（未填写）'}

具体打卡细节与项目：
${JSON.stringify(habits, null, 2)}

请生成一份条理分明、鼓舞人心且具备实操价值的复盘分析（约350~500字）。请包含以下四个部分，使用清晰的 Markdown 格式输出：
### 🌟 亮点与成就（真诚肯定用户在运动与阅读上坚持的付出）
### 📈 习惯节奏洞察（基于锻炼时长、阅读页数和打卡周期的规律分析）
### 💡 科学优化建议（针对未达标或精力波动的科学改进方案，如微习惯法、环境提示、番茄工作法等）
### 🚀 下一阶段聚焦行动（2-3个清晰、门槛低且能即刻开始的具体行动）

注意：语气积极、专业、真诚，排版呼吸感好，不要出现机器人口吻。`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return res.json({ text: response.text });
    } catch (err: any) {
      console.error('Error generating AI review:', err);
      return res.status(500).json({
        error: err.message || '生成失败，请稍后重试',
      });
    }
  });

  // Healthcheck endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
