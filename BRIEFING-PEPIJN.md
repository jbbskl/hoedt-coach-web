# Briefing — correcties op je drie bevindingen

Je drie observaties waren scherp. Twee bleken artefacten van hóé ik de snapshot had ingepakt (mijn fout, niet die van de app), één was terecht. Alles is inmiddels opgelost en opnieuw gepusht. **Haal de nieuwste versie op voor je verder gaat** — anders ontwerp je dingen opnieuw die al bestaan.

---

## 1. Klant-detailpagina 404't → opgelost, en je vond hiermee een echte bug

Twee oorzaken:

- **Mijn verpakking**: ik had de pagina weggeschreven op `/coach/klant-detail/`, terwijl de klantenlijst linkt naar `/coach/klanten/<id>`. De link klopte dus niet, de pagina wel.
- **Een echt datalek in de lijst**: 8 van de 11 rijen waren *wees-intakes* — restanten van test-klanten uit onze audit, waarvan de klant wél maar de intake niet was opgeruimd. Die links 404'den terecht.

**Nu:** de lijst bevat 3 echte klanten, alle detail-links werken, de pagina's zijn 79–93 KB volledig gerenderd.
**Je hoeft deze pagina dus niet from scratch te ontwerpen** — hij bestaat compleet, met alle tegels (check-ins, gewicht, voeding, training, login, metingen, foto's, actiepunten, logboek, betalingen).

Je bevinding was trouwens waardevoller dan je dacht: diezelfde wees-intakes zouden ook de geplande databasemigratie hebben laten klappen. Die is nu structureel afgevangen.

## 2. Chat / Aandacht / Taken laden geen rijen → klopte, nu opgelost

Die schermen halen hun inhoud client-side op (chat 6 aanroepen, aandacht 11, taken 5) en er zat geen backend onder de snapshot.

**Nu bevroren en werkend:** aandacht-signalen, takenlijst, berichten-overzicht, wekelijkse check-ins, healthscores, sales-calls, backup-lijst, scheduler-status, chat-threads per klant, en alle 45 recept-details (dus de recept-editor-modal opent gevuld).

## 3. Schema Builder-tabs zijn stubs → dit klopt niet

Die tabs zijn volledig gebouwd:

| Tab | Omvang | Inhoud |
|---|---|---|
| Producten | **757 KB** | volledige productenbibliotheek met macro's |
| Recepten | 216 KB | receptenbibliotheek + editor |
| Oefeningen | 211 KB | oefeningenbibliotheek |

Een stub is geen 757 KB. Wat je zag: de tabs linken via `?tab=producten`, en een statische host negeert query-strings — dus je landde terug op de generator. Die links zijn nu herschreven naar echte paden en werken.

---

## Wat wél en niet werkt in deze snapshot

**Werkt:** alle pagina's, alle styling, navigatie, tabs, en elk scherm dat data *leest* — die tonen echte gevulde data.

**Werkt niet, en kan ook niet:** alles wat iets *opslaat of verstuurt*. Concreet 16 acties: bericht versturen, bericht goedkeuren/negeren/terugzetten, snoozen, taak opslaan, klant aanmaken, wachtwoord wijzigen, backup draaien, wekelijkse check-in versturen, actieplannen genereren. Een statische host kan geen POST verwerken — daar is geen omweg voor.

**Wil je die flows écht doorlopen** (bijvoorbeeld de goedkeur-workflow voor berichten, die je terecht als kernfunctie noemde): draai de backend lokaal, dan werkt alles inclusief opslaan.

```
git clone <backend-repo>
npm install
node server.js        # → http://localhost:3000/coach
```

---

## Documenten in deze repo

- **`SCOPE-PLATFORM.md`** — elke functie van beide portalen, wat het doet en de workflow. **Sectie 6 is het belangrijkst:** daar staat wat er nu al mist of dood is in de frontend, inclusief de valkuil dat de training-tab twee keer in de code staat en één versie dood is.
- **`E2E-TEST-CHECKLIST.md`** — vinkbare doorloop van alle functies.
