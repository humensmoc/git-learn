import { getColorClass, resolveShortcutColorId, tokenizeGitCommand } from "../terminal/gitColors";

interface CommandLogLineProps {
  command: string;
  shortcutId?: string;
  showPrompt?: boolean;
}

export const CommandLogLine = ({ command, shortcutId, showPrompt = true }: CommandLogLineProps) => {
  const subcommandId = resolveShortcutColorId(command, shortcutId);
  const tokens = tokenizeGitCommand(command, shortcutId);

  return (
    <div className="command-log-line">
      {showPrompt ? <span className="git-token git-token--plain">$ </span> : null}
      {tokens.map((token, index) => (
        <span
          key={`${token.text}-${index}`}
          className={getColorClass(
            token.kind,
            token.kind === "subcommand" ? (token.subcommandId ?? subcommandId) : subcommandId,
          )}
        >
          {token.text}
        </span>
      ))}
    </div>
  );
};
