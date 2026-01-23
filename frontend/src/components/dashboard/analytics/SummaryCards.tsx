import { Card, CardContent } from "@/components/ui/card";
import { Task, Ticket } from "@/types";
import { CheckCircle2, Edit2, Plus, Calendar } from "lucide-react";
import { subDays, isAfter, isBefore, addDays, startOfDay, endOfDay } from "date-fns";

interface SummaryCardsProps {
    tasks: Task[];
    tickets: Ticket[];
}

export function SummaryCards({ tasks, tickets }: SummaryCardsProps) {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 7);
    const sevenDaysFromNow = addDays(today, 7);

    // Filter Logic
    const doneInLast7Days = tasks.filter(t =>
        t.status === 'done' &&
        new Date(t.updatedAt) >= sevenDaysAgo
    ).length;

    const updatedInLast7Days = tasks.filter(t =>
        new Date(t.updatedAt) >= sevenDaysAgo
    ).length;

    const createdInLast7Days = tasks.filter(t =>
        new Date(t.createdAt) >= sevenDaysAgo
    ).length;

    const dueInNext7Days = tasks.filter(t =>
        t.dueDate &&
        isAfter(new Date(t.dueDate), startOfDay(today)) &&
        isBefore(new Date(t.dueDate), endOfDay(sevenDaysFromNow))
    ).length;

    const stats = [
        {
            label: "done",
            subLabel: "in the last 7 days",
            value: doneInLast7Days,
            icon: CheckCircle2,
            color: "bg-green-500/10 text-green-500",
            textColor: "text-green-500"
        },
        {
            label: "updated",
            subLabel: "in the last 7 days",
            value: updatedInLast7Days,
            icon: Edit2,
            color: "bg-blue-500/10 text-blue-500",
            textColor: "text-blue-500"
        },
        {
            label: "created",
            subLabel: "in the last 7 days",
            value: createdInLast7Days,
            icon: Plus,
            color: "bg-purple-500/10 text-purple-500",
            textColor: "text-purple-500"
        },
        {
            label: "due",
            subLabel: "in the next 7 days",
            value: dueInNext7Days,
            icon: Calendar,
            color: "bg-muted text-muted-foreground",
            textColor: "text-muted-foreground"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, i) => (
                <Card key={i} className="glass-card shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex flex-col h-full justify-between gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</span>
                                    <span className={`text-lg font-medium ${stat.textColor}`}>{stat.label}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{stat.subLabel}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
