import fs from 'fs';

const storeData = JSON.parse(fs.readFileSync('C:\\Users\\Salman Khattak\\Desktop\\ordora\\store-data.json', 'utf8'));
console.log(JSON.stringify(storeData, null, 2));
