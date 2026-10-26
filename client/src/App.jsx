import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import StagePanel from './components/StagePanel.jsx';
import RightDrawer from './components/RightDrawer.jsx';
import WorldForgeModal from './components/WorldForgeModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import PersonaModal from './components/PersonaModal.jsx';
import { parseRoleplayBlocks } from './utils/parseRoleplayBlocks.js';
import {
  getActiveProvider,
  getStoredApiKeys,
  getStoredModels,
  getStoredSamplers,
  getStoredSummaryConfig,
  getStoredCustomProxyUrl,
} from './utils/storage.js';

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [worldState, setWorldState] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const abortControllerRef = useRef(null);

  // Modals & Drawers visibility
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [isLeftPanelOpenMobile, setIsLeftPanelOpenMobile] = useState(false);
  const [isWorldForgeOpen, setIsWorldForgeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [quickInputMove, setQuickInputMove] = useState('');
  const [keyUpdateTick, setKeyUpdateTick] = useState(0);

  // Recomputed every render (or on keyUpdateTick bump) so status pill reacts
  const _provider = getActiveProvider();
  const _keys = getStoredApiKeys();
  const isApiKeyConnected = _provider === 'custom' || Boolean(_keys[_provider]?.trim());

  // 1. Fetch sessions on initial mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      const safeData = Array.isArray(data) ? data : [];
      setSessions(safeData);

      if (safeData.length > 0) {
        loadSession(safeData[0]._id);
      } else {
        setCurrentSessionId(null);
        setCurrentSession(null);
        setWorldState(null);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setSessions([]);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const loadSession = async (id) => {
    setIsLoadingSession(true);
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) throw new Error('Session not found');
      const data = await res.json();
      setCurrentSessionId(data.session._id);
      setCurrentSession(data.session);
      setWorldState(data.worldState);
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleCreateSession = async (title) => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      setSessions((prev) => [data.session, ...prev]);
      setCurrentSessionId(data.session._id);
      setCurrentSession(data.session);
      setWorldState(data.worldState);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleForgeRealm = async (forgePayload) => {
    try {
      const res = await fetch('/api/sessions/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forgePayload),
      });
      if (!res.ok) throw new Error('Failed to forge realm');
      const data = await res.json();
      setSessions((prev) => [data.session, ...prev]);
      setCurrentSessionId(data.session._id);
      setCurrentSession(data.session);
      setWorldState(data.worldState);

      const provider = getActiveProvider();
      const apiKeys = getStoredApiKeys();
      const hasKey = Boolean(apiKeys[provider]?.trim());

      if (hasKey && data.spawnPrompt) {
        // Trigger first roleplay turn
        handleSendMessage(data.spawnPrompt, false, data.session);
      } else if (data.spawnPrompt) {
        setQuickInputMove(data.spawnPrompt);
      }
    } catch (err) {
      console.error('Forge realm error:', err);
      alert(`Error forging world: ${err.message}`);
    }
  };

  const handleDeleteSession = async (id) => {
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      const remaining = sessions.filter((s) => s._id !== id);
      setSessions(remaining);
      if (remaining.length > 0) {
        loadSession(remaining[0]._id);
      } else {
        setCurrentSessionId(null);
        setCurrentSession(null);
        setWorldState(null);
        setIsWorldForgeOpen(true);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleClearAllData = async () => {
    try {
      for (const s of sessions) {
        await fetch(`/api/sessions/${s._id}`, { method: 'DELETE' });
      }
      setSessions([]);
      setCurrentSessionId(null);
      setCurrentSession(null);
      setWorldState(null);
      setIsWorldForgeOpen(true);
    } catch (e) {
      console.error('Failed to clear data:', e);
    }
  };

  // 2. Handle SSE Chat Message & Streaming
  const handleSendMessage = async (userMessage, isReroll = false, targetSession = null) => {
    const activeSession = targetSession || currentSession;
    const activeSessionId = activeSession?._id || currentSessionId;
    if (!activeSessionId || isStreaming) return;

    setIsStreaming(true);
    setStreamingContent('');

    // Optimistically add user turn to local UI if not rerolling
    if (!isReroll && userMessage) {
      setCurrentSession((prev) => {
        const base = prev?._id === activeSessionId ? prev : activeSession;
        return {
          ...base,
          messages: [
            ...(base?.messages || []),
            { role: 'user', rawContent: userMessage, timestamp: new Date() },
          ],
        };
      });
    }

    const provider = getActiveProvider();
    const apiKeys = getStoredApiKeys();
    const models = getStoredModels();
    const samplers = getStoredSamplers();
    const summaryConfig = getStoredSummaryConfig();

    const apiKey = apiKeys[provider] || '';
    const model = models[provider] || '';

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/roleplay/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-provider': provider,
          'x-model': model,
          'x-custom-proxy-url': getStoredCustomProxyUrl(),
          'x-summary-api-key': summaryConfig?.apiKey || apiKey,
          'x-summary-provider': summaryConfig?.provider || 'openai',
          'x-summary-model': summaryConfig?.model || 'gpt-4o-mini',
        },
        body: JSON.stringify({
          sessionId: activeSessionId,
          userMessage: isReroll ? null : userMessage,
          reroll: isReroll,
          samplers,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`Chat API error: ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));

            if (data.error) {
              console.warn('[SSE Error]', data);
              alert(data.message || data.error);
              setIsStreaming(false);
              setStreamingContent('');
              return;
            }

            if (data.token) {
              accumulatedContent += data.token;
              setStreamingContent(accumulatedContent);

              const { stateUpdate: liveState } = parseRoleplayBlocks(accumulatedContent);
              if (liveState && typeof liveState === 'object') {
                setWorldState((prev) => ({ ...prev, ...liveState }));
              }
            }

            if (data.done) {
              if (data.worldState) {
                setWorldState(data.worldState);
              }

              setCurrentSession((prev) => {
                const base = prev?._id === activeSessionId ? prev : activeSession;
                const msgs = [...(base?.messages || [])];
                if (isReroll && msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
                  const last = msgs[msgs.length - 1];
                  msgs[msgs.length - 1] = {
                    ...last,
                    rawContent: data.fullContent || accumulatedContent,
                    timestamp: new Date(),
                  };
                } else {
                  msgs.push({
                    role: 'assistant',
                    rawContent: data.fullContent || accumulatedContent,
                    timestamp: new Date(),
                    _id: data.messageId,
                  });
                }
                return { ...base, messages: msgs };
              });
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Streaming error:', err);
        alert(`Roleplay generation error: ${err.message}`);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
      refreshSessionData(activeSessionId);
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setStreamingContent('');
  };

  const handleRegenerateTurn = () => {
    if (isStreaming) return;
    handleSendMessage(null, true);
  };

  const handleEditMessage = async (index, newContent) => {
    try {
      const res = await fetch(`/api/sessions/${currentSessionId}/messages/${index}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawContent: newContent, truncateBelow: true }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedList = data.messages || [];
        setCurrentSession((prev) => ({
          ...prev,
          messages: updatedList,
        }));

        // If the edited turn is a user turn, immediately regenerate the associated assistant response!
        if (data.isUser) {
          handleSendMessage(null, false);
        } else {
          // If the edited turn was an assistant turn, all subsequent turns below are deleted,
          // and we refresh the session state to preserve the edited assistant turn.
          refreshSessionData(currentSessionId);
        }
      }
    } catch (err) {
      console.error('Failed to edit turn:', err);
    }
  };

  const handleDeleteMessage = async (index) => {
    try {
      const res = await fetch(`/api/sessions/${currentSessionId}/messages/${index}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCurrentSession((prev) => {
          const msgs = [...prev.messages];
          msgs.splice(index, 1);
          return { ...prev, messages: msgs };
        });
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleTriggerCompaction = async () => {
    const summaryConfig = getStoredSummaryConfig();
    const primaryProvider = getActiveProvider();
    const primaryKeys = getStoredApiKeys();
    const primaryModels = getStoredModels();

    // Use dedicated summarizer key if provided; otherwise seamlessly fallback to primary roleplay API & model
    const hasDedicatedKey = Boolean(summaryConfig?.apiKey && summaryConfig.apiKey.trim());
    const effectiveProvider = hasDedicatedKey ? summaryConfig.provider : primaryProvider;
    const effectiveApiKey = hasDedicatedKey ? summaryConfig.apiKey.trim() : (primaryKeys[primaryProvider] || '').trim();
    const effectiveModel = hasDedicatedKey
      ? summaryConfig.model
      : (primaryModels[primaryProvider] || (primaryProvider === 'gemini' ? 'gemini-1.5-flash' : primaryProvider === 'anthropic' ? 'claude-3-5-haiku-20241022' : 'gpt-4o-mini'));
    const effectiveCustomBaseUrl = getStoredCustomProxyUrl();

    if (effectiveProvider !== 'custom' && !effectiveApiKey) {
      throw new Error('No API key available for compaction. Please connect an API key in BYOK Settings.');
    }

    const res = await fetch(`/api/sessions/${currentSessionId}/compact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summaryApiConfig: {
          provider: effectiveProvider,
          apiKey: effectiveApiKey,
          model: effectiveModel,
          customBaseUrl: effectiveCustomBaseUrl,
        }
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Compaction failed');
    }
    const data = await res.json();
    setCurrentSession((prev) => ({
      ...prev,
      rollingSummary: data.rollingSummary,
      lastSummarizedIndex: data.lastSummarizedIndex,
    }));
    refreshSessionData(currentSessionId);
  };

  const handleAddPinnedMemory = async (memoryText) => {
    try {
      const res = await fetch(`/api/sessions/${currentSessionId}/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory: memoryText }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentSession((prev) => ({ ...prev, pinnedMemories: data.pinnedMemories }));
      }
    } catch (err) {
      console.error('Failed to pin memory:', err);
    }
  };

  const handleDeletePinnedMemory = async (memIndex) => {
    try {
      const res = await fetch(`/api/sessions/${currentSessionId}/memories/${memIndex}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentSession((prev) => ({ ...prev, pinnedMemories: data.pinnedMemories }));
      }
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  const handleUpdateWorldState = async (updatedFields) => {
    try {
      const res = await fetch(`/api/world-state/${currentSessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      const data = await res.json();
      setWorldState(data);
    } catch (err) {
      console.error('Failed to update world state:', err);
    }
  };

  const handleSaveSessionSettings = async (settings) => {
    try {
      const res = await fetch(`/api/sessions/${currentSessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      setCurrentSession((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Failed to save session settings:', err);
    }
  };

  const refreshSessionData = async (id) => {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentSession(data.session);
        setWorldState(data.worldState);
      }
    } catch (err) {}
  };

  const handleInjectMove = (actionText) => {
    setQuickInputMove(actionText);
    setTimeout(() => setQuickInputMove(''), 100);
  };

  return (
    <div className="h-screen h-[100dvh] w-screen max-w-full flex flex-col bg-[#060912] text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        sessions={sessions}
        currentSessionId={currentSessionId}
        currentUniverse={worldState?.universe}
        onSelectSession={loadSession}
        onOpenWorldForge={() => setIsWorldForgeOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
        onDeleteSession={handleDeleteSession}
        onToggleRightDrawer={() => setIsRightDrawerOpen(!isRightDrawerOpen)}
        onToggleLeftPanel={() => setIsLeftPanelOpenMobile(!isLeftPanelOpenMobile)}
        isRightDrawerOpen={isRightDrawerOpen}
        keyTick={keyUpdateTick}
        currentSceneContext={{
          narration: streamingContent || (currentSession?.messages?.length > 0 ? currentSession.messages[currentSession.messages.length - 1].rawContent : ''),
          location: worldState?.currentLocation || '',
          weather: worldState?.weather || '',
          universe: worldState?.universe || '',
        }}
      />

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: World, Timeline & Tracker */}
        <LeftPanel
          worldState={worldState}
          rollingSummary={currentSession?.rollingSummary}
          totalUserTurns={(currentSession?.messages || []).filter((m) => m.role === 'user').length}
          summarizedUserTurns={(currentSession?.messages || []).slice(0, currentSession?.lastSummarizedIndex || 0).filter((m) => m.role === 'user').length}
          pendingUserTurns={(currentSession?.messages || []).slice(currentSession?.lastSummarizedIndex || 0).filter((m) => m.role === 'user').length}
          pinnedMemories={currentSession?.pinnedMemories || []}
          onUpdateWorldState={handleUpdateWorldState}
          onTriggerCompaction={handleTriggerCompaction}
          onAddPinnedMemory={handleAddPinnedMemory}
          onDeletePinnedMemory={handleDeletePinnedMemory}
          isMobileOpen={isLeftPanelOpenMobile}
          onCloseMobile={() => setIsLeftPanelOpenMobile(false)}
        />

        {/* Center Panel: The Roleplay Stage */}
        <StagePanel
          session={currentSession}
          worldState={worldState}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          apiKeyConnected={isApiKeyConnected}
          onSendMessage={handleSendMessage}
          onRegenerateTurn={handleRegenerateTurn}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onStopStreaming={handleStopStreaming}
          onOpenWorldForge={() => setIsWorldForgeOpen(true)}
          onOpenKeyManager={() => setIsRightDrawerOpen(true)}
          quickInputMove={quickInputMove}
        />

        {/* Right Drawer: Context, Moveset & Samplers */}
        <RightDrawer
          isOpen={isRightDrawerOpen}
          onClose={() => setIsRightDrawerOpen(false)}
          session={currentSession}
          onSaveSessionSettings={handleSaveSessionSettings}
          onInjectMove={handleInjectMove}
          onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
          onKeysSaved={() => setKeyUpdateTick((t) => t + 1)}
        />
      </div>

      {/* World Forge & Universe Selector Modal */}
      <WorldForgeModal
        isOpen={isWorldForgeOpen}
        onClose={() => setIsWorldForgeOpen(false)}
        onForgeRealm={handleForgeRealm}
        onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClearAllData={handleClearAllData}
      />

      {/* Dedicated Persona & Moveset Lorebook Hub Modal */}
      <PersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        currentSession={currentSession}
        onApplyPersonaToSession={handleSaveSessionSettings}
        onInjectMove={handleInjectMove}
      />
    </div>
  );
}
