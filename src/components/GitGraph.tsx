import { motion } from "framer-motion";

import type { RepoSnapshot } from "../engine/snapshot";
import { buildGraphLayout } from "../viz/layout";

interface GitGraphProps {
  snapshot: RepoSnapshot;
}

const refColor = (type: "branch" | "tag" | "remote", active: boolean) => {
  if (active) return "var(--branch-active)";
  if (type === "remote") return "#ffd166";
  if (type === "tag") return "#d6b1ff";
  return "#b5f58f";
};

export const GitGraph = ({ snapshot }: GitGraphProps) => {
  const layout = buildGraphLayout(snapshot);
  const pointByHash = new Map(layout.commits.map((commit) => [commit.hash, commit]));
  const indexByHash = new Map(layout.commits.map((commit, index) => [commit.hash, `C${index}`]));
  const isEmpty = layout.commits.length === 0;

  return (
    <section className="graph-panel">
      <div className="graph-scroll">
        <svg width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`}>
          <defs>
            <marker
              id="edgeArrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--graph-edge)" />
            </marker>
          </defs>
          {isEmpty ? (
            <g>
              <rect
                x={layout.width / 2 - 210}
                y={layout.height / 2 - 56}
                width={420}
                height={112}
                rx={12}
                fill="var(--graph-empty-bg)"
                stroke="var(--graph-empty-border)"
                strokeWidth={2}
              />
              <text
                x={layout.width / 2}
                y={layout.height / 2 - 14}
                fill="var(--graph-empty-text)"
                textAnchor="middle"
                fontSize={18}
                fontWeight={700}
              >
                仓库还没有提交历史
              </text>
              <text x={layout.width / 2} y={layout.height / 2 + 18} fill="var(--graph-empty-text-soft)" textAnchor="middle" fontSize={14}>
                在终端输入 git commit 后，这里会显示分支和提交图
              </text>
            </g>
          ) : null}
          {layout.edges.map((edge) => {
            const from = pointByHash.get(edge.from);
            const to = pointByHash.get(edge.to);
            if (!from || !to) return null;
            const curve = `M ${from.x} ${from.y} C ${from.x - 26} ${from.y}, ${to.x + 26} ${to.y}, ${to.x} ${to.y}`;
            return (
              <path
                key={`${edge.from}-${edge.to}`}
                d={curve}
                stroke="var(--graph-edge)"
                strokeWidth={2.4}
                fill="none"
                markerEnd="url(#edgeArrow)"
              />
            );
          })}
          {layout.commits.map((commit) => (
            <motion.g
              key={commit.hash}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 140, damping: 14 }}
            >
              <circle cx={commit.x} cy={commit.y} r={19} fill="var(--graph-node)" stroke="var(--graph-node-stroke)" strokeWidth={2.2} />
              <text x={commit.x} y={commit.y + 5} fill="var(--graph-label-text)" textAnchor="middle" fontSize={12} fontWeight={700}>
                {indexByHash.get(commit.hash)}
              </text>
            </motion.g>
          ))}
          {layout.refs.map((ref) => (
            <motion.g key={ref.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <rect
                x={ref.x - 38}
                y={ref.y - 13}
                width={76}
                height={22}
                rx={11}
                fill={refColor(ref.type, snapshot.head === ref.name)}
                stroke="var(--graph-node-stroke)"
                strokeWidth={1.4}
              />
              <path d={`M ${ref.x - 8} ${ref.y + 9} L ${ref.x} ${ref.y + 18} L ${ref.x + 8} ${ref.y + 9} Z`} fill="var(--graph-node-stroke)" />
              <text x={ref.x} y={ref.y + 2} fill="var(--graph-label-text)" textAnchor="middle" fontSize={11} fontWeight={700}>
                {snapshot.head === ref.name ? `${ref.name}*` : ref.name}
              </text>
            </motion.g>
          ))}
        </svg>
      </div>
    </section>
  );
};

