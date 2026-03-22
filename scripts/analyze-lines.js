const key = require('fs').readFileSync('.env', 'utf8').split('FIREBASE_PRIVATE_KEY=')[1].split(/\r?\n/)[0];
let i = 0;
while (i < key.length) {
    if (key[i] === '\\' && key[i+1] !== 'n') {
        console.log(`Bad backslash at ${i}: \\${key[i+1]}`);
        console.log(`Context: ${key.substring(i-10, i+10)}`);
    }
    i++;
}
