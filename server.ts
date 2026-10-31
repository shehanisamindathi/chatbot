import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, ConversationDoc, MessageDoc, PersonaDoc, LogDoc } from './src/server/db.js';
import { streamGeminiResponse } from './src/server/gemini.js';
 
dotenv.config();
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
 
async function bootstrapServer() {
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) {
    await db.connectMongo(process.env.MONGODB_URI.trim());
  }
 
  const app = express();
 
  app.use(express.json({ limit: '10mb' }));
 
  // Request logging & MERN Activity monitoring
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
 
    console.log(`📨 ${req.method} ${req.path} from ${req.ip}`);
 
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`📤 ${req.method} ${req.path} - Status: ${res.statusCode} (${duration}ms)`);
      if (req.path.startsWith('/api/')) {
        try {
          db.logs.insertOne({
            _id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            durationMs: duration,
            timestamp: new Date().toISOString(),
            details: req.method !== 'GET' ? JSON.stringify(req.body).slice(0, 100) : undefined,
          });
        } catch {
          // Ignore logging errors
        }
      }
    });
 
    next();
  });
 
  // --- MERN API ENDPOINTS ---
 
  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      stack: 'MERN',
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    });
  });
 
  // System, Node, and MongoDB connection stats
  app.get('/api/system/info', async (_req: Request, res: Response) => {
    const memory = process.memoryUsage();
    const dbStats = await db.getStats();
 
    res.json({
      nodeVersion: process.version,
      platform: process.platform,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsage: {
        rssMB: Math.round(memory.rss / 1024 / 1024),
        heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
      },
      database: dbStats,
      environmentConfig: {
        hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
        hasMongoUri: Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim().length > 0),
        mongoUriMasked: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@') : '',
        port: PORT,
      },
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    });
  });
 
  // Dynamic MongoDB connection test / switch
  app.post('/api/mongo/connect', async (req: Request, res: Response) => {
    const { uri } = req.body;
    if (!uri || typeof uri !== 'string') {
      return res.status(400).json({ error: 'Valid MongoDB URI string is required' });
    }
 
    const result = await db.connectMongo(uri.trim());
    const stats = await db.getStats();
    res.json({ ...result, stats });
  });
 
  // Personas
  app.get('/api/personas', async (_req: Request, res: Response) => {
    const personas = await db.personas.find();
    res.json({ personas });
  });
 
  app.post('/api/personas', async (req: Request, res: Response) => {
    const { name, avatar, title, description, systemPrompt, starterPrompts, temperature } = req.body;
    if (!name || !systemPrompt) {
      return res.status(400).json({ error: 'Name and system prompt are required' });
    }
 
    const newPersona: PersonaDoc = {
      _id: `custom-${Date.now()}`,
      name,
      badge: 'Custom',
      avatar: avatar || '🤖',
      title: title || 'Custom Assistant',
      description: description || 'User-defined AI Persona',
      systemPrompt,
      defaultModel: 'gemini-3.8-flash',
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      starterPrompts: Array.isArray(starterPrompts) ? starterPrompts : ['Hello! What can you help me with?'],
      isCustom: true,
    };
 
    await db.personas.insertOne(newPersona);
    res.status(201).json({ persona: newPersona });
  });
 
  app.delete('/api/personas/:id', async (req: Request, res: Response) => {
    const persona = await db.personas.findOne({ _id: req.params.id });
    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }
    if (!persona.isCustom) {
      return res.status(400).json({ error: 'Built-in personas cannot be deleted' });
    }
    await db.personas.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  });
 
  // Conversations
  app.get('/api/conversations', async (_req: Request, res: Response) => {
    const all = await db.conversations.find();
    all.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    res.json({ conversations: all });
  });
 
  app.post('/api/conversations', async (req: Request, res: Response) => {
    const { title, personaId, model, temperature, tags } = req.body;
    const persona = (await db.personas.findOne({ _id: personaId })) || (await db.personas.findOne({ _id: 'mern-architect' }));
    const now = new Date().toISOString();
 
    const newConv: ConversationDoc = {
      _id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title?.trim() || 'New Discussion',
      personaId: persona?._id || 'mern-architect',
      model: model || persona?.defaultModel || 'gemini-3.8-flash',
      temperature: typeof temperature === 'number' ? temperature : (persona?.temperature ?? 0.7),
      pinned: false,
      tags: Array.isArray(tags) ? tags : ['mern'],
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    };
 
    await db.conversations.insertOne(newConv);
    res.status(201).json({ conversation: newConv });
  });
 
  app.get('/api/conversations/:id', async (req: Request, res: Response) => {
    const conv = await db.conversations.findOne({ _id: req.params.id });
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const messages = await db.messages.find({ conversationId: req.params.id });
    messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const persona = await db.personas.findOne({ _id: conv.personaId });
    res.json({ conversation: conv, messages, persona });
  });
 
  app.patch('/api/conversations/:id', async (req: Request, res: Response) => {
    const { title, pinned, tags, personaId, temperature } = req.body;
    const existing = await db.conversations.findOne({ _id: req.params.id });
    if (!existing) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
 
    const updates: Partial<ConversationDoc> = {
      updatedAt: new Date().toISOString(),
    };
    if (typeof title === 'string') updates.title = title.trim();
    if (typeof pinned === 'boolean') updates.pinned = pinned;
    if (Array.isArray(tags)) updates.tags = tags;
    if (typeof personaId === 'string') updates.personaId = personaId;
    if (typeof temperature === 'number') updates.temperature = temperature;
 
    await db.conversations.updateOne({ _id: req.params.id }, updates);
    const updated = await db.conversations.findOne({ _id: req.params.id });
    res.json({ conversation: updated });
  });
 
  app.delete('/api/conversations/:id', async (req: Request, res: Response) => {
    const conv = await db.conversations.findOne({ _id: req.params.id });
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    await db.conversations.deleteOne({ _id: req.params.id });
    const deletedMessages = await db.messages.deleteMany({ conversationId: req.params.id });
    res.json({ success: true, deletedMessagesCount: deletedMessages });
  });
 
  // Post message & stream response (Server-Sent Events)
  app.post('/api/conversations/:id/messages', async (req: Request, res: Response) => {
    const conversationId = req.params.id;
    const { content } = req.body;
 
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }
 
    const conv = await db.conversations.findOne({ _id: conversationId });
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
 
    const persona = await db.personas.findOne({ _id: conv.personaId });
    const now = new Date().toISOString();
 
    // 1. Save user message to MongoDB
    const userMsg: MessageDoc = {
      _id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      conversationId,
      role: 'user',
      content: content.trim(),
      timestamp: now,
      tokenEstimate: Math.ceil(content.length / 4),
    };
    await db.messages.insertOne(userMsg);
 
    // Auto-update conversation title if it was default
    if (conv.title === 'New Discussion' || conv.messageCount === 0) {
      const suggestedTitle = content.trim().slice(0, 32) + (content.length > 32 ? '...' : '');
      await db.conversations.updateOne({ _id: conversationId }, { title: suggestedTitle });
    }
 
    // Set up SSE response headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
 
    // Send user message confirmation
    res.write(`data: ${JSON.stringify({ type: 'user_message', message: userMsg })}\n\n`);
 
    // Retrieve previous messages for context
    const previousMessages = await db.messages.find({ conversationId });
    previousMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
 
    const history = previousMessages
      .slice(0, -1)
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
 
    const startInferenceTime = Date.now();
    let accumulatedContent = '';
 
    try {
      const stream = streamGeminiResponse({
        model: conv.model || 'gemini-3.8-flash',
        systemPrompt: persona?.systemPrompt,
        history,
        userMessage: content.trim(),
      });
 
      for await (const chunk of stream) {
        accumulatedContent += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
      }
 
      const inferenceDuration = Date.now() - startInferenceTime;
      const assistantMsg: MessageDoc = {
        _id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        conversationId,
        role: 'assistant',
        content: accumulatedContent,
        timestamp: new Date().toISOString(),
        model: conv.model || 'gemini-3.8-flash',
        thinkingTimeMs: inferenceDuration,
        tokenEstimate: Math.ceil(accumulatedContent.length / 4),
      };
 
      // 2. Save assistant message to MongoDB
      await db.messages.insertOne(assistantMsg);
 
      // Update conversation metadata
      const totalMessages = await db.messages.countDocuments({ conversationId });
      await db.conversations.updateOne(
        { _id: conversationId },
        {
          updatedAt: new Date().toISOString(),
          messageCount: totalMessages,
        }
      );
 
      res.write(`data: ${JSON.stringify({ type: 'done', message: assistantMsg })}\n\n`);
    } catch (err: any) {
      console.error('[Chat Streaming Error]:', err);
      res.write(`data: ${JSON.stringify({ type: 'error', error: err?.message || 'Streaming failed' })}\n\n`);
    } finally {
      res.end();
    }
  });
 
  // Regenerate last response
  app.post('/api/conversations/:id/regenerate', async (req: Request, res: Response) => {
    const conversationId = req.params.id;
    const conv = await db.conversations.findOne({ _id: conversationId });
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
 
    const messages = await db.messages.find({ conversationId });
    messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
 
    if (messages.length === 0) {
      return res.status(400).json({ error: 'No messages to regenerate' });
    }
 
    let lastUserMessage = '';
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'assistant') {
      await db.messages.deleteOne({ _id: lastMsg._id });
      const prevMsg = messages[messages.length - 2];
      if (prevMsg && prevMsg.role === 'user') {
        lastUserMessage = prevMsg.content;
      }
    } else if (lastMsg.role === 'user') {
      lastUserMessage = lastMsg.content;
    }
 
    if (!lastUserMessage) {
      return res.status(400).json({ error: 'No user prompt found to regenerate' });
    }
 
    const persona = await db.personas.findOne({ _id: conv.personaId });
    const currentMessages = await db.messages.find({ conversationId });
    currentMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const history = currentMessages
      .slice(0, -1)
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
 
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
 
    const startInferenceTime = Date.now();
    let accumulatedContent = '';
 
    try {
      const stream = streamGeminiResponse({
        model: conv.model || 'gemini-3.8-flash',
        systemPrompt: persona?.systemPrompt,
        history,
        userMessage: lastUserMessage,
      });
 
      for await (const chunk of stream) {
        accumulatedContent += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
      }
 
      const inferenceDuration = Date.now() - startInferenceTime;
      const assistantMsg: MessageDoc = {
        _id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        conversationId,
        role: 'assistant',
        content: accumulatedContent,
        timestamp: new Date().toISOString(),
        model: conv.model || 'gemini-3.8-flash',
        thinkingTimeMs: inferenceDuration,
        tokenEstimate: Math.ceil(accumulatedContent.length / 4),
      };
 
      await db.messages.insertOne(assistantMsg);
      const totalMessages = await db.messages.countDocuments({ conversationId });
      await db.conversations.updateOne(
        { _id: conversationId },
        {
          updatedAt: new Date().toISOString(),
          messageCount: totalMessages,
        }
      );
 
      res.write(`data: ${JSON.stringify({ type: 'done', message: assistantMsg })}\n\n`);
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err?.message || 'Streaming failed' })}\n\n`);
    } finally {
      res.end();
    }
  });
 
  // MongoDB Inspector Endpoints
  app.get('/api/mongo/collections', async (_req: Request, res: Response) => {
    const all = await db.getAllCollections();
    res.json(all);
  });
 
  app.delete('/api/conversations/:id/messages', async (req: Request, res: Response) => {
    const deleted = await db.messages.deleteMany({ conversationId: req.params.id });
    await db.conversations.updateOne({ _id: req.params.id }, { messageCount: 0, updatedAt: new Date().toISOString() });
    res.json({ success: true, count: deleted });
  });
 
  // Code ZIP Download Endpoint (disabled - zip file not present)
  // app.get('/api/download-zip', (_req: Request, res: Response) => {
  //   const zipPath = path.resolve(__dirname, 'public', 'mern-chatbot-project.zip');
  //   res.setHeader('Content-Type', 'application/zip');
  //   res.setHeader('Content-Disposition', 'attachment; filename="mern-chatbot-project.zip"');
  //   res.sendFile(zipPath);
  // });
 
  // --- VITE / CLIENT INTEGRATION ---
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // HMR off + ignore DB files: stops the endless page-reload loop locally.
        hmr: false,
        watch: {
          ignored: ['**/*.json', '**/data/**', '**/db/**', '**/.data/**', '**/node_modules/**'],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }
 
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [MERN Server] Express & Node.js backend running at http://0.0.0.0:${PORT}`);
    console.log(`🍃 [MongoDB Driver] Initialized with official mongodb driver & local fallback store`);
    console.log(`✨ [Gemini Engine] Powered by Gemini 3.8 Flash`);
  });
}
 
bootstrapServer().catch((err) => {
  console.error('Fatal error starting MERN server:', err);
  process.exit(1);
});
 