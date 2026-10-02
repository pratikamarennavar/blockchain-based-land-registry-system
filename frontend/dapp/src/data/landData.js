import csvText from './TN_Land_Registry_1000_Sample_Records1.csv?raw';

const parseCSV = (text) => {
  const lines = text
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const headers = lines[0].split(',').map(header => header.trim());

  return lines.slice(1).map(line => {
    const values = line.split(',');

    const record = {};

    headers.forEach((header, index) => {
      record[header] = values[index]?.trim() || '';
    });

    return record;
  });
};

const allLandRecords = parseCSV(csvText);

/*
  We are using the first 500 records for the project.
  The original dataset contains 1000 records.
*/
export const landRecords = allLandRecords.slice(0, 500);

export default landRecords;