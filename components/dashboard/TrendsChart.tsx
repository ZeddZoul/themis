'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { colors } from '@/lib/design-system';
import { SimpleLoading } from '@/components/ui/simple-loading';

interface DailyStats {
  date: string;
  averageScore: number;
  totalIssues: number;
  highSeverity: number;
}

export function TrendsChart() {
  const [data, setData] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/v1/stats/history');
        if (!response.ok) throw new Error('Failed to fetch history');
        const stats = await response.json();
        
        // Format dates
        const formattedData = stats.map((item: any) => ({
          ...item,
          date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        }));
        
        setData(formattedData);
      } catch (err) {
        console.error(err);
        setError('Failed to load trends');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 w-full bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center bg-white rounded-xl border border-gray-200 p-6 text-gray-500">
        {error || 'No historical data available yet'}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text.primary }}>
        Compliance Trends (Last 30 Days)
      </h3>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary.accent} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={colors.primary.accent} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.status.error} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={colors.status.error} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: colors.text.secondary, fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              yAxisId="left"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: colors.text.secondary, fontSize: 12 }}
              domain={[0, 100]}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: colors.text.secondary, fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="averageScore"
              name="Avg. Score"
              stroke={colors.primary.accent}
              fillOpacity={1}
              fill="url(#colorScore)"
              strokeWidth={2}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="totalIssues"
              name="Total Issues"
              stroke={colors.status.error}
              fillOpacity={1}
              fill="url(#colorIssues)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
