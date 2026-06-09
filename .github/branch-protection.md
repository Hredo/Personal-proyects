# Branch protection recommendation (manual or gh CLI)

These are the recommended settings so that only the repository owners can make direct changes to primary branches.

Recommended steps:

1. Protect target branches: `main`, `master`, `production`.
2. Enable "Require pull request reviews before merging".
3. Enable "Require status checks to pass before merging" and add the `require-owner-status` check (workflow included in `.github/workflows`).
4. Enable "Require review from Code Owners".
5. Restrict who can push: add the repository owner usernames to "Restrict who can push to matching branches".

Automation (example using `gh`):

Create a `protection.json`:
{
  "required_status_checks": {"strict": true, "contexts": ["require-owner-status"]},
  "enforce_admins": true,
  "required_pull_request_reviews": {"required_approving_review_count": 1, "require_code_owner_reviews": true},
  "restrictions": {"users": ["Hredo","Hrvr1"], "teams": []}
}

Run:
gh api --method PUT /repos/OWNER/REPO/branches/BRANCH/protection --input protection.json

Note: `gh` must be authenticated with admin permissions.