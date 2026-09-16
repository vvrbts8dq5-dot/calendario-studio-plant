// ══════════════════════════════════════════════════════════════════════
// STORICO BUDGET CONTRACT v2 — dati estratti cella per cella dai 249 file
// Excel della cartella "01_BUDGET CONTRACT Archivio" (settembre 2026).
// Una riga per persona × livello × disciplina per ogni file/fase.
// Regole concordate con Giovanni:
//  - Senior solo Marco Dante (Ele) e Michele Arnosti (Mec); tutti gli altri Junior.
//  - File nuovi (colonne SENIOR/JUNIOR ELE/MEC): disciplina come scritta nel file.
//  - File vecchi (colonne con nomi): disciplina abituale della persona
//    (Marco Sorgato, Giovanni = Ele; Zabeo/"Marchetto", Alessio, Enrico, Amine, David = Mec).
//  - Colonne senza nome e senza indicazione: Junior, disciplina "nd" (non indicata).
//  - Escluse le righe d'esempio del modello (MD "Progetto preliminare per comune" +
//    MS "Leg squat") in 25084 VARIANTE e 25085: record con righe vuote, così lo
//    strumento toglie anche le 8 h fittizie importate a inizio settembre.
// Totale: 12154,1 ore in 230 file/fasi, 621 righe.
// Usato una tantum da migrazione_storico_v2.js.
// ══════════════════════════════════════════════════════════════════════
const STORICO_BUDGET_V2 = [
{
"numero": "23004",
"fase": "AS BUILT APT",
"file": "23004_BUDGET CONTRACT AS BUILT APT.xlsx",
"salvatoIl": "2026-08-28",
"km": 30,
"speseVive": 121,
"righe": [
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "nd",
"ore": 333.0
},
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "ele",
"ore": 47.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 37.0
}
]
},
{
"numero": "23004",
"fase": "ESECUTIVO GENERALE",
"file": "23004_BUDGET CONTRACT ESECUTIVO GENERALE.xlsx",
"salvatoIl": "2026-09-02",
"km": 62,
"speseVive": 6,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 348.0
},
{
"persona": "David Digioseffo",
"livello": "junior",
"disciplina": "mec",
"ore": 22.0
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 26.0
},
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 185.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 76.3
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 720.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1157.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 190.0
}
]
},
{
"numero": "23027",
"fase": "",
"file": "23027_BUDGET CONTRACT.xlsx",
"salvatoIl": "2024-09-13",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 13.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 56.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 42.5
}
]
},
{
"numero": "23040",
"fase": "",
"file": "23040_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-10",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 18.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 79.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 15.5
}
]
},
{
"numero": "23041",
"fase": "",
"file": "23041_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-10-08",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 14.0
},
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "nd",
"ore": 0.5
},
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "mec",
"ore": 20.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 27.0
}
]
},
{
"numero": "23042",
"fase": "",
"file": "23042_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-06",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 4.0
},
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "mec",
"ore": 16.0
}
]
},
{
"numero": "23045",
"fase": "",
"file": "23045_BUDGET CONTRACT.xlsx",
"salvatoIl": "2023-04-14",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "23050",
"fase": "",
"file": "23050_BUDGET CONTRACT.xlsx",
"salvatoIl": "2024-10-28",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 7.0
},
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 8.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 10.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 20.0
}
]
},
{
"numero": "23055",
"fase": "",
"file": "23055_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-06-03",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 2.0
},
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "23060",
"fase": "",
"file": "23060_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-04",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 30.5
},
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "nd",
"ore": 11.0
},
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "mec",
"ore": 10.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "23062",
"fase": "",
"file": "23062_BUDGET CONTRACT.xlsx",
"salvatoIl": "2023-12-19",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 1.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 11.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 10.5
}
]
},
{
"numero": "23064",
"fase": "",
"file": "23064_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-05-12",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 9.0
},
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "mec",
"ore": 12.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 15.5
}
]
},
{
"numero": "23067",
"fase": "",
"file": "23067_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-11-18",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "nd",
"ore": 8.0
},
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "mec",
"ore": 7.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 8.0
}
]
},
{
"numero": "23079",
"fase": "",
"file": "23079_BUDGET CONTRACT.xlsx",
"salvatoIl": "2024-12-18",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 7.5
}
]
},
{
"numero": "23082",
"fase": "",
"file": "23082_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-06-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 29.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 0.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 2.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 11.5
}
]
},
{
"numero": "23094",
"fase": "",
"file": "23094_BUDGET CONTRACT.xlsx",
"salvatoIl": "2023-10-18",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 47.5
}
]
},
{
"numero": "23095",
"fase": "",
"file": "23095_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-03-19",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 3.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 9.5
}
]
},
{
"numero": "23098",
"fase": "",
"file": "23098_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-21",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 46.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 8.5
}
]
},
{
"numero": "23104",
"fase": "",
"file": "23104_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-13",
"km": 40,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 9.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 59.5
}
]
},
{
"numero": "23106",
"fase": "",
"file": "23106_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-12-09",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 26.0
},
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 12.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 87.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 16.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "23114",
"fase": "",
"file": "23114_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-20",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 9.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 4.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 116.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 18.0
}
]
},
{
"numero": "23115",
"fase": "",
"file": "23115_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-01-07",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "mec",
"ore": 17.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 1.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 2.5
}
]
},
{
"numero": "23118",
"fase": "",
"file": "23118_BUDGET CONTRACT.xlsx",
"salvatoIl": "2024-02-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 28.5
}
]
},
{
"numero": "23119",
"fase": "",
"file": "23119_BUDGET CONTRACT.xlsx",
"salvatoIl": "2024-03-01",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 21.0
}
]
},
{
"numero": "23120",
"fase": "",
"file": "23120_BUDGET CONTRACT.xlsx",
"salvatoIl": "2024-01-12",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 21.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 5.0
}
]
},
{
"numero": "23121",
"fase": "",
"file": "23121_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 13.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "23123",
"fase": "",
"file": "23123_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-28",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 13.5
},
{
"persona": "David Digioseffo",
"livello": "junior",
"disciplina": "mec",
"ore": 16.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 3.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 20.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 21.5
}
]
},
{
"numero": "24002",
"fase": "",
"file": "24002_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-30",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 58.5
},
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 9.5
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 2.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 62.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 54.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "24004",
"fase": "",
"file": "24004_BUDGET Contract.xlsx",
"salvatoIl": "2026-05-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 22.0
},
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 3.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 2.5
}
]
},
{
"numero": "24015",
"fase": "",
"file": "24015_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-12-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 24.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 8.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 3.0
}
]
},
{
"numero": "24017",
"fase": "",
"file": "24017_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-27",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 2.0
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 4.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 2.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 8.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 12.0
}
]
},
{
"numero": "24020",
"fase": "",
"file": "24020_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-12-09",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 4.0
},
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "nd",
"ore": 6.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 0.5
}
]
},
{
"numero": "24022",
"fase": "",
"file": "24022_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-06-05",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "24031",
"fase": "",
"file": "24031_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-04-23",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 12.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 43.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 58.0
}
]
},
{
"numero": "24032",
"fase": "",
"file": "24032_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 10.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 19.5
}
]
},
{
"numero": "24033",
"fase": "",
"file": "24033_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-10",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 11.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 44.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 33.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 5.0
}
]
},
{
"numero": "24034",
"fase": "",
"file": "24034_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-04-24",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 5.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 337.5
}
]
},
{
"numero": "24035",
"fase": "",
"file": "24035_BUDGET CONTRACT.xlsx",
"salvatoIl": "2024-05-31",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 23.5
}
]
},
{
"numero": "24037",
"fase": "",
"file": "24037_BUDGET CONTRACT.xlsx",
"salvatoIl": "2024-04-30",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "24039",
"fase": "",
"file": "24039_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-06",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Amine Raghib",
"livello": "junior",
"disciplina": "mec",
"ore": 4.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "24041",
"fase": "",
"file": "24041_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-05-22",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 6.0
}
]
},
{
"numero": "24050",
"fase": "",
"file": "24050_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-05-14",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 26.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 23.0
}
]
},
{
"numero": "24052",
"fase": "",
"file": "24052_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 22.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 10.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 79.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 37.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 5.0
}
]
},
{
"numero": "24053",
"fase": "",
"file": "24053_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-21",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 5.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 6.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 3.0
}
]
},
{
"numero": "24058",
"fase": "DM+DEF+ESEC",
"file": "24058_BUDGET CONTRACT DM+DEF+ESEC.xlsx",
"salvatoIl": "2026-05-14",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 99.5
},
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 106.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 80.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 237.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 291.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 80.0
}
]
},
{
"numero": "24058",
"fase": "VARIANTE OTT 2025",
"file": "24058_BUDGET CONTRACT VARIANTE OTT 2025.xlsx",
"salvatoIl": "2026-07-21",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 92.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 5.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 55.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 7.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "ele",
"ore": 1.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 5.5
}
]
},
{
"numero": "24060",
"fase": "",
"file": "24060_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-30",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 28.0
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 29.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 29.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 7.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "24067",
"fase": "",
"file": "24067_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 20.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 18.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 8.0
}
]
},
{
"numero": "24071",
"fase": "",
"file": "24071_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-02-27",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 0.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 18.0
}
]
},
{
"numero": "24072",
"fase": "",
"file": "24072_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-03-11",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 16.5
}
]
},
{
"numero": "24076",
"fase": "",
"file": "24076_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-03-24",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 3.5
}
]
},
{
"numero": "24078",
"fase": "",
"file": "24078_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 8.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 2.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 21.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 24.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 11.5
}
]
},
{
"numero": "24079",
"fase": "",
"file": "24079_BUDGET CONTRACT.xlsx",
"salvatoIl": "2024-10-14",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 2.5
}
]
},
{
"numero": "24081",
"fase": "",
"file": "24081_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-12-09",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 9.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 19.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 10.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "24084",
"fase": "",
"file": "24084_BUDGET CONTRACT.xlsx",
"salvatoIl": "2024-10-29",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "24085",
"fase": "",
"file": "24085_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-05-14",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 0.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 24.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 15.5
}
]
},
{
"numero": "24086",
"fase": "",
"file": "24086_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-07",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 7.5
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 40.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 2.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 31.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 21.5
}
]
},
{
"numero": "24088",
"fase": "",
"file": "24088_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-04",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 6.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "24090",
"fase": "",
"file": "24090_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-01-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 42.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 11.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 28.5
}
]
},
{
"numero": "24091",
"fase": "",
"file": "24091_BUDGET CONTRACT.xlsx",
"salvatoIl": "2024-12-03",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "24092",
"fase": "",
"file": "24092_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-03-11",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "ele",
"ore": 4.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 10.5
}
]
},
{
"numero": "24093",
"fase": "",
"file": "24093_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-04-09",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 3.0
}
]
},
{
"numero": "24094",
"fase": "",
"file": "24094_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-01",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 9.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 1.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 31.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 11.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 10.0
}
]
},
{
"numero": "24095",
"fase": "",
"file": "24095_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-01-22",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 2.5
}
]
},
{
"numero": "24096",
"fase": "",
"file": "24096_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-21",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 4.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 24.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "24097",
"fase": "",
"file": "24097_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 12.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 16.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 8.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 6.0
}
]
},
{
"numero": "24098",
"fase": "",
"file": "24098_BUDGET CONTRACT.xlsx",
"salvatoIl": "2024-12-03",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "24099",
"fase": "",
"file": "24099_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-10",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 51.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 32.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 36.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 12.5
}
]
},
{
"numero": "24100",
"fase": "",
"file": "24100_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 34.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 2.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 64.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 10.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "24101",
"fase": "",
"file": "24101_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-04-01",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 1.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 51.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 6.5
}
]
},
{
"numero": "24105",
"fase": "",
"file": "24105_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-07",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 17.5
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 11.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 4.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 3.5
}
]
},
{
"numero": "24106",
"fase": "",
"file": "24106_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 48.5
},
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "ele",
"ore": 7.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 0.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 19.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 8.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "25002",
"fase": "",
"file": "25002_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-10-01",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 23.5
}
]
},
{
"numero": "25006",
"fase": "",
"file": "25006_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-11-04",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 0.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 28.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 7.0
}
]
},
{
"numero": "25009",
"fase": "",
"file": "25009_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-02-06",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 5.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 19.5
}
]
},
{
"numero": "25010",
"fase": "",
"file": "25010_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-03",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "25011",
"fase": "",
"file": "25011_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-02-10",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "25012",
"fase": "",
"file": "25012_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 1.5
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 1.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 27.0
}
]
},
{
"numero": "25016",
"fase": "",
"file": "25016_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-07-14",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "25017",
"fase": "",
"file": "25017_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-07-14",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "25018",
"fase": "",
"file": "25018_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-30",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 4.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 10.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 5.5
}
]
},
{
"numero": "25023",
"fase": "",
"file": "25023_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-09-19",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 171.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 25.5
}
]
},
{
"numero": "25024",
"fase": "",
"file": "25024_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-04-04",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 20.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 23.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 11.5
}
]
},
{
"numero": "25026",
"fase": "",
"file": "25026_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-04-04",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "25027",
"fase": "",
"file": "25027_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-06-22",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 3.5
}
]
},
{
"numero": "25028",
"fase": "",
"file": "25028_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-05-13",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "25030",
"fase": "",
"file": "25030_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-03-31",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 5.5
}
]
},
{
"numero": "25033",
"fase": "",
"file": "25033_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-12-09",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 14.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 0.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 31.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 5.5
}
]
},
{
"numero": "25036",
"fase": "",
"file": "25036_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-07",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 0.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 8.5
}
]
},
{
"numero": "25037",
"fase": "",
"file": "25037_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-04-29",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 3.0
}
]
},
{
"numero": "25038",
"fase": "",
"file": "25038_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-28",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 6.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 11.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 41.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 30.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 2.5
}
]
},
{
"numero": "25039",
"fase": "",
"file": "25039_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-28",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 8.5
}
]
},
{
"numero": "25043",
"fase": "",
"file": "25043_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-05-15",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 6.5
}
]
},
{
"numero": "25045",
"fase": "",
"file": "25045_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-05-15",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "25046",
"fase": "",
"file": "25046_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "David Digioseffo",
"livello": "junior",
"disciplina": "mec",
"ore": 6.5
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 1.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 8.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 22.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 3.0
}
]
},
{
"numero": "25049",
"fase": "",
"file": "25049_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-05-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 0.5
}
]
},
{
"numero": "25051",
"fase": "",
"file": "25051_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-05-29",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 0.5
}
]
},
{
"numero": "25052",
"fase": "",
"file": "25052_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-07-30",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 56.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 32.5
}
]
},
{
"numero": "25053",
"fase": "",
"file": "25053_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-27",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 6.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 8.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 5.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "25054",
"fase": "",
"file": "25054_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-17",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 1.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 11.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 7.0
}
]
},
{
"numero": "25055",
"fase": "",
"file": "25055_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-31",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "ele",
"ore": 3.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 5.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 12.0
}
]
},
{
"numero": "25056",
"fase": "",
"file": "25056_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-04-27",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 49.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 2.5
}
]
},
{
"numero": "25057",
"fase": "",
"file": "25057_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-06-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 6.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 41.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 25.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 3.0
}
]
},
{
"numero": "25058",
"fase": "",
"file": "25058_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-06-25",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "25059",
"fase": "",
"file": "25059_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-06-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 17.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 74.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 13.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 3.0
}
]
},
{
"numero": "25061",
"fase": "",
"file": "25061_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-07-11",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 4.5
}
]
},
{
"numero": "25062",
"fase": "",
"file": "25062_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-07-24",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "25063",
"fase": "",
"file": "25063_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 7.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "25065",
"fase": "",
"file": "25065_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-12-10",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 7.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "25066",
"fase": "",
"file": "25066_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-16",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 17.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 1.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 7.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 4.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 3.5
}
]
},
{
"numero": "25067",
"fase": "",
"file": "25067_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-12-05",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 14.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 0.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "25069",
"fase": "",
"file": "25069_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-07-21",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 0.5
}
]
},
{
"numero": "25071",
"fase": "",
"file": "25071_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-10-07",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 44.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 9.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "25072",
"fase": "",
"file": "25072_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-30",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 65.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 4.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 29.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 2.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 10.5
}
]
},
{
"numero": "25073",
"fase": "",
"file": "25073_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 6.0
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 34.0
},
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 7.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 9.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 21.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 16.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 17.5
}
]
},
{
"numero": "25074",
"fase": "",
"file": "25074_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-12-09",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 2.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 0.5
}
]
},
{
"numero": "25075",
"fase": "",
"file": "25075_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-02-27",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 6.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 0.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 1.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "25076",
"fase": "",
"file": "25076_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-12-09",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 2.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "25077",
"fase": "",
"file": "25077_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-21",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 46.0
},
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 3.5
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 4.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 32.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 13.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "ele",
"ore": 2.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 11.0
}
]
},
{
"numero": "25078",
"fase": "",
"file": "25078_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-09-09",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 2.5
}
]
},
{
"numero": "25080",
"fase": "",
"file": "25080_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-09-29",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 6.5
}
]
},
{
"numero": "25081",
"fase": "",
"file": "25081_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-09-18",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 0.5
}
]
},
{
"numero": "25082",
"fase": "",
"file": "25082_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-09-24",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "25084",
"fase": "DEFINITIVO",
"file": "25084_BUDGET CONTRACT DEFINITIVO.xlsx",
"salvatoIl": "2025-10-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 8.0
}
]
},
{
"numero": "25084",
"fase": "VARIANTE",
"file": "25084_BUDGET CONTRACT VARIANTE.xlsx",
"salvatoIl": "2025-10-07",
"km": 0,
"speseVive": 0,
"righe": []
},
{
"numero": "25085",
"fase": "",
"file": "25085_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-10-07",
"km": 0,
"speseVive": 0,
"righe": []
},
{
"numero": "25086",
"fase": "ESECUTIVO",
"file": "25086_BUDGET CONTRACT ESECUTIVO.xlsx",
"salvatoIl": "2026-04-27",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 8.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 35.0
}
]
},
{
"numero": "25086",
"fase": "PRELIMINARE",
"file": "25086_BUDGET CONTRACT PRELIMINARE.xlsx",
"salvatoIl": "2025-10-20",
"km": 6,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 1.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 13.0
}
]
},
{
"numero": "25087",
"fase": "",
"file": "25087_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-11-03",
"km": 40,
"speseVive": 0,
"righe": [
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 5.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 5.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 6.5
}
]
},
{
"numero": "25088",
"fase": "",
"file": "25088_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-28",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 1.3
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 10.0
}
]
},
{
"numero": "25089",
"fase": "",
"file": "25089_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-10-24",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 5.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 2.5
}
]
},
{
"numero": "25090",
"fase": "",
"file": "25090_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-01-26",
"km": 3,
"speseVive": 3,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 24.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 10.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "25091",
"fase": "",
"file": "25091_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-10-30",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 0.5
}
]
},
{
"numero": "25092",
"fase": "",
"file": "25092_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-11-04",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "25093",
"fase": "",
"file": "25093_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-01-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 39.0
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 9.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 0.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 6.5
}
]
},
{
"numero": "25094",
"fase": "",
"file": "25094_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-12-09",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 7.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "25095",
"fase": "",
"file": "25095_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-28",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 10.5
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 6.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 70.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 30.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "ele",
"ore": 1.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "25096",
"fase": "",
"file": "25096_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-01-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 22.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 2.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 4.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 2.5
}
]
},
{
"numero": "25097",
"fase": "",
"file": "25097_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-16",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 9.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 0.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 6.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 3.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "25098",
"fase": "",
"file": "25098_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-12-09",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 7.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "25099",
"fase": "",
"file": "25099_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-07",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 8.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "25101",
"fase": "",
"file": "25101_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-02-06",
"km": 40,
"speseVive": 0,
"righe": [
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 0.5
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 3.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 9.0
}
]
},
{
"numero": "25102",
"fase": "",
"file": "25102_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 6.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 12.0
}
]
},
{
"numero": "25103",
"fase": "",
"file": "25103_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-04-27",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 7.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 11.0
}
]
},
{
"numero": "25104",
"fase": "",
"file": "25104_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-16",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 3.0
},
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 9.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 10.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 9.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "25105",
"fase": "",
"file": "25105_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 4.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 3.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 7.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "mec",
"ore": 0.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 4.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "ele",
"ore": 1.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 0.5
}
]
},
{
"numero": "25106",
"fase": "",
"file": "25106_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-12-01",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "25107",
"fase": "",
"file": "25107_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-12-01",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "25108",
"fase": "",
"file": "25108_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-12-01",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 0.5
}
]
},
{
"numero": "25109",
"fase": "",
"file": "25109_BUDGET CONTRACT.xlsx",
"salvatoIl": "2025-12-09",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "25110",
"fase": "",
"file": "25110_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-04-13",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 3.0
}
]
},
{
"numero": "25111",
"fase": "",
"file": "25111_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-01-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "mec",
"ore": 8.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 3.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 0.5
}
]
},
{
"numero": "25112",
"fase": "",
"file": "25112_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 8.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 19.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 25.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 8.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "ele",
"ore": 2.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 12.0
}
]
},
{
"numero": "25113",
"fase": "",
"file": "25113_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-01-08",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Junior non indicato",
"livello": "junior",
"disciplina": "mec",
"ore": 3.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 3.5
}
]
},
{
"numero": "25114",
"fase": "",
"file": "25114_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 2.0
},
{
"persona": "David Digioseffo",
"livello": "junior",
"disciplina": "mec",
"ore": 35.0
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 58.0
},
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 19.5
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 3.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 63.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "mec",
"ore": 32.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 52.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "ele",
"ore": 4.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 21.5
}
]
},
{
"numero": "26001",
"fase": "",
"file": "26001_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 3.5
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 5.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 18.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "ele",
"ore": 0.5
}
]
},
{
"numero": "26002",
"fase": "",
"file": "26002_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-09",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 5.5
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 4.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 11.5
}
]
},
{
"numero": "26003",
"fase": "",
"file": "26003_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 3.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "26004",
"fase": "",
"file": "26004_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 9.0
},
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 3.5
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 1.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 3.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 9.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "26005",
"fase": "",
"file": "26005_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-06-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 20.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 25.0
}
]
},
{
"numero": "26007",
"fase": "",
"file": "26007_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-04-27",
"km": 6736,
"speseVive": 694.1,
"righe": [
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 329.5
},
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 45.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 15.5
}
]
},
{
"numero": "26010",
"fase": "",
"file": "26010_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-02-09",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 1.5
}
]
},
{
"numero": "26011",
"fase": "",
"file": "26011_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-04",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 6.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "26012",
"fase": "",
"file": "26012_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-04",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 0.5
}
]
},
{
"numero": "26013",
"fase": "",
"file": "26013_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-09",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 6.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 2.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 10.5
}
]
},
{
"numero": "26014",
"fase": "",
"file": "26014_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-31",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "ele",
"ore": 5.0
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 7.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 1.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 13.5
}
]
},
{
"numero": "26015",
"fase": "",
"file": "26015_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-04-27",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "26016",
"fase": "",
"file": "26016_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-06-19",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "26017",
"fase": "",
"file": "26017_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-09",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 3.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "26018",
"fase": "",
"file": "26018_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-14",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 5.0
}
]
},
{
"numero": "26019",
"fase": "",
"file": "26019_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 58.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 5.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 5.0
}
]
},
{
"numero": "26020",
"fase": "",
"file": "26020_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-06-17",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 28.0
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "ele",
"ore": 8.0
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 11.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 1.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 2.5
}
]
},
{
"numero": "26021",
"fase": "",
"file": "26021_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-04-27",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 2.5
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 2.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 2.0
}
]
},
{
"numero": "26022",
"fase": "",
"file": "26022_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-18",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 2.5
}
]
},
{
"numero": "26023",
"fase": "",
"file": "26023_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-03",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 73.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 10.5
}
]
},
{
"numero": "26024",
"fase": "",
"file": "26024_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-05",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 35.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 0.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 17.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 12.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 10.5
}
]
},
{
"numero": "26025",
"fase": "",
"file": "26025_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "David Digioseffo",
"livello": "junior",
"disciplina": "mec",
"ore": 15.5
},
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 21.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 1.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 18.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 3.0
}
]
},
{
"numero": "26026",
"fase": "",
"file": "26026_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-04-27",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "26027",
"fase": "",
"file": "26027_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-06",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "26028",
"fase": "",
"file": "26028_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-21",
"km": 40,
"speseVive": 0,
"righe": [
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 9.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 3.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 38.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "mec",
"ore": 21.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 48.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 8.5
}
]
},
{
"numero": "26030",
"fase": "",
"file": "26030_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-11",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 4.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 6.0
}
]
},
{
"numero": "26031",
"fase": "",
"file": "26031_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "David Digioseffo",
"livello": "junior",
"disciplina": "mec",
"ore": 21.5
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 8.0
},
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 20.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 9.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 69.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 29.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 5.5
}
]
},
{
"numero": "26032",
"fase": "",
"file": "26032_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-21",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "David Digioseffo",
"livello": "junior",
"disciplina": "mec",
"ore": 17.5
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 0.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 7.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 9.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "26033",
"fase": "",
"file": "26033_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-15",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 15.0
}
]
},
{
"numero": "26034",
"fase": "",
"file": "26034_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-03-20",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "26035",
"fase": "",
"file": "26035_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-28",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 57.0
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "ele",
"ore": 17.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 1.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 10.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "ele",
"ore": 3.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "26036",
"fase": "",
"file": "26036_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-15",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "26037",
"fase": "",
"file": "26037_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-04-13",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 4.5
}
]
},
{
"numero": "26038",
"fase": "",
"file": "26038_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-06-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 7.0
}
]
},
{
"numero": "26039",
"fase": "",
"file": "26039_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "26040",
"fase": "",
"file": "26040_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-04-29",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 2.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 3.0
}
]
},
{
"numero": "26041",
"fase": "",
"file": "26041_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-06-04",
"km": 3,
"speseVive": 3,
"righe": [
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 6.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 3.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "26042",
"fase": "",
"file": "26042_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-06-29",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 1.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 4.0
}
]
},
{
"numero": "26043",
"fase": "",
"file": "26043_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-27",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 4.0
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 11.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 2.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 0.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "26044",
"fase": "",
"file": "26044_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-06-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 5.0
}
]
},
{
"numero": "26045",
"fase": "",
"file": "26045_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-28",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 27.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "26046",
"fase": "",
"file": "26046_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-06-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "ele",
"ore": 8.0
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 9.5
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 2.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 3.0
}
]
},
{
"numero": "26047",
"fase": "",
"file": "26047_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-06-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "26049",
"fase": "",
"file": "26049_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 29.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 0.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 8.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 9.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 9.0
}
]
},
{
"numero": "26050",
"fase": "",
"file": "26050_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-27",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 5.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 2.0
}
]
},
{
"numero": "26051",
"fase": "",
"file": "26051_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-08",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "26052",
"fase": "",
"file": "26052_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-19",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "26053",
"fase": "",
"file": "26053_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 18.0
},
{
"persona": "David Digioseffo",
"livello": "junior",
"disciplina": "mec",
"ore": 14.5
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "ele",
"ore": 8.0
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 10.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 5.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 10.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 2.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 8.5
}
]
},
{
"numero": "26054",
"fase": "",
"file": "26054_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-28",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 3.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 5.0
}
]
},
{
"numero": "26055",
"fase": "",
"file": "26055_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-27",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 0.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 3.0
}
]
},
{
"numero": "26056",
"fase": "",
"file": "26056_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-27",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 4.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "26057",
"fase": "",
"file": "26057_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-05-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 7.0
}
]
},
{
"numero": "26058",
"fase": "",
"file": "26058_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-21",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 3.5
}
]
},
{
"numero": "26059",
"fase": "",
"file": "26059_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-03",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 0.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 7.0
}
]
},
{
"numero": "26060",
"fase": "",
"file": "26060_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-06-26",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "David Digioseffo",
"livello": "junior",
"disciplina": "mec",
"ore": 8.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 2.0
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 0.5
}
]
},
{
"numero": "26061",
"fase": "",
"file": "26061_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-30",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "26062",
"fase": "",
"file": "26062_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-30",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 6.0
},
{
"persona": "David Digioseffo",
"livello": "junior",
"disciplina": "mec",
"ore": 6.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 0.5
}
]
},
{
"numero": "26063",
"fase": "",
"file": "26063_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-06-12",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "26064",
"fase": "",
"file": "26064_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-20",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 0.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 4.0
}
]
},
{
"numero": "26066",
"fase": "",
"file": "26066_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-29",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "David Digioseffo",
"livello": "junior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "26067",
"fase": "",
"file": "26067_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-28",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 11.0
},
{
"persona": "David Digioseffo",
"livello": "junior",
"disciplina": "mec",
"ore": 2.0
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 38.0
},
{
"persona": "Giovanni Dante",
"livello": "junior",
"disciplina": "ele",
"ore": 21.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 10.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 31.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 30.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 7.0
}
]
},
{
"numero": "26068",
"fase": "",
"file": "26068_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-31",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 1.0
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "ele",
"ore": 11.0
},
{
"persona": "Enrico Boschetto",
"livello": "junior",
"disciplina": "mec",
"ore": 14.0
},
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 1.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 26.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 34.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "ele",
"ore": 3.0
}
]
},
{
"numero": "26069",
"fase": "",
"file": "26069_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-03",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 11.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 1.0
}
]
},
{
"numero": "26070",
"fase": "",
"file": "26070_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-21",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "David Digioseffo",
"livello": "junior",
"disciplina": "mec",
"ore": 2.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 3.0
}
]
},
{
"numero": "26071",
"fase": "",
"file": "26071_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-30",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 11.5
}
]
},
{
"numero": "26073",
"fase": "",
"file": "26073_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 7.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "ele",
"ore": 1.5
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 4.0
}
]
},
{
"numero": "26074",
"fase": "",
"file": "26074_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-07-30",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 5.0
}
]
},
{
"numero": "26075",
"fase": "",
"file": "26075_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-10",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 9.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "26076",
"fase": "",
"file": "26076_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Alessio Bertin",
"livello": "junior",
"disciplina": "mec",
"ore": 14.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 7.0
}
]
},
{
"numero": "26077",
"fase": "",
"file": "26077_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-10",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 2.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.0
}
]
},
{
"numero": "26078",
"fase": "",
"file": "26078_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-03",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 2.5
}
]
},
{
"numero": "26079",
"fase": "",
"file": "26079_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-08-10",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 1.5
}
]
},
{
"numero": "26081",
"fase": "",
"file": "26081_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 4.0
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 1.5
},
{
"persona": "Marco Zabeo",
"livello": "junior",
"disciplina": "mec",
"ore": 3.0
},
{
"persona": "Michele Arnosti",
"livello": "senior",
"disciplina": "mec",
"ore": 0.5
}
]
},
{
"numero": "26082",
"fase": "",
"file": "26082_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-02",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 22.0
}
]
},
{
"numero": "26083",
"fase": "",
"file": "26083_BUDGET CONTRACT.xlsx",
"salvatoIl": "2026-09-03",
"km": 0,
"speseVive": 0,
"righe": [
{
"persona": "Marco Dante",
"livello": "senior",
"disciplina": "ele",
"ore": 1.5
},
{
"persona": "Marco Sorgato",
"livello": "junior",
"disciplina": "ele",
"ore": 19.5
}
]
}
];
