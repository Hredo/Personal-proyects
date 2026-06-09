param(
  [string]$Owner = "OWNER",
  [string]$Repo = "REPO",
  [string]$Branch = "main",
  [string]$User = "Hredo"
)

$protection = @{
  required_status_checks = @{ strict = $true; contexts = @("require-owner-status") }
  enforce_admins = $true
  required_pull_request_reviews = @{ required_approving_review_count = 1; require_code_owner_reviews = $true }
  restrictions = @{ users = @($User); teams = @() }
}

$tmp = Join-Path -Path $env:TEMP -ChildPath "protection.json"
$protection | ConvertTo-Json -Depth 6 | Out-File -FilePath $tmp -Encoding utf8

Write-Host "Applying branch protection to $Owner/$Repo branch $Branch..."

gh api --method PUT "/repos/$Owner/$Repo/branches/$Branch/protection" --input $tmp

Write-Host "Done. Verify protection in GitHub UI or with 'gh api /repos/$Owner/$Repo/branches/$Branch/protection'"