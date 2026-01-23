import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task, TaskStatus } from "@/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from "recharts";

interface StatusDonutChartProps {
    tasks: Task[];
}

const statusColors: Record<string, string> = {
    to_do: '#9ca3af', // gray (muted)
    in_progress: '#3b82f6', // blue
    in_review: '#eab308', // yellow
    done: '#22c55e', // green
};

const statusLabels: Record<string, string> = {
    to_do: 'To Do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done'
};

export function StatusDonutChart({ tasks }: StatusDonutChartProps) {
    const data = [
        { name: 'to_do', value: tasks.filter(t => t.status === 'to_do').length },
        { name: 'in_progress', value: tasks.filter(t => t.status === 'in_progress').length },
        { name: 'in_review', value: tasks.filter(t => t.status === 'in_review').length },
        { name: 'done', value: tasks.filter(t => t.status === 'done').length },
    ].filter(item => item.value > 0);

    const total = tasks.length;

    if (total === 0) {
        return (
            <Card className="glass-card h-full">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Status overview</CardTitle>
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
                <CardTitle className="text-lg font-semibold">Status overview</CardTitle>
                <p className="text-xs text-muted-foreground">Current workload</p>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] relative">
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
                                    dy={25}
                                    className="text-xs fill-muted-foreground"
                                />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-3 mt-4">
                    {Object.keys(statusLabels).map((status) => {
                        const count = tasks.filter(t => t.status === status).length;
                        if (count === 0 && total > 0) return null;

                        return (
                            <div key={status} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: statusColors[status] }}
                                    />
                                    <span className="text-muted-foreground">{statusLabels[status]}</span>
                                </div>
                                <span className="font-medium text-foreground">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
