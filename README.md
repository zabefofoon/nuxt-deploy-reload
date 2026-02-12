# nuxt-deploy-reload

A Nuxt module that detects new deployments and automatically reloads the page on the client.

## What It Does

- Updates a version file before the Nitro build (default: `public/version.json`).
- Stores the current version in a cookie (`web-version`) on the client.
- Re-checks version on first load and on route changes.
- Calls `window.location.reload()` when a new version is detected.

## Install

```bash
pnpm add -D nuxt-deploy-reload
```

`nuxt.config.ts`:

```ts
export default defineNuxtConfig({
    modules: ["nuxt-deploy-reload"],
})
```

## Configuration

`nuxt.config.ts`:

```ts
export default defineNuxtConfig({
    modules: ["nuxt-deploy-reload"],
    deployReload: {
        key: "version",
        skipInDev: true,
        checkIntervalMs: 30_000,
        filePath: "public/version.json",
    },
})
```

Options:

- `filePath?: string`
    - Output path for the version file
    - Default: `public/version.json`
- `key?: string`
    - Key name used in the version JSON
    - Default: `"version"`
- `initial?: number`
    - Not used in the current implementation (reserved)
- `skipInDev?: boolean`
    - Skips module behavior in dev mode when `true`
    - Default: `true`
- `checkIntervalMs?: number`
    - Minimum interval (ms) between checks on route changes
    - Default: `30000`

## Important Notes

- The client fetch path is currently fixed to `"/version.json"`.
- If you change `filePath`, that file still needs to be reachable at `"/version.json"` for the current client logic.
- Version checks are skipped when the tab is not visible or the browser is offline.

## License

MIT
