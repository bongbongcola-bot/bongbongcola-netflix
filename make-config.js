const fs = require('fs');
const path = require('path');

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let value = m[2];
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    out[m[1]] = value;
  }
  return out;
}

function makeConfig(dir = __dirname) {
  const envPath = path.join(dir, '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env 파일이 없어요. .env.example 을 .env 로 복사하고 키를 넣어주세요.');
  }
  const key = parseEnv(fs.readFileSync(envPath, 'utf8')).TMDB_API_KEY;
  if (!key || !/^[a-f0-9]{32}$/i.test(key)) {
    throw new Error('.env 의 TMDB_API_KEY 가 비었거나 형식이 달라요 (32자리 16진수 API 키).');
  }
  const body = `window.APP_CONFIG = Object.freeze(${JSON.stringify({ TMDB_API_KEY: key })});\n`;
  fs.writeFileSync(path.join(dir, 'config.js'), body, { mode: 0o600 });
}

module.exports = { makeConfig, parseEnv };

if (require.main === module) {
  try {
    makeConfig();
    console.log('config.js 를 만들었어요.');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
