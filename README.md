# Tagesschau KI-Zusammenfassung – Setup Guide

Dieses Projekt fasst die Tagesschau 20-Uhr-Sendung automatisch mit Google Gemini zusammen und sendet dir eine E-Mail.

## 🚀 Deployment (Ohne Git-Installation)

Da du kein Git auf deinem Mac installieren möchtest (wegen Speicherplatz), kannst du diesen Weg nutzen:

### 1. Repository auf GitHub erstellen
1. Gehe zu [github.com](https://github.com) und logge dich ein.
2. Klicke auf das **+** oben rechts → **New repository**.
3. Name: `tagesschau-zusammenfassung`.
4. Wähle **Public** oder **Private**.
5. Klicke auf **Create repository**.

### 2. Dateien hochladen (via Browser)
1. Im leeren Repository klicke auf den Link **"uploading an existing file"**.
2. Ziehe **alle Dateien und Ordner** aus deinem Projekt-Ordner `tagesschau-zusammenfassung` (außer `.env.local`, falls vorhanden) in das Browser-Fenster.
3. Klicke unten auf **Commit changes**.

### 3. Vercel Projekt erstellen
1. Gehe zu [vercel.com](https://vercel.com).
2. Klicke auf **Add New** → **Project**.
3. Importiere dein neues GitHub-Repository.

### 4. Vercel KV (Datenbank) einrichten
1. Klicke in deinem Vercel-Projekt oben auf **Storage**.
2. Wähle **KV** → **Create**.
3. Name es z.B. `tagesschau-db`.
4. Klicke auf **Connect** und wähle dein Projekt aus. (Das setzt automatisch die benötigten `KV_...` Variablen).

### 5. Umgebungsvariablen setzen
Gehe in Vercel zu **Settings → Environment Variables** und füge diese hinzu:
- `GEMINI_API_KEY`: Dein Key von Google AI Studio.
- `RESEND_API_KEY`: Dein Key von Resend.com. 
- `EMAIL_TO`: `josephinewerner12@gmail.com`.
- `CRON_SECRET`: Ein ausgedachtes Passwort (z.B. `mein-geheimnis-123`).

### 6. Deployment abschließen
Gehe zu **Deployments** und klicke auf die drei Punkte → **Redeploy**, damit die neuen Variablen aktiv werden.

---

## 🛠 Technik-Details

- **Frontend:** Next.js mit App Router & modernem CSS (Glassmorphism).
- **KI:** Gemini 3.1 Flash-Lite Preview (analysiert YouTube direkt!).
- **Speicher:** Vercel KV (Redis).
- **Cron:** Läuft alle 8 Stunden (konfiguriert in `vercel.json`).

## 🧪 Testen
Du kannst den Cron Job jederzeit manuell testen, indem du im Browser aufrufst:
`https://deine-url.vercel.app/api/cron?secret=DEIN_CRON_SECRET`
