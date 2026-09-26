# Corsia — alpha

Versione alpha reale di Corsia: form pubblico di richiesta, database Supabase
e pannello operativo interno per il team che cerca gli appuntamenti. Sostituisce
il piano iniziale a Jotform + Airtable con un'app vera, sullo stesso stack di
Solvex CRM (Vite + React + TypeScript + Supabase + Vercel), pensata da subito
per: diventare anche un'app mobile, sostenere un traffico più alto, e
collegarsi a un operatore telefonico AI (fase 2/3 del piano già deciso).

## Struttura

```
supabase/migrations/   → schema del database e permessi (RLS)
src/lib/                → client Supabase e tipi TypeScript
src/pages/
  Richiedi.tsx           → form pubblico "Richiesta di ricerca" (chiunque, senza login)
  Login.tsx              → accesso operatori (link via email, senza password)
  Pipeline.tsx           → pannello interno: elenco richieste, stato, log chiamate
api/                     → riservato alla futura funzione serverless per Retell AI (non ancora creata)
```

## 1. Crea il progetto Supabase

1. Vai su [supabase.com](https://supabase.com) e crea un nuovo progetto (piano gratuito per iniziare, regione UE per i dati).
2. In **Project Settings → API** trovi `Project URL` e `anon public key`.

## 2. Esegui la migrazione

Apri **SQL Editor** nel pannello Supabase ed esegui il contenuto di `supabase/migrations/0001_init.sql`. Crea due tabelle:

- `richieste` — ogni richiesta arrivata dal form pubblico, con calcolo automatico della scadenza della finestra RAO
- `chiamate` — il log di ogni chiamata fatta per una richiesta, già con un campo `canale` (`umano`/`ai`) e `external_call_id` pronti per quando collegherai l'operatore AI

I permessi (RLS) sono già impostati così: chiunque può **inviare** una richiesta dal form pubblico, ma **nessuno** può leggerle senza aver fatto login come operatore — la privacy di chi fa la richiesta è protetta a livello di database, non solo nell'interfaccia.

## 3. Configura l'ambiente locale

```bash
cp .env.example .env.local
```

Apri `.env.local` e incolla `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` dal passo 1.

## 4. Installa e avvia

```bash
npm install
npm run dev
```

L'app parte su `http://localhost:5173`. La home (`/`) è il form pubblico; `/staff/login` e `/staff/pipeline` sono per il team.

## 5. Primo accesso operatori

Il login è passwordless: l'operatore inserisce la sua email su `/staff/login`, riceve un link e clicca per entrare — nessuna password da gestire. Perché un'email possa accedere, deve esistere come utente in Supabase: vai su **Authentication → Users** nel pannello Supabase e clicca **Add user** (o **Invite**) per ogni operatore che deve entrare nella pipeline.

In questa fase alpha tutti gli operatori hanno gli stessi permessi (nessuna distinzione di ruolo interno, a differenza di Solvex): chiunque faccia login può vedere e aggiornare tutte le richieste.

## 6. Metti online: GitHub + Vercel

```bash
git init
git add .
git commit -m "Corsia alpha"
```

Crea un repository su GitHub e collegalo:

```bash
git remote add origin <url-del-tuo-repo>
git push -u origin main
```

Su [vercel.com](https://vercel.com), importa il repository, e nelle **Environment Variables** del progetto Vercel incolla le stesse due variabili di `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Vercel farà il deploy automatico a ogni push.

## Cosa manca ancora (prossimi passi)

- **Operatore telefonico AI (Retell AI)**: lo schema (`chiamate.canale`, `chiamate.external_call_id`) è già pronto a riceverlo; manca la funzione serverless in `api/` che riceve il webhook da Retell e scrive il log chiamata — da costruire quando avrai creato l'account Retell AI e fatto i primi test.
- **App mobile**: il database e la logica (Supabase + RLS) sono già condivisibili con un client mobile (React Native/Expo o simile) senza modifiche: il passo successivo sarebbe un progetto separato che riusa le stesse tabelle.
- **Ruoli interni per gli operatori**: oggi chi fa login vede tutto; se in futuro serve distinguere ad esempio "operatore" da "responsabile", si aggiunge una colonna ruolo come già fatto in Solvex.
- **Notifica automatica al richiedente** quando lo stato passa a "Trovato" (oggi l'operatore deve ricontattarlo a mano, come da script telefonico).
- **Scala**: Supabase e Vercel scalano entrambi automaticamente con il traffico nei piani a pagamento; da monitorare quando il volume di richieste crescerà.

## Note di sicurezza

La regola più importante — non rivelare mai la struttura trovata prima della prenotazione confermata, né esporre le richieste di altri utenti — è applicata dalla **Row Level Security** del database (`supabase/migrations/0001_init.sql`), non solo dall'interfaccia: anche chiamando le API di Supabase direttamente, senza aver fatto login come operatore, non è possibile leggere nessuna riga di `richieste` o `chiamate`, solo inserirne di nuove tramite il form pubblico.
