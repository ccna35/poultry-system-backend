export const nowIso = (): string => new Date().toISOString();

export const toDateOnly = (dateInput: string): string => {
    const date = new Date(dateInput);
    return date.toISOString().slice(0, 10);
};

export const diffInDaysInclusive = (
    startDateInput: string,
    endDateInput: string,
): number => {
    const start = new Date(toDateOnly(startDateInput));
    const end = new Date(toDateOnly(endDateInput));
    const msInDay = 1000 * 60 * 60 * 24;
    const diff = Math.floor((end.getTime() - start.getTime()) / msInDay);
    return Math.max(1, diff + 1);
};