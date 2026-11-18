CREATE TABLE IF NOT EXISTS vots (
  voter TEXT PRIMARY KEY,
  opcio TEXT NOT NULL CHECK(opcio IN ('simbols','mapa','fitxes','xarxa','ruta')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vots_opcio ON vots(opcio);
CREATE TABLE IF NOT EXISTS propostes (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 tipus TEXT NOT NULL,
 obra TEXT,
 missatge TEXT NOT NULL,
 font TEXT,
 nom TEXT,
 correu TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
