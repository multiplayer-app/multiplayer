const io = require('socket.io-client')

// ── State ────────────────────────────────────────────────────────────────
let socket = null
let connected = false
let currentAgentId = null
let currentWorkspace = null
let currentProject = null

// Map of chatId → { chat, messages: AgentMessage[] }
const chats = new Map()

// ── DOM helpers ───────────────────────────────────────────────────────────
function el(id) { return document.getElementById(id) }

function setStatus(cls, text) {
  el('status-dot').className = cls
  el('status-text').textContent = text
}

function showError(msg) {
  const errEl = el('err-msg')
  errEl.textContent = msg
  errEl.style.display = 'block'
}

// ── Rendering ─────────────────────────────────────────────────────────────
function renderAll() {
  const feed = el('chat-feed')
  feed.innerHTML = ''

  for (const { chat, messages } of chats.values()) {
    const chatEl = document.createElement('div')
    chatEl.className = 'chat-block'

    const header = document.createElement('div')
    header.className = `chat-header status-${chat.status ?? 'processing'}`
    header.textContent = chat.title ?? `Chat ${chat.id.slice(-8)}`
    chatEl.appendChild(header)

    for (const msg of messages) {
      chatEl.appendChild(renderMessage(msg))
    }

    feed.appendChild(chatEl)
  }

  feed.scrollTop = feed.scrollHeight
}

function renderMessage(msg) {
  const div = document.createElement('div')
  div.className = `message role-${msg.role}`
  div.dataset.msgId = msg.id

  const meta = document.createElement('span')
  meta.className = 'msg-meta'
  const time = new Date(msg.createdAt).toLocaleTimeString()
  meta.textContent = `[${time}] ${msg.agentName ?? msg.role}${msg.activity ? ` · ${msg.activity}` : ''}`
  div.appendChild(meta)

  const content = document.createElement('div')
  content.className = 'msg-content'
  content.textContent = msg.content
  div.appendChild(content)

  return div
}

function upsertMessage(msg) {
  const chatEntry = chats.get(msg.chat)
  if (!chatEntry) return

  const existingIdx = chatEntry.messages.findIndex(m => m.id === msg.id)
  if (existingIdx >= 0) {
    chatEntry.messages[existingIdx] = msg
    // Update in-place in the DOM if possible
    const existingEl = el('chat-feed').querySelector(`[data-msg-id="${msg.id}"]`)
    if (existingEl) {
      const newEl = renderMessage(msg)
      existingEl.replaceWith(newEl)
      el('chat-feed').scrollTop = el('chat-feed').scrollHeight
      return
    }
  } else {
    chatEntry.messages.push(msg)
  }
  renderAll()
}

// ── Send user message ─────────────────────────────────────────────────────
function sendUserMessage() {
  if (!socket || !connected) return
  const input = el('msg-input')
  const content = input.value.trim()
  if (!content) return

  // Find the most recent chat
  const lastChat = Array.from(chats.values()).pop()
  if (!lastChat) return

  const msg = {
    id: crypto.randomUUID(),
    chat: lastChat.chat.id,
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
    // Include routing params so radar service can forward to agent
    workspaceId: currentWorkspace,
    projectId: currentProject,
    agentId: currentAgentId,
  }
  socket.emit('agent:message:new', msg)

  // Optimistically render
  upsertMessage(msg)
  input.value = ''
}

// ── DOM init ──────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search)
  const paramMap = { url: 'f-url', apiKey: 'f-apikey', agentId: 'f-agentid', workspace: 'f-workspace', project: 'f-project' }
  for (const [key, id] of Object.entries(paramMap)) {
    const v = params.get(key)
    if (v) el(id).value = v
  }

  el('btn-connect').addEventListener('click', onConnect)

  el('btn-send').addEventListener('click', sendUserMessage)

  el('msg-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendUserMessage()
    }
  })
})

// ── Connect ───────────────────────────────────────────────────────────────
function onConnect() {
  const url = el('f-url').value.trim()
  const apiKey = el('f-apikey').value.trim()
  const agentId = el('f-agentid').value.trim()
  const workspace = el('f-workspace').value.trim()
  const project = el('f-project').value.trim()

  if (!url || !apiKey || !agentId || !workspace || !project) {
    showError('All fields are required.')
    return
  }

  let origin
  try {
    origin = new URL(url).origin
  } catch (_e) {
    showError('Invalid URL.')
    return
  }

  currentAgentId = agentId
  currentWorkspace = workspace
  currentProject = project

  el('setup').style.display = 'none'
  el('agent-badge').textContent = `agent ${agentId.slice(-8)}  ·  ${workspace.slice(-8)}/${project.slice(-8)}`

  setStatus('', 'connecting...')

  socket = io(
    `${location.protocol}//${location.host}`,
    {
      path: '/v0/radar/ws',
      auth: { 'x-api-key': apiKey },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 15000,
    }
  )

  socket.on('ready', ({ ready }) => {
    if (ready) {
      socket.emit('agent:chat:subscribe', { workspaceId: workspace, projectId: project, agentId })
      connected = true
      setStatus('connected', 'connected')
    } else {
      setStatus('error', 'authentication failed')
    }
  })

  socket.on('chat:new', (chat) => {
    chats.set(chat.id, { chat, messages: [] })
    renderAll()
  })

  socket.on('message:new', (msg) => {
    if (!chats.has(msg.chat)) {
      // Chat arrived out of order — create a placeholder
      chats.set(msg.chat, { chat: { id: msg.chat, title: 'Agent session', status: 'processing', contextKey: msg.chat, createdAt: msg.createdAt, updatedAt: msg.createdAt, userId: 'agent' }, messages: [] })
    }
    upsertMessage(msg)
  })

  socket.on('chat:update', (chat) => {
    const entry = chats.get(chat.id)
    if (entry) {
      entry.chat = chat
      renderAll()
    }
  })

  socket.on('disconnect', (reason) => {
    connected = false
    setStatus('disconnected', `disconnected: ${reason}`)
  })

  socket.on('connect_error', (err) => {
    setStatus('error', `error: ${err.message}`)
  })

  socket.on('reconnect', () => {
    socket.emit('agent:chat:subscribe', { workspaceId: workspace, projectId: project, agentId })
    connected = true
    setStatus('connected', 'reconnected')
  })
}
