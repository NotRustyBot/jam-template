import bundle from "../bundle";
import { getRegisteredClasses, type PropSchema } from "../gameObject";
import { game } from "../game";
import type { WorldObject } from "../world";
import type { Editor } from "./state";

export interface Overlay {
    element: HTMLElement;
    update(): void;
    setStatus(text: string): void;
}

function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className?: string,
    text?: string
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != undefined) node.textContent = text;
    return node;
}

const HEX = /^#([0-9a-f]{6})$/i;

function assetAliases(): string[] {
    return (bundle.assets as readonly { alias: string }[]).map((a) => a.alias);
}

export function createOverlay(editor: Editor): Overlay {
    const root = el("div", "editor-ui");
    const inspector = el("div", "editor-inspector");
    const status = el("div", "editor-status", "ready");

    const header = el("div", "editor-header");
    header.appendChild(el("span", "editor-title", "Level Editor"));

    const levelInput = el("input", "editor-level");
    levelInput.value = editor.state.level;
    levelInput.addEventListener("change", () => editor.setLevel(levelInput.value.trim()));
    header.appendChild(levelInput);

    const saveBtn = el("button", "editor-btn", "Save");
    saveBtn.addEventListener("click", () => {
        editor.save().catch((e) => editor.setStatus(String(e)));
    });
    header.appendChild(saveBtn);

    const reloadBtn = el("button", "editor-btn", "Reload");
    reloadBtn.addEventListener("click", () => {
        editor.reload().catch((e) => editor.setStatus(String(e)));
    });
    header.appendChild(reloadBtn);

    header.appendChild(status);
    root.appendChild(header);

    const palette = el("div", "editor-palette");
    for (const cls of getRegisteredClasses()) {
        const btn = el("button", "editor-palette-btn", cls.type);
        btn.addEventListener("click", () => {
            const center = game.camera.position;
            const snap = editor.state.snap || 1;
            editor.spawn(
                cls.type,
                Math.round(center.x / snap) * snap,
                Math.round(center.y / snap) * snap
            );
        });
        palette.appendChild(btn);
    }
    root.appendChild(palette);
    root.appendChild(inspector);

    const hint = el(
        "div",
        "editor-hint",
        "` toggle · drag move · Shift free · Del delete · Ctrl+D duplicate · Esc deselect"
    );
    root.appendChild(hint);

    document.body.appendChild(root);

    function renderInspector() {
        inspector.replaceChildren();

        const entry = editor.state.selectedEntry;
        if (!entry) {
            inspector.appendChild(el("div", "editor-empty", "nothing selected"));
            return;
        }

        const cls = getRegisteredClasses().find((c) => c.type === entry.type);
        if (!cls) {
            inspector.appendChild(el("div", "editor-empty", `unknown type: ${entry.type}`));
            return;
        }

        const actions = el("div", "editor-actions");
        const dupBtn = el("button", "editor-btn", "Duplicate");
        dupBtn.addEventListener("click", () => editor.duplicate(entry.id));
        const delBtn = el("button", "editor-btn danger", "Delete");
        delBtn.addEventListener("click", () => editor.remove(entry.id));
        actions.appendChild(dupBtn);
        actions.appendChild(delBtn);
        inspector.appendChild(actions);

        for (const key of Object.keys(cls.schema)) {
            inspector.appendChild(
                renderField(editor, entry, key, (cls.schema as Record<string, PropSchema>)[key])
            );
        }
    }

    function update() {
        if (document.activeElement !== levelInput) levelInput.value = editor.state.level;
        renderInspector();
    }

    update();

    return {
        element: root,
        update,
        setStatus(text: string) {
            status.textContent = text;
        },
    };
}

function renderField(
    editor: Editor,
    entry: WorldObject,
    key: string,
    schema: PropSchema
): HTMLElement {
    const row = el("label", "editor-field");
    row.appendChild(el("span", "editor-field-name", schema.label ?? key));

    const value = entry.props[key];
    let input: HTMLInputElement | HTMLSelectElement;

    switch (schema.kind) {
        case "number": {
            input = el("input");
            input.type = "number";
            if (schema.step != undefined) input.step = String(schema.step);
            if (schema.min != undefined) input.min = String(schema.min);
            if (schema.max != undefined) input.max = String(schema.max);
            input.value = String(value ?? 0);
            input.addEventListener("input", () => {
                const num = Number(input.value);
                if (!Number.isNaN(num)) editor.setProp(entry.id, key, num);
            });
            break;
        }
        case "string": {
            input = el("input");
            input.type = "text";
            input.value = String(value ?? "");
            input.addEventListener("input", () => editor.setProp(entry.id, key, input.value));
            break;
        }
        case "boolean": {
            const checkbox = el("input");
            checkbox.type = "checkbox";
            checkbox.checked = Boolean(value);
            checkbox.addEventListener("change", () =>
                editor.setProp(entry.id, key, checkbox.checked)
            );
            input = checkbox;
            break;
        }
        case "enum": {
            input = el("select");
            for (const option of schema.options) {
                const opt = el("option", undefined, option);
                opt.value = option;
                input.appendChild(opt);
            }
            input.value = String(value ?? schema.options[0] ?? "");
            input.addEventListener("change", () => editor.setProp(entry.id, key, input.value));
            break;
        }
        case "asset": {
            input = el("select");
            const none = el("option", undefined, "(none)");
            none.value = "";
            input.appendChild(none);
            for (const alias of assetAliases()) {
                const opt = el("option", undefined, alias);
                opt.value = alias;
                input.appendChild(opt);
            }
            input.value = typeof value === "string" ? value : "";
            input.addEventListener("change", () => editor.setProp(entry.id, key, input.value));
            break;
        }
        case "color": {
            input = el("input");
            input.type = "color";
            input.value = HEX.test(String(value)) ? String(value) : "#ffffff";
            input.addEventListener("change", () => editor.setProp(entry.id, key, input.value));
            break;
        }
    }

    input.className = "editor-input";
    row.appendChild(input);
    return row;
}
