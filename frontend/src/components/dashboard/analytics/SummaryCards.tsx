import { CheckCircle2, Edit2, Plus, Clock } from "lucide-react";

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
        label: 'Done',
        subLabel: 'in the last 7 days',
        value: stats?.doneInLast7Days || 0,
        icon: CheckCircle2,
        iconBg: 'rgba(0,0,0,.06)',
        iconColor: '#9ca3af',
        urgent: false,
    },
    {
        label: 'Updated',
        subLabel: 'in the last 7 days',
        value: stats?.updatedInLast7Days || 0,
        icon: Edit2,
        iconBg: 'rgba(0,0,0,.06)',
        iconColor: '#9ca3af',
        urgent: false,
    },
    {
        label: 'Created',
        subLabel: 'in the last 7 days',
        value: stats?.createdInLast7Days || 0,
        icon: Plus,
        iconBg: 'rgba(0,0,0,.06)',
        iconColor: '#9ca3af',
        urgent: false,
    },
    {
        label: 'Due',
        subLabel: 'in the next 7 days',
        value: stats?.dueInNext7Days || 0,
        icon: Clock,
        iconBg: 'rgba(239,68,68,.1)',
        iconColor: '#ef4444',
        urgent: true,
    },
];

export function SummaryCards({ stats }: SummaryCardsProps) {
    const items = navStats(stats);
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {items.map((stat, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                    {/* Top row: label + icon */}
                    <div className="flex items-center justify-between mb-5">
                        <span className="text-[10px] font-bold uppercase tracking-[1.6px] text-gray-400">
                            {stat.label}
                        </span>
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: stat.iconBg }}
                        >
                            <stat.icon
                                className="w-3.5 h-3.5"
                                style={{ color: stat.iconColor }}
                            />
                        </div>
                    </div>

                    {/* Number */}
                    <div
                        style={{
                            fontFamily: 'Bricolage Grotesque, sans-serif',
                            fontSize: 40,
                            lineHeight: 1,
                            fontWeight: 800,
                            color: stat.urgent ? '#ef4444' : '#111',
                            letterSpacing: '-1px',
                        }}
                    >
                        {stat.value}
                    </div>
                    <div className="text-xs text-gray-400 mt-1.5">{stat.subLabel}</div>
                </div>
            ))}
        </div>
    );
}
