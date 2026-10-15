# SIYAG site allowlist

This public repository contains the centrally managed site exceptions for SIYAG.
Anyone can read the list. Only collaborators with write access can change it.
The extension downloads `allowlist.json` from the `main` branch hourly, caches
it locally and checks it before contacting ShomerDNS. No client token is used.

An exception permits the website through SIYAG's Shomer site check. Local image
and video protection remains active. This does not change system DNS.

## Edit on GitHub

1. Open [allowlist.json](allowlist.json) and click the pencil to edit it.
2. Add or remove entries in `domains`. Separate entries with commas, with no
   comma after the last entry.
3. Commit the change to `main`. The extension picks it up on its next successful
   hourly refresh while Chrome is running and online.

This complete example permits exactly `tailscale.com`, plus `example.org` and
its subdomains. The `example.org` entry illustrates adding a second site;
replace it with a site you want to allow. Editing this README does not change
the actual list.

```json
{
  "version": 1,
  "domains": [
    { "host": "tailscale.com", "includeSubdomains": false },
    { "host": "example.org", "includeSubdomains": true }
  ]
}
```

| Field | What to enter |
| --- | --- |
| `version` | Keep `1`. This is the format version, not an edit counter. |
| `domains` | An array of site entries. Use `[]` to remove all exceptions. |
| `host` | A lowercase hostname such as `tailscale.com`, without `https://` or a path. |
| `includeSubdomains` | `false` for only that host; `true` for the host and all its subdomains. |

`false` permits only the exact hostname. `true` permits the hostname and its
subdomains, such as `www.example.org` and `login.example.org`. It never matches
`fakeexample.org` or `example.org.other.com`. `example.com` and `www.example.com`
are separate hosts unless subdomains are included. Only lowercase bare DNS
hostnames are accepted. Do not add paths, wildcards, ports, IP addresses,
comments or trailing commas. Every entry needs both fields. Keep `version` at
`1`; it identifies the format, not the number of edits. Duplicate hosts and
unknown fields are rejected. The limit is 1,000 entries and 128 KiB.

Delete an entry to revoke it. To revoke all entries, keep `"domains": []`.
An invalid update is rejected as a whole; the extension keeps its last valid
copy. Existing open pages are not automatically closed after a removal.
Updates arrive on the next successful refresh while Chrome is running and
online. GitHub caching can add propagation delay. Offline clients retain the
last valid list. With no downloaded list, normal Shomer behavior applies.

## Small editing tool

Install Node.js, clone this repo and run:

```sh
node edit.cjs add tailscale.com
node edit.cjs add example.org --subdomains
node edit.cjs remove tailscale.com
node edit.cjs validate
node edit.cjs show
```

`add` also accepts a pasted URL and converts it to a hostname. It updates an
existing host rather than adding a duplicate. Without `--subdomains`, it uses
exact-host matching. The tool edits the local file and prints the resulting
JSON. Review it, then commit and push `allowlist.json` to `main` to publish.
It never pushes or signs in on your behalf.

GitHub Actions validates list changes. A failing check does not stop direct
commits unless repository branch rules require the check. Invalid downloads
are still rejected by the extension.
