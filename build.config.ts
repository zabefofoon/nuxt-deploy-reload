import { defineBuildConfig } from "unbuild"

export default defineBuildConfig({
    rollup: {
        esbuild: {
            minify: true,
        },
    },
    hooks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "mkdist:entry:options"(_ctx: any, _entry: any, options: any) {
            options.esbuild ||= {}
            options.esbuild.minify = true
        },
    },
})
