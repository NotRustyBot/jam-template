import fs from "node:fs";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";

const LEVEL_PATTERN = /^[a-z0-9_-]+$/i;
const MAX_BODY = 10 * 1024 * 1024;

export interface EditorApiOptions {
    worldsDir?: string;
}

function readBody(req: any): Promise<string> {
    return new Promise((resolve, reject) => {
        let size = 0;
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > MAX_BODY) {
                req.destroy();
                reject(new Error("payload too large"));
                return;
            }
            chunks.push(chunk);
        });
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
    });
}

function send(res: any, status: number, data: unknown) {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
}

export function mountEditorApi(worldsDir: string, middlewares: any) {
    const dir = path.resolve(worldsDir);
    fs.mkdirSync(dir, { recursive: true });

    middlewares.use(async (req: any, res: any, next: () => void) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (!url.pathname.startsWith("/__editor")) return next();

        const route = url.pathname.slice("/__editor".length) || "/";

        try {
            if (route === "/list" && req.method === "GET") {
                const levels = fs
                    .readdirSync(dir)
                    .filter((f) => f.endsWith(".json"))
                    .map((f) => f.replace(/\.json$/, ""));
                return send(res, 200, { levels });
            }

            if (route === "/load" && req.method === "GET") {
                const level = url.searchParams.get("level") ?? "default";
                if (!LEVEL_PATTERN.test(level)) return send(res, 400, { error: "invalid level" });
                const file = path.join(dir, `${level}.json`);
                if (!fs.existsSync(file)) return send(res, 404, { error: "not found" });
                res.setHeader("Content-Type", "application/json");
                return res.end(fs.readFileSync(file, "utf8"));
            }

            if (route === "/save" && req.method === "POST") {
                const raw = await readBody(req);
                let parsed: any;
                try {
                    parsed = JSON.parse(raw);
                } catch {
                    return send(res, 400, { error: "invalid json" });
                }

                const level = typeof parsed.level === "string" ? parsed.level : "";
                if (!LEVEL_PATTERN.test(level)) return send(res, 400, { error: "invalid level" });

                const state = parsed.state;
                if (!state || typeof state !== "object" || !Array.isArray(state.objects)) {
                    return send(res, 400, { error: "invalid state" });
                }

                const file = path.join(dir, `${level}.json`);
                fs.writeFileSync(file, JSON.stringify(state, null, 2) + "\n");
                console.log(
                    `[editor] saved ${path.relative(process.cwd(), file)} (${state.objects.length} objects)`
                );
                return send(res, 200, { ok: true, level, count: state.objects.length });
            }

            return send(res, 404, { error: "unknown route" });
        } catch (error) {
            console.error("[editor] error", error);
            return send(res, 500, { error: String(error) });
        }
    });
}

export function editorApi(options: EditorApiOptions = {}): Plugin {
    return {
        name: "jam-editor-api",
        apply: "serve",
        configureServer(server: ViteDevServer) {
            mountEditorApi(options.worldsDir ?? "public/worlds", server.middlewares);
        },
    };
}
