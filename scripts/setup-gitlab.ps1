# GitLab Setup Script

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "GitLab Repository Setup" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Check current remotes
Write-Host "Current Git remotes:" -ForegroundColor Yellow
git remote -v
Write-Host ""

# Prompt for GitLab username
$gitlabUsername = Read-Host "Enter your GitLab username"

if ([string]::IsNullOrWhiteSpace($gitlabUsername)) {
    Write-Host "❌ Username cannot be empty" -ForegroundColor Red
    exit 1
}

$gitlabUrl = "https://gitlab.com/$gitlabUsername/Vistora.git"

Write-Host "`nGitLab repository URL: $gitlabUrl" -ForegroundColor Cyan

# Check if gitlab remote already exists
$existingRemote = git remote | Select-String -Pattern "^gitlab$"

if ($existingRemote) {
    Write-Host "`n⚠️  GitLab remote already exists. Updating URL..." -ForegroundColor Yellow
    git remote set-url gitlab $gitlabUrl
} else {
    Write-Host "`nAdding GitLab remote..." -ForegroundColor Cyan
    git remote add gitlab $gitlabUrl
}

Write-Host "`n✅ GitLab remote configured!" -ForegroundColor Green
Write-Host "`nUpdated remotes:" -ForegroundColor Yellow
git remote -v

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Create a new project on GitLab: https://gitlab.com/projects/new" -ForegroundColor White
Write-Host "   - Name: Vistora" -ForegroundColor White
Write-Host "   - Uncheck 'Initialize repository with a README'" -ForegroundColor White
Write-Host ""
Write-Host "2. Push to GitLab:" -ForegroundColor White
Write-Host "   git push gitlab main" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Set up CI/CD variables in GitLab:" -ForegroundColor White
Write-Host "   Settings → CI/CD → Variables" -ForegroundColor White
Write-Host "   - AWS_ACCESS_KEY_ID" -ForegroundColor Cyan
Write-Host "   - AWS_SECRET_ACCESS_KEY (masked)" -ForegroundColor Cyan
Write-Host "   - AWS_REGION: us-east-1" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================`n" -ForegroundColor Cyan
