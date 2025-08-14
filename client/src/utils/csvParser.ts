export interface CSVHealthData {
  type: string;
  value: string;
  date: string;
  notes?: string;
}

export const parseCSV = (file: File): Promise<CSVHealthData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error("CSV file is empty"));
          return;
        }
        
        // Check if first line is header
        const hasHeader = lines[0].toLowerCase().includes('type') || 
                         lines[0].toLowerCase().includes('value') ||
                         lines[0].toLowerCase().includes('date');
        
        const dataLines = hasHeader ? lines.slice(1) : lines;
        const parsedData: CSVHealthData[] = [];
        
        for (let i = 0; i < dataLines.length; i++) {
          const line = dataLines[i].trim();
          if (!line) continue;
          
          const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
          
          if (columns.length < 3) {
            console.warn(`Skipping line ${i + 1}: insufficient columns`);
            continue;
          }
          
          const [type, value, date, notes] = columns;
          
          // Validate data type
          const validTypes = ['heart_rate', 'blood_pressure', 'weight', 'blood_sugar', 'temperature', 'steps', 'sleep'];
          if (!validTypes.includes(type)) {
            console.warn(`Skipping line ${i + 1}: invalid data type "${type}"`);
            continue;
          }
          
          // Validate date
          const parsedDate = new Date(date);
          if (isNaN(parsedDate.getTime())) {
            console.warn(`Skipping line ${i + 1}: invalid date "${date}"`);
            continue;
          }
          
          parsedData.push({
            type,
            value,
            date,
            notes: notes || undefined
          });
        }
        
        if (parsedData.length === 0) {
          reject(new Error("No valid data found in CSV file"));
          return;
        }
        
        resolve(parsedData);
      } catch (error) {
        reject(new Error("Error parsing CSV file: " + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };
    
    reader.readAsText(file);
  });
};

export const generateSampleCSV = (): string => {
  const sampleData = [
    "type,value,date,notes",
    "heart_rate,72,2024-03-01,Morning reading",
    "blood_pressure,120/80,2024-03-01,After exercise",
    "weight,70.5,2024-03-01,",
    "steps,8547,2024-03-01,Daily total",
    "sleep,7.5,2024-03-01,Good quality sleep"
  ];
  
  return sampleData.join('\n');
};
