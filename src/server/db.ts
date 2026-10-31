import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { MongoClient, Db } from 'mongodb';

dotenv.config();

export interface ConversationDoc {
  _id: string;
  title: string;
  personaId: string;
  model: string;
  temperature: number;
  systemPrompt?: string;
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface MessageDoc {
  _id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
  thinkingTimeMs?: number;
  tokenEstimate?: number;
}

export interface PersonaDoc {
  _id: string;
  name: string;
  badge: string;
  avatar: string;
  title: string;
  description: string;
  systemPrompt: string;
  defaultModel: string;
  temperature: number;
  starterPrompts: string[];
  isCustom?: boolean;
}

export interface LogDoc {
  _id: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  timestamp: string;
  details?: string;
}

interface DatabaseSchema {
  conversations: ConversationDoc[];
  messages: MessageDoc[];
  personas: PersonaDoc[];
  logs: LogDoc[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'mongodb_store.json');

const INITIAL_PERSONAS: PersonaDoc[] = [
  {
    _id: 'mern-architect',
    name: 'MERN Architect',
    badge: 'MERN Pro',
    avatar: '🍃',
    title: 'Senior MERN Full-Stack Engineer',
    description: 'Expert in MongoDB aggregation, Express middleware, React 19 concurrent features, and Node.js microservices.',
    systemPrompt: `You are a world-class senior MERN Stack Architect (MongoDB, Express.js, React 19, Node.js). 
Provide direct, highly accurate, production-ready code examples, architecture patterns, and debugging guidance. 
Whenever discussing databases, explain MongoDB queries, indexing, and schema design. 
For backend, highlight robust Express routes and middleware. 
For frontend, leverage modern React 19 hooks and clean Tailwind styling. 
Format code blocks clearly with the proper language tag.`,
    defaultModel: 'gemini-3.8-flash',
    temperature: 0.7,
    starterPrompts: [
      'How do I implement indexing in MongoDB for high-throughput chat messages?',
      'Show me a clean Express controller pattern with async error handling',
      'How to connect React 19 to an Express Server-Sent Events (SSE) stream?',
      'Design a scalable MERN database schema for an AI workspace'
    ]
  },
  {
    _id: 'general-assistant',
    name: 'Nova AI',
    badge: 'Versatile',
    avatar: '✨',
    title: 'Adaptive Intelligent Assistant',
    description: 'Thoughtful, creative, and articulate partner for problem solving, writing, analysis, and ideation.',
    systemPrompt: `You are Nova, an exceptionally capable and articulate AI assistant. 
You provide structured, insightful, and helpful answers across science, technology, creative arts, and philosophy. 
Structure long explanations with clear markdown headers and bullet points.`,
    defaultModel: 'gemini-3.8-flash',
    temperature: 0.8,
    starterPrompts: [
      'Summarize the core architectural benefits of document vs relational databases',
      'Help me draft a compelling product launch email for a developer tool',
      'Explain quantum computing algorithms in intuitive terms',
      'Critique my startup value proposition for real-time collaborative apps'
    ]
  },
  {
    _id: 'code-debugger',
    name: 'Bug Hunter',
    badge: 'Debugger',
    avatar: '⚡',
    title: 'Full-Stack Debugger & Optimizer',
    description: 'Specialist in dissecting stack traces, resolving memory leaks, race conditions, and CORS issues.',
    systemPrompt: `You are Bug Hunter, an elite code debugging specialist. 
When given code or an error message, immediately diagnose the root cause, explain why it happens, provide the fixed code, and highlight prevention strategies (linting, tests, types).`,
    defaultModel: 'gemini-3.8-flash',
    temperature: 0.3,
    starterPrompts: [
      'Why is my Express route hanging when an unhandled promise rejection occurs?',
      'Fix CORS error between React client on port 3000 and Express API',
      'Diagnose MongoDB connection pool exhaustion in high-concurrency Node.js',
      'Prevent React useEffect infinite re-render loops with dependencies'
    ]
  },
  {
    _id: 'api-designer',
    name: 'API Craftsman',
    badge: 'API & REST',
    avatar: '🔌',
    title: 'REST, GraphQL & Webhook Specialist',
    description: 'Specializes in designing robust API contracts, JWT auth, rate limiting, and SSE streams.',
    systemPrompt: `You are an API architecture specialist. You excel in RESTful design conventions, idempotent requests, JWT/session authentication, security headers, rate limiting, and event streaming.`,
    defaultModel: 'gemini-3.8-flash',
    temperature: 0.5,
    starterPrompts: [
      'Write an Express rate-limiting middleware using token bucket algorithm',
      'Design secure JWT authentication with refresh tokens in HttpOnly cookies',
      'How to structure SSE (Server-Sent Events) in Node.js with auto-reconnection',
      'Create an API spec for bulk document processing in MongoDB'
    ]
  }
];

class MongoEngine {
  private localData: DatabaseSchema;
  private mongoClient: MongoClient | null = null;
  private mongoDb: Db | null = null;
  private isConnectedToLiveMongo = false;
  private connectionError: string | null = null;
  private activeUri: string | null = null;

