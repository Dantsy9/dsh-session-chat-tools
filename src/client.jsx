import { useEffect, useRef, useState } from 'react'

const NS = 'dsh-session-chat-tools'
const STYLE_ID = 'dsh-session-chat-tools-style'

const zh = {
  'copy.aria': '复制对话 ID：{id}',
  'copy.title': '复制对话 ID',
  'copy.copied': '已复制对话 ID',
  'copy.failed': '复制失败',
}

const en = {
  'copy.aria': 'Copy session ID: {id}',
  'copy.title': 'Copy session ID',
  'copy.copied': 'Session ID copied',
  'copy.failed': 'Copy failed',
}

export const inject = ['slots', 'locale']

export async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }
  const exec = typeof document.execCommand === 'function'
    ? document.execCommand.bind(document)
    : undefined
  if (exec === undefined) return false
  const element = document.createElement('textarea')
  element.value = text
  element.setAttribute('readonly', '')
  element.style.position = 'fixed'
  element.style.left = '-9999px'
  document.body.appendChild(element)
  element.select()
  try {
    return exec('copy')
  } catch {
    return false
  } finally {
    element.remove()
  }
}

function CopyIcon({ copied }) {
  return copied
    ? (
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="m3.5 8.2 2.8 2.8 6.2-6.2" />
        </svg>
      )
    : (
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <rect x="5.1" y="5.1" width="7.4" height="7.4" rx="1.4" />
          <path d="M10.7 5.1V4.2a1.7 1.7 0 0 0-1.7-1.7H4.2a1.7 1.7 0 0 0-1.7 1.7V9A1.7 1.7 0 0 0 4.2 10.7h.9" />
        </svg>
      )
}

function CopySessionId({ sessionId, t }) {
  const [status, setStatus] = useState('idle')
  const timer = useRef()

  useEffect(() => () => { clearTimeout(timer.current) }, [])

  const copy = async () => {
    const accepted = await writeClipboard(String(sessionId))
    setStatus(accepted ? 'copied' : 'failed')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { setStatus('idle') }, 1600)
  }

  const title = status === 'copied'
    ? t('copy.copied')
    : status === 'failed' ? t('copy.failed') : t('copy.title')

  return (
    <button
      type="button"
      className="dsh-session-chat-tools-copy"
      data-status={status}
      aria-label={status === 'idle' ? t('copy.aria', { id: String(sessionId) }) : title}
      title={title}
      onClick={() => { void copy() }}
    >
      <span>ID</span>
      <CopyIcon copied={status === 'copied'} />
    </button>
  )
}

function installStyles() {
  if (document.querySelector(`#${STYLE_ID}`) !== null) return () => {}
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
.dsh-session-chat-tools-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  min-width: 56px;
  padding: 6px 12px;
  gap: 5px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 18px;
  color: var(--dsw-alias-label-primary);
  background: transparent;
  font: 400 13px/20px var(--dsw-font-family);
  cursor: pointer;
}
.dsh-session-chat-tools-copy:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-session-chat-tools-copy:focus-visible { outline: 2px solid var(--dsw-alias-label-primary-bluish); outline-offset: 2px; }
.dsh-session-chat-tools-copy[data-status="copied"] { color: var(--dsw-alias-label-primary-bluish); }
.dsh-session-chat-tools-copy[data-status="failed"] { color: var(--dsw-alias-label-error); }
.dsh-session-chat-tools-copy span { white-space: nowrap; }
.dsh-session-chat-tools-copy svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
`
  document.head.appendChild(style)
  return () => { style.remove() }
}

/**
 * The session-row "..." menu already ships a built-in "Copy Session ID" item in
 * DSH 0.2.1, so this plugin only contributes the Session-header "ID" chip. The
 * row-menu item from earlier releases was a DOM injection that duplicated it.
 */
export function apply(ctx) {
  ctx.effect(installStyles)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }))
  ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
    name: 'conversation.session.header.utilities',
    id: 'copy-session-id',
    locale: NS,
  }, CopySessionId))
}
