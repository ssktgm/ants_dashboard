export const parseDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Match yyyy-m-d format. Added trim() to handle potential whitespace.
    const parts = dateStr.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!parts) {
        return null; // Does not match the expected yyyy-m-d format
    }
    
    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10);
    const day = parseInt(parts[3], 10);

    // Basic sanity checks for year, month, and day ranges
    if (year < 1971) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    // Use Date constructor with numbers, which is reliable.
    // Month is 0-indexed for the constructor.
    const d = new Date(year, month - 1, day);

    // Final validation to catch invalid dates like new Date(2024, 1, 30) which becomes March 1st
    // Check if the constructed date matches the parsed numbers.
    if (d.getFullYear() !== year || d.getMonth() !== (month - 1) || d.getDate() !== day) {
        return null;
    }
    
    return d; // Date object is already at local timezone midnight
};
