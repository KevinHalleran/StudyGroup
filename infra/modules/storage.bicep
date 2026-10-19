@description('Azure region for the storage account and monitoring resources.')
param location string

@description('Name of the storage account; computed by the caller so it can be referenced before deployment.')
param storageAccountName string

@description('Tags applied to every resource.')
param tags object

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  tags: tags
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
    allowCrossTenantReplication: false
    // Static Web Apps managed Functions authenticate with the connection string app setting.
    allowSharedKeyAccess: true
    publicNetworkAccess: 'Enabled'
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
}

var containerNames = [
  'sessions'
  'archive'
]

resource containers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = [for name in containerNames: {
  parent: blobService
  name: name
  properties: {
    publicAccess: 'None'
  }
}]

resource tableService 'Microsoft.Storage/storageAccounts/tableServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

var tableNames = [
  'Students'
  'Identities'
  'Operations'
]

resource tables 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-05-01' = [for name in tableNames: {
  parent: tableService
  name: name
}]

output storageAccountName string = storage.name
output storageAccountId string = storage.id
