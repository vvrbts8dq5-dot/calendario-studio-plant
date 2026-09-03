// ══════════════════════════════════════════════════════════════════════
// CORREZIONE NOMI COMMESSE — banner Rubrica Commesse, stesso pattern dei
// banner "Correzione storico orario" / "Rimuovi doppioni". Una tantum:
// legge l'elenco ufficiale numero+nome commesse (fornito da Giovanni dal
// file "_INDICE LAVORI 1.xlsx", foglio "INDICE Commesse") e sistema:
//   • il nome (campo committente), SEMPRE nel formato "numero_nome",
//     così è identico ovunque compaia nell'app (Rubrica, Budget Contract,
//     menu "Ore per Commessa" dei dipendenti, Contabilità...);
//   • le note, SOLO quando sono ancora vuote, arricchendole con
//     Committente Plant / Cliente Finale / Opera (quando presenti
//     nell'Excel).
//
// NON tocca MAI: tariffe, monte ore, righe già registrate, listino
// stampe, anno, progetto, note già scritte da un umano. Nessuna
// cancellazione: solo .update() mirati sui singoli campi, oppure .set()
// per creare una commessa che nell'Excel c'è ma in Firestore ancora no
// (con gli stessi valori di default già usati da "+ Nuova Commessa").
//
// Fonte dati: 431 commesse, anni 2023-2026 (i due fogli storici
// "ELETTRICI/MECCANICI ARCHIVIO-OPS", con numerazione pre-2023 tipo
// "T005_17", sono esclusi di proposito — numerazione incompatibile).
//
// Se una commessa esiste sia in Firestore che nell'Excel, il nome
// dell'Excel fa sempre fede (anche se differisce leggermente da quello
// già scritto in Firestore) — così l'archivio ufficiale resta la fonte
// di verità unica. Se una commessa esiste in Firestore ma NON è
// nell'Excel, non inventiamo nulla: aggiungiamo solo "numero_" davanti
// al nome già presente (se c'è).
//
// Campi del seed: n=numero, c=nome commessa (COMMESSA), cp=committente
// plant, cf=cliente finale, op=opera.
// ══════════════════════════════════════════════════════════════════════
const CNC_SEED =
[
  {n:'23001',c:'ZAMBONIN AGRICOLURA - PD',cp:'ZAMBONIN MAURIZIO',cf:'ZAMBONIN AGRICOLTURA',op:'Adeguamento impianti elettrici'},
  {n:'23002',c:'NH HOTEL - PD',cp:'LUIGI RISI (MEDIOLANUM)',cf:'NH HOTEL',op:'Sostituzione generatori'},
  {n:'23003',c:'TENUTA LA PRESA - VR',cp:'TENUTA LA PRESA',cf:'TENUTA LA PRESA',op:'Illuminazione esterna'},
  {n:'23004',c:'PALAZZO ZABARELLA - PD',cp:'ALBANO SALMASO / CARRON',cf:'PALAZZO ZABARELLA',op:'Progetto prel. e def. impianti el e mec, L.10, APE'},
  {n:'23005',c:'COND. BRENTAVECCHIA - VE',cp:'ARCH. FORNASIERO',cf:'CONDOMINIO BRENTAVECCHIA',op:'Assistenza pratica SuperBonus 110%'},
  {n:'23006',c:'SISSA - TS',cp:'ING. MARCO BAGANTE',cf:'SISSA',op:'Esecutivo imp. mecc. chiusura terrazze'},
  {n:'23007',c:'ENEA FTV LONGO MARIA',cp:'TESLA IMPIANTI',cf:'LONGO MARIA',op:'Pratica Bonus Casa con asseverazione'},
  {n:'23008',c:'ENEA FTV CONTE GIANNI',cp:'TESLA IMPIANTI',cf:'CONTE GIANNI',op:'Pratica Bonus Casa con asseverazione'},
  {n:'23009',c:'ENEA FTV ROSSO ALESSANDRO',cp:'TESLA IMPIANTI',cf:'ROSSO ALESSANDRO',op:'Pratica Bonus Casa con asseverazione'},
  {n:'23010',c:'ENEA FTV CABERLOTTO RENZO',cp:'TESLA IMPIANTI',cf:'CABERLOTTO RENZO',op:'Pratica Bonus Casa con asseverazione'},
  {n:'23011',c:'ENEA FTV TIFI DANILO',cp:'TESLA IMPIANTI',cf:'TIFI DANILO',op:'Pratica Bonus Casa con asseverazione'},
  {n:'23012',c:'ENEA FTV CARNIEL MAURO',cp:'TESLA IMPIANTI',cf:'CARNIEL MAURO',op:'Pratica Bonus Casa con asseverazione'},
  {n:'23013',c:'ENEA FTV PEROSSA ARDUINO',cp:'TESLA IMPIANTI',cf:'PEROSSA ARDUINO',op:'Pratica Bonus Casa con asseverazione'},
  {n:'23014',c:'ENEA FTV GIRARDI VINCENZO',cp:'TESLA IMPIANTI',cf:'GIRARDI VINCENZO',op:'Pratica Bonus Casa con asseverazione'},
  {n:'23015',c:'ENEA FTV PIZZOLATO ERMES',cp:'TESLA IMPIANTI',cf:'PIZZOLATO ERMES',op:'Pratica Bonus Casa con asseverazione'},
  {n:'23016',c:'ENEA FTV CERELLO ROBERTO',cp:'TESLA IMPIANTI',cf:'CERELLO ROBERTO',op:'Pratica Bonus Casa con asseverazione'},
  {n:'23017',c:'ENEA FTV SCHIAVONE LUIGI',cp:'TESLA IMPIANTI',cf:'SCHIAVONE LUIGI',op:'Pratica Bonus Casa con asseverazione'},
  {n:'23018',c:'SAEID Jelak Correzzola',cp:'ARCH. SAEID',cf:'JELAK JEAN CLAUDE',op:''},
  {n:'23019',c:'MELINA',cp:'',cf:'VARIE',op:''},
  {n:'23020',c:'APP. P2 VIA PIGHIN',cp:'BERTANI',cf:'APP. P2 VIA PIGHIN',op:'Prog. definitivo impianti termici'},
  {n:'23021',c:'CO ENEL',cp:'DUSSMANN',cf:'DUSSMANN',op:''},
  {n:'23022',c:'OWW MERLATA BLOOM',cp:'SONIA PITIS - CIGIERRE',cf:'OWW MERLATA BLOOM MILANO',op:''},
  {n:'23023',c:'UFFICI SAEID',cp:'ARCH. SAEID',cf:'ARCH. SAEID',op:'L.10, progetto def impianti termici, pratica Enea Eco Bonus'},
  {n:'23024',c:'ABITAZIONE SAEID',cp:'ARCH. SAEID',cf:'ARCH. SAEID',op:'L.10, progetto def impianti termici, pratica Enea Eco Bonus'},
  {n:'23025',c:'ABITAZIONE FAVERO - Saonara',cp:'ARCH. SAEID',cf:'FAVERO',op:''},
  {n:'23026',c:'ST. GHELLER Camposampiero',cp:'ANDREA BRIANI',cf:'ST. GHELLER',op:'Progettazione impianti nuovo studio dentistico'},
  {n:'23027',c:'OFFICINA BALLAN Campodarsego',cp:'ARCH. PATRON',cf:'B&B BALLAN',op:'Progettazione impianti ristrutturazione edificio artigianale'},
  {n:'23028',c:'APP. P5 Vicenza',cp:'FULLSERVICE',cf:'REMIDA SRL',op:'Stesura APE'},
  {n:'23029',c:'BERTO DEL FAVERO Brugine',cp:'',cf:'BERTO CLAUDIO',op:'Impianto climatizzazione radiante a pavimento'},
  {n:'23030',c:'LOREO Il.ne rotatoria',cp:'STUDIO S2O',cf:'COMUNE DI LOREO',op:'Progetto illuminazione pubblica'},
  {n:'23031',c:'ENEA FTV Bertotto',cp:'MUNARI GROUP',cf:'BERTOTTO/TRAVIA',op:''},
  {n:'23032',c:'BERTANI Vianello',cp:'BERTANI',cf:'VIANELLO',op:''},
  {n:'23033',c:'COND. CALIFORNIA (elettrico)',cp:'',cf:'',op:''},
  {n:'23034',c:'VERONA MED San Zeno VR',cp:'BRIANI',cf:'VERONA MED',op:'Progetto impianti studio medico'},
  {n:'23035',c:'ABITAZ. VIA M. BIVERA ORIAGO',cp:'3NDY STUDIO',cf:'',op:'L.10, preliminare impianti DM 37/08, APE'},
  {n:'23036',c:'ABITAZ. BALDO',cp:'TALATO DANIELA',cf:'BALDO',op:'L.10, pratica Bonus Casa e Ecobonus, APE'},
  {n:'23037',c:'ABITAZ. VIA VECELLIO PsN',cp:'',cf:'',op:''},
  {n:'23038',c:'AERNOVA FONTANIVA',cp:'MUNARI GROUP',cf:'AERNOVA S.R.L.',op:'Adeguamento quadri elettrici'},
  {n:'23039',c:'CAPUZZO SPINELLO',cp:'CAPUZZO ALESSANDRO',cf:'SPINELLO MATTEO',op:'APE'},
  {n:'23040',c:'PALESTRA VIA ATTENDOLO PD',cp:'ING. MARCO BAGANTE',cf:'BASSI & FURLAN',op:'Impianti termotecnici'},
  {n:'23041',c:'SARTORI MARTINI CARRE\' VI',cp:'RASOTTO/STUDIO MUNARETTO',cf:'SARTORI GIANBERTO',op:'L.10, def el+ mecc, APE'},
  {n:'23042',c:'FREE LIVING MASERA\'',cp:'S2O - GIULIA BOSCO',cf:'PLS GROUP',op:'L.10, preliminare impianti DM 37/08'},
  {n:'23043',c:'MARITAN AGOSTINI CASALSERUGO',cp:'ANDREA AGOSTINI',cf:'MARITAN MIRELLA',op:'APE'},
  {n:'23044',c:'ABITAZ. GARBO ARRE',cp:'BEATRICE ?',cf:'',op:''},
  {n:'23045',c:'FORESTAN CAMISANO VIC.NO',cp:'CARLO MARIA FORESTAN',cf:'?',op:'APE VILLETTA A SCHIERA'},
  {n:'23046',c:'OWW FORLI\'',cp:'JURI BASSI',cf:'CIGIERRE',op:''},
  {n:'23047',c:'MENSA ASILO BOJON',cp:'ARCH. CHINELLO',cf:'COMUNE CAMPOLONGO MAGG.',op:'Progetto impianti el+mecc'},
  {n:'23048',c:'FRANCO NADIA Quaggio',cp:'ARCH. GIULIO BASO',cf:'',op:''},
  {n:'23049',c:'ASILO MONTEBELLUNA (elettrico)',cp:'ING. CARLO FORTINI',cf:'COMUNE MONTEBELLUNA',op:''},
  {n:'23050',c:'COND. LOTTO A SPINEA',cp:'3NDY STUDIO',cf:'',op:''},
  {n:'23051',c:'NARDO Via XXV Aprile',cp:'',cf:'',op:''},
  {n:'23052',c:'SITEC SRL Fustellificio Vigonza',cp:'SI-TEC S.N.C.',cf:'FUSTELLIFICIO DI STRA S.N.C.',op:'Impianto climatizzazione estiva'},
  {n:'23053',c:'ORIGANI Enea Bonus Casa',cp:'',cf:'ORIGANI DANIELE',op:''},
  {n:'23054',c:'TAMIOZZO Monteviale',cp:'GEOM. RASOTTO DIEGO',cf:'TAMIOZZO',op:'L.10, progetto def impianti termici, APE'},
  {n:'23055',c:'MARCHI Pettorazza',cp:'GEOM. SARTORI',cf:'',op:''},
  {n:'23056',c:'IPAB progetto ct NO',cp:'HAER - DAL MASO',cf:'IPAB Dueville',op:''},
  {n:'23057',c:'PEZZOLO Vigodarzere',cp:'ARVALLI',cf:'PEZZOLO LUCA',op:'Prog. Impianti termoidraulici'},
  {n:'23058',c:'VINICOLA NAPOLEONE Ape',cp:'DEI MICHIELI?',cf:'DEI MICHIELI?',op:'APE UFFICI'},
  {n:'23059',c:'GOBBO DENIS FTV Arre',cp:'ARCH. ROMANI',cf:'GOBBO DENIS',op:'Prog FTV'},
  {n:'23060',c:'RIGHETTI Via Picchini',cp:'STUDIO ARVALLI',cf:'RIGHETTI GIACOMO',op:'L.10, Prog. Impianti termotecnici'},
  {n:'23061',c:'BALLAN Elisa APE',cp:'B&B BALLAN',cf:'BALLAN ELISA',op:'APE'},
  {n:'23062',c:'CASA SUL FIUME Treviso',cp:'MIDE Architetti',cf:'',op:'Prog impianti el + mec + ftv'},
  {n:'23063',c:'MUNARI Andrea',cp:'MUNARI ANDREA',cf:'MUNARI ANDREA',op:'APE'},
  {n:'23064',c:'COND. LOTTO 4 Via delle Gardenie Mira',cp:'3NDY STUDIO',cf:'COND. Via delle Gardenie Mira (Oriago)',op:''},
  {n:'23065',c:'GOBBI SAMUELE',cp:'DEBORA MOLENA?',cf:'',op:''},
  {n:'23066',c:'SNAM Massa Carrara',cp:'DUSSMAN',cf:'SNAM Massa Carrara',op:''},
  {n:'23067',c:'DANTE PAOLO',cp:'DANTE PAOLO?',cf:'DANTE PAOLO',op:''},
  {n:'23068',c:'COND. LONGO (elettrico)',cp:'DEBORA MOLENA?',cf:'LONGO ALBERTO',op:''},
  {n:'23069',c:'ABITAZIONE ZAMBONIN',cp:'DORA GIUNCO',cf:'ZAMBONIN',op:''},
  {n:'23070',c:'PALESTRA GOLDS GYM Mestre',cp:'ING. BIDOGGIA',cf:'GOLD\'s GYM Mestre',op:''},
  {n:'23071',c:'TURATTO Mestre',cp:'ARCH. FORNASIERO',cf:'TURATTO',op:''},
  {n:'23072',c:'COND 3 Unità Scatena',cp:'',cf:'',op:''},
  {n:'23073',c:'OWW Trento',cp:'CIGIERRE',cf:'CIGIERRE',op:''},
  {n:'23074',c:'COND. BS Albignasego',cp:'GEOM. SARTORI',cf:'BS IMMOBILIARE',op:''},
  {n:'23075',c:'COLCERA Fossò',cp:'ARCH. SALMASO ALBANO',cf:'COLCERA GIANNI',op:''},
  {n:'23076',c:'CARABINIERI Campagna Lupia',cp:'ARCH. CHINELLO',cf:'COMUNE DI CAMPAGNA LUPIA',op:''},
  {n:'23077',c:'CARRARO S.P. Viminario',cp:'PLANNING PRO',cf:'CARRARO',op:''},
  {n:'23078',c:'NIVEX SERVICES Uffici PD',cp:'ARCH. SALMASO ALBANO',cf:'NIVEX SERVICES',op:''},
  {n:'23079',c:'TRIFAM. FIESSO GASTALDI',cp:'3NDY STUDIO',cf:'GASTALDI ROMEO',op:''},
  {n:'23080',c:'MARELLA GIANNA FTV Pensilina',cp:'CUBO INGEGNERIA',cf:'MARELLA GIANNA',op:''},
  {n:'23081',c:'UFFICI ARPAV Belluno MM',cp:'ANDREA CREPALDI',cf:'MM IDROSERVICE',op:'consulenza tecnica ARPAV Belluno'},
  {n:'23082',c:'BIZZOTTO show room 2',cp:'MUNARI GROUP',cf:'MUNARI GROUP',op:''},
  {n:'23083',c:'CAVALETTI ROMANO ftv abitazione',cp:'CAVALETTI ROMANO',cf:'CAVALETTI ROMANO',op:'pratica Enea ftv'},
  {n:'23084',c:'PIRATES BAY CC Merlata Bloom',cp:'PIRATES BAY',cf:'FKONE',op:''},
  {n:'23085',c:'AUTOTR BARONE navigazione int 53',cp:'CESCON/BRIANI',cf:'AUTOTRASPORTI BARONE',op:''},
  {n:'23086',c:'RFI UFFICI Mestre',cp:'FULLSERVICE',cf:'FULLSERVICE',op:''},
  {n:'23087',c:'ILL.NE BOTTEGO Piove di Sacco',cp:'CUBO INGEGNERIA',cf:'CUBO INGEGNERIA',op:'Illuminazione esterna'},
  {n:'23088',c:'AMBULAT SUMAN Farra di Soligo',cp:'ANDREA BRIANI',cf:'SUMAN',op:''},
  {n:'23089',c:'MUNARI Artemis',cp:'MUNARI PAOLO',cf:'',op:''},
  {n:'23090',c:'FABRIS Vigonovo',cp:'TALATO DANIELA',cf:'FABRIS MATTEO',op:'L.10'},
  {n:'23091',c:'IMG uffici Mira',cp:'MELINA',cf:'MELINA?',op:''},
  {n:'23092',c:'ARVALLI ex Orbat Forlimpopoli',cp:'ARVALLI',cf:'',op:''},
  {n:'23093',c:'SCUOLA PIAZZA GALVANI San Bellino',cp:'GRUPPO HERA',cf:'',op:''},
  {n:'23094',c:'MAAP Padova Pal. A',cp:'',cf:'',op:''},
  {n:'23095',c:'COND LOTTO D_I Faggi',cp:'ELDA SRL',cf:'ELDA SRL',op:''},
  {n:'23096',c:'OWW San Donà di Piave',cp:'FULLSERVICE',cf:'FULLSERVICE',op:''},
  {n:'23097',c:'CAPANNONE Terrassa',cp:'',cf:'',op:''},
  {n:'23098',c:'COND COLCERA Alleghe',cp:'ROMANI',cf:'ROMANI',op:''},
  {n:'23099',c:'SARTORI Casalserugo',cp:'SIMONE SARTORI',cf:'BATTISTI MINELLA',op:''},
  {n:'23100',c:'HOTEL COLORS Venezia',cp:'HOTEL COLORS',cf:'HOTEL COLORS',op:''},
  {n:'23101',c:'BIFAMILIARE PADOVA Cubo',cp:'CUBO INGEGNERIA',cf:'',op:''},
  {n:'23102',c:'BATTISTI Albignasego (NO)',cp:'',cf:'',op:''},
  {n:'23103',c:'STAZIONE IP Goito MN',cp:'DUSSMANN',cf:'DUSSMANN',op:''},
  {n:'23104',c:'CONSORZIO RFX Modulo VEM Spider',cp:'DUSSMANN',cf:'DUSSMANN',op:''},
  {n:'23105',c:'ABITAZI SARTORE SILVIA Marano VI',cp:'BRIANI',cf:'SARTORE SILVIA',op:''},
  {n:'23106',c:'CENTRO CULTURALE Tiziano Rossi',cp:'STUDIO MUNARETTO',cf:'',op:''},
  {n:'23107',c:'STAZIONE IP Busnago MB',cp:'DUSSMANN',cf:'DUSSMANN',op:''},
  {n:'23108',c:'UFFICI L.R. Maserà di Padova',cp:'L.R. SRL',cf:'L.R. SRL',op:''},
  {n:'23109',c:'ABITAZIONE Brusegana',cp:'ARCH. RIZZI',cf:'',op:''},
  {n:'23110',c:'CONDOMINIO Via Eridano',cp:'BOSCOLO',cf:'ATLANTIS RE',op:''},
  {n:'23111',c:'PERONI area snack',cp:'RASOTTO',cf:'BIRRA PERONI SRL',op:''},
  {n:'23112',c:'NARDO APE via Tergolino',cp:'',cf:'',op:''},
  {n:'23113',c:'GREENS Viale Svezia PSN',cp:'CLIMAIR SRL',cf:'CLIMAIR SRL',op:''},
  {n:'23114',c:'CEAM CAVI Ampliam 2 Monselice',cp:'CEAM CAVI',cf:'CEAM CAVI',op:''},
  {n:'23115',c:'COND 3 unità Vittor Pisani',cp:'BOSCOLO',cf:'ATLANTIS RE',op:''},
  {n:'23116',c:'BETTO LUCA',cp:'',cf:'BETTO LUCA',op:'Enea serramenti'},
  {n:'23117',c:'GROSSET LUCON',cp:'',cf:'GROSSET LUCON',op:'Asseverazione serramenti'},
  {n:'23118',c:'ILL.NE PUB VIA CA\' D\'ORO Mestre',cp:'3NDY STUDIO',cf:'3NDY STUDIO',op:''},
  {n:'23119',c:'ILL.NE EXT VIA BENNATI Spinea',cp:'3NDY STUDIO',cf:'3NDY STUDIO',op:''},
  {n:'23120',c:'COND. H002 Via Gardenie Primule Oriago',cp:'3NDY STUDIO',cf:'3NDY STUDIO',op:''},
  {n:'23121',c:'B&B RIVIERA PONTI ROMANI Padova',cp:'ICENT',cf:'ICENT',op:''},
  {n:'23122',c:'COND. VIA CA\' D\'ORO Mestre',cp:'3NDY STUDIO',cf:'3NDY STUDIO',op:''},
  {n:'23123',c:'COND. B035 Caleselle di Oriago',cp:'3NDY STUDIO',cf:'3NDY STUDIO',op:''},
  {n:'23124',c:'S2O L.10 Rosso',cp:'STUDIO S2O',cf:'',op:''},
  {n:'23125',c:'CAPUZZO Ferrara Alberto',cp:'CAPUZZO',cf:'FERRARA ALBERTO',op:''},
  {n:'23126',c:'IMM NAVIGLIO Ponte Molino',cp:'FANZAGO',cf:'IMM NAVIGLIO',op:''},
  {n:'23127',c:'CIS MAGAZZINO',cp:'CIS MAGAZZINO',cf:'CIS MAGAZZINO',op:'Wallbox e ill.ne ext'},
  {n:'23128',c:'CENTRO REVIS SCRAL Padova',cp:'CENTRO REVISIONI SCRAL',cf:'CENTRO REVISIONI SCRAL',op:''},
  {n:'24001',c:'BIF LOTTO 9 Mestrino',cp:'DIEGO TREVELIN',cf:'COSTRUZIONI MESTRINO',op:'L. 10'},
  {n:'24002',c:'TOMASI Marostica',cp:'RASOTTO',cf:'TOMASI GIULIO',op:'IMPIANTI EDIFICIO COMMERCIALE E RESIDENZIALE'},
  {n:'24003',c:'MELINA 2024',cp:'MELINA',cf:'MELINA',op:'CLIENTI VARI'},
  {n:'24004',c:'TERRA DEI PICCOLI',cp:'BRIANI',cf:'ASILO TERRA DEI PICCOLI',op:'IMPIANTO AERAULICO'},
  {n:'24005',c:'IPAB GODI SGARGI Torri di Quartesolo',cp:'HSE - GRUPPO HERA',cf:'IPAB GODI SGARGI',op:'STUDIO FATTIBILITA\' EFFICIENTAMENTO ENERGETICO'},
  {n:'24006',c:'CRICONIA 2024',cp:'CRICONIA DANIEL',cf:'CRICONIA DANIEL',op:'CLIENTI VARI'},
  {n:'24007',c:'APT VIA MAGELLANO Piove',cp:'CUBO ING',cf:'CUBO ING',op:'DICHIARAZIONE RISPONDENZA IMPIANTI ELETTRICI'},
  {n:'24008',c:'ILL.NE PUB V008 Viste 62 PUA Mogliano',cp:'3NDY STUDIO',cf:'3NDY STUDIO',op:'ILL.NE PUBBLICA'},
  {n:'24009',c:'SMASHIE Marcianise Caserta',cp:'CIGIERRE',cf:'CIGIERRE',op:'IMPIANTI RISTORANTE'},
  {n:'24010',c:'PIEFFE APE Bosco Chiesanuova',cp:'BETTELLA',cf:'',op:'APE'},
  {n:'24011',c:'PALAZZO MARTINENGO Via Euganea PD',cp:'BETTELLA',cf:'STUDIO CARAMEL',op:'IMPIANTI ELETTRICI'},
  {n:'24012',c:'BIF. UNGARETTI Brugine',cp:'ELDA',cf:'ELDA',op:'L.10, APE'},
  {n:'24013',c:'VOLFA SNC Capannone Casalserugo PD',cp:'VOLFA SNC',cf:'VOLFA SNC',op:'ADEGUAMENTO IMPIANTI ELETTRICI'},
  {n:'24014',c:'BIZETA Capannone S.Angelo di Piove',cp:'ARREDAMENTO BIZETA',cf:'',op:''},
  {n:'24015',c:'G_026 Via Bennati',cp:'3NDY STUDIO',cf:'3NDY STUDIO',op:'IMPIANTI 29 UNITA\''},
  {n:'24016',c:'GREGGIO SCALABRIN ampliamento',cp:'PLANNING PRO',cf:'',op:''},
  {n:'24017',c:'BAR GIACINTO PD',cp:'',cf:'',op:''},
  {n:'24018',c:'AUTOTR BARONE navigazione int 52 ed C',cp:'BRIANI',cf:'AUTOTRASPORTI BARONE',op:''},
  {n:'24019',c:'ABITAZ PERON Voltabarozzo Via Arditi',cp:'CUBO ING',cf:'CUBO INGEGNERIA',op:''},
  {n:'24020',c:'BOSCARO RICCARDO',cp:'STUDIO CONVENTO?',cf:'',op:'BIFAMILIARE BOJON'},
  {n:'24021',c:'RAITERI GIULIA',cp:'IGLI SALVIATO',cf:'RAITERI GIULIA',op:'APE LONGARE'},
  {n:'24022',c:'FAGGIN FRANCESCO',cp:'FAGGIN FRANCESCO',cf:'FAGGIN FRANCESCO',op:'TRIFAMILIARE VIA ODERZO PD'},
  {n:'24023',c:'HERA SERVIZI ENERGIA',cp:'HSE - GRUPPO HERA',cf:'HSE GRUPPO HERA',op:'SCUOLE VIGODARZERE'},
  {n:'24024',c:'D\'ATRI SRL',cp:'BRIANI',cf:'D\'ATRI SRL',op:'CENTRO IMPIANTISTICO STRA'},
  {n:'24025',c:'APPART. ROMANI UMBERTO',cp:'ROMANI',cf:'ROMANI',op:'ITER FTV'},
  {n:'24026',c:'BS IMMOBILIARE',cp:'SARTORI',cf:'?',op:'ABITAZIONE SIMONE BORILLE'},
  {n:'24027',c:'BIZZOTTO SPA',cp:'MUNARI',cf:'MUNARI',op:'INTEGRAZIONE RINNOVO CPI'},
  {n:'24028',c:'ARVALLI',cp:'ARVALLI',cf:'ARVALLI',op:'POLO LOGISTICO CADONEGHE'},
  {n:'24029',c:'AURORA QUATTRO',cp:'CINETTO',cf:'AURORA QUATTRO',op:'APE'},
  {n:'24030',c:'CALORE APE app Via Roma 42 Due Carrare',cp:'CALORE',cf:'CALORE',op:'APE'},
  {n:'24031',c:'299 Casa Vigonza',cp:'MIDE SRL',cf:'MIDE SRL',op:'PROGG. IMPIANTI UNIFAMILIARE VIGONZA'},
  {n:'24032',c:'STUDIO DENTISTICO SARTORE',cp:'BRIANI',cf:'STUDIO DENTISTICO SARTORE',op:'PROGG. IMPIANTI RISTRUTTURAZIONE STUDIO'},
  {n:'24033',c:'GONZO Villaverla VI',cp:'MUNARETTO',cf:'GONZO STEFANO',op:'PROGG. IMPIANTI FABBRICATO VILLAVERLA'},
  {n:'24034',c:'CASERMA REP. MOBILE Padova',cp:'S2O',cf:'S2O',op:''},
  {n:'24035',c:'PERONI riempimento fusti',cp:'PERONI',cf:'PERONI',op:'PROG. CLIMATIZZAZIONE LINEA FUSTI'},
  {n:'24036',c:'CALORE APE app Via Roma 46-A4 Due Carrare',cp:'CALORE',cf:'CALORE',op:'APE'},
  {n:'24037',c:'CASA COMMIATO Padova',cp:'MUNARI',cf:'MUNARI/ARTHEMIS',op:'CERTIFICAZIONI RISPONDENZA'},
  {n:'24038',c:'FORNASARI App Carpi',cp:'BRIANI',cf:'FORNASARI',op:'RISTRUTTAZIONE APPARTAMENTO'},
  {n:'24039',c:'CLIMAIR Via Austria PD',cp:'CLIMAIR',cf:'CLIMAIR',op:'ADEGUAMENTO CENTRALE TERMICA'},
  {n:'24040',c:'I MARKET Lab. Villorba',cp:'VISENTIN MARCO (CUBO ING ?)',cf:'I MARKET SRLS',op:'PROG. IMPIANTI ELETTRICI e RILEVAZIONE INCENDI'},
  {n:'24041',c:'TENUTA LA PRESA Cabina MT-BT',cp:'',cf:'TENUTA LA PRESA',op:''},
  {n:'24042',c:'MECCANICA ZIELLO Carceri PD',cp:'CUBO INGEGNERIA',cf:'CAPANNONE CARCERI',op:'AMPLIAMENTO CAPANNONE PD'},
  {n:'24043',c:'CHIESA CASALSERUGO Illuminazione',cp:'',cf:'',op:''},
  {n:'24044',c:'SAN POLO Ponte Bernardo 2195',cp:'',cf:'',op:''},
  {n:'24045',c:'APE SAVIO (Varotto) Via Granzetta Saonara',cp:'',cf:'',op:'APE'},
  {n:'24046',c:'UNIFLAIR - SE Test gas ex',cp:'BMR?',cf:'UNIFLAIR',op:''},
  {n:'24047',c:'FANIN (NARDO) - APE Cond Teolo',cp:'',cf:'',op:'APE'},
  {n:'24048',c:'APE Via Perosi 6B PdS',cp:'',cf:'',op:'APE'},
  {n:'24049',c:'CT BIOMASSA Padova Monselice',cp:'GRUPPO HERA',cf:'CT BIOMASSA',op:''},
  {n:'24050',c:'PERONI mensa centrale',cp:'PERONI',cf:'PERONI',op:''},
  {n:'24051',c:'ABITAZIONE Brusegana Scarinzi',cp:'',cf:'',op:''},
  {n:'24052',c:'ITALCHIMICA PD',cp:'MIDE',cf:'ITALCHIMICA PD',op:''},
  {n:'24053',c:'328 RESORT Sant\'Urbano PD',cp:'MIDE',cf:'RESORT Sant\'Urbano',op:''},
  {n:'24055',c:'PALAZZO DOLFIN Padova - APE',cp:'',cf:'',op:'APE'},
  {n:'24056',c:'QUADRI UNGARETTI Brugine',cp:'ELDA SRL',cf:'ELDA SRL',op:''},
  {n:'24057',c:'ST DENTISTICO CARRARO Pianiga',cp:'ARCH. BRIANI',cf:'STUDIO DENTISTICO CARRARO',op:''},
  {n:'24058',c:'Cond. BASIGLIO MI',cp:'INCIDE ENGINEERING SRL',cf:'INCIDE ENGINEERING SRL',op:''},
  {n:'24059',c:'GIANNI CALZATURE Negozio',cp:'SPORZON SIMONE',cf:'SPORZON SIMONE',op:''},
  {n:'24060',c:'NEW DENTAL STUDIO Quarto d\'Altino',cp:'ARCH. BRIANI',cf:'NEW DENTAL STUDIO',op:''},
  {n:'24061',c:'STUDIO MEDICO Adria',cp:'ARCH. BRIANI',cf:'STUDIO MEDICO Adria',op:''},
  {n:'24062',c:'UNIFAMILIARE B&B BALLAN Zanè',cp:'B&B BALLAN',cf:'B&B BALLAN',op:''},
  {n:'24063',c:'ABITAZIONE TAMIAZZO Via Adami PdS',cp:'ROMANI?',cf:'TAMIAZZO',op:''},
  {n:'24064',c:'APE TRIVELLATO (Varotto)',cp:'VAROTTO',cf:'TRIVELLATO MARCO',op:'APE'},
  {n:'24065',c:'SCUOLA FONTANA Caprino Veronese S2O',cp:'S2O?',cf:'',op:''},
  {n:'24066',c:'PAL. ADD GHEDI Sirti',cp:'PLANEX',cf:'PLANEX',op:''},
  {n:'24067',c:'CT MUNICIPIO Vigonovo',cp:'MUNICIPIO VIGONOVO',cf:'MUNICIPIO VIGONOVO',op:''},
  {n:'24068',c:'BIOS LINE Ponte San Nicolò',cp:'BIOS LINE',cf:'BIOS LINE',op:''},
  {n:'24069',c:'FAVARATO Arzergrande APE',cp:'FAVARATO',cf:'FAVARATO',op:'APE'},
  {n:'24070',c:'CALORE APE Via Roma 42a4',cp:'CALORE',cf:'CALORE',op:'APE'},
  {n:'24071',c:'COND 3 APT PD Checchin Enrico',cp:'STUDIO CARAMEL',cf:'STUDIO CARAMEL?',op:''},
  {n:'24072',c:'G020 GH Via Bernini',cp:'3NDY STUDIO',cf:'3NDY STUDIO',op:''},
  {n:'24073',c:'FTV MARELLA MANIERO Upgrade',cp:'MARELLA',cf:'',op:''},
  {n:'24074',c:'I FASHION Maserà',cp:'VISENTIN MARCO (CUBO ING ?)',cf:'I FASHION',op:''},
  {n:'24075',c:'CIS SRL Adeguamento magazzino',cp:'CIS SRL',cf:'CIS SRL',op:''},
  {n:'24076',c:'PERONI centrale termo-frigo',cp:'BIRRA PERONI SRL',cf:'BIRRA PERONI SRL',op:''},
  {n:'24077',c:'MORO MIRCO FTV abitazione',cp:'',cf:'MORO MIRCO',op:''},
  {n:'24078',c:'339 CASA PADOVA Via Manzoni PD',cp:'MIDE SRL',cf:'MIDE SRL',op:''},
  {n:'24079',c:'B&B BALLAN HQ Via Frattina',cp:'B&B BALLAN',cf:'B&B BALLAN',op:''},
  {n:'24080',c:'CASA MONTAGNER Via Faggiola PD',cp:'GIACOMAZZI BEATRICE',cf:'MONTAGNER?',op:''},
  {n:'24081',c:'CASA CAVESTRO Ponte San Nicolò',cp:'',cf:'CAVESTRO?',op:''},
  {n:'24082',c:'BEDIN Via delle industrie',cp:'BARATTO SIMONE',cf:'',op:''},
  {n:'24083',c:'COND. VIALE MILANO Vicenza',cp:'FULLSERVICE',cf:'FULLSERVICE',op:''},
  {n:'24084',c:'BIF MATTERAZZO Sant\'Angelo',cp:'GEOM SARTORI',cf:'',op:''},
  {n:'24085',c:'264 VILLA Fiesso d\'Artico VE',cp:'MIDE SRL',cf:'',op:''},
  {n:'24086',c:'303 CASA Selvazzano PD',cp:'MIDE SRL',cf:'',op:''},
  {n:'24087',c:'CASA FERRARA Ape e Enea',cp:'FERRARA ALBERTO',cf:'FERRARA ALBERTO',op:''},
  {n:'24088',c:'CASA LEGNARO Lino Bazzolo',cp:'ELDA SRL?',cf:'',op:''},
  {n:'24089',c:'FTV DANTE RENATO',cp:'',cf:'',op:''},
  {n:'24090',c:'QUADRI RIGHELE Zané',cp:'',cf:'',op:''},
  {n:'24091',c:'HOTEL RIO VE',cp:'',cf:'',op:''},
  {n:'24092',c:'C051 COND ABANO',cp:'',cf:'',op:''},
  {n:'24093',c:'CASA VIA TOSCANA FOSSO\'',cp:'',cf:'',op:''},
  {n:'24094',c:'DAL FERRO Thiene',cp:'',cf:'',op:''},
  {n:'24095',c:'ROSSI FERRETTO Arzergrande',cp:'',cf:'',op:''},
  {n:'24096',c:'STUDIO TOGNAZZO Albignasego',cp:'',cf:'',op:''},
  {n:'24097',c:'DONDI GIULIANO Via Squarcione PD',cp:'',cf:'',op:''},
  {n:'24098',c:'BENVEGNU\' Via Tito Livio Piove',cp:'',cf:'',op:''},
  {n:'24100',c:'348 MENSA B-MARCELLO Selvazzano',cp:'',cf:'',op:''},
  {n:'24101',c:'351 MENSA Scuola Villa Del Conte',cp:'',cf:'',op:''},
  {n:'24102',c:'DONA\' Silvano',cp:'',cf:'',op:'Enea'},
  {n:'24103',c:'AGORA\' negozi Via Magarotto PD',cp:'',cf:'',op:''},
  {n:'24104',c:'BRAGGION CALORE casa Conselve',cp:'',cf:'',op:''},
  {n:'24105',c:'DENTISTA BACILIERO Vicenza',cp:'',cf:'',op:''},
  {n:'24106',c:'VPS Codevigo uffici',cp:'',cf:'',op:''},
  {n:'24107',c:'TERESIANUM Padova',cp:'',cf:'',op:''},
  {n:'25001',c:'APP CECCATO Rubano',cp:'',cf:'',op:''},
  {n:'25002',c:'MAAP Adeg. 3 SCH Ovest',cp:'',cf:'',op:''},
  {n:'25003',c:'JAL Piove di Sacco',cp:'',cf:'',op:''},
  {n:'25004',c:'LUNA NEL POZZO Ospedaletto',cp:'',cf:'',op:''},
  {n:'25005',c:'VALCOMS via Austria PD',cp:'',cf:'',op:''},
  {n:'25006',c:'PLANT new HQ',cp:'',cf:'',op:''},
  {n:'25007',c:'BERGO GIULIO APE',cp:'',cf:'',op:''},
  {n:'25008',c:'VIA TONELLO LIMENA APE Nardo',cp:'',cf:'',op:''},
  {n:'25009',c:'CARR MAGAGNA Cartura PD',cp:'',cf:'CARROZZERIA MAGAGNA',op:''},
  {n:'25010',c:'SCANU Riv. S. Bened. PD',cp:'ALBANO SALMASO',cf:'',op:''},
  {n:'25011',c:'TOMMASIN Selvazzano PD',cp:'',cf:'TOMMASIN FRANCESCA',op:'L.10'},
  {n:'25012',c:'ILL.NE BREDA3 UMI4 Limena',cp:'3NDY STUDIO',cf:'3NDY STUDIO',op:'AGG. PROG. ILL.NE PUBBLICA'},
  {n:'25013',c:'S2O ape uffici',cp:'S2O',cf:'S2O',op:'APE DUE CARRARE'},
  {n:'25014',c:'CALORE ape piazza XX settembre 62',cp:'',cf:'CALORE MASSIMILIANO?',op:'APE CONSELVE'},
  {n:'25015',c:'CALORE APE Via Roma 42a4',cp:'',cf:'CALORE MASSIMILIANO?',op:'APE DUE CARRARE'},
  {n:'25016',c:'app int4 P2 Cond Raffella',cp:'GEOM PIPPO Gianfranco',cf:'LIBERATON MARISA',op:'APE CAMPONOGARA'},
  {n:'25017',c:'app via Pirandello Vigonovo',cp:'3NDY STUDIO',cf:'3NDY STUDIO?',op:'APE VIGONOVO'},
  {n:'25018',c:'292 casa Gargnano sul lago',cp:'MIDE SRL',cf:'MIDE SRL',op:''},
  {n:'25019',c:'RORBERI bifamiliare sant\'angelo',cp:'TALATO DANIELA',cf:'ROBERI',op:''},
  {n:'25020',c:'MELINA 2025',cp:'MELINA',cf:'MELINA',op:'VARIE'},
  {n:'25021',c:'NIERO ANTONELLA estetica',cp:'STUDIO CONVENTO',cf:'',op:'ADEGUAMENTO IMPIANTI ELETTRICI E DIRI CAMPOLONGO MAGG'},
  {n:'25022',c:'BALLAN Apt P1 Campodarsego',cp:'',cf:'',op:''},
  {n:'25023',c:'MAZZUCATO Via Monte Suello PD',cp:'',cf:'',op:''},
  {n:'25024',c:'3NDY STUDIO G019 GH Via Matteotti',cp:'',cf:'',op:''},
  {n:'25025',c:'MAAP SUPERATA',cp:'',cf:'',op:''},
  {n:'25026',c:'MAGGI ISABELLA Via Monte Pertica PD',cp:'',cf:'',op:''},
  {n:'25027',c:'SARTORI / TERRASSAN L. 10 Albignasego',cp:'',cf:'',op:''},
  {n:'25028',c:'ZAMBOLIN Casa PD',cp:'',cf:'',op:''},
  {n:'25029',c:'SABBION PIROSKA FTV',cp:'',cf:'',op:''},
  {n:'25030',c:'ROSU IOUNEL Casa Via Salata Noventa',cp:'',cf:'',op:''},
  {n:'25031',c:'INCIDE Hangar 2 Roma',cp:'',cf:'',op:''},
  {n:'25032',c:'VENETA IMPIANTI Longo Edoardo FTV',cp:'',cf:'',op:''},
  {n:'25033',c:'DENTAL TOMASELLI (BRIANI) studio dentistico',cp:'',cf:'',op:''},
  {n:'25034',c:'LATINOZZA (BARATTO)  Dehor esterno',cp:'',cf:'',op:''},
  {n:'25035',c:'CRICONIA Varie 2025',cp:'',cf:'',op:''},
  {n:'25036',c:'COSTRUZIONI MESTRINO Bif Lotto A - L.10 e impianto radiante',cp:'',cf:'',op:''},
  {n:'25037',c:'CASA CINESE',cp:'',cf:'',op:''},
  {n:'25038',c:'MAAP impianti palazzina uffici PD',cp:'',cf:'',op:''},
  {n:'25039',c:'EMME quadrifamiliare Cornegliana',cp:'',cf:'',op:''},
  {n:'25040',c:'STUDIO S2O Ill.ne Via Drago Jesolo',cp:'',cf:'',op:''},
  {n:'25041',c:'SARTORI ANGELO Capannone Via Matteotti - Arzergrande',cp:'',cf:'',op:''},
  {n:'25042',c:'PORTINARI SALVIATI Inail CT',cp:'',cf:'',op:''},
  {n:'25043',c:'F&T INTERNI Noale, riqualificazione CT',cp:'',cf:'',op:''},
  {n:'25044',c:'STUDENTATO Volparo Legnaro',cp:'',cf:'',op:''},
  {n:'25045',c:'APP Pecori Giraldi Padova',cp:'',cf:'',op:''},
  {n:'25046',c:'CAPEZZUOLI MAURIZIO RISTO ROMA Via Salaria',cp:'',cf:'',op:''},
  {n:'25047',c:'MIDE SRL Sala Civica Torri di Quartesolo VI',cp:'',cf:'',op:''},
  {n:'25048',c:'SIMONE VISENTIN Sost inv FTV',cp:'',cf:'',op:''},
  {n:'25049',c:'GRIGOLON Enea',cp:'',cf:'',op:''},
  {n:'25050',c:'GIORGIO BUSINARO - B.G. SERVICE NEGOZIO Ex frutta Casalserugo',cp:'',cf:'',op:''},
  {n:'25051',c:'NARDO Ape negozi Ponte San Nicolò',cp:'',cf:'',op:''},
  {n:'25052',c:'FINCANTIERI (CURTARELLO) Edificio 91, L.10 + def termico',cp:'',cf:'',op:''},
  {n:'25053',c:'STUDIO BORDIN (BRIANI) Verona',cp:'',cf:'',op:''},
  {n:'25054',c:'STUDIO 3NDY T010 Terracciano Mira',cp:'',cf:'',op:''},
  {n:'25055',c:'MIDE SRL 356 Casa Arcole VR',cp:'',cf:'',op:''},
  {n:'25056',c:'BORGATO Saonara',cp:'Saonara',cf:'',op:''},
  {n:'25057',c:'STUDIO GPA Camping TRE-DUE Chioggia',cp:'',cf:'',op:''},
  {n:'25058',c:'BARZAZI APE Fiesso d\'Artico',cp:'',cf:'',op:''},
  {n:'25059',c:'BETTELLA Piazza Accademia Delia Padova',cp:'',cf:'',op:''},
  {n:'25060',c:'LOVISOTTO CDC Monfalcone',cp:'',cf:'',op:''},
  {n:'25061',c:'GIUNCO MASIERO casa Brugine',cp:'',cf:'',op:''},
  {n:'25062',c:'CALORE APE piazza XX settembre 62 sub8',cp:'',cf:'',op:''},
  {n:'25063',c:'NATALE LORENZO Via Naccari Padova',cp:'',cf:'',op:''},
  {n:'25064',c:'ZECCHIN FRANCESCA Annesso rustico',cp:'',cf:'',op:''},
  {n:'25065',c:'CESARO casa Albignasego',cp:'',cf:'',op:''},
  {n:'25066',c:'PERONI spogliatoi donne',cp:'',cf:'',op:''},
  {n:'25067',c:'AGORA\' negozio Via Magarotto PD',cp:'',cf:'',op:''},
  {n:'25068',c:'ZTN capannone  Tognana PD',cp:'',cf:'',op:''},
  {n:'25069',c:'NARDO Ape Via XXV aprile 5-4 Ponte San Nicolò',cp:'',cf:'',op:''},
  {n:'25070',c:'BPER due diligence 2025',cp:'',cf:'',op:''},
  {n:'25071',c:'PG Bergamo',cp:'',cf:'',op:''},
  {n:'25072',c:'355 LA SEMAFORICA uffici Padova',cp:'',cf:'',op:''},
  {n:'25073',c:'360 MIDE new HQ',cp:'',cf:'',op:''},
  {n:'25074',c:'SCUOLA Via Barche San Pietro in Gu',cp:'',cf:'',op:''},
  {n:'25075',c:'MUNARI new HQ',cp:'',cf:'',op:''},
  {n:'25076',c:'LEARDINI apt Mestre',cp:'',cf:'',op:''},
  {n:'25077',c:'STURNIOLO OTTAVIANO Via Macope PD',cp:'',cf:'',op:''},
  {n:'25078',c:'SPOGLIATOI Solesino',cp:'',cf:'',op:''},
  {n:'25079',c:'CASA BASSO Legnaro',cp:'',cf:'',op:''},
  {n:'25080',c:'CRIOCABIN Teolo APE',cp:'',cf:'',op:''},
  {n:'25081',c:'VAROTTO Via Grimani PD APE',cp:'',cf:'',op:''},
  {n:'25082',c:'ANCUTA ape',cp:'',cf:'',op:''},
  {n:'25083',c:'ARCHIVIO Torri di Quartesolo',cp:'',cf:'',op:''},
  {n:'25084',c:'MUNARI GROUP Vano tec Agrivoltaico',cp:'',cf:'',op:''},
  {n:'25085',c:'FINCATO Enea Serramenti',cp:'',cf:'',op:''},
  {n:'25086',c:'CAMPAGNA LUPIA Piazza Park',cp:'',cf:'',op:''},
  {n:'25087',c:'DAL COM Capannone Maserà',cp:'',cf:'',op:''},
  {n:'25088',c:'CONDOMINIO TIRRENO Boscolo FTV',cp:'',cf:'',op:''},
  {n:'25089',c:'BIFAMILIARE Via Ariosto Mirano',cp:'',cf:'',op:''},
  {n:'25090',c:'ZANINELLI 4unità PD',cp:'',cf:'',op:''},
  {n:'25091',c:'VIA PETRARCA Saonara APE',cp:'',cf:'',op:''},
  {n:'25092',c:'ARNOSTI Enea tenda',cp:'',cf:'',op:''},
  {n:'25093',c:'VERO SRL Casalserugo',cp:'',cf:'',op:''},
  {n:'25094',c:'CASA Via Trentino Campolongo',cp:'',cf:'',op:''},
  {n:'25095',c:'CASA COMMIATO Aps Padova',cp:'',cf:'',op:''},
  {n:'25096',c:'COND 4 Apt vicolo Castel Fidardo PD',cp:'',cf:'',op:''},
  {n:'25097',c:'TRIFAMILIARE Breda di Piave TV',cp:'',cf:'',op:''},
  {n:'25098',c:'ATTICO Corso del Popolo PD',cp:'',cf:'',op:''},
  {n:'25099',c:'BIF Via Corsivola Campolongo',cp:'',cf:'',op:''},
  {n:'25100',c:'NEGOZIO Via Roma 44 Due Carrare',cp:'',cf:'',op:''},
  {n:'25101',c:'COND Via Palestro PD',cp:'',cf:'',op:''},
  {n:'25102',c:'PERONI centrale a.c.s.',cp:'',cf:'',op:''},
  {n:'25103',c:'BIZ.STORE Bassano DG',cp:'',cf:'',op:''},
  {n:'25104',c:'THERAPEUTICA Bassano VI',cp:'',cf:'',op:''},
  {n:'25105',c:'BURGER KING Spinea',cp:'',cf:'',op:''},
  {n:'25106',c:'CASA Via Sauro Legnaro APE',cp:'',cf:'',op:''},
  {n:'25107',c:'CASA Via Sicilia Padova APE',cp:'',cf:'',op:''},
  {n:'25108',c:'COSMA Enea cdz',cp:'',cf:'',op:''},
  {n:'25109',c:'UNITA\' D Villa Antonietta',cp:'',cf:'',op:''},
  {n:'25110',c:'MASTROENI via Torino Albignasego',cp:'',cf:'',op:''},
  {n:'25111',c:'3UNITA\' Fiesso d\'Artico',cp:'',cf:'',op:''},
  {n:'25112',c:'ATTICO via S.Lucia PD',cp:'',cf:'',op:''},
  {n:'25113',c:'CASA Lotto 5a New Pereri Fossò',cp:'',cf:'',op:''},
  {n:'25114',c:'PALAZZO Fracanzani Este',cp:'',cf:'',op:''},
  {n:'26001',c:'BIOTRONICA Piovene Rocchette',cp:'',cf:'',op:''},
  {n:'26002',c:'MENHEALT Cottolengo PD',cp:'',cf:'',op:''},
  {n:'26003',c:'CASA FORESTAN Camisano',cp:'',cf:'',op:''},
  {n:'26004',c:'CAPANNONE PUA Severi II Lotto 1',cp:'',cf:'',op:''},
  {n:'26005',c:'COMUNE MONTEGROTTO Tvcc',cp:'',cf:'',op:''},
  {n:'26006',c:'CRICONIA 2026',cp:'',cf:'',op:''},
  {n:'26007',c:'UNICREDIT Censimento Tag',cp:'',cf:'',op:''},
  {n:'26008',c:'VIA SAN PELLICO Albignasego APE',cp:'',cf:'',op:''},
  {n:'26009',c:'VIA FRIULI Saonara APE',cp:'',cf:'',op:''},
  {n:'26010',c:'PIOVEGA Sagra',cp:'',cf:'',op:''},
  {n:'26011',c:'BARCHESSA TOMMASINI Veggiano PD',cp:'',cf:'',op:''},
  {n:'26012',c:'PALESTRA You&Motion',cp:'',cf:'',op:''},
  {n:'26013',c:'BIFAMILIARE Lotto 15 Maserà PD',cp:'',cf:'',op:''},
  {n:'26014',c:'COND. GREEN LIFE Saonara',cp:'',cf:'',op:''},
  {n:'26015',c:'CASA AGNOLI via Padrin PD',cp:'',cf:'',op:''},
  {n:'26016',c:'EDIFICIO 2 unità via Ponterotto Villafranca PD',cp:'',cf:'',op:''},
  {n:'26017',c:'BERTAZZO Legnaro',cp:'',cf:'',op:''},
  {n:'26018',c:'CASA Via Pave Campolongo',cp:'',cf:'',op:''},
  {n:'26019',c:'CASA Tombolo',cp:'',cf:'',op:''},
  {n:'26020',c:'CASA MATTERAZZO EVA Campolongo',cp:'',cf:'',op:''},
  {n:'26021',c:'COOP SAN GREGORIO Padova',cp:'',cf:'',op:''},
  {n:'26022',c:'COOP VILLA IDA Padova',cp:'',cf:'',op:''},
  {n:'26023',c:'STELLA casa Montecchio Prec',cp:'',cf:'',op:''},
  {n:'26024',c:'SM GROUP casa Malo',cp:'',cf:'',op:''},
  {n:'26025',c:'M033 Spinea',cp:'',cf:'',op:''},
  {n:'26026',c:'Parrocchia CASALSERUGO CT Chiesa',cp:'',cf:'',op:''},
  {n:'26027',c:'APE APP. piano terra Mestre VE',cp:'',cf:'',op:''},
  {n:'26028',c:'LA SEMAFORICA Capannone PD',cp:'',cf:'',op:''},
  {n:'26029',c:'SEGNALETICA DESTRO Sede',cp:'',cf:'',op:''},
  {n:'26030',c:'TENUTA LA PRESA Gruppi Frigo',cp:'',cf:'',op:''},
  {n:'26031',c:'B&B BALLAN Ampliam. sede',cp:'',cf:'',op:''},
  {n:'26032',c:'FREGUGLIA Lung. Adr. Chioggia',cp:'',cf:'',op:''},
  {n:'26033',c:'NEGOZIO viale porta adige Rovigo',cp:'',cf:'',op:''},
  {n:'26034',c:'VIA SILVIO PELLICO Albignasego APE',cp:'',cf:'',op:''},
  {n:'26035',c:'ABITAZ. SEGHETTO Isola DS VR',cp:'',cf:'',op:''},
  {n:'26036',c:'APE via Pioga Campodarsego',cp:'',cf:'',op:''},
  {n:'26037',c:'APPARTAM via Basso Camponogara',cp:'',cf:'',op:''},
  {n:'26038',c:'CASA Barbieri via Roma Rubano',cp:'',cf:'',op:''},
  {n:'26039',c:'HOTEL EDISON Chioggia VE',cp:'',cf:'',op:''},
  {n:'26040',c:'26040_CENTRO PRELIEVI Borgoricco PD',cp:'',cf:'',op:''},
  {n:'26041',c:'CASA ALESSI Cittadella PD',cp:'',cf:'',op:''},
  {n:'26042',c:'GRANDATE Lavatoio',cp:'',cf:'',op:''},
  {n:'26043',c:'EDIFICIO Via G. Carducci 12 PSN',cp:'',cf:'',op:''},
  {n:'26044',c:'TUTTARREDO Correzzola (PD)',cp:'',cf:'',op:''},
  {n:'26045',c:'SCUOLA SAN BIAGIO Teolo',cp:'',cf:'',op:''},
  {n:'26046',c:'SPOGLIATOI Solesino PD',cp:'',cf:'',op:''},
  {n:'26047',c:'CASA AMIRI Padova',cp:'',cf:'',op:''},
  {n:'26048',c:'CALORE ape piazza XX sett 62 SUB 7',cp:'',cf:'',op:''},
  {n:'26049',c:'P1 ALA EST ex Centr.Idro Montereale PN',cp:'',cf:'',op:''},
  {n:'26050',c:'CAPANNONE Via Svezia 7 PD',cp:'',cf:'',op:''},
  {n:'26051',c:'VIA SANTA SOFIA Padova APE 3 unità',cp:'',cf:'',op:''},
  {n:'26052',c:'VIA CAVALCA Padova APE',cp:'',cf:'',op:''},
  {n:'26053',c:'VILLA NALINI Verona',cp:'',cf:'',op:''},
  {n:'26054',c:'MIBOS PD',cp:'',cf:'',op:''},
  {n:'26055',c:'CAPANNONE Correzzola',cp:'',cf:'',op:''},
  {n:'26056',c:'PLANNING PRO classeA',cp:'',cf:'',op:''},
  {n:'26057',c:'APE EDIFICI Castelfidardo',cp:'',cf:'',op:''},
  {n:'26058',c:'FIDALCO Schio V',cp:'',cf:'',op:''},
  {n:'26059',c:'CAMPAGNA LUPIA Park angolo',cp:'',cf:'',op:''},
  {n:'26060',c:'COND. Castelfidardo 48',cp:'',cf:'',op:''},
  {n:'26061',c:'BARCHESSA Piove di Sacco APE Saeid',cp:'',cf:'',op:''},
  {n:'26062',c:'CASA via Serra 2A Abano',cp:'',cf:'',op:''},
  {n:'26063',c:'MONTEMERLO Saccolongo 2APE',cp:'',cf:'',op:''},
  {n:'26064',c:'Q8 Park Porpetto UD',cp:'',cf:'',op:''},
  {n:'26065',c:'MELINA 2026',cp:'',cf:'',op:''},
  {n:'26066',c:'PERONI Laboratori',cp:'',cf:'',op:''},
  {n:'26067',c:'UNICAMILLUS variante Mestre',cp:'',cf:'',op:''},
  {n:'26068',c:'RISTO San Marco 223-228 VE',cp:'',cf:'',op:''},
  {n:'26069',c:'CASA BALLARIN Sopraelev Chioggia',cp:'',cf:'',op:''},
  {n:'26070',c:'CASA NESI ape',cp:'',cf:'',op:''},
  {n:'26071',c:'CASA CHINELLO Brugine',cp:'',cf:'',op:''},
  {n:'26072',c:'SPOGLIATOI SCUOLE Solesino',cp:'',cf:'',op:''},
  {n:'26073',c:'TORRI I009 Parma',cp:'',cf:'',op:''},
  {n:'26074',c:'APP via S.Francesco Casalserugo',cp:'',cf:'',op:''},
  {n:'26075',c:'EDIFICIO via Piave 16 PD',cp:'',cf:'',op:''},
  {n:'26076',c:'RSA LAVAGNO ape',cp:'',cf:'',op:''},
  {n:'26077',c:'NEGOZIO Ponte Molino PD',cp:'',cf:'',op:''},
  {n:'26078',c:'ROCCABONELLA Negozio PD',cp:'',cf:'',op:''},
  {n:'26079',c:'VENULEO Padova',cp:'',cf:'',op:''},
  {n:'26080',c:'STUDIO MARTIN Via Forcellini PD',cp:'',cf:'',op:''},
  {n:'26081',c:'IT KENNEDY Cantina PD',cp:'',cf:'',op:''},
  {n:'26082',c:'CDC Monfalcone Perizia',cp:'',cf:'',op:''},
  {n:'26083',c:'POLIZIA PD Cucina Mensa',cp:'',cf:'',op:''},
  {n:'26084',c:'P1 Palaz Contarini Este',cp:'',cf:'',op:''}
];

