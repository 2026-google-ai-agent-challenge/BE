const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../src/data/complaints.csv');
const tsPath = path.join(__dirname, '../src/data/complaintsData.ts');

if (!fs.existsSync(csvPath)) {
  console.error('CSV file not found at:', csvPath);
  process.exit(1);
}

const csvData = fs.readFileSync(csvPath, 'utf8');
const lines = csvData.split('\n');

const headers = lines[0].trim().split(',');
const complaints = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // Simple CSV parser handling possible commas in quotes (though this file is simple comma-separated)
  const values = [];
  let currentVal = '';
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(currentVal);
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  values.push(currentVal);

  if (values.length >= 5) {
    complaints.push({
      created_at: values[0].replace(/"/g, ''),
      title: values[2].replace(/"/g, ''),
      content: values[3].replace(/"/g, ''),
      actual_department: values[4].replace(/"/g, ''),
      // Add placeholders for AI departments & reasons as required by schema
      ai_department_1: null,
      ai_department_2: null,
      ai_department_3: null,
      ai_reason: null,
      final_department: null
    });
  }
}

const tsContent = `export interface ComplaintData {
  title: string;
  content: string;
  actual_department: string;
  ai_department_1: string | null;
  ai_department_2: string | null;
  ai_department_3: string | null;
  ai_reason: string | null;
  final_department: string | null;
  created_at?: string;
}

export const complaintsData: ComplaintData[] = ${JSON.stringify(complaints, null, 2)};
`;

fs.writeFileSync(tsPath, tsContent, 'utf8');
console.log(`Successfully converted ${complaints.length} complaints to complaintsData.ts`);
