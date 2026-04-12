const f = require('fs');
const text = f.readFileSync('logs.json', 'utf16le');
const jsonText = text.substring(text.indexOf('{'));
const data = JSON.parse(jsonText);
console.log(Object.keys(data.data));
if (data.data.resolution) console.log("Resolution:", data.data.resolution);
