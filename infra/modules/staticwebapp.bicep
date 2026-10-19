@description('Region for the Static Web App (must be a Static Web Apps region).')
param location string

@description('Short prefix used to name resources.')
param namePrefix string

@description('Tags applied to every resource.')
param tags object

@description('Storage connection string for the managed Functions. Secure so it is masked in what-if output and deployment history.')
@secure()
param storageConnectionString string

@description('Application Insights connection string for the managed Functions.')
@secure()
param appInsightsConnectionString string

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: '${namePrefix}-swa'
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    // Code is deployed by GitHub Actions with a deployment token, not by an Azure-managed repository link.
    stagingEnvironmentPolicy: 'Disabled'
    allowConfigFileUpdates: true
  }
}

resource appSettings 'Microsoft.Web/staticSites/config@2023-12-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    STORAGE_CONNECTION_STRING: storageConnectionString
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsightsConnectionString
  }
}

output staticWebAppName string = staticWebApp.name
output defaultHostname string = staticWebApp.properties.defaultHostname
