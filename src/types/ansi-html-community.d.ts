// Type definitions for ansi-html-community
declare module 'ansi-html-community' {
    function ansiHTML(text: string): string;
    namespace ansiHTML {
        export function setColors(colors: Record<string, string | string[]>): void;
    }
    export = ansiHTML;
}
