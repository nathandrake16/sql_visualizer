declare module 'sql.js/dist/sql-wasm-browser.js' {
  import type initSqlJs from 'sql.js';
  const mod: typeof initSqlJs & { default?: typeof initSqlJs };
  export = mod;
}
