// Dati estratti dai 249 file Excel storici: tabella "NUMERO DI ORE PREVENTIVATE IN OFFERTA"
// (Senior/Junior x Ele/Mec) presente solo nei file in formato nuovo (116 fasi su 1549).
// Usato una tantum da migrazione_monte_ore_split.js per popolare i 4 campi monte ore
// separati Senior/Junior, al posto di monteOreEle/monteOreMec unici.
const MONTE_ORE_PREVENTIVATO_DATA = [
 {
  "numero": "24058",
  "faseId": "fase2",
  "faseNome": "VARIANTE OTT 2025",
  "fileOrigine": "24058_BUDGET CONTRACT VARIANTE OTT 2025.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 92.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 20.0
 },
 {
  "numero": "25073",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25073_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 25.0,
  "monteOreEleJunior": 30.0,
  "monteOreMecSenior": 25.0,
  "monteOreMecJunior": 30.0
 },
 {
  "numero": "25077",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25077_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 8.0,
  "monteOreEleJunior": 56.0,
  "monteOreMecSenior": 14.0,
  "monteOreMecJunior": 64.0
 },
 {
  "numero": "25084",
  "faseId": "fase2",
  "faseNome": "VARIANTE",
  "fileOrigine": "25084_BUDGET CONTRACT VARIANTE.xlsx",
  "monteOreEleSenior": 25.0,
  "monteOreEleJunior": 30.0,
  "monteOreMecSenior": 25.0,
  "monteOreMecJunior": 30.0
 },
 {
  "numero": "25085",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25085_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 25.0,
  "monteOreEleJunior": 30.0,
  "monteOreMecSenior": 25.0,
  "monteOreMecJunior": 30.0
 },
 {
  "numero": "25086",
  "faseId": "fase1",
  "faseNome": "ESECUTIVO",
  "fileOrigine": "25086_BUDGET CONTRACT ESECUTIVO.xlsx",
  "monteOreEleSenior": 8.0,
  "monteOreEleJunior": 24.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25086",
  "faseId": "fase2",
  "faseNome": "PRELIMINARE",
  "fileOrigine": "25086_BUDGET CONTRACT PRELIMINARE.xlsx",
  "monteOreEleSenior": 4.0,
  "monteOreEleJunior": 16.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25087",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25087_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 4.0,
  "monteOreEleJunior": 24.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25088",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25088_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 6.0,
  "monteOreEleJunior": 30.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25089",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25089_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25090",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25090_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25091",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25091_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25092",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25092_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25093",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25093_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25094",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25094_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25095",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25095_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25096",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25096_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25097",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25097_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 10.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25098",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25098_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25099",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25099_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25100",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25100_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25101",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25101_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25102",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25102_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25103",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25103_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25104",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25104_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 8.0,
  "monteOreEleJunior": 20.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25105",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25105_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25106",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25106_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25107",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25107_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25108",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25108_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25109",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25109_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25110",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25110_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25111",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25111_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25112",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25112_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25113",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25113_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "25114",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "25114_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 18.0,
  "monteOreEleJunior": 110.0,
  "monteOreMecSenior": 30.0,
  "monteOreMecJunior": 150.0
 },
 {
  "numero": "26001",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26001_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 8.0,
  "monteOreEleJunior": 32.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26002",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26002_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 4.0,
  "monteOreEleJunior": 24.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26003",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26003_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26004",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26004_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 5.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26005",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26005_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 25.0,
  "monteOreEleJunior": 40.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26008",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26008_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 2.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26009",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26009_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 2.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26010",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26010_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 2.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26011",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26011_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 2.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26012",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26012_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 2.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26013",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26013_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 2.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26014",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26014_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 2.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26015",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26015_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 2.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26016",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26016_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 2.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26017",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26017_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 2.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26018",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26018_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 2.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26019",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26019_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 2.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26020",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26020_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 2.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26021",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26021_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 5.0,
  "monteOreEleJunior": 20.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26022",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26022_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 5.0,
  "monteOreEleJunior": 20.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26023",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26023_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 2.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26024",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26024_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 2.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26025",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26025_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26026",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26026_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 2.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26027",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26027_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 2.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26028",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26028_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 10.0,
  "monteOreEleJunior": 40.0,
  "monteOreMecSenior": 16.0,
  "monteOreMecJunior": 48.0
 },
 {
  "numero": "26029",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26029_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 6.0,
  "monteOreEleJunior": 22.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26030",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26030_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26031",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26031_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 10.0,
  "monteOreEleJunior": 64.0,
  "monteOreMecSenior": 10.0,
  "monteOreMecJunior": 72.0
 },
 {
  "numero": "26032",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26032_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26033",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26033_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26034",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26034_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26035",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26035_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26036",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26036_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26037",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26037_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26038",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26038_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26039",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26039_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26040",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26040_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 4.0,
  "monteOreEleJunior": 12.0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26041",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26041_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26042",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26042_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26043",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26043_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 4.0,
  "monteOreEleJunior": 50.0,
  "monteOreMecSenior": 6.0,
  "monteOreMecJunior": 60.0
 },
 {
  "numero": "26044",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26044_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26045",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26045_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26046",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26046_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 4.0,
  "monteOreEleJunior": 40.0,
  "monteOreMecSenior": 9.0,
  "monteOreMecJunior": 46.0
 },
 {
  "numero": "26047",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26047_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26048",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26048_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26049",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26049_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 38.0
 },
 {
  "numero": "26050",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26050_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26051",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26051_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26052",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26052_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26053",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26053_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26054",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26054_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26055",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26055_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26056",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26056_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26057",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26057_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26058",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26058_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26059",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26059_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26060",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26060_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26061",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26061_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26062",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26062_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26063",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26063_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26064",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26064_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26066",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26066_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26067",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26067_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26068",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26068_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26069",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26069_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26070",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26070_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26071",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26071_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26072",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26072_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26073",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26073_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26074",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26074_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26075",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26075_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26076",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26076_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26077",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26077_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26078",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26078_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26079",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26079_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26080",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26080_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26081",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26081_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26082",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26082_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26083",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26083_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 },
 {
  "numero": "26084",
  "faseId": "fase1",
  "faseNome": "Generale",
  "fileOrigine": "26084_BUDGET CONTRACT.xlsx",
  "monteOreEleSenior": 0,
  "monteOreEleJunior": 0,
  "monteOreMecSenior": 0,
  "monteOreMecJunior": 0
 }
];
