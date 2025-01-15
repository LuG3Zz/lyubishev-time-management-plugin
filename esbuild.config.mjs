import esbuild from "esbuild";
import esbuildPluginVue3 from "esbuild-plugin-vue3";
import builtinModules from "builtin-modules";
import process from "process";
import fs from "fs";

const release = (process.argv[2] === "release");

const jsBanner = `/**
 * 这是一个由 ESbuild 生成的打包文件.
 * 如果您想查看源代码, 请访问这个插件的 GitHub 仓库.
 */
`;

const cssBanner = `/* *************************************************************************

这是一个由 ESbuild 生成的打包文件.
它会在 Obsidian 加载插件的时候一并进行加载.
如果您想查看源代码, 请访问这个插件的 GitHub 仓库.

************************************************************************* */
`;

const esbuildContext = await esbuild.context({
    bundle: true,
    entryPoints: ["src/main.ts"],
    external: [
        "obsidian",
        "electron",
        "@codemirror/autocomplete",
        "@codemirror/collab",
        "@codemirror/commands",
        "@codemirror/language",
        "@codemirror/lint",
        "@codemirror/search",
        "@codemirror/state",
        "@codemirror/view",
        "@lezer/common",
        "@lezer/highlight",
        "@lezer/lr",
        ...builtinModules
    ],
    outfile: "main.js",
    banner: {
        js: jsBanner,
        css: cssBanner
    },
    format: "cjs",
    target: "ESNext",
    logLevel: release ? "info" : "debug",
    sourcemap: release ? false : "inline",
    treeShaking: true,
    plugins: [esbuildPluginVue3()],
    drop: release ? ["console"] : [], // 仅在发布模式下移除 console.*
});

if (release) {
    await esbuildContext.rebuild();
    fs.rename("main.css", "styles.css", (err) => {
        if (err) {
            throw err;
        }
    });
    process.exit(0);
} else {
    await esbuildContext.watch();
    fs.watchFile("main.css", () => {
        fs.access("main.css", fs.constants.F_OK, (err) => {
            if (!err) {
                fs.rename("main.css", "styles.css", (err) => {
                    if (err) {
                        throw err;
                    }
                });
            }
        });
    });
}