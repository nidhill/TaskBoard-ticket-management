import { PieChart, Pie, Cell, ResponsiveContainer, Label } from "recharts";
import { MoreHorizontal } from "lucide-react";

interface StatusDonutChartProps {
    stats: {
        to_do: number;
        in_progress: number;
        in_review: number;
        done: number;
    } | undefined;
}

const statusColors: Record<string, string> = {
    to_do: '#9ca3af',
    in_progress: '#3b82f6',
    in_review: '#eab308',
    done: '#22c55e',
};

const statusLabels: Record<string, string> = {
    to_do: 'To Do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done'
};

export function StatusDonutChart({ stats }: StatusDonutChartProps) {
    const data = [
        { name: 'to_do', value: stats?.to_do || 0 },
        { name: 'in_progress', value: stats?.in_progress || 0 },
        { name: 'in_review', value: stats?.in_review || 0 },
        { name: 'done', value: stats?.done || 0 },
    ].filter(item => item.value > 0);

    const total = (stats?.to_do || 0) + (stats?.in_progress || 0) + (stats?.in_review || 0) + (stats?.done || 0);

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm h-full">
            {/* Card header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Status overview</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Current workload</p>
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
                            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">No data available</p>
                    <p className="text-xs text-gray-400 max-w-[200px]">No data available for the current period</p>
                </div>
            ) : (
                <div className="px-6 py-4">
                    <div className="h-[220px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={statusColors[entry.name]} />
                                    ))}
                                    <Label
                                        value={total}
                                        position="center"
                                        className="text-3xl font-bold fill-foreground"
                                    />
                                    <Label
                                        value="Work items"
                                        position="center"
                                        dy={22}
                                        className="text-xs fill-muted-foreground"
                                    />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-2.5 mt-2">
                        {Object.keys(statusLabels).map((status) => {
                            const count = (stats as any)?.[status] || 0;
                            if (count === 0 && total > 0) return null;
                            return (
                                <div key={status} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[status] }} />
                                        <span className="text-gray-500 text-xs">{statusLabels[status]}</span>
                                    </div>
                                    <span className="font-semibold text-gray-800 text-xs">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
