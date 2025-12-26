import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface BarData {
  name: string
  tokens: number
  cost?: number
}

interface BarChartComponentProps {
  data: BarData[]
  height?: number
  showCost?: boolean
}

export default function BarChartComponent({ 
  data, 
  height = 300,
  showCost = false,
}: BarChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          tickFormatter={(value) => value.toLocaleString()}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'Tokens') return [value.toLocaleString(), name]
            if (name === 'Cost') return [`$${value.toFixed(4)}`, name]
            return [value, name]
          }}
        />
        <Legend />
        <Bar 
          dataKey="tokens" 
          name="Tokens"
          fill="#3b82f6" 
          radius={[4, 4, 0, 0]}
        />
        {showCost && (
          <Bar 
            dataKey="cost" 
            name="Cost"
            fill="#10b981" 
            radius={[4, 4, 0, 0]}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}
