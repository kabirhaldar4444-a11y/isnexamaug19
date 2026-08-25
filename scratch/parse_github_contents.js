import fs from 'fs';

const content = fs.readFileSync('C:/Users/Dell/.gemini/antigravity-ide/brain/bd6f495c-e0c0-4321-87f1-f72af20d53c5/.system_generated/steps/753/content.md', 'utf8');
const jsonStr = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
const items = JSON.parse(jsonStr);

console.log("Root Items on GitHub:");
items.forEach(item => {
  console.log(`- ${item.name} (${item.type})`);
});
