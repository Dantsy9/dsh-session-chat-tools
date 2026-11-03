import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

async function loadBundle(navigator = {}, overrides = {}) {
  const code = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  let handoff
  const react = new Proxy({}, { get: (_target, key) => {
    if (key === 'createElement') return (...args) => ({ args })
    return () => undefined
  } })
  const context = {
    window: {
      __ModuleLoader__: {
        load(record) { handoff = record },
      },
      ...overrides.window,
    },
    navigator,
    document: {
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({
        setAttribute() {},
        style: {},
        dataset: {},
        select() {},
        remove() {},
      }),
      head: { appendChild() {} },
      body: { appendChild() {} },
      addEventListener() {},
      removeEventListener() {},
      ...overrides.document,
    },
    Event,
    console,
    setTimeout,
    clearTimeout,
  }
  vm.runInNewContext(code, context, { filename: 'dsh-session-chat-tools/client.js' })
  assert.ok(handoff)
  const exports = handoff.factory((id) => {
    if (id === 'react') return react
    if (id === 'react/jsx-runtime') {
      return { jsx: (...args) => ({ args }), jsxs: (...args) => ({ args }), Fragment: Symbol('Fragment') }
    }
    throw new Error(`unexpected browser external: ${id}`)
  })
  return { handoff, exports }
}

test('browser bundle contributes one localized session-header copy-ID utility', async () => {
  const { handoff, exports } = await loadBundle()
  const registrations = []
  const locales = []
  const ctx = {
    effect(start) { return start() },
    locale: {
      bind() { return key => key },
      register(namespace, dictionaries) { locales.push({ namespace, dictionaries }); return () => {} },
    },
    slots: {
      inject(name, mount) { assert.equal(name, 'conversation.session.header.utilities'); return mount() },
      register(options, component) { registrations.push({ options, component }); return () => {} },
    },
  }

  exports.apply(ctx)

  assert.equal(handoff.id, 'dsh-session-chat-tools')
  assert.deepEqual(Array.from(exports.inject), ['slots', 'locale'])
  assert.equal(locales.length, 1)
  assert.equal(locales[0].namespace, 'dsh-session-chat-tools')
  assert.equal(registrations.length, 1)
  assert.equal(registrations[0].options.id, 'copy-session-id')
  assert.equal(registrations[0].options.name, 'conversation.session.header.utilities')
  assert.equal(registrations[0].options.locale, 'dsh-session-chat-tools')
  assert.equal(typeof registrations[0].component, 'function')
})

test('browser bundle no longer injects a session-row menu item', async () => {
  const { exports } = await loadBundle()
  const listeners = []
  const ctx = {
    effect(start) { return start() },
    locale: { bind() { return key => key }, register() { return () => {} } },
    slots: { inject(_name, mount) { return mount() }, register() { return () => {} } },
    __capture: (type, listener) => listeners.push({ type, listener }),
  }

  exports.apply(ctx)

  // 0.3.2 exposed the DOM helper; 0.3.3 must not.
  assert.equal('sessionIdFromElement' in exports, false)
  assert.equal('installSessionMenuCopy' in exports, false)
  assert.equal(listeners.length, 0)
})

test('clipboard helper reports success only after the exact session id is accepted', async () => {
  const writes = []
  const { exports } = await loadBundle({ clipboard: { async writeText(text) { writes.push(text) } } })
  assert.equal(await exports.writeClipboard('session-other'), true)
  assert.deepEqual(writes, ['session-other'])

  const denied = await loadBundle({ clipboard: { async writeText() { throw new Error('denied') } } })
  assert.equal(await denied.exports.writeClipboard('session-other'), false)
})
