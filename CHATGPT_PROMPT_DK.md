# Prompt til ChatGPT 5.2 - Machine History QR Projekt Setup

Hej ChatGPT,

Jeg har brug for hjælp til at få et eksisterende projekt kørende. Jeg har arbejdet med en anden AI-assistent (Auto fra Cursor) for at forstå projektet, og nu har jeg brug for din hjælp til at få det sat op og kørende.

## Hvad er dette projekt?

**Machine History QR** er en fuldstack webapplikation til at administrere maskinhistorik og vedligeholdelse gennem QR-koder. Det er et omfattende system med følgende funktioner:

### Hovedfunktioner:
- **Maskinadministration**: Opret, rediger, slet og vis maskiner med detaljerede oplysninger
- **QR-kode system**: Generer QR-koder til maskiner og scan dem med kamera
- **Vedligeholdelseshistorik**: Spor servicehistorik, smøring, vedligeholdelse og olieinformation
- **Opgaver (Tasks)**: Opret og tildel opgaver til maskiner med workflow (pending → in-progress → completed)
- **Dokumenthåndtering**: Upload dokumenter, billeder, 3D-modeller
- **Brugeradministration**: Roller og adgangskontrol (admin/bruger)
- **Dashboard**: Oversigt over alle maskiner med kortvisning og kortvisning
- **Offline support**: IndexedDB til offline adgang
- **PWA-ready**: Service worker til progressive web app funktionalitet

## Tech Stack

### Frontend:
- **React 18** med **TypeScript**
- **Vite** som build tool (kører på port 8081, IKKE 5173!)
- **Tailwind CSS** til styling
- **Shadcn UI** komponenter (50+ React komponenter)
- **React Router** til navigation
- **Supabase Client** til database og authentication
- **IndexedDB** (via idb) til offline support
- **QR Code biblioteker**: qrcode, html5-qrcode, @zxing/browser
- **3D Viewer**: @google/model-viewer
- **Kort**: Leaflet og react-leaflet
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod validation

### Backend (valgfri):
- **Node.js + Express** server
- **MongoDB** med Mongoose (alternativ til Supabase)
- RESTful API endpoints
- Test suite med Jest

### Database:
- **Supabase** (PostgreSQL) som primær database
- Database schema defineret i `supabase/schema.sql`
- Tabeller: machines, tasks, maintenance

## Projektstruktur

```
machine-history-qr-main/
├── src/                    # Frontend React app
│   ├── components/         # 50+ React komponenter
│   │   ├── machine/        # Maskin-relaterede komponenter
│   │   ├── qr-scanner/     # QR scanner komponenter
│   │   ├── dashboard/       # Dashboard komponenter
│   │   ├── service/        # Service/vedligeholdelse
│   │   ├── elearning/      # E-learning funktioner
│   │   └── ui/             # Shadcn UI komponenter
│   ├── pages/              # 7 hovedpages
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # API & Supabase client
│   └── utils/              # Utility funktioner
├── backend/                # Node.js backend (valgfri)
│   ├── controllers/        # API controllers
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   └── tests/              # Test suite
├── supabase/               # Database schema
│   └── schema.sql          # SQL schema fil
├── dist/                   # Build output
├── package.json            # Frontend dependencies
├── vite.config.ts          # Vite konfiguration (port 8081)
└── .env                    # Environment variabler (skal oprettes)
```

## Hvad jeg har lavet indtil nu

Jeg har arbejdet med Auto (Cursor AI) til at:
1. ✅ **Analysere projektstrukturen** - Forstået hele projektets opbygning
2. ✅ **Identificeret tech stack** - Ved hvilke teknologier der bruges
3. ✅ **Læst dokumentation** - Gennemgået README, setup guides, og status dokumenter
4. ✅ **Forstået dependencies** - Ved hvilke npm pakker der skal installeres
5. ✅ **Identificeret setup krav** - Ved at Supabase skal konfigureres

## Nuværende status

### Hvad der er klart:
- ✅ Projektstruktur er komplet
- ✅ Alle kodefiler er på plads
- ✅ Dependencies er defineret i package.json
- ✅ Vite er konfigureret til port 8081
- ✅ Supabase integration er implementeret
- ✅ Database schema er defineret i `supabase/schema.sql`

### Hvad der mangler/ikke er testet:
- ❓ **Node.js installation** - Ved ikke om det er installeret
- ❓ **npm dependencies** - Ved ikke om `npm install` er kørt
- ❓ **Supabase projekt** - Ved ikke om Supabase projekt er oprettet
- ❓ **.env fil** - Ved ikke om .env fil eksisterer med korrekte credentials
- ❓ **Database schema** - Ved ikke om schema er kørt i Supabase
- ❓ **Backend (valgfri)** - Ved ikke om backend skal bruges eller kun Supabase

## Hvad jeg har brug for hjælp til

Jeg har brug for din hjælp til at:

1. **Verificere systemkrav**:
   - Tjekke om Node.js er installeret og hvilken version
   - Tjekke om npm er tilgængelig
   - Verificere at alle nødvendige værktøjer er på plads

2. **Installere dependencies**:
   - Køre `npm install` i root mappen
   - Eventuelt også `npm install` i backend mappen hvis backend skal bruges

3. **Opsætte Supabase**:
   - Guide mig gennem oprettelse af Supabase projekt (hvis ikke allerede gjort)
   - Hjælpe med at køre database schema fra `supabase/schema.sql`
   - Oprette `.env` fil med korrekte Supabase credentials
   - Verificere at Supabase connection virker

4. **Starte applikationen**:
   - Køre `npm run dev` og verificere at serveren starter
   - Tjekke at appen kører på `http://localhost:8081` (ikke 5173!)
   - Fejlfinding hvis der opstår problemer

5. **Valgfri: Backend setup** (hvis nødvendigt):
   - Hvis backend skal bruges i stedet for kun Supabase
   - Opsætte MongoDB (hvis valgt)
   - Konfigurere backend .env fil
   - Starte backend server

## Vigtige detaljer

- **Port**: Appen kører på port **8081**, ikke standard 5173
- **Environment variabler**: Skal have `VITE_SUPABASE_URL` og `VITE_SUPABASE_ANON_KEY` i `.env` fil
- **Supabase er primær database**: Backend er valgfri, Supabase bruges som standard
- **Windows miljø**: Jeg kører Windows 10, så kommandoer skal være Windows-kompatible

## Næste skridt jeg forventer

Jeg håber du kan:
1. Guide mig gennem en systematisk tjekliste af hvad der skal gøres
2. Hjælpe mig med at identificere hvad der mangler
3. Give mig step-by-step instruktioner til at få alt sat op
4. Fejlfindinge problemer der opstår undervejs
5. Verificere at appen kører korrekt når alt er sat op

Kan du hjælpe mig med at få dette projekt kørende? Start gerne med at tjekke systemkrav og derefter guide mig gennem setup processen step-by-step.

---

**Projekt sti**: `C:\Users\admin\OneDrive\Desktop\machine-history-qr-main\machine-history-qr-main`

**Vigtige filer at være opmærksom på**:
- `package.json` - Frontend dependencies
- `backend/package.json` - Backend dependencies (hvis backend bruges)
- `vite.config.ts` - Port konfiguration (8081)
- `supabase/schema.sql` - Database schema
- `LOCAL_SETUP_GUIDE.md` - Lokal setup guide
- `SUPABASE_SETUP.md` - Supabase setup guide
- `PROJECT_STATUS.md` - Detaljeret projekt status


