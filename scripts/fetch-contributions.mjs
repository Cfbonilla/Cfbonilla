// Descarga el calendario de contribuciones del último año a data/contributions.json
// Uso: GITHUB_TOKEN=... GH_LOGIN=usuario node scripts/fetch-contributions.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const login = process.env.GH_LOGIN;
const token = process.env.GITHUB_TOKEN;
if (!login || !token) throw new Error('Faltan GH_LOGIN o GITHUB_TOKEN');

const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{
  totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;
const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'profile-readme' },
  body: JSON.stringify({ query, variables: { login } }),
});
const json = await res.json();
if (!res.ok || json.errors) throw new Error(`GraphQL falló: ${res.status} ${JSON.stringify(json.errors || json)}`);

const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const cal = json.data.user.contributionsCollection.contributionCalendar;
const days = cal.weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0 }));
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'contributions.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ total: cal.totalContributions, days }) + '\n');
console.log(`${login}: ${cal.totalContributions} contribuciones, ${days.length} días`);
