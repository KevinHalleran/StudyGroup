<#
.SYNOPSIS
  One-time bootstrap that lets GitHub Actions manage Azure. Safe to re-run.

.DESCRIPTION
  Creates the resource group, an Entra app registration and service principal for
  GitHub Actions, a Contributor role assignment scoped to that resource group only, and
  GitHub OIDC federated credentials (no client secret is created or stored).
  Finally it stores the identifiers as GitHub repository variables when the gh CLI is
  available, otherwise it prints them for you to add.

  Run it once from Azure Cloud Shell or any machine with the Azure CLI, signed in as a
  user who can create app registrations and assign roles on the resource group.

.EXAMPLE
  ./bootstrap.ps1 -SubscriptionId 00000000-0000-0000-0000-000000000000
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $SubscriptionId,
  [string] $Location = 'eastus2',
  [string] $ResourceGroup = 'rg-kobudo-prod',
  [string] $GitHubRepo = 'KevinHalleran/StudyGroup',
  [string] $AppName = 'github-kobudo-deployer'
)

$ErrorActionPreference = 'Stop'

function Invoke-Az {
  $output = & az @args
  if ($LASTEXITCODE -ne 0) { throw "az $($args -join ' ') failed" }
  return $output
}

Invoke-Az account set --subscription $SubscriptionId | Out-Null
$tenantId = Invoke-Az account show --query tenantId -o tsv

Write-Host 'Registering resource providers...'
foreach ($provider in 'Microsoft.Web', 'Microsoft.Storage', 'Microsoft.Insights', 'Microsoft.OperationalInsights') {
  Invoke-Az provider register --namespace $provider | Out-Null
}

Write-Host "Ensuring resource group $ResourceGroup..."
# An existing group is used as-is (its location and tags are not changed).
$groupExists = Invoke-Az group exists --name $ResourceGroup
if ($groupExists -ne 'true') {
  Invoke-Az group create --name $ResourceGroup --location $Location --tags application=matayoshi-kobudo-study-group managedBy=bicep-github-actions | Out-Null
}
$rgId = Invoke-Az group show --name $ResourceGroup --query id -o tsv

Write-Host "Ensuring app registration $AppName..."
$appId = Invoke-Az ad app list --display-name $AppName --query '[0].appId' -o tsv
if (-not $appId) {
  $appId = Invoke-Az ad app create --display-name $AppName --query appId -o tsv
}

$spId = Invoke-Az ad sp list --filter "appId eq '$appId'" --query '[0].id' -o tsv
if (-not $spId) {
  $spId = Invoke-Az ad sp create --id $appId --query id -o tsv
}

Write-Host 'Ensuring Contributor on the resource group only...'
$existingRole = Invoke-Az role assignment list --assignee $spId --role Contributor --scope $rgId --query '[0].id' -o tsv
if (-not $existingRole) {
  Invoke-Az role assignment create --assignee-object-id $spId --assignee-principal-type ServicePrincipal --role Contributor --scope $rgId | Out-Null
}

Write-Host 'Ensuring federated credentials...'
$credentials = @(
  @{ name = 'github-main'; subject = "repo:${GitHubRepo}:ref:refs/heads/main" },
  @{ name = 'github-pull-request'; subject = "repo:${GitHubRepo}:pull_request" }
)
$existingNames = Invoke-Az ad app federated-credential list --id $appId --query '[].name' -o tsv
foreach ($credential in $credentials) {
  if ($existingNames -contains $credential.name) { continue }
  $file = New-TemporaryFile
  try {
    @{
      name      = $credential.name
      issuer    = 'https://token.actions.githubusercontent.com'
      subject   = $credential.subject
      audiences = @('api://AzureADTokenExchange')
    } | ConvertTo-Json | Set-Content -Path $file -Encoding utf8
    Invoke-Az ad app federated-credential create --id $appId --parameters "@$file" | Out-Null
  }
  finally {
    Remove-Item $file -Force
  }
}

$variables = [ordered]@{
  AZURE_CLIENT_ID       = $appId
  AZURE_TENANT_ID       = $tenantId
  AZURE_SUBSCRIPTION_ID = $SubscriptionId
  AZURE_RESOURCE_GROUP  = $ResourceGroup
}

if (Get-Command gh -ErrorAction SilentlyContinue) {
  foreach ($name in $variables.Keys) {
    & gh variable set $name --body $variables[$name] --repo $GitHubRepo
    if ($LASTEXITCODE -ne 0) { throw "Could not set GitHub variable $name" }
  }
  Write-Host 'GitHub repository variables set.'
}
else {
  Write-Host 'gh CLI not found. Add these as repository VARIABLES (Settings > Secrets and variables > Actions > Variables):'
  $variables.GetEnumerator() | ForEach-Object { Write-Host ("  {0} = {1}" -f $_.Key, $_.Value) }
}

Write-Host 'Done. Next: run the "Infrastructure" workflow (Actions tab) to provision resources.'
