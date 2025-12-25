import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface DailyUsage {
  date: string
  tokens: number
  cost: number
  count: number
}

interface TokenUsageChartProps {
  data: DailyUsage[]
  height?: number
}

export default function TokenUsageChart({ data, height = 300 }: TokenUsageChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis 
          yAxisId="left"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          tickFormatter={(value) => value.toLocaleString()}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          tickFormatter={(value) => `$${value.toFixed(2)}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'tokens') return [value.toLocaleString(), 'Tokens']
            if (name === 'cost') return [`$${value.toFixed(4)}`, 'Cost']
            return [value, name]
          }}
        />
        <Legend />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="tokens"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorTokens)"
          name="Tokens"
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="cost"
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#colorCost)"
          name="Cost ($)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
