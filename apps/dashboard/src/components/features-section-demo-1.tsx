"use client";

import React from "react";
import { useId } from "react";

export default function FeaturesSectionDemo() {
  return (
    <div className="py-20 lg:py-40">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 md:gap-2 max-w-7xl mx-auto">
        {grid.map((feature) => (
          <div
            key={feature.title}
            className="relative bg-neutral-900/50 border border-neutral-800 p-8 rounded-3xl overflow-hidden hover:border-neutral-700 transition-all duration-500 group"
          >
            <Grid size={20} />
            <p className="text-lg font-medium text-white relative z-20">
              {feature.title}
            </p>
            <p className="text-neutral-500 mt-4 text-sm font-normal relative z-20 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const grid = [
  {
    title: "HIPAA & SOC2 Compliant",
    description:
      "Enterprise-grade security and compliance. Your data is protected with military-grade encryption and audit trails.",
  },
  {
    title: "Multi-Agent Orchestration",
    description:
      "Deploy and manage multiple AI agents simultaneously. Scale your operations with parallel processing capabilities.",
  },
  {
    title: "Real-time Analytics",
    description:
      "Monitor agent performance and business metrics with live dashboards and customizable reporting.",
  },
  {
    title: "Workflow Automation",
    description:
      "Create complex workflows with our visual builder. Automate repetitive tasks with conditional logic and triggers.",
  },
  {
    title: "Enterprise Integrations",
    description:
      "Connect to 100+ business tools including Salesforce, Slack, Google Workspace, and custom APIs.",
  },
  {
    title: "24/7 Monitoring",
    description:
      "Proactive system monitoring with automated alerts and self-healing capabilities for mission-critical operations.",
  },
  {
    title: "White-label Solutions",
    description:
      "Fully customizable branding and domain. Deploy Tendrra under your own company identity.",
  },
  {
    title: "Dedicated Support",
    description:
      "24/7 enterprise support with SLA guarantees. Get dedicated account managers for critical issues.",
  },
];

export const Grid = ({
  pattern,
  size,
}: {
  pattern?: number[][];
  size?: number;
}) => {
  const [p, setP] = React.useState<number[][]>([]);

  React.useEffect(() => {
    if (!pattern) {
      setP([
        [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
        [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
        [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
        [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
        [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
      ]);
    } else {
      setP(pattern);
    }
  }, [pattern]);

  if (p.length === 0) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-0  -ml-20 -mt-2 h-full w-full [mask-image:linear-gradient(white,transparent)]">
      <div className="absolute inset-0 bg-gradient-to-r  [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] dark:from-zinc-900/30 from-zinc-100/30 to-zinc-300/30 dark:to-zinc-900/30 opacity-100">
        <GridPattern
          width={size ?? 20}
          height={size ?? 20}
          x="-12"
          y="4"
          squares={p}
          className="absolute inset-0 h-full w-full  mix-blend-overlay dark:fill-white/10 dark:stroke-white/10 stroke-black/10 fill-black/10"
        />
      </div>
    </div>
  );
};

export function GridPattern({ width, height, x, y, squares, ...props }: any) {
  const patternId = useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y]: any, idx: number) => (
            <rect
              strokeWidth="0"
              key={`${x}-${y}-${idx}`}
              width={width + 1}
              height={height + 1}
              x={x * width}
              y={y * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}
