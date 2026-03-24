import api from '@/services/api';

// Download a CSV file from the backend export endpoint
export const downloadCSV = async (type: 'tickets' | 'tasks' | 'projects') => {
    const response = await api.get(`/export/${type}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

// Export any array of data as CSV directly in the browser (no backend needed)
export const exportToCSV = (data: any[], filename: string, columns: { key: string; label: string }[]) => {
    const header = columns.map((c) => c.label).join(',');
    const rows = data.map((row) =>
        columns.map((c) => {
            const val = c.key.split('.').reduce((obj: any, k: string) => obj?.[k], row) ?? '';
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};
