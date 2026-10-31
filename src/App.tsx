/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CleanChatWidget } from './components/CleanChatWidget';
import { Conversation, Message } from './types';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMongoLive, setIsMongoLive] = useState(true);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initial load
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    console.log("🔄 Initializing app...");
    try {
      // Check MongoDB status
      console.log("📡 Fetching /api/system/info...");
      const sysRes = await fetch('/api/system/info');
      console.log("📊 System info response status:", sysRes.status);
      if (!sysRes.ok) {
        throw new Error(`System info fetch failed: ${sysRes.status}`);
      }
      const sysData = await sysRes.json();
      console.log("✅ System data received:", sysData);
      setIsMongoLive(Boolean(sysData.database?.isLiveMongo));

      // Load conversations
      console.log("📡 Fetching /api/conversations...");
      const convRes = await fetch('/api/conversations');
      console.log("📊 Conversations response status:", convRes.status);
      if (!convRes.ok) {
        throw new Error(`Conversations fetch failed: ${convRes.status}`);
      }
      const convData = await convRes.json();
      console.log("✅ Conversations data:", convData);

      if (convData.conversations && convData.conversations.length > 0) {
        setConversations(convData.conversations);
        const firstId = convData.conversations[0]._id;
        setActiveConversationId(firstId);
        loadConversationMessages(firstId);
      } else {
        // Create initial conversation
        console.log("📝 No conversations found, creating new one...");
        handleCreateNewChat();
      }
    } catch (err) {
      console.error('❌ Initialization error:', err);
      // Create a new conversation even if init fails
      handleCreateNewChat();
    }
  };

  const loadConversationMessages = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setActiveConversation(data.conversation);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleCreateNewChat = async () => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'General Chat',
          personaId: 'general-assistant',
        }),
      });
      const data = await res.json();
      if (data.conversation) {
        setConversations([data.conversation]);
        setActiveConversationId(data.conversation._id);
        setActiveConversation(data.conversation);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  const handleSendMessage = async (text: string) => {
    console.log("🚀 handleSendMessage called with:", text);
    let currentId = activeConversationId;
    console.log("📝 Current conversation ID:", currentId);

    if (!currentId) {
      console.log("⚠️ No conversation ID, creating new conversation...");
      try {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: text.slice(0, 24), personaId: 'general-assistant' }),
        });
        const data = await res.json();
        currentId = data.conversation._id;
        setActiveConversationId(currentId);
        setActiveConversation(data.conversation);
        console.log("✅ New conversation created:", currentId);
      } catch (err) {
        console.error("❌ Failed to create conversation:", err);
        return;
      }
    }

    if (!currentId) return;
    console.log("📤 Sending to conversation:", currentId, "with message:", text);

    // Optimistic user message insertion
    const tempUserMsg: Message = {
      _id: `temp-user-${Date.now()}`,
      conversationId: currentId,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      tokenEstimate: Math.ceil(text.length / 4),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsStreaming(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      console.log("🌐 Fetching:", `/api/conversations/${currentId}/messages`);
      const response = await fetch(`/api/conversations/${currentId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
        signal: controller.signal,
      });

      console.log("📊 Response status:", response.status);
      if (!response.ok) {
        console.error("❌ Response not OK:", response.status);
        throw new Error(`HTTP ${response.status}`);
      }
      console.log("✅ Response OK, starting to read stream...");

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'chunk') {
                accumulated += parsed.text;
                setStreamingContent(accumulated);
              } else if (parsed.type === 'done' && parsed.message) {
                setMessages((prev) => [...prev, parsed.message]);
                setStreamingContent('');
              }
            } catch {
              // Ignore chunk parse error
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Streaming error:', err);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleClearChat = async () => {
    if (!activeConversationId) return;
    try {
      await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: 'DELETE',
      });
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  const handleSelectConversation = async (id: string) => {
    setActiveConversationId(id);
    loadConversationMessages(id);
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4 bg-[#f3efff] selection:bg-purple-200 selection:text-purple-900 relative overflow-hidden">
      {/* Background soft ambient blur circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none"></div>


      {/* Main Clean Chatbot Card */}
      <div className="relative z-10 w-full flex items-center justify-center">
        <CleanChatWidget
          conversation={activeConversation}
          conversations={conversations}
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          onNewChat={handleCreateNewChat}
          onSelectConversation={handleSelectConversation}
          isMongoLive={isMongoLive}
        />
      </div>

    </div>
  );
}
