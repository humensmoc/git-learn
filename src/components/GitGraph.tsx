import { motion } from "framer-motion";

import type { RepoSnapshot } from "../engine/snapshot";
import { buildGraphLayout } from "../viz/layout";

interface GitGraphProps {
  snapshot: RepoSnapshot;
}

const refColor = (type: "branch" | "tag" | "remote") => {
  if (type === "remote") return "#f59e0b";
  if (type === "tag") return "#8b5cf6";
  return "#10b981";
};

export const GitGraph = ({ snapshot }: GitGraphProps) => {
  const layout = buildGraphLayout(snapshot);
  const pointByHash = new Map(layout.commits.map((commit) => [commit.hash, commit]));
  const isEmpty = layout.commits.length === 0;

  return (
    <section className="graph-panel card">
      <header>
        <h3>Graph View</h3>
      </header>
      <div className="graph-scroll">
        <svg width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`}>
          <rect x={0} y={0} width={layout.width} height={layout.height} fill="#0b1220" />
          {isEmpty ? (
            <g>
              <rect
                x={layout.width / 2 - 210}
                y={layout.height / 2 - 56}
                width={420}
                height={112}
                rx={12}
                fill="#0f172a"
                stroke="#334155"
              />
              <text
                x={layout.width / 2}
                y={layout.height / 2 - 14}
                fill="#e2e8f0"
                textAnchor="middle"
                fontSize={18}
                fontWeight={700}
              >
                仓库还没有提交历史
              </text>
              <text x={layout.width / 2} y={layout.height / 2 + 18} fill="#94a3b8" textAnchor="middle" fontSize={14}>
                在终端输入 git commit 后，这里会显示分支和提交图
              </text>
            </g>
          ) : null}
          {layout.edges.map((edge) => {
            const from = pointByHash.get(edge.from);
            const to = pointByHash.get(edge.to);
            if (!from || !to) return null;
            const curve = `M ${from.x} ${from.y} C ${from.x - 30} ${from.y}, ${to.x + 30} ${to.y}, ${to.x} ${to.y}`;
            return <path key={`${edge.from}-${edge.to}`} d={curve} stroke="#334155" strokeWidth={3} fill="none" />;
          })}
          {layout.commits.map((commit) => (
            <motion.g
              key={commit.hash}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 140, damping: 14 }}
            >
              <circle cx={commit.x} cy={commit.y} r={16} fill="#60a5fa" />
              <text x={commit.x} y={commit.y + 38} fill="#cbd5e1" textAnchor="middle" fontSize={12}>
                {commit.hash.slice(0, 6)}
              </text>
            </motion.g>
          ))}
          {layout.refs.map((ref) => (
            <motion.g key={ref.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <rect x={ref.x - 34} y={ref.y - 12} width={68} height={20} rx={10} fill={refColor(ref.type)} />
              <text x={ref.x} y={ref.y + 2} fill="#0f172a" textAnchor="middle" fontSize={11} fontWeight={700}>
                {ref.name}
              </text>
            </motion.g>
          ))}
        </svg>
      </div>
    </section>
  );
};

