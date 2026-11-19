# VisualForge Studio – tests

Two sets of tests, written for the testing documentation of the project.

| Member | Kind | File | Needs |
|---|---|---|---|
| Member 1 | Black box (release/system testing through the REST API): BB-01 to BB-10, 96 checks | `blackbox.mjs`, `helpers/testAdmin.mjs` | the backend running and `backend/.env` |
| Member 2 | White box (unit/component tests with coverage): WB-01 to WB-09, 41 tests | `whitebox.test.mjs` | nothing (no server, no database) |

The tests have no dependencies of their own. They use Node's built-in test runner (Node 22 or newer) and the `node_modules` of `../backend`, so run `npm install` in `backend/` once.

## Run the white box tests (Member 2)

```powershell
cd test
npm run test:white
```

It prints one line per test and a coverage report. The administration controller (`deleteUser`, `updateUserStatus`, `listUsers`, `listLogs`) is tested with the database models replaced by test doubles, so no database is used.

**One test is expected to fail**: `WB-05 step 2` shows defect D-01 (components nested exactly 12 levels deep are refused, the SRS allows 12). After the depth check in `backend/controllers/projectController.js` (`validateComponents`) is corrected, all tests pass.

## Run the black box tests (Member 1)

1. Start the backend (`cd backend`, `npm run dev`). **Restart it if it was already running** so that it has the new `DELETE /api/admin/users/:id` route. The tests use `http://127.0.0.1:5000`; set `API_URL` to use another address.
2. In another terminal:

```powershell
cd test
npm run test:black          # BB-01 to BB-10, writes results/blackbox-results.json
```

**Administrator accounts.** The Register screen creates Developers only, so the tests need an Administrator for BB-09 (administration) and BB-10 (marketplace review). `helpers/testAdmin.mjs` writes two temporary administrators (`qa.admin1/2.<stamp>@qa.test`) directly into the database that the backend uses, reading `MONGODB_URI` from `backend/.env` through dotenv (the value is never printed), and removes them at the end. It only creates and removes accounts whose email matches `qa.admin<n>.<stamp>@qa.test`.

**Clean up.** At the end the script deletes every test user (`qa.m1.*@qa.test`) through the administrator's delete-account function, which also deletes their projects, tables, records and listings. The uploaded test files are deleted from `backend/uploads`. Nothing is left behind (users left by older runs are removed too).

## Files

- `results/blackbox-results.json` – every check with input, expected and actual result (last run).
- `results/whitebox-output.txt` – output of the white box run with the coverage report.
- The Word documents and Excel sheets that describe these tests are in `Software Testing Documents/` next to the repository.
