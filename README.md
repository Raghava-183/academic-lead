# Academic Lead

Academic monitoring and documentation portal for the **Department of Computer Applications**, School of Computing & Informatics — Vignan's Foundation for Science, Technology & Research.

Four modules, one shared departmental login, every record stored in MongoDB with its supporting evidence:

1. **Attendance & Counselling** — Semester 1 / Semester 2, five classes, per-student records with issues, action taken and follow-up dates. **Record whole class** opens a grid with one row per student from the roster, so a whole class is entered and saved in one go.
2. **Assessment** — Formative (FA) and Summative (SA) kept separately, with justification and action plan
3. **Co-Curricular Activities** — event register with participation totals
4. **Course Feedback** — Phase 1 and Phase 2 per subject, with action plan

Plus a **Student Roster** importer and a **Reports & Export** screen (CSV, Excel, printable report).

---

## What you need

- A free [MongoDB Atlas](https://www.mongodb.com/atlas) account
- A [Vercel](https://vercel.com) account
- Node.js 18 or newer, only if you want to run it locally first

## Deploy in five steps

### 1. Create the database

1. Sign in to MongoDB Atlas and create a free **M0** cluster.
2. **Database Access** → Add New Database User. Give it a username and password, with the *Read and write to any database* role. Write the password down.
3. **Network Access** → Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`). Vercel's functions do not have fixed IP addresses, so this is required.
4. **Database** → Connect → **Drivers** → copy the connection string. It looks like:
   `mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   Replace `PASSWORD` with the real password. If your password contains `@`, `/`, `:` or `#`, percent-encode those characters.

### 2. Push this folder to GitHub

```bash
cd academic-lead
git init
git add .
git commit -m "Academic Lead portal"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/academic-lead.git
git push -u origin main
```

### 3. Import it into Vercel

On vercel.com → **Add New** → **Project** → import the repository.

Leave the build settings alone. There is no build step: the frontend is plain HTML, CSS and JavaScript served from `public/`, and everything under `api/` becomes a serverless function automatically.

### 4. Set the environment variables

Before you click Deploy (or afterwards under **Settings → Environment Variables**), add these four, for **all** environments:

| Name | Value |
|---|---|
| `MONGODB_URI` | the connection string from step 1 |
| `MONGODB_DB` | `academic_lead` |
| `PORTAL_PASSWORD` | `Vignan@123` |
| `SESSION_SECRET` | a long random string — see below |

Generate the secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

If you change the variables after deploying, **redeploy** for them to take effect.

### 5. Open it

Visit your `*.vercel.app` URL, sign in with the portal password, and go to **Student Roster → Import students** to load your class lists.

---

## Running it locally

```bash
npm install
cp .env.example .env.local      # then fill in the real values
npx vercel dev
```

It serves on `http://localhost:3000`. `vercel dev` is used rather than a plain static server because the `api/` folder needs the serverless runtime.

---

## How it is put together

```
academic-lead/
├── api/
│   ├── _lib/
│   │   ├── auth.js             session cookies, password check, JSON body reading
│   │   ├── db.js               cached MongoDB connection, index setup
│   │   └── records.js          field whitelists and validation per record type
│   ├── auth.js                 POST sign in · GET session · DELETE sign out
│   ├── files/
│   │   ├── index.js            POST upload evidence
│   │   └── [id].js             GET view/download · DELETE remove
│   └── records/
│       ├── [module].js         GET list · POST create
│       └── [module]/[id].js    PUT update · DELETE remove
├── public/
│   ├── index.html              the whole interface
│   ├── app.js                  all frontend logic
│   └── banner.png              department banner
├── package.json
├── vercel.json
└── .env.example
```

### Collections

`attendance`, `assessment`, `cocurricular`, `feedback`, `roster`, and `files` for uploaded evidence. Each record carries `createdAt`, `updatedAt` and the name of whoever entered it. The `roster` collection has a unique index on class + roll number, so importing the same list twice will not create duplicates.

### API

Every route except signing in requires the session cookie.

| Method | Path | Does |
|---|---|---|
| `POST` | `/api/auth` | sign in with `{ password, name }` |
| `GET` | `/api/auth` | report the current session |
| `DELETE` | `/api/auth` | sign out |
| `GET` | `/api/records/:module` | list every record |
| `POST` | `/api/records/:module` | create one |
| `PUT` | `/api/records/:module/:id` | replace one |
| `DELETE` | `/api/records/:module/:id` | delete one |
| `POST` | `/api/files` | upload evidence, base64 in JSON |
| `GET` | `/api/files/:id` | view it (`?download=1` to save it) |
| `DELETE` | `/api/files/:id` | remove it |

`:module` must be one of the five collection names; anything else returns 404.

---

## Things worth knowing

**File uploads are capped at 3 MB.** Vercel limits a serverless function's request body to roughly 4.5 MB, and base64 encoding adds a third. If you need larger scans, move uploads to [Vercel Blob](https://vercel.com/docs/storage/vercel-blob): add the `@vercel/blob` package, replace the body of `api/files/index.js` with a `put()` call, and store the returned URL instead of the file bytes.

**The password is shared and it is not a vault.** One password protects the whole portal, and counselling notes are sensitive. Change `PORTAL_PASSWORD` each time someone leaves the department, and prefer roll numbers over names in free-text fields where either would do. Changing `SESSION_SECRET` immediately signs everyone out.

**Records are read in full on load.** Each module fetches up to 5,000 records at once, which is fast at departmental scale. If the portal is still in use in five years and feels slow, add server-side filtering to `api/records/[module].js`.

**There is no "undo".** Deleting a record removes it from the database. Uploaded files are not deleted with the record that pointed at them, so evidence survives an accidental delete, but the link to it does not.

**Back it up.** Atlas free clusters have no automated backups. Once a term, use Reports & Export to download each module as Excel, or run `mongodump` against the cluster.
