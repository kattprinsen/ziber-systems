import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ChartDataPoint } from '../../types/performance';

interface GroupPerformanceChartProps {
  data: ChartDataPoint[];
  target: number | null;
  selectedKey: string | null;
  onBarClick?: (key: string) => void;
  isLoading?: boolean;
}

const BAR_COLOR = '#6366f1';       // indigo-500 — default bar
const BAR_SELECTED = '#818cf8';    // indigo-400 — selected/active bar
const BAR_PARTIAL = '#a78bfa';     // violet-400 — partial/estimated data
const BAR_EMPTY = '#374151';       // gray-700 — zero-fill placeholder
const TARGET_COLOR = '#f59e0b';    // amber-500 — horizontal target line

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-2 h-[280px] flex flex-col justify-end px-4">
      {[40, 70, 55, 90, 65, 80].map((h, i) => (
        <div
          key={i}
          className="bg-gray-700 rounded-t"
          style={{ height: `${h}%`, flex: '1 0 0' }}
        />
      ))}
    </div>
  );
}

export function GroupPerformanceChart({
  data,
  target,
  selectedKey,
  onBarClick,
  isLoading = false,
}: GroupPerformanceChartProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400 text-sm">
        No performance data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{ top: 16, right: 24, left: 0, bottom: 0 }}
        onClick={(payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const active = (payload as any)?.activePayload?.[0];
          if (active && onBarClick) {
            onBarClick((active.payload as ChartDataPoint).key);
          }
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
          }}
          labelStyle={{ color: '#f9fafb', fontWeight: 600 }}
          itemStyle={{ color: '#d1d5db' }}
          formatter={(value, _name, props) => {
            const payload = props.payload as ChartDataPoint | undefined;
            const hours = typeof value === 'number' ? value : 0;
            if (payload?.hours === 0) return ['No data', 'Billed hours'];
            const partial = payload?.isPartial ? ' (partial)' : '';
            return [`${hours.toFixed(1)} h${partial}`, 'Billed hours'];
          }}
        />
        {target !== null && (
          <ReferenceLine
            y={target}
            stroke={TARGET_COLOR}
            strokeDasharray="6 3"
            label={{
              value: `Target: ${target} h`,
              fill: TARGET_COLOR,
              fontSize: 11,
              position: 'insideTopRight',
            }}
          />
        )}
        <Bar
          dataKey="hours"
          radius={[4, 4, 0, 0]}
          cursor={onBarClick ? 'pointer' : 'default'}
          minPointSize={4}
        >
          {data.map((entry) => {
            let fill: string;
            if (entry.hours === 0) {
              fill = BAR_EMPTY;
            } else if (entry.key === selectedKey) {
              fill = BAR_SELECTED;
            } else if (entry.isPartial) {
              fill = BAR_PARTIAL;
            } else {
              fill = BAR_COLOR;
            }
            return <Cell key={entry.key} fill={fill} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
