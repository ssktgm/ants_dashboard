// Remove BOM (Byte Order Mark) if it exists at the beginning of the file
export const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
   
  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xFEFF) {
      headerLine = headerLine.substring(1);
  }
  const headers = headerLine.split(',').map(h => h.trim());
  const result = [];
   
  for (let i = 1; i < lines.length; i++) {
    const currentline = lines[i].split(',');
    if (currentline.length <= 1) continue;
    
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let val = currentline[j] ? currentline[j].trim() : '';
      if (!['選手ID', '名前', '日付', '試合ID', 'スコア', 'カテゴリ', '球場', 'タイトル', '背番号', '先攻', '後攻'].includes(headers[j])) {
         if (!isNaN(val) && val !== '') {
             val = Number(val);
         }
      }
      obj[headers[j]] = val;
    }
    result.push(obj);
  }
  return result;
};
