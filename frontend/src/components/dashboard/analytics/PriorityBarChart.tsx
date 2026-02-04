import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface PriorityBarChartProps {
    stats: {
        high: number;
        medium: number;
        low: number;
    } | undefined;
}

const priorityColors: Record<string, string> = {
    high: '#f97316', // orange
    medium: '#eab308', // yellow
    low: '#3b82f6', // blue
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

    if (total === 0) {
        return (
            <Card className="glass-card h-full">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Priority breakdown</CardTitle>
                    <p className="text-xs text-muted-foreground">in the last 14 days</p>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="glass-card h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Priority breakdown</CardTitle>
                <p className="text-xs text-muted-foreground">Current workload distribution</p>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} barSize={40}>
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => ''} // Hide x-axis labels as we use legend below
                                height={0}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={priorityColors[entry.name]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-y-2 mt-4">
                    {Object.keys(priorityLabels).map((priority) => (
                        <div key={priority} className="flex items-center gap-2 text-sm">
                            <span className="font-bold text-lg" style={{ color: priorityColors[priority] }}>
                                {priority === 'high' ? '^' : priority === 'medium' ? '=' : '⌄'}
                            </span>
                            <span className="text-muted-foreground" style={{ color: priorityColors[priority] }}>
                                {priorityLabels[priority]}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