  constructor() {
    this.localData = this.loadLocal();
    this.seedDefaultLocalData();
    // Attempt connecting to MongoDB if URI is configured in environment
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) {
      this.connectMongo(process.env.MONGODB_URI.trim()).catch((err) => {
        console.warn('[MongoDB Connect Error]:', err.message);
      });
    }
  }

  public async connectMongo(uri: string): Promise<{ success: boolean; message: string }> {
    try {
      this.connectionError = null;
      this.activeUri = uri;

      if (this.mongoClient) {
        await this.mongoClient.close().catch(() => {});
      }

      console.log('[MongoDB] Connecting to:', uri.replace(/:([^@]+)@/, ':****@'));
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });

      await client.connect();
      // Test ping command
      await client.db().command({ ping: 1 });

      this.mongoClient = client;
      this.mongoDb = client.db();
      this.isConnectedToLiveMongo = true;
      console.log(`🍃 [MongoDB] Successfully connected to live database: "${this.mongoDb.databaseName}"`);

      // Seed default personas in live MongoDB if needed
      const personasCount = await this.mongoDb.collection('personas').countDocuments();
      if (personasCount === 0) {
        await this.mongoDb.collection('personas').insertMany(INITIAL_PERSONAS as any[]);
      }

      return { success: true, message: `Connected to MongoDB database "${this.mongoDb.databaseName}"` };
    } catch (err: any) {
      this.isConnectedToLiveMongo = false;
      this.connectionError = err.message || 'Failed to connect to MongoDB instance';
      console.warn(`[MongoDB Warning] Live connection failed (${this.connectionError}). Falling back to local document engine.`);
      return { success: false, message: this.connectionError || 'Failed to connect to MongoDB instance' };
    }
  }

  private loadLocal(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[MongoDB Engine] Initializing fresh local store:', err);
    }

    return {
      conversations: [],
      messages: [],
      personas: [],
      logs: []
    };
  }

  private saveLocal(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.localData, null, 2), 'utf-8');
    } catch (err) {
      console.error('[MongoDB Engine] Failed to save local store:', err);
    }
  }

  private seedDefaultLocalData(): void {
    if (!this.localData.personas || this.localData.personas.length === 0) {
      this.localData.personas = [...INITIAL_PERSONAS];
      this.saveLocal();
    } else {
      for (const p of INITIAL_PERSONAS) {
        if (!this.localData.personas.find(existing => existing._id === p._id)) {
          this.localData.personas.push(p);
        }
      }
      this.saveLocal();
    }

    if (!this.localData.conversations || this.localData.conversations.length === 0) {
      const now = new Date().toISOString();
      const initialConvId = 'welcome-mern-conv';
      
      const welcomeConv: ConversationDoc = {
        _id: initialConvId,
        title: 'Welcome to MERN ChatBot Pro',
        personaId: 'mern-architect',
        model: 'gemini-3.8-flash',
        temperature: 0.7,
        pinned: true,
        tags: ['welcome', 'mern-stack', 'gemini-ai'],
        createdAt: now,
        updatedAt: now,
        messageCount: 2
      };

      const welcomeUserMsg: MessageDoc = {
        _id: 'msg-welcome-1',
        conversationId: initialConvId,
        role: 'user',
        content: 'Hi! Can you explain how the MERN stack is used in this chatbot?',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        tokenEstimate: 16
      };

      const welcomeBotMsg: MessageDoc = {
        _id: 'msg-welcome-2',
        conversationId: initialConvId,
        role: 'assistant',
        content: `### Welcome to **MERN ChatBot Pro**! 🍃⚡⚛️🟩

This application is an end-to-end full-stack AI chatbot built using the **MERN** architecture:

1. **🍃 M - MongoDB Document Store**
   - Live document collections: \`conversations\`, \`messages\`, \`personas\`, and \`logs\`.
   - Supports both native live **MongoDB Atlas / Local instance** connections and our high-speed embedded document engine.
   - Inspect collections, run queries, and test connection strings live in the **MERN Inspector**.

2. **⚡ E - Express.js REST & SSE Backend**
   - High-throughput REST API routes (\`/api/conversations\`, \`/api/personas\`, \`/api/mongo\`).
   - Server-Sent Events (SSE) streaming for real-time word-by-word Gemini AI responses.

3. **⚛️ R - React 19 Frontend**
   - Interactive, sleek UI styled with Tailwind CSS.
   - Live streaming Markdown renderer with syntax-highlighted code blocks, copy actions, voice speech, and responsive drawer navigation.

4. **🟩 N - Node.js & Gemini 3.8 Flash**
   - Server-side AI intelligence powered by the modern \`@google/genai\` TypeScript SDK.
   - Low-latency inference, multi-turn context retention, and customizable AI personas.

Try asking me any coding challenge, architectural question, or MongoDB query! You can also check the **MERN Inspector** in the top navigation to view the live database and API metrics.`,
        timestamp: now,
        model: 'gemini-3.8-flash',
        thinkingTimeMs: 420,
        tokenEstimate: 210
      };

      this.localData.conversations = [welcomeConv];
      this.localData.messages = [welcomeUserMsg, welcomeBotMsg];
      this.saveLocal();
    }
  }

  // --- COLLECTION ACCESSORS ---

  get conversations() {
    return {
      find: async (filter?: any): Promise<ConversationDoc[]> => {
        if (this.isConnectedToLiveMongo && this.mongoDb) {
          const query = filter || {};
          return (await this.mongoDb.collection('conversations').find(query).toArray()) as any;
        }
        const data = this.localData.conversations;
        if (!filter) return [...data];
        return data.filter(item => {
          for (const key of Object.keys(filter)) {
            if ((item as any)[key] !== filter[key]) return false;
          }
          return true;
        });
      },
      findOne: async (filter: any): Promise<ConversationDoc | null> => {
        if (this.isConnectedToLiveMongo && this.mongoDb) {
          return (await this.mongoDb.collection('conversations').findOne(filter)) as any;
        }
        const items = await this.conversations.find(filter);
        return items.length > 0 ? items[0] : null;
      },
      insertOne: async (doc: ConversationDoc): Promise<ConversationDoc> => {
        if (this.isConnectedToLiveMongo && this.mongoDb) {
          await this.mongoDb.collection('conversations').insertOne(doc as any);
        }
        this.localData.conversations.push(doc);
        this.saveLocal();
        return doc;
      },
      updateOne: async (filter: any, updates: Partial<ConversationDoc>): Promise<boolean> => {
        if (this.isConnectedToLiveMongo && this.mongoDb) {
          await this.mongoDb.collection('conversations').updateOne(filter, { $set: updates });
        }
        const index = this.localData.conversations.findIndex(c => c._id === filter._id);
        if (index !== -1) {
          this.localData.conversations[index] = { ...this.localData.conversations[index], ...updates };
          this.saveLocal();
          return true;
        }
        return false;
      },
      deleteOne: async (filter: any): Promise<boolean> => {
        if (this.isConnectedToLiveMongo && this.mongoDb) {
          await this.mongoDb.collection('conversations').deleteOne(filter);
        }
        const index = this.localData.conversations.findIndex(c => c._id === filter._id);
        if (index !== -1) {
          this.localData.conversations.splice(index, 1);
          this.saveLocal();
          return true;
        }
        return false;
      },
      countDocuments: async (filter?: any): Promise<number> => {
        if (this.isConnectedToLiveMongo && this.mongoDb) {
          return await this.mongoDb.collection('conversations').countDocuments(filter || {});
        }
        return (await this.conversations.find(filter)).length;
      }
    };
  }

  get messages() {
    return {
      find: async (filter?: any): Promise<MessageDoc[]> => {
        if (this.isConnectedToLiveMongo && this.mongoDb) {
          const query = filter || {};
          return (await this.mongoDb.collection('messages').find(query).toArray()) as any;
        }
        const data = this.localData.messages;
        if (!filter) return [...data];
        return data.filter(item => {
          for (const key of Object.keys(filter)) {
            if ((item as any)[key] !== filter[key]) return false;
          }
          return true;
        });
      },
      insertOne: async (doc: MessageDoc): Promise<MessageDoc> => {
        if (this.isConnectedToLiveMongo && this.mongoDb) {
          await this.mongoDb.collection('messages').insertOne(doc as any);
        }
        this.localData.messages.push(doc);
        this.saveLocal();
        return doc;
      },
      deleteOne: async (filter: any): Promise<boolean> => {
        if (this.isConnectedToLiveMongo && this.mongoDb) {
          await this.mongoDb.collection('messages').deleteOne(filter);
        }
        const idx = this.localData.messages.findIndex(m => m._id === filter._id);
        if (idx !== -1) {
          this.localData.messages.splice(idx, 1);
          this.saveLocal();
          return true;
        }
        return false;
      },
      deleteMany: async (filter: any): Promise<number> => {
        if (this.isConnectedToLiveMongo && this.mongoDb) {
          const res = await this.mongoDb.collection('messages').deleteMany(filter);
          return res.deletedCount;
        }
        const initialLen = this.localData.messages.length;
        this.localData.messages = this.localData.messages.filter(m => m.conversationId !== filter.conversationId);
        const removed = initialLen - this.localData.messages.length;
        if (removed > 0) this.saveLocal();
        return removed;
      },
      countDocuments: async (filter?: any): Promise<number> => {
        if (this.isConnectedToLiveMongo && this.mongoDb) {
          return await this.mongoDb.collection('messages').countDocuments(filter || {});
        }
        return (await this.messages.find(filter)).length;
      }
    };
  }

  get personas() {
    return {
      find: async (): Promise<PersonaDoc[]> => {
        if (this.isConnectedToLiveMongo && this.mongoDb) {
          return (await this.mongoDb.collection('personas').find().toArray()) as any;
        }
        return [...this.localData.personas];
      },
      findOne: async (filter: any): Promise<PersonaDoc | null> => {
        if (this.isConnectedToLiveMongo && this.mongoDb) {
          return (await this.mongoDb.collection('personas').findOne(filter)) as any;
        }
        const match = this.localData.personas.find(p => p._id === filter._id);
        return match || null;
      },
      insertOne: async (doc: PersonaDoc): Promise<PersonaDoc> => {
        if (this.isConnectedToLiveMongo && this.mongoDb) {
          await this.mongoDb.collection('personas').insertOne(doc as any);
        }
        this.localData.personas.push(doc);
        this.saveLocal();
        return doc;
      },
      deleteOne: async (filter: any): Promise<boolean> => {
        if (this.isConnectedToLiveMongo && this.mongoDb) {
          await this.mongoDb.collection('personas').deleteOne(filter);
        }
        const idx = this.localData.personas.findIndex(p => p._id === filter._id);
        if (idx !== -1) {
          this.localData.personas.splice(idx, 1);
          this.saveLocal();
          return true;
        }
        return false;
      }
    };
  }

  get logs() {
    return {
      find: async (): Promise<LogDoc[]> => {
        if (this.isConnectedToLiveMongo && this.mongoDb) {
          return (await this.mongoDb.collection('logs').find().sort({ timestamp: -1 }).limit(50).toArray()) as any;
        }
        return this.localData.logs.slice(-50);
      },
      insertOne: (doc: LogDoc): LogDoc => {
        if (this.isConnectedToLiveMongo && this.mongoDb) {
          this.mongoDb.collection('logs').insertOne(doc as any).catch(() => {});
        }
        this.localData.logs.push(doc);
        if (this.localData.logs.length > 200) {
          this.localData.logs = this.localData.logs.slice(-100);
        }
        this.saveLocal();
        return doc;
      }
    };
  }

  async getStats() {
    let mode = 'Local Embedded Engine';
    let dbName = 'mern_chatbot_local';

    if (this.isConnectedToLiveMongo && this.mongoDb) {
      mode = 'Live MongoDB Instance (Connected)';
      dbName = this.mongoDb.databaseName;
    } else if (this.connectionError) {
      mode = `Fallback Local Engine (Connect issue: ${this.connectionError})`;
    }

    const conversationsCount = await this.conversations.countDocuments();
    const messagesCount = await this.messages.countDocuments();
    const personasCount = (await this.personas.find()).length;
    const logsCount = (await this.logs.find()).length;

    return {
      databaseName: dbName,
      status: this.isConnectedToLiveMongo ? 'Live Connected' : 'Local Connected',
      connectionMode: mode,
      isLiveMongo: this.isConnectedToLiveMongo,
      configuredUri: this.activeUri ? this.activeUri.replace(/:([^@]+)@/, ':****@') : 'Not Set (using local)',
      collections: {
        conversations: conversationsCount,
        messages: messagesCount,
        personas: personasCount,
        logs: logsCount
      },
      storageSizeBytes: fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE).size : 0,
      lastModified: fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE).mtime.toISOString() : new Date().toISOString()
    };
  }

  async getAllCollections() {
    return {
      conversations: await this.conversations.find(),
      messages: await this.messages.find(),
      personas: await this.personas.find(),
      logs: await this.logs.find()
    };
  }
}

export const db = new MongoEngine();
