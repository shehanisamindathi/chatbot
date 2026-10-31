import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Server, 
  Layers, 
  Cpu, 
  RefreshCw, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  Search,
  Key,
  FileText,
  AlertCircle,
  Link,
  Code2
} from 'lucide-react';
import { SystemInfo, ActivityLog } from '../types';

interface MernInspectorProps {
  onRefreshStats: () => void;
}

export const MernInspector: React.FC<MernInspectorProps> = ({ onRefreshStats }) => {
  const [activeSubTab, setActiveSubTab] = useState<'mongo' | 'express' | 'react' | 'node'>('mongo');
  const [collectionsData, setCollectionsData] = useState<any>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>('conversations');
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // MongoDB URI live connect state
  const [mongoUriInput, setMongoUriInput] = useState('');
  const [isConnectingMongo, setIsConnectingMongo] = useState(false);
  const [connectResult, setConnectResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchInspectorData = async () => {
    setIsLoading(true);
    try {
      const [colRes, sysRes] = await Promise.all([
        fetch('/api/mongo/collections'),
        fetch('/api/system/info'),
      ]);
      const colData = await colRes.json();
      const sysData = await sysRes.json();

      setCollectionsData(colData);
      setSystemInfo(sysData);
      onRefreshStats();
    } catch (err) {
      console.error('Failed to load MERN inspector data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInspectorData();
    const interval = setInterval(fetchInspectorData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mongoUriInput.trim()) return;

    setIsConnectingMongo(true);
    setConnectResult(null);
    try {
      const res = await fetch('/api/mongo/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: mongoUriInput.trim() }),
      });
      const data = await res.json();
      setConnectResult({
        success: data.success,
        message: data.message || (data.success ? 'Successfully connected to MongoDB!' : data.error || 'Connection failed'),
      });
      fetchInspectorData();
    } catch (err: any) {
      setConnectResult({
        success: false,
        message: err.message || 'Network error connecting to MongoDB',
      });
    } finally {
      setIsConnectingMongo(false);
    }
  };

  const collections = ['conversations', 'messages', 'personas', 'logs'];
  const currentDocs = collectionsData?.[selectedCollection] || [];
  const filteredDocs = currentDocs.filter((doc: any) =>
    JSON.stringify(doc).toLowerCase().includes(searchDocQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950/70 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍃⚡⚛️🟩</span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                MERN Stack Architecture Inspector
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Live inspection of MongoDB document collections, Express REST/SSE streaming routes, React components, and Node.js process runtime.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={fetchInspectorData}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-slate-200 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh Stats</span>
            </button>
          </div>
        </div>

        {/* 4 MERN Pillars Switcher */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* M - Mongo */}
          <button
            onClick={() => setActiveSubTab('mongo')}
            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
              activeSubTab === 'mongo'
                ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                🍃 M - MongoDB
              </span>
              <span className={`w-2 h-2 rounded-full ${systemInfo?.database?.isLiveMongo ? 'bg-emerald-400 animate-ping' : 'bg-teal-400'}`}></span>
            </div>
            <div className="text-base font-bold text-white">
              {systemInfo?.database?.collections ? (
                Object.values(systemInfo.database.collections).reduce((a, b) => a + b, 0)
              ) : 0}{' '}
              <span className="text-xs font-normal text-slate-400">Documents</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">
              {systemInfo?.database?.isLiveMongo ? 'Live Atlas/Cluster' : 'Embedded Engine'}
            </div>
          </button>

          {/* E - Express */}
          <button
            onClick={() => setActiveSubTab('express')}
            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
              activeSubTab === 'express'
                ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/30'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                ⚡ E - Express.js
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            </div>
            <div className="text-base font-bold text-white">
              REST & SSE <span className="text-xs font-normal text-slate-400">Streams</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {collectionsData?.logs?.length || 0} Recorded Requests
            </div>
          </button>

          {/* R - React */}
          <button
            onClick={() => setActiveSubTab('react')}
            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
              activeSubTab === 'react'
                ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/30'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                ⚛️ R - React 19
              </span>
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            </div>
            <div className="text-base font-bold text-white">
              Client UI <span className="text-xs font-normal text-slate-400">+ Tailwind</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Component Dataflow & State</div>
          </button>

          {/* N - Node */}
          <button
            onClick={() => setActiveSubTab('node')}
            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
              activeSubTab === 'node'
                ? 'bg-green-950/40 border-green-500/60 ring-1 ring-green-500/30'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-green-400">
                🟩 N - Node.js & AI
              </span>
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
            </div>
            <div className="text-base font-bold text-white">
              {systemInfo?.nodeVersion || 'v22.x'}{' '}
              <span className="text-xs font-normal text-slate-400">Runtime</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Gemini 3.8 Flash Inference
            </div>
          </button>
        </div>

        {/* Tab 1: MongoDB Collections & Connection Manager */}
        {activeSubTab === 'mongo' && (
          <div className="space-y-5">
            {/* Live MongoDB Connection & Config Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    MongoDB Connection Status
                  </h3>
                  <p className="text-xs text-slate-400">
                    Connect to MongoDB Atlas, local MongoDB, or continue using the built-in document engine.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    systemInfo?.database?.isLiveMongo
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {systemInfo?.database?.connectionMode || 'Active'}
                  </span>
                </div>
              </div>

              {/* Connection Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Active Database</span>
                  <div className="font-mono text-white font-medium mt-0.5 truncate">
                    {systemInfo?.database?.databaseName || 'mern_chatbot_db'}
                  </div>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Configured URI</span>
                  <div className="font-mono text-emerald-400 font-medium mt-0.5 truncate" title={systemInfo?.database?.configuredUri}>
                    {systemInfo?.database?.configuredUri || 'None (Using Embedded Store)'}
                  </div>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Driver</span>
                  <div className="font-mono text-white font-medium mt-0.5">
                    Official mongodb v6.x
                  </div>
                </div>
              </div>

              {/* Dynamic Connect Form */}
              <form onSubmit={handleConnectMongo} className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Connect / Test Live MongoDB URI (Atlas or Local):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="e.g. mongodb+srv://username:password@cluster0.abc.mongodb.net/mern_chatbot"
                    value={mongoUriInput}
                    onChange={(e) => setMongoUriInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60"
                  />
                  <button
                    type="submit"
                    disabled={isConnectingMongo || !mongoUriInput.trim()}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
                  >
                    {isConnectingMongo ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Link className="w-3.5 h-3.5" />
                        <span>Connect MongoDB</span>
                      </>
                    )}
                  </button>
                </div>

                {connectResult && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 mt-2 ${
                      connectResult.success
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {connectResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{connectResult.message}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Collections Browser */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    MongoDB Document Collections
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live documents, schemas, and records.
                  </p>
                </div>

                {/* Collection selector */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {collections.map((colName) => {
                    const count = collectionsData?.[colName]?.length || 0;
                    return (
                      <button
                        key={colName}
                        onClick={() => setSelectedCollection(colName)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          selectedCollection === colName
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {colName} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Document search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search documents in '${selectedCollection}'...`}
                  value={searchDocQuery}
                  onChange={(e) => setSearchDocQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              {/* Documents List */}
              <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                {filteredDocs.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500">
                    No documents found in collection "{selectedCollection}".
                  </div>
                ) : (
                  filteredDocs.map((doc: any, idx: number) => (
                    <div
                      key={doc._id || idx}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/30 transition-all font-mono text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-850 pb-1.5">
                        <span className="text-emerald-400 font-bold">
                          _id: "{doc._id}"
                        </span>
                        <span className="text-slate-500">
                          {doc.updatedAt || doc.timestamp || 'active'}
                        </span>
                      </div>
                      <pre className="text-slate-300 overflow-x-auto text-[11px] leading-relaxed max-h-48">
                        {JSON.stringify(doc, null, 2)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Express Route Monitor */}
        {activeSubTab === 'express' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-md">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-400" />
                Express.js REST & SSE Streaming Endpoints
              </h3>
              <p className="text-xs text-slate-400">
                All backend routes registered in <code>server.ts</code> with live execution logs.
              </p>
            </div>

            {/* Endpoints Table */}
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Method</th>
                    <th className="py-2.5 px-3 font-semibold">Route Path</th>
                    <th className="py-2.5 px-3 font-semibold">Purpose</th>
                    <th className="py-2.5 px-3 font-semibold">Response Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  <tr>
                    <td className="py-2 px-3 font-mono text-emerald-400 font-bold">GET</td>
                    <td className="py-2 px-3 font-mono">/api/conversations</td>
                    <td className="py-2 px-3">Fetch conversation list</td>
                    <td className="py-2 px-3 text-slate-400">application/json</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-cyan-400 font-bold">POST</td>
                    <td className="py-2 px-3 font-mono">/api/conversations/:id/messages</td>
                    <td className="py-2 px-3">Send message & stream Gemini tokens</td>
                    <td className="py-2 px-3 text-amber-400 font-mono">text/event-stream (SSE)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-emerald-400 font-bold">GET</td>
                    <td className="py-2 px-3 font-mono">/api/personas</td>
                    <td className="py-2 px-3">List AI personas and system prompts</td>
                    <td className="py-2 px-3 text-slate-400">application/json</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-cyan-400 font-bold">POST</td>
                    <td className="py-2 px-3 font-mono">/api/mongo/connect</td>
                    <td className="py-2 px-3">Test & connect live MongoDB URI</td>
                    <td className="py-2 px-3 text-slate-400">application/json</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-rose-400 font-bold">DELETE</td>
                    <td className="py-2 px-3 font-mono">/api/conversations/:id</td>
                    <td className="py-2 px-3">Cascade delete chat and messages</td>
                    <td className="py-2 px-3 text-slate-400">application/json</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Live Request Activity Stream */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Recent Express Request Logs (Recorded in MongoDB logs collection)</span>
                <span className="text-[10px] text-slate-500">Auto-recorded via Express Middleware</span>
              </div>
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-2 font-mono text-[11px] space-y-1">
                {(collectionsData?.logs || []).slice(-15).reverse().map((log: ActivityLog) => (
                  <div key={log._id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-900">
                    <div className="flex items-center gap-2">
                      <span className={`px-1 rounded text-[10px] font-bold ${
                        log.method === 'POST' ? 'bg-cyan-500/20 text-cyan-300' :
                        log.method === 'DELETE' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {log.method}
                      </span>
                      <span className="text-slate-300">{log.path}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <span className="text-emerald-400 font-semibold">{log.status} OK</span>
                      <span>{log.durationMs}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: React Architecture & Dataflow */}
        {activeSubTab === 'react' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-md">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                React 19 Frontend Architecture & SSE Flow
              </h3>
              <p className="text-xs text-slate-400">
                How React coordinates user input, streaming tokens, and optimistic updates.
              </p>
            </div>

            {/* Visual Flow diagram */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
                <div className="text-2xl">⚛️</div>
                <div className="text-xs font-bold text-cyan-300">1. User Inputs Message</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  React app renders textarea, triggers optimistic state insertion, and sends POST request.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
                <div className="text-2xl">⚡</div>
                <div className="text-xs font-bold text-amber-300">2. Express SSE Pipeline</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Server sets <code>text/event-stream</code> headers, pulls chat history, and calls Gemini SDK.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-green-500/30 space-y-2">
                <div className="text-2xl">🟩</div>
                <div className="text-xs font-bold text-green-300">3. Node.js + Gemini 3.8</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Generates content stream with system instruction persona, emitting chunks in real time.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                <div className="text-2xl">🍃</div>
                <div className="text-xs font-bold text-emerald-300">4. MongoDB Persistence</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Atomic insertion into messages collection with token estimates and timestamp.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2 text-slate-300">
              <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                Frontend Highlights:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li>EventSource-style ReadableStream consumption with auto-scroll and cancelation.</li>
                <li>Live markdown rendering with code block syntax framing and one-click clipboard copying.</li>
                <li>Web Speech Synthesis API for audio voice playback and SpeechRecognition for voice dictation.</li>
                <li>Automatic metadata synchronization and persistence across browser sessions.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 4: Node.js Runtime, Environment & Gemini API Key */}
        {activeSubTab === 'node' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-md">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-green-400" />
                Node.js Process, Environment Variables & API Key
              </h3>
              <p className="text-xs text-slate-400">
                Runtime system metrics, heap memory allocation, and environment variable configuration.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Node.js Version</div>
                <div className="text-base font-bold text-white mt-1 font-mono">{systemInfo?.nodeVersion || 'v22.x'}</div>
                <div className="text-[10px] text-slate-400 mt-1">Platform: {systemInfo?.platform || 'linux'}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Process Uptime</div>
                <div className="text-base font-bold text-white mt-1 font-mono">
                  {systemInfo?.uptimeSeconds ? `${Math.floor(systemInfo.uptimeSeconds / 60)}m ${systemInfo.uptimeSeconds % 60}s` : 'Active'}
                </div>
                <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Healthy Process
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Heap Memory (Used/Total)</div>
                <div className="text-base font-bold text-white mt-1 font-mono">
                  {systemInfo?.memoryUsage?.heapUsedMB || 42}MB / {systemInfo?.memoryUsage?.heapTotalMB || 80}MB
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((systemInfo?.memoryUsage?.heapUsedMB || 42) /
                            (systemInfo?.memoryUsage?.heapTotalMB || 80)) *
                            100
                        )
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Environment Variables & Secrets Reference */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Environment Configuration (.env / Secrets)
              </h4>
              
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      GEMINI_API_KEY
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Server-side Gemini AI key used to stream live inference responses. Configured in AI Studio's <strong>Settings &gt; Secrets</strong> panel.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                    Active on Server
                  </span>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" />
                      MONGODB_URI
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      MongoDB connection string in <code>.env</code>. When omitted, the app smoothly uses the embedded file-backed MongoDB engine.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0">
                    {systemInfo?.environmentConfig?.hasMongoUri ? 'Configured' : 'Auto-Fallback'}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Engine Status */}
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Gemini 3.8 Flash AI Model</div>
                  <div className="text-xs text-slate-400">
                    Shared server-side client with telemetry header <code>aistudio-build</code>
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                Ready & Active
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
