import { Task } from "@/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { MoreHorizontal } from "lucide-react";

interface PriorityBarChartProps {
    stats: {
        high: number;
        medium: number;
        low: number;
    } | undefined;
}

const priorityColors: Record<string, string> = {
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6',
};

const priorityLabels: Record<string, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low'
};

export function PriorityBarChart({ stats }: PriorityBarChartProps) {
    const data = [
        { name: 'high', value: stats?.high || 0 },
        { name: 'medium', value: stats?.medium || 0 },
        { name: 'low', value: stats?.low || 0 },
    ];

    const total = (stats?.high || 0) + (stats?.medium || 0) + (stats?.low || 0);

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm h-full">
            {/* Card header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Priority breakdown</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Current workload distribution</p>
                </div>
                <button className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            {/* Card body */}
            {total === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                            <rect x="3" y="3" width="4" height="14" rx="1" /><rect x="10" y="7" width="4" height="10" rx="1" /><rect x="17" y="5" width="4" height="12" rx="1" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">No data available</p>
                    <p className="text-xs text-gray-400 max-w-[200px]">Insufficient data to generate breakdown</p>
                </div>
            ) : (
                <div className="px-6 py-4">
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} barSize={44}>
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={() => ''}
                                    height={0}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,.03)' }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', backgroundColor: '#fff', fontSize: 12 }}
                                    formatter={(val: any, name: any) => [val, priorityLabels[name] || name]}
                                />
                                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={priorityColors[entry.name]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex gap-5 mt-3">
                        {Object.keys(priorityLabels).map((priority) => (
                            <div key={priority} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: priorityColors[priority] }} />
                                <span className="text-xs text-gray-500">{priorityLabels[priority]}</span>
                                <span className="text-xs font-semibold text-gray-800">{(stats as any)?.[priority] || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
