import type { RepoSnapshot } from "../engine/snapshot";

interface FilePanelProps {
  snapshot: RepoSnapshot;
}

export const FilePanel = ({ snapshot }: FilePanelProps) => {
  return (
    <section className="file-panel card">
      <h3>文件状态</h3>
      <div className="file-groups">
        <div>
          <h4>工作区</h4>
          <ul>
            {snapshot.workingTree.length ? (
              snapshot.workingTree.map((entry) => (
                <li key={entry.path}>
                  <span>{entry.path}</span>
                  <em>{entry.status}</em>
                </li>
              ))
            ) : (
              <li>clean</li>
            )}
          </ul>
        </div>
        <div>
          <h4>暂存区</h4>
          <ul>
            {snapshot.index.length ? snapshot.index.map((file) => <li key={file}>{file}</li>) : <li>empty</li>}
          </ul>
        </div>
      </div>
    </section>
  );
};

