const fs = require('fs');
const envPath = '.env';
let env = fs.readFileSync(envPath, 'utf8');

// Find the private key line
const match = env.match(/FIREBASE_PRIVATE_KEY=(.*)/);
if (match) {
    let key = match[1];
    
    // Fix common missing 'n' points we identified
    // NaGMp\0vDPd -> NaGMp\n0vDPd
    // GPGWG\dn93d -> GPGWG\ndn93d
    // +YXFC\kowZD -> +YXFC\nkowZD
    // Oj/McV\ueFh -> Oj/McV\nueFh
    // ZJmUaZ\I9PZ -> ZJmUaZ\nI9PZ
    
    // Pattern: \ followed by a character that is NOT n
    let fixedKey = key.replace(/\\([^n])/g, '\\n$1');
    
    // Also check for twice escaped ones if any, but let's start with this
    
    const newEnv = env.replace(key, fixedKey);
    fs.writeFileSync(envPath, newEnv, 'utf8');
    console.log("Private key fixed!");
} else {
    console.log("Private key not found in .env");
}
