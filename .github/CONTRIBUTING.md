# Contributing policy

Goal: Ensure that only the repository administrator (the owner listed in `CODEOWNERS`) can merge changes into the original codebase.

Main rules:

- All external contributions must be submitted via fork + pull request. Direct pushes to protected branches (`main`, `master`, `production`, etc.) are not allowed.
- Each Pull Request should reference an issue or clearly describe the purpose of the change.
- Changes that affect source code require approval from `CODEOWNERS`.
- Merges require passing CI/status checks and approval from `CODEOWNERS`.

Quick guide for contributors:

1. Fork the repository.
2. Create a branch in your fork: `git checkout -b feature/my-change`.
3. Make clear, atomic commits.
4. Push your branch to your fork and open a Pull Request against `main` in the original repository.

If you require direct access (exceptional case), contact the owner (see `SECURITY.md` for contact details).