const CNC_SEED_MAP = (()=>{ const m={}; CNC_SEED.forEach(r=>{ m[r.n]=r; }); return m; })();

// Stessa identica logica di composizione usata in salvaNuovaCommessa()
// (vedi bcComponiCommittente in admin.html) — tenerle allineate se una
// delle due cambia. Se il nome digitato contiene già "numero_" davanti,
// non lo raddoppia.
function cncComponiCommittente(numero, nomeRaw){
  numero=(numero||'').toString().trim();
  let nome=(nomeRaw||'').toString().trim();
  const prefix=numero+'_';
  if(nome.startsWith(prefix)) nome=nome.slice(prefix.length);
  return numero ? (prefix+nome) : nome;
}

function cncCostruisciNote(row){
  const parti=[];
  if(row.cp) parti.push('Committente Plant: '+row.cp);
  if(row.cf) parti.push('Cliente finale: '+row.cf);
  if(row.op) parti.push('Opera: '+row.op);
  return parti.join('\n');
}

function cncAnnoDaNumero(numero){
  const pref=(numero||'').toString().slice(0,2);
  const n=parseInt(pref,10);
  return (Number.isFinite(n) && n>=0 && n<=99) ? (2000+n) : null;
}

// Calcola il piano di modifiche confrontando BC_commesse (già in memoria,
// nessuna query Firestore aggiuntiva) con il seed ufficiale. Funzione
// pura, nessuna scrittura: usata sia per il banner che per l'anteprima.
function cncCalcolaPiano(){
  const daAggiornare=[]; // {numero, committenteAttuale, committenteNuovo|null, noteNuova|null}
  const daCreare=[];     // {numero, committenteNuovo, noteNuova, anno}
  const trovati=new Set();

  (typeof BC_commesse!=='undefined'?BC_commesse:[]).forEach(c=>{
    const numero=(c.numero||'').toString().trim();
    if(!numero)return;
    trovati.add(numero);
    const row=CNC_SEED_MAP[numero];
    const committenteAttuale=(c.committente||'').trim();
    let committenteNuovo=null;

    if(row){
      committenteNuovo=cncComponiCommittente(numero,row.c);
    }else if(committenteAttuale){
      const prefix=numero+'_';
      committenteNuovo = committenteAttuale.startsWith(prefix) ? null : cncComponiCommittente(numero,committenteAttuale);
    }
    // altrimenti: numero non nell'Excel E senza nome attuale → non possiamo
    // inventare nulla, lasciamo la commessa com'è (nessuna riga in output).

    const cambiaNome = committenteNuovo!==null && committenteNuovo!==committenteAttuale;

    let noteNuova=null;
    if(row && !(c.note||'').trim()){
      const built=cncCostruisciNote(row);
      if(built) noteNuova=built;
    }

    if(cambiaNome || noteNuova!==null){
      daAggiornare.push({numero, committenteAttuale, committenteNuovo: cambiaNome?committenteNuovo:null, noteNuova});
    }
  });

  CNC_SEED.forEach(row=>{
    if(trovati.has(row.n))return;
    const committenteNuovo=cncComponiCommittente(row.n,row.c);
    const noteNuova=cncCostruisciNote(row);
    daCreare.push({numero:row.n, committenteNuovo, noteNuova, anno:cncAnnoDaNumero(row.n)});
  });

  const ordina=(a,b)=>String(a.numero).localeCompare(String(b.numero),undefined,{numeric:true});
  daAggiornare.sort(ordina);
  daCreare.sort(ordina);

  return {daAggiornare, daCreare};
}

