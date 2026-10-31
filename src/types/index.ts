export interface Conversation {
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

export interface Message {
  _id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
  thinkingTimeMs?: number;
  tokenEstimate?: number;
}

export interface Persona {
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

export interface SystemInfo {
  nodeVersion: string;
  platform: string;
  uptimeSeconds: number;
  memoryUsage: {
    rssMB: number;
    heapUsedMB: number;
    heapTotalMB: number;
  };
  database: {
    databaseName: string;
    status: string;
    connectionMode?: string;
    isLiveMongo?: boolean;
    configuredUri?: string;
    collections: {
      conversations: number;
      messages: number;
      personas: number;
      logs: number;
    };
    storageSizeBytes: number;
    lastModified: string;
  };
  environmentConfig?: {
    hasGeminiApiKey: boolean;
    hasMongoUri: boolean;
    mongoUriMasked: string;
    port: number;
  };
  geminiConfigured: boolean;
}

export interface ActivityLog {
  _id: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  timestamp: string;
  details?: string;
}
