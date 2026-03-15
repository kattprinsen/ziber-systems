# Quickstart: Tidig home page employees and monthly performance

## What this feature does

- Derives the home page employee list from the Tidig employee subtree for SBQ, showing only direct children of SBQ that have no children (leaf employees).
- Extends the internal user data file (`backend/src/data/users.json`) with per-employee monthly hours for the current calendar month.
- Uses those hours and existing rate/margin data to compute and display both total hours and total SEK for the SBQ group on the home page.

## Prerequisites

- Tidig integration is already configured and working using the existing configuration and environment variables (no new env keys were added for this feature).
- SBQ group is identified using the same Tidig configuration that was already in place before this feature (no new config files are required).
- `backend/src/data/users.json` exists and is git-ignored (this file may contain real data).

## Updating monthly hours

1. Open `backend/src/data/users.json` in your editor.
2. For each employee that should appear on the home page and in group performance:
   - Ensure the record has a stable `id` and `externalId`.
   - Add or update a `monthlyHours` map, for example:

   ```jsonc
   {
     "id": "emp-123",
     "externalId": "tidig-emp-123",
     "name": "Example Employee",
     "monthlyHours": {
       "2026-03": 160
     }
   }
   ```

3. Optionally ensure that an hourly rate in SEK is configured for the employee (reusing the existing `hourlyRate`/salary and margin settings already present in your system) so SEK totals can be computed.
4. Save the file; no additional configuration changes are required.

## How the home page uses this data

- On load, the frontend:
  - Fetches the Tidig employee subtree (including SBQ and its descendants) from the existing `/api/sync/subtree` endpoint.
  - Identifies the SBQ node using existing Tidig configuration (no new flags or IDs were added).
  - Filters to direct SBQ children where `hasChildren === false` to form the employee list.
  - Fetches internal employees from the existing `/api/users` endpoint, which reads from `backend/src/data/users.json`.
  - Joins these employees on their Tidig identifier (`employeeID`/`externalId`) with the SBQ leaf employees from Tidig.
  - For the current calendar month (`YYYY-MM` based on today’s date):
    - Reads `monthlyHours[monthKey]` from `users.json` (defaulting to `0` when missing).
    - Uses the existing hourly rate fields and calculators to compute SEK.
- The group performance chart then displays:
  - Total hours for the SBQ group.
  - Total SEK for the same employees and month.

## Verifying the feature locally

1. Start the backend as usual (from the repository root):
   - `npm run dev` or the existing backend dev command.
2. Start the frontend:
   - `npm run dev`
3. Open the home page in your browser.
4. Confirm that:
   - Only SBQ’s direct child employees with no children are shown.
   - Updating `monthlyHours` in `users.json` for the current month updates the group performance chart after a refresh.
   - Both hours and SEK metrics are visible and consistent with your inputs.

## Operational notes

- No new environment variables or configuration files are introduced by this feature; it reuses the existing Tidig integration configuration and the existing `users.json` file.
- Real employee data remains confined to `backend/src/data/users.json` and should not be copied into specs, tests, or logs.
- If the home page shows an empty employee list or zero totals unexpectedly, first check:
  - That SBQ is correctly configured in the Tidig integration.
  - That `monthlyHours` entries exist for the current calendar month.