// ── Banner "una tantum" nella pagina Rubrica Commesse ──────────────────
function renderCorrNomiCommesseBanner(){
  const wrap=document.getElementById('corr-nomi-commesse-wrap');
  if(!wrap)return;
  if(typeof BC_commesseLoaded==='undefined' || !BC_commesseLoaded || !BC_commesse || !BC_commesse.length){wrap.innerHTML='';return}
  const {daAggiornare, daCreare}=cncCalcolaPiano();
  if(!daAggiornare.length && !daCreare.length){wrap.innerHTML='';return}
  wrap.innerHTML=`<div class="contab-import-banner">
    <div class="contab-import-banner-txt">🗂️ Trovate ${daAggiornare.length+daCreare.length} commesse da sistemare rispetto all'elenco ufficiale (${daAggiornare.length} da aggiornare, ${daCreare.length} da creare). Puoi rivedere il dettaglio completo prima di scrivere qualsiasi cosa.</div>
    <button class="btn btn-blu btn-sm" onclick="cncApriAnteprima()">🔍 Anteprima e correzione</button>
  </div>`;
}

// ── Anteprima dettagliata (nessuna scrittura) ───────────────────────────
function cncApriAnteprima(){
  const {daAggiornare, daCreare}=cncCalcolaPiano();
  const wrap=document.getElementById('corr-nomi-commesse-wrap');
  if(!wrap)return;
  const esc=s=>String(s==null?'':s).replace(/</g,'&lt;');
  const rigaAgg=daAggiornare.map(x=>`
    <tr>
      <td style="padding:5px 8px;white-space:nowrap">${esc(x.numero)}</td>
      <td style="padding:5px 8px;white-space:nowrap">Aggiorna</td>
      <td style="padding:5px 8px">${esc(x.committenteAttuale||'—')}</td>
      <td style="padding:5px 8px">${esc(x.committenteNuovo||x.committenteAttuale||'—')}</td>
      <td style="padding:5px 8px;white-space:nowrap">${x.noteNuova?'✓ nota aggiunta':'—'}</td>
    </tr>`).join('');
  const rigaCrea=daCreare.map(x=>`
    <tr>
      <td style="padding:5px 8px;white-space:nowrap">${esc(x.numero)}</td>
      <td style="padding:5px 8px;white-space:nowrap">Crea</td>
      <td style="padding:5px 8px">—</td>
      <td style="padding:5px 8px">${esc(x.committenteNuovo)}</td>
      <td style="padding:5px 8px;white-space:nowrap">${x.noteNuova?'✓ nota':'—'}</td>
    </tr>`).join('');
  wrap.innerHTML=`<div class="contab-import-banner" style="flex-direction:column;align-items:stretch;gap:10px">
    <div class="contab-import-banner-txt">🗂️ Anteprima correzione nomi commesse — <b>${daAggiornare.length}</b> da aggiornare, <b>${daCreare.length}</b> da creare. Nessuna scrittura è ancora stata effettuata: controlla con calma, poi conferma in fondo alla tabella.</div>
    <div style="max-height:420px;overflow:auto;border:1px solid var(--border);border-radius:8px">
      <table style="width:100%;font-size:12px;border-collapse:collapse">
        <thead style="position:sticky;top:0;background:#f4f4f4">
          <tr>
            <th style="text-align:left;padding:6px 8px">Numero</th>
            <th style="text-align:left;padding:6px 8px">Azione</th>
            <th style="text-align:left;padding:6px 8px">Nome attuale</th>
            <th style="text-align:left;padding:6px 8px">Nome nuovo</th>
            <th style="text-align:left;padding:6px 8px">Note</th>
          </tr>
        </thead>
        <tbody>${rigaAgg}${rigaCrea}</tbody>
      </table>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn btn-sm" onclick="renderCorrNomiCommesseBanner()">Annulla</button>
      <button class="btn btn-ink btn-sm" onclick="cncEseguiCorrezione()">✅ Conferma e scrivi su Firestore</button>
    </div>
  </div>`;
}

