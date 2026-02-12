import { promises as fs } from "node:fs"
import path from "node:path"
import { addPluginTemplate, defineNuxtModule } from "nuxt/kit"

export interface Options {
    filePath?: string
    key?: string
    initial?: number
    skipInDev?: boolean
    checkIntervalMs?: number
}
export default defineNuxtModule<Options>({
    meta: {
        name: "nuxt-deploy-reload",
        configKey: "deployReload",
    },
    defaults: {
        key: "version",
        initial: 0,
        skipInDev: true,
        checkIntervalMs: 30_000,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setup(options: any, nuxt: any) {
        const key = options.key ?? "version"
        const skipInDev = options.skipInDev ?? true
        const checkIntervalMs = options.checkIntervalMs ?? 30_000
        const serializedKey = JSON.stringify(key)

        const publicDir = path.resolve(nuxt.options.rootDir, "public")
        const resolvedFile = options.filePath
            ? path.isAbsolute(options.filePath)
                ? options.filePath
                : path.join(nuxt.options.rootDir, options.filePath)
            : path.join(publicDir, "version.json")

        async function bump(): Promise<void> {
            try {
                await fs.mkdir(path.dirname(resolvedFile), { recursive: true })

                const next = Date.now()

                const out = JSON.stringify({ [key]: next }, null, 2) + "\n"
                await fs.writeFile(resolvedFile, out, "utf-8")

                nuxt.options.logger?.info?.(
                    `[nuxt-deploy-reload] ${path.relative(nuxt.options.rootDir, resolvedFile)} -> ${next}`
                )
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                nuxt.options.logger?.warn?.(`[nuxt-deploy-reload] Failed: ${e?.message || e}`)
            }
        }

        if (nuxt.options.dev && skipInDev) return

        nuxt.hook("nitro:build:before", bump)

        addPluginTemplate({
            filename: "version-check.client.ts",
            getContents: () => `
const WEB_VERSION_COOKIE_KEY = "web-version"
const LAST_CHECKED_STATE_KEY = "last-web-version-check-at"

export default defineNuxtPlugin(async () => {
  if (document.visibilityState !== "visible") return
  if (navigator.onLine === false) return

  const route = useRoute()
  const versionCookie = useCookie<number | undefined>(WEB_VERSION_COOKIE_KEY, { maxAge: 60 * 60 * 24 })
  const lastChecked = useState<number>(LAST_CHECKED_STATE_KEY, () => 0)

  const checkVersion = async (): Promise<void> => {
    if (document.visibilityState !== "visible") return
    if (navigator.onLine === false) return

    const url = \`/version.json?ts=\${Date.now()}\`
    const res = await $fetch<Record<string, number>>(url, { cache: "no-store" })
    const nextVersion = res[${serializedKey}]
    if (typeof nextVersion !== "number") return

    lastChecked.value = Date.now()

    if (!versionCookie.value) {
      versionCookie.value = nextVersion
      return
    }

    if (versionCookie.value !== nextVersion) {
      versionCookie.value = nextVersion
      window.setTimeout(() => window.location.reload(), 100)
    }
  }

  await checkVersion().catch((error: unknown) => {
    console.log(error)
  })

  watch(
    () => route.fullPath,
    async () => {
      if (Date.now() - lastChecked.value <= ${checkIntervalMs}) return
      await checkVersion().catch((error: unknown) => {
        console.log(error)
      })
    }
  )
})
`,
        })
    },
})
