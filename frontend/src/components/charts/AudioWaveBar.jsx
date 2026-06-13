import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-accent)',
      borderRadius: 'var(--radius-md)',
      padding: '8px 14px',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}s</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value?.toFixed(1)}
          {p.name === 'volume' ? ' dB' : p.name === 'pace' ? ' wpm' : ''}
        </div>
      ))}
    </div>
  );
};

export default function AudioWaveBar({ data, metric = 'volume' }) {
  const defaultData = Array.from({ length: 30 }, (_, i) => ({
    time: (i * 10),
    volume: 45 + Math.random() * 30 - 15 + Math.sin(i / 3) * 10,
    pace: 120 + Math.random() * 60 - 30,
    pitch: 150 + Math.random() * 40,
  }));

  const chartData = data || defaultData;

  const COLOR_MAP = {
    volume: 'var(--teal)',
    pace:   'var(--amber)',
    pitch:  'var(--blue)',
  };

  const MEAN_MAP = {
    volume: 50,
    pace: 130,
    pitch: 165,
  };

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}
        barCategoryGap="20%">
        <CartesianGrid
          vertical={false}
          stroke="var(--border)"
          strokeDasharray="3 0"
          opacity={0.5}
        />
        <XAxis
          dataKey="time"
          tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
          tickFormatter={(v) => `${v}s`}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <ReferenceLine
          y={MEAN_MAP[metric]}
          stroke={COLOR_MAP[metric]}
          strokeDasharray="4 4"
          opacity={0.4}
        />
        <Bar
          dataKey={metric}
          fill={COLOR_MAP[metric]}
          fillOpacity={0.75}
          radius={[2, 2, 0, 0]}
          maxBarSize={12}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}