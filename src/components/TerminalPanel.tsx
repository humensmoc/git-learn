import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

interface TerminalPanelProps {
  history: string[];
  onCommand: (command: string) => void;
  getCompletions: (input: string) => string[];
}

const PROMPT = "git-learn$ ";

export const TerminalPanel = ({ history, onCommand, getCompletions }: TerminalPanelProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const lineBufferRef = useRef("");
  const cursorPosRef = useRef(0);
  const cmdHistoryRef = useRef<string[]>([]);
  const cmdHistoryCursorRef = useRef(-1);
  const printedRef = useRef(0);
  const safeFitRef = useRef<() => void>(() => undefined);
  const promptVisibleRef = useRef(false);
  const isSubmittingRef = useRef(false);

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
    term.write(`\r\x1b[2K${PROMPT}${buffer}`);
    const moveLeft = buffer.length - cursorPos;
    if (moveLeft > 0) {
      term.write(`\x1b[${moveLeft}D`);
    }
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
    if (promptVisibleRef.current) {
      term.write("\r\x1b[2K");
    }
    lines.forEach((line) => term.writeln(line));
    promptVisibleRef.current = true;
    renderPromptLine();
  };

  useEffect(() => {
    const term = new Terminal({
      theme: {
        background: "#020617",
        foreground: "#cbd5e1",
        cursor: "#22d3ee",
      },
      fontFamily: "JetBrains Mono, ui-monospace, Menlo, monospace",
      fontSize: 13,
      cursorBlink: true,
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
    term.writeln("欢迎来到 Git Learn 终端。输入 levels / hint / reset 或 git 命令开始。");
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

      if (data === "\r") {
        const command = lineBufferRef.current.trim();
        term.writeln(`> ${lineBufferRef.current}`);
        isSubmittingRef.current = true;
        if (command) {
          cmdHistoryRef.current.unshift(command);
          cmdHistoryCursorRef.current = -1;
          onCommand(command);
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
        const suggestions = getCompletions(lineBufferRef.current);
        if (suggestions.length === 1) {
          setInputBuffer(suggestions[0], suggestions[0].length);
        } else if (suggestions.length > 1) {
          term.write("\r\x1b[2K");
          term.writeln(suggestions.join("   "));
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
  }, [getCompletions, onCommand]);

  useEffect(() => {
    safeFitRef.current();
  }, [history.length]);

  useEffect(() => {
    if (!termRef.current) return;
    const nextLines = history.slice(printedRef.current);
    if (!nextLines.length) return;
    const lines = isSubmittingRef.current ? nextLines.filter((line) => !line.startsWith("> ")) : nextLines;
    printHistoryLines(lines);
    isSubmittingRef.current = false;
    printedRef.current = history.length;
  }, [history]);

  return <section className="terminal-panel card" ref={hostRef} />;
};

