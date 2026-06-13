import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-accent)',
      borderRadius: 'var(--radius-md)',
      padding: '8px 12px',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
    }}>
      <span style={{ color: 'var(--amber)' }}>{payload[0]?.value?.toFixed(1)}%</span>
    </div>
  );
};

const CustomTick = ({ payload, x, y, cx, cy }) => {
  const EMOTION_ICONS = {
    Confident:   '◆',
    Nervous:     '◇',
    Engaged:     '▲',
    Distracted:  '▽',
    Positive:    '●',
    Neutral:     '○',
    Stressed:    '■',
    Calm:        '□',
  };
  const icon = EMOTION_ICONS[payload.value] || '·';
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="var(--text-secondary)"
      fontSize={11}
      fontFamily="var(--font-mono)"
    >
      {icon} {payload.value}
    </text>
  );
};

export default function EmotionRadar({ data }) {
  // data: [{ emotion: 'Confident', value: 78 }, ...]
  const chartData = data || [
    { emotion: 'Confident', value: 72 },
    { emotion: 'Engaged',   value: 85 },
    { emotion: 'Positive',  value: 68 },
    { emotion: 'Calm',      value: 55 },
    { emotion: 'Neutral',   value: 40 },
    { emotion: 'Nervous',   value: 28 },
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <PolarGrid
          stroke="var(--border)"
          strokeDasharray="3 3"
          gridType="polygon"
        />
        <PolarAngleAxis
          dataKey="emotion"
          tick={<CustomTick />}
          tickLine={false}
          axisLine={{ stroke: 'var(--border)' }}
        />
        <Radar
          dataKey="value"
          stroke="var(--amber)"
          fill="var(--amber)"
          fillOpacity={0.15}
          strokeWidth={2}
          dot={{ fill: 'var(--amber)', r: 3, strokeWidth: 0 }}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}