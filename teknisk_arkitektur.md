# Teknisk arkitektur för FormFlow

## Översikt

FormFlow är en SaaS-lösning uppbyggd med en modern mikrotjänstarkitektur, där frontend och backend är löst kopplade via API:er. Lösningen använder Supabase för datapersistens och autentisering.

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│  React Frontend  │◄────┤  Python Backend  │◄────┤    Supabase      │
│                  │     │                  │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

## Frontend (React)

### Teknologier
- React 18+
- React Router för routing
- Redux eller Context API för tillståndshantering
- Styled Components eller TailwindCSS för styling
- React Testing Library för komponenttester
- Axios för API-anrop

### Huvudkomponenter
1. **AuthModule** - Hantering av inloggning, registrering, återställning av lösenord
2. **ProducerDashboard** - Dashboard för producenter
3. **AdminDashboard** - Dashboard för administratörer
4. **FormBuilder** - Verktyg för att skapa och anpassa formulär
5. **OrderManagement** - Hantering av beställningar
6. **ProductManagement** - Hantering av produkter
7. **InventoryManagement** - Hantering av lagersaldo
8. **Analytics** - Visualisering av statistik och trender

## Backend (Python)

### Teknologier
- FastAPI för API-utveckling
- SQLAlchemy för ORM och databasinteraktion
- Pydantic för datavalidering
- pytest för enhetstester
- JWT för autentisering (via Supabase)
- Resend för e-postutskick

### Huvudmoduler
1. **AuthService** - Integrering med Supabase Auth
2. **FormService** - Hantering av formulär och formulärdata
3. **OrderService** - Beställningslogik och bearbetning
4. **ProductService** - Produkthantering
5. **InventoryService** - Lagersaldohantering
6. **AnalyticsService** - Dataaggregering och statistik
7. **AdminService** - Administrativa funktioner
8. **EmailService** - Hantering av e-postutskick via Resend

## Datalagring (Supabase)

### Huvudfunktioner
- PostgreSQL-databas för relationell datalagring
- Supabase Auth för användarhantering och autentisering
- Realtidsuppdateringar via Supabase Realtime
- Row Level Security (RLS) för dataåtkomstkontroll

### Nyckeltabeller
1. **users** - Användarinformation (hanteras av Supabase Auth)
2. **profiles** - Utökad användarinformation
3. **organizations** - Information om producenter
4. **products** - Produktdata
5. **forms** - Formulärinformation
6. **form_fields** - Formulärfält
7. **orders** - Beställningar
8. **order_items** - Beställda produkter
9. **inventory** - Lagersaldo
10. **subscriptions** - Prenumerationsdata

## API-design

RESTful API med följande huvudendpoints:

```
/api/auth - Autentiseringsrelaterade endpoints
/api/forms - Formulärhantering
/api/products - Produkthantering
/api/orders - Beställningshantering
/api/inventory - Lagersaldohantering
/api/analytics - Statistik och rapporter
/api/admin - Administrativa funktioner
```

## Säkerhet

1. **Autentisering** - JWT-baserad via Supabase Auth
2. **Auktorisering** - Rollbaserad åtkomstkontroll (RBAC)
3. **Dataåtkomst** - Row Level Security i Supabase
4. **API-säkerhet** - CORS, rate limiting
5. **Input-validering** - Via Pydantic på backend och formulärvalidering på frontend
6. **HTTPS** - All trafik krypterad
7. **Säker hantering av lösenord** - Via Supabase Auth
8. **CSP** - Content Security Policy för frontend
9. **Miljövariabler** - Känsliga nycklar som Resend API-nyckel lagras i .env-fil i backend

## Infrastruktur

1. **Hosting**
   - Frontend: Vercel eller Netlify
   - Backend: Railway, Render eller liknande
   - Databas: Supabase

2. **CI/CD**
   - GitHub Actions för automatisk byggnad, testning och driftsättning
   - Separata miljöer för utveckling, testning och produktion

3. **Domänhantering**
   - Huvuddomän för tjänsten
   - Dynamiska subdomäner för producenters formulär

4. **Övervakning och loggning**
   - Sentry för felrapportering
   - Loggning av kritiska operationer
   - Uptime-övervakning
