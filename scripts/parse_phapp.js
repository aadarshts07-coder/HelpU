const fs = require('fs');
const html = fs.readFileSync('cisco_sample.html', 'utf8');

const match = html.match(/var phApp\s*=\s*phApp\s*\|\|\s*({.*?});/s);
if (match) {
  const phApp = JSON.parse(match[1]);
  console.log('phApp configuration:');
  console.log(JSON.stringify(phApp, null, 2));
} else {
  console.log('No var phApp match');
}
