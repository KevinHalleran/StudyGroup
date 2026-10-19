targetScope = 'resourceGroup'

@description('Environment name, used in resource names and tags.')
@allowed([
  'prod'
])
param environmentName string = 'prod'

@description('Azure region for storage and monitoring.')
param location string = resourceGroup().location

@description('Region for Static Web Apps. It supports only a limited set of regions.')
@allowed([
  'centralus'
  'eastus2'
  'westus2'
  'westeurope'
  'eastasia'
])
param staticWebAppLocation string = 'eastus2'

var namePrefix = 'kobudo-${environmentName}'
// Storage account names: 3-24 chars, lowercase letters and digits only, globally unique.
var storageAccountName = toLower('${take(replace(namePrefix, '-', ''), 12)}${take(uniqueString(resourceGroup().id), 8)}')
var tags = {
  application: 'matayoshi-kobudo-study-group'
  environment: environmentName
  managedBy: 'bicep-github-actions'
}

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring'
  params: {
    location: location
    namePrefix: namePrefix
    tags: tags
  }
}

module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: {
    location: location
    storageAccountName: storageAccountName
    tags: tags
  }
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: storageAccountName
}

module staticWebApp 'modules/staticwebapp.bicep' = {
  name: 'staticWebApp'
  dependsOn: [
    storage
  ]
  params: {
    location: staticWebAppLocation
    namePrefix: namePrefix
    tags: tags
    storageConnectionString: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
  }
}

output staticWebAppName string = staticWebApp.outputs.staticWebAppName
output staticWebAppHostname string = staticWebApp.outputs.defaultHostname
output storageAccountName string = storage.outputs.storageAccountName
