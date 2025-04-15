
/**
 * Format a date string to a Danish format
 * @param dateString ISO date string
 * @returns Formatted date string in Danish format (DD/MM/YYYY)
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('da-DK');
};

/**
 * Format a date string to a Danish format with time
 * @param dateString ISO date string
 * @returns Formatted date string in Danish format with time (DD/MM/YYYY HH:MM)
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('da-DK') + ' ' + date.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Check if a date is in the past
 * @param dateString ISO date string
 * @returns Boolean indicating if the date is in the past
 */
export const isPastDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date < new Date();
};

/**
 * Check if a date is today
 * @param dateString ISO date string
 * @returns Boolean indicating if the date is today
 */
export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

/**
 * Parse a date string in Danish format (DD/MM/YYYY) to a JavaScript Date object
 * @param dateString Danish format date string
 * @returns JavaScript Date object or null if invalid
 */
export const parseDanishDateString = (dateString: string): Date | null => {
  try {
    const parts = dateString.split('/');
    if (parts.length !== 3) {
      return null;
    }
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // months are 0-indexed in JS Date
    const year = parseInt(parts[2]);
    
    if (isNaN(day) || isNaN(month) || isNaN(year) || 
        day < 1 || day > 31 || month < 0 || month > 11) {
      return null;
    }
    
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
};

/**
 * Format a JavaScript Date object to a Danish date string (DD/MM/YYYY)
 * @param date JavaScript Date object
 * @returns Danish format date string
 */
export const formatToDanishDate = (date: Date): string => {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

/**
 * Convert ISO string to Date object safely
 * @param dateString ISO date string
 * @returns JavaScript Date object or null if invalid
 */
export const parseISODateString = (dateString: string): Date | null => {
  try {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
};

/**
 * Get formatted Danish date string from Date object or ISO string
 * @param date Date object or ISO string
 * @returns Formatted Danish date string or empty string if invalid
 */
export const getFormattedDate = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  return formatToDanishDate(dateObj);
};

/**
 * Get the current date as an ISO string
 * @returns Current date as ISO string
 */
export const getCurrentDateISO = (): string => {
  return new Date().toISOString();
};

/**
 * Get the current date as a Danish format string
 * @returns Current date in Danish format
 */
export const getCurrentDanishDate = (): string => {
  return formatToDanishDate(new Date());
};
