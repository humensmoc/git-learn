import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

import { highlightLine, highlightPrompt } from "../terminal/highlight";

interface TerminalPanelProps {
  history: string[];
  onCommand: (command: string) => void;
  getCompletions: (input: string) => string[];
  darkMode?: boolean;
}

const lightTerminalTheme = {
  background: "#3a3a3a",
  foreground: "#f0f0f0",
  cursor: "#c8e600",
};

const darkTerminalTheme = {
  background: "#141c28",
  foreground: "#e2e8f0",
  cursor: "#c8e600",
};

const PROMPT_VISIBLE_LEN = 2;

export const TerminalPanel = ({ history, onCommand, getCompletions, darkMode = false }: TerminalPanelProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const onCommandRef = useRef(onCommand);
  const getCompletionsRef = useRef(getCompletions);
  const lineBufferRef = useRef("");
  const cursorPosRef = useRef(0);
  const cmdHistoryRef = useRef<string[]>([]);
  const cmdHistoryCursorRef = useRef(-1);
  const printedRef = useRef(0);
  const safeFitRef = useRef<() => void>(() => undefined);
  const promptVisibleRef = useRef(false);
  const awaitingResultRef = useRef(false);

  useEffect(() => {
    onCommandRef.current = onCommand;
    getCompletionsRef.current = getCompletions;
  }, [getCompletions, onCommand]);

  const focusTerminal = () => {
    const term = termRef.current;
    if (!term) return;
    try {
      term.focus();
    } catch {
      // keep silent; focus can fail during disposal
    }
  };

  const renderPromptLine = () => {
    const term = termRef.current;
    if (!term) return;
    const buffer = lineBufferRef.current;
    const cursorPos = cursorPosRef.current;
    term.write(`\r\x1b[2K${highlightPrompt(buffer)}`);
    term.write(`\x1b[${PROMPT_VISIBLE_LEN + cursorPos + 1}G`);
    term.scrollToBottom();
    focusTerminal();
  };

  const setInputBuffer = (next: string, cursorPos = next.length) => {
    lineBufferRef.current = next;
    cursorPosRef.current = Math.max(0, Math.min(cursorPos, next.length));
    renderPromptLine();
  };

  const printHistoryLines = (lines: string[]) => {
    const term = termRef.current;
    if (!term || lines.length === 0) return;
    if (promptVisibleRef.current) term.write("\r\x1b[2K");
    term.write("\r\n");
    lines.forEach((line) => term.writeln(highlightLine(line)));
    promptVisibleRef.current = true;
    awaitingResultRef.current = false;
    renderPromptLine();
  };

  useEffect(() => {
    const term = new Terminal({
      theme: darkMode ? darkTerminalTheme : lightTerminalTheme,
      fontFamily: "JetBrains Mono, ui-monospace, Menlo, monospace",
      fontSize: 13,
      cursorBlink: true,
      scrollback: 5000,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    termRef.current = term;
    term.open(hostRef.current!);
    const safeFit = () => {
      try {
        if (!hostRef.current) return;
        if (hostRef.current.clientWidth <= 0 || hostRef.current.clientHeight <= 0) return;
        fit.fit();
      } catch {
        // xterm render service can be undefined during very early layout cycles.
      }
    };
    safeFitRef.current = safeFit;
    requestAnimationFrame(safeFit);
    promptVisibleRef.current = true;
    renderPromptLine();
    focusTerminal();

    const onResize = () => safeFit();
    window.addEventListener("resize", onResize);
    hostRef.current?.addEventListener("mousedown", focusTerminal);

    term.onData((data) => {
      const char = data.charCodeAt(0);
      const buffer = lineBufferRef.current;
      const pos = cursorPosRef.current;
      if (awaitingResultRef.current) return;

      if (data === "\r") {
        const command = lineBufferRef.current.trim();
        term.write("\r\n");
        if (command.length > 0) {
          cmdHistoryRef.current.unshift(command);
          cmdHistoryCursorRef.current = -1;
          awaitingResultRef.current = command.startsWith("git ");
          onCommandRef.current(command);
        }
        lineBufferRef.current = "";
        cursorPosRef.current = 0;
        promptVisibleRef.current = true;
        renderPromptLine();
        return;
      }
      if (data === "\u007f") {
        if (pos > 0) {
          const next = buffer.slice(0, pos - 1) + buffer.slice(pos);
          setInputBuffer(next, pos - 1);
        }
        return;
      }
      if (data === "\t") {
        const suggestions = getCompletionsRef.current(lineBufferRef.current);
        if (suggestions.length === 1) {
          setInputBuffer(suggestions[0], suggestions[0].length);
        } else if (suggestions.length > 1) {
          term.write("\r\x1b[2K");
          term.writeln(suggestions.map((item) => highlightLine(`$ ${item}`)).join("   "));
          promptVisibleRef.current = true;
          renderPromptLine();
        }
        return;
      }
      if (data === "\u001b[D") {
        if (cursorPosRef.current > 0) {
          cursorPosRef.current -= 1;
          renderPromptLine();
        }
        return;
      }
      if (data === "\u001b[C") {
        if (cursorPosRef.current < lineBufferRef.current.length) {
          cursorPosRef.current += 1;
          renderPromptLine();
        }
        return;
      }
      if (data === "\u001b[A") {
        const list = cmdHistoryRef.current;
        if (!list.length) return;
        cmdHistoryCursorRef.current = Math.min(list.length - 1, cmdHistoryCursorRef.current + 1);
        const item = list[cmdHistoryCursorRef.current] ?? "";
        setInputBuffer(item, item.length);
        return;
      }
      if (data === "\u001b[B") {
        const list = cmdHistoryRef.current;
        if (!list.length) return;
        cmdHistoryCursorRef.current = Math.max(-1, cmdHistoryCursorRef.current - 1);
        const item = cmdHistoryCursorRef.current >= 0 ? list[cmdHistoryCursorRef.current] : "";
        setInputBuffer(item, item.length);
        return;
      }
      if (char >= 32) {
        const next = buffer.slice(0, pos) + data + buffer.slice(pos);
        setInputBuffer(next, pos + data.length);
      }
    });

    return () => {
      window.removeEventListener("resize", onResize);
      hostRef.current?.removeEventListener("mousedown", focusTerminal);
      term.dispose();
    };
  }, []);

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.theme = darkMode ? darkTerminalTheme : lightTerminalTheme;
  }, [darkMode]);

  useEffect(() => {
    safeFitRef.current();
  }, [history.length]);

  useEffect(() => {
    if (!termRef.current) return;
    const nextLines = history.slice(printedRef.current);
    if (!nextLines.length) return;
    printHistoryLines(nextLines);
    printedRef.current = history.length;
  }, [history]);

  return <section className="terminal-panel" ref={hostRef} />;
};