// ── Scrittura effettiva (solo dopo conferma esplicita) ──────────────────
async function cncEseguiCorrezione(){
  const {daAggiornare, daCreare}=cncCalcolaPiano();
  if(!daAggiornare.length && !daCreare.length){alert('Niente da correggere.');return}

  const msg=`Stai per scrivere su Firestore:\n\n`+
    `• ${daAggiornare.length} commesse esistenti aggiornate (solo nome e/o note — tariffe, monte ore, ore già registrate e listino stampe restano invariati)\n`+
    `• ${daCreare.length} nuove commesse create (con le stesse tariffe/monte ore di default di "+ Nuova Commessa")\n\n`+
    `Confermi la scrittura?`;
  if(!confirm(msg))return;

  const wrap=document.getElementById('corr-nomi-commesse-wrap');
  if(wrap)wrap.innerHTML='<div class="empty-state">Correzione in corso, non chiudere la pagina...</div>';

  const ops=[];
  daAggiornare.forEach(x=>{
    const upd={};
    if(x.committenteNuovo!==null) upd.committente=x.committenteNuovo;
    if(x.noteNuova!==null) upd.note=x.noteNuova;
    if(Object.keys(upd).length) ops.push({tipo:'update', numero:x.numero, data:upd});
  });
  daCreare.forEach(x=>{
    const rec={
      numero:x.numero,
      anno:x.anno||(typeof ANNO!=='undefined'?ANNO:new Date().getFullYear()),
      committente:x.committenteNuovo,
      progetto:'',
      note:x.noteNuova||'',
      tariffaSenior:98,
      tariffaJunior:31,
      tariffaKm:0.45,
      monteOreEle:0,
      monteOreMec:0,
      listinoStampe:JSON.parse(JSON.stringify(BC_DEFAULT_LISTINO)),
      createdBy:(typeof ADM!=='undefined'&&ADM.username)?ADM.username:'import-nomi-commesse',
      createdAt:new Date().toISOString()
    };
    ops.push({tipo:'create', numero:x.numero, data:rec});
  });

  let fatti=0;
  for(let i=0;i<ops.length;i+=450){
    const chunk=ops.slice(i,i+450);
    const batch=db.batch();
    chunk.forEach(op=>{
      const ref=db.collection('commesse').doc(op.numero);
      if(op.tipo==='update') batch.update(ref,op.data);
      else batch.set(ref,op.data);
    });
    await batch.commit();
    fatti+=chunk.length;
  }

  alert(`✓ Correzione completata.\n\n${daAggiornare.length} commesse aggiornate, ${daCreare.length} commesse create (${fatti} operazioni totali).`);
  await loadCommesse(true);
  try{ if(typeof renderRubrica==='function') renderRubrica(); }catch(e){}
  try{ renderCorrNomiCommesseBanner(); }catch(e){}
}
