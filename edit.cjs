#!/usr/bin/env node
// Run locally after cloning this repository. No packages or credentials needed.
const fs = require('node:fs')
const path = require('node:path')
const file = path.join(__dirname, 'allowlist.json')
const validHost = host => typeof host === 'string' && host.length <= 253 && host.includes('.') && host === host.toLowerCase() && host.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) && /[a-z]/.test(host.split('.').pop()) && !['local', 'localhost', 'internal', 'lan', 'home', 'home.arpa'].some(suffix => host === suffix || host.endsWith('.' + suffix))
const keys = (value, expected) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === expected.length && expected.every(key => key in value)
const validate = feed => {
  if (!keys(feed, ['version', 'domains']) || feed.version !== 1 || !Array.isArray(feed.domains) || feed.domains.length > 1000 || Buffer.byteLength(JSON.stringify(feed, null, 2) + '\n') > 128 * 1024) throw new Error('Expected version 1 and at most 1,000 domains within 128 KiB.')
  const seen = new Set()
  for (const entry of feed.domains) {
    if (!keys(entry, ['host', 'includeSubdomains']) || !validHost(entry.host) || typeof entry.includeSubdomains !== 'boolean' || seen.has(entry.host)) throw new Error('Each entry needs a unique lowercase hostname and an includeSubdomains boolean. No URLs, IPs, wildcards or local names.')
    seen.add(entry.host)
  }
  return feed
}
try {
  const [command, input, flag, ...extra] = process.argv.slice(2)
  if (!['add', 'remove', 'show', 'validate'].includes(command) || extra.length || (['show', 'validate'].includes(command) && input !== undefined) || (command === 'remove' && flag !== undefined) || (command === 'add' && flag !== undefined && flag !== '--subdomains')) throw new Error('Usage: node edit.cjs add <host-or-url> [--subdomains] | remove <host-or-url> | show | validate')
  const feed = validate(JSON.parse(fs.readFileSync(file, 'utf8')))
  if (command === 'add' || command === 'remove') {
    if (!input) throw new Error('Enter a hostname or URL.')
    const host = new URL(input.includes('://') ? input : 'https://' + input).hostname.replace(/\.$/, '')
    if (!validHost(host)) throw new Error('Enter a public DNS hostname, not an IP, wildcard or local name.')
    feed.domains = feed.domains.filter(entry => entry.host !== host)
    if (command === 'add') feed.domains.push({ host, includeSubdomains: flag === '--subdomains' })
    feed.domains.sort((a, b) => a.host.localeCompare(b.host))
    validate(feed)
    fs.writeFileSync(file, JSON.stringify(feed, null, 2) + '\n')
  }
  process.stdout.write(command === 'validate' ? 'Valid allowlist.\n' : JSON.stringify(feed, null, 2) + '\n')
} catch (error) {
  process.stderr.write(error.message + '\n')
  process.exitCode = 1
}
