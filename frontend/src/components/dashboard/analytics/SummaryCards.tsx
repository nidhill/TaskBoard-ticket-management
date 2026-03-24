import { CheckCircle2, Edit2, Plus, Calendar } from "lucide-react";

interface SummaryCardsProps {
    stats: {
        doneInLast7Days: number;
        updatedInLast7Days: number;
        createdInLast7Days: number;
        dueInNext7Days: number;
    } | undefined;
}

const navStats = (stats: SummaryCardsProps['stats']) => [
    {
        label: 'done',
        subLabel: 'in the last 7 days',
        value: stats?.doneInLast7Days || 0,
        icon: CheckCircle2,
        accent: '#22c55e',
        iconBg: 'bg-green-50',
        iconColor: 'text-green-500',
        valueColor: 'text-green-600',
    },
    {
        label: 'updated',
        subLabel: 'in the last 7 days',
        value: stats?.updatedInLast7Days || 0,
        icon: Edit2,
        accent: '#3b82f6',
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-500',
        valueColor: 'text-blue-600',
    },
    {
        label: 'created',
        subLabel: 'in the last 7 days',
        value: stats?.createdInLast7Days || 0,
        icon: Plus,
        accent: '#a855f7',
        iconBg: 'bg-purple-50',
        iconColor: 'text-purple-500',
        valueColor: 'text-purple-600',
    },
    {
        label: 'due',
        subLabel: 'in the next 7 days',
        value: stats?.dueInNext7Days || 0,
        icon: Calendar,
        accent: '#f59e0b',
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-500',
        valueColor: 'text-amber-600',
    },
];

export function SummaryCards({ stats }: SummaryCardsProps) {
    const items = navStats(stats);
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {items.map((stat, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    {/* Accent strip */}
                    <div className="h-[3px]" style={{ background: stat.accent }} />
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                            </div>
                        </div>
                        <div
                            style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}
                            className="text-[36px] leading-none font-bold text-gray-900"
                        >
                            {stat.value}
                        </div>
                        <div className={`text-sm font-semibold mt-1.5 ${stat.valueColor}`}>{stat.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{stat.subLabel}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
