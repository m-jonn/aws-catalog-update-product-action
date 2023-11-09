/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import * as main from '../src/main'

import { mockClient } from 'aws-sdk-client-mock'
import * as sdk from '@aws-sdk/client-service-catalog'

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

// Mock the GitHub Actions core library
let infoMock: jest.SpyInstance
let errorMock: jest.SpyInstance
let getInputMock: jest.SpyInstance
//let setFailedMock: jest.SpyInstance
let setOutputMock: jest.SpyInstance

const serviceCatalogMock = mockClient(sdk.ServiceCatalogClient)

// See https://awscli.amazonaws.com/v2/documentation/api/latest/reference/servicecatalog/describe-provisioned-product.html
const provisionedProductRegion = 'eu-central-1'
const provisionedProductId = 'pp-jgpl6jy6aq2lu'
const provisionedArtifactName = 'cd99d16'
const testParametersJson = '__tests__/aws-provisioned-product.json'
const describeProvisionedProductCommandOutput = `
{
  "ProvisionedProductDetail": {
    "Name": "SampleStack-10110954",
    "Arn": "arn:aws:servicecatalog:eu-central-1:666666666666:stack/SampleStack-10110954/${provisionedProductId}",
    "Type": "CFN_STACK",
    "Id": "${provisionedProductId}",
    "Status": "AVAILABLE",
    "CreatedTime": "2023-10-11T09:31:17.607000+00:00",
    "IdempotencyToken": "631...1a8",
    "LastRecordId": "rec-3oqhe4kjejn4q",
    "LastProvisioningRecordId": "rec-3oqhe4kjejn4q",
    "LastSuccessfulProvisioningRecordId": "rec-3oqhe4kjejn4q",
    "ProductId": "prod-c4kv34nyxdcxi",
    "ProvisioningArtifactId": "pa-cskogrciwcbjs",
    "LaunchRoleArn": "arn:aws:iam::666666666666:role/dice-amg-666666666666-env-ProvisionRole"
  },
  "CloudWatchDashboards": []
}
`

const describeProvisioningArtifactCommandOutput = `
{
  "ProvisioningArtifactDetail": {
      "Id": "pa-cskogrciwcbjs",
      "Name": "${provisionedArtifactName}",
      "Description": "cleanup unused console and oidc stacks",
      "Type": "CLOUD_FORMATION_TEMPLATE",
      "CreatedTime": "2023-11-07T23:07:46+00:00",
      "Active": true,
      "Guidance": "DEFAULT"
  },
  "Info": {
      "TemplateUrl": "https://s3.amazonaws.com/dice-amg-666666666666-env-thiss3templatebucket-555555iiygy/product/${provisionedArtifactName}/template.cfn.yaml"
  },
  "Status": "AVAILABLE",
  "ProvisioningArtifactParameters": [
    {
        "ParameterKey": "AssumedRoleArns",
        "DefaultValue": "",
        "ParameterType": "String",
        "IsNoEcho": false,
        "Description": "Comma separated list of Arns of Iam Roles which are assumed by this stack",
        "ParameterConstraints": {
            "AllowedValues": []
        }
    },
    {
        "ParameterKey": "TrustedCidrs",
        "DefaultValue": "88.4.2.0/28",
        "ParameterType": "String",
        "IsNoEcho": false,
        "Description": "Comma separated list of CIDR ranges of IP addresses which are able to access this stack",
        "ParameterConstraints": {
            "AllowedValues": []
        }
    }
  ]
}
`

function setupMocks(): void {
  // Set the action's inputs as return values from core.getInput()
  getInputMock.mockImplementation((name: string): string => {
    switch (name) {
      case 'provisioned-product-region':
        return provisionedProductRegion
      case 'provisioned-product-id':
        return provisionedProductId
      case 'provisioned-parameters-json':
        return testParametersJson
      default:
        return ''
    }
  })

  serviceCatalogMock
    .on(sdk.DescribeProvisionedProductCommand)
    .resolves(JSON.parse(describeProvisionedProductCommandOutput))

  serviceCatalogMock
    .on(sdk.DescribeProvisioningArtifactCommand)
    .resolves(JSON.parse(describeProvisioningArtifactCommandOutput))
}

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    infoMock = jest.spyOn(core, 'info').mockImplementation()
    errorMock = jest.spyOn(core, 'error').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    //setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()

    serviceCatalogMock.reset()
  })

  it('check it updates the provisioned product', async () => {
    setupMocks()

    await main.run()
    expect(runMock).toHaveReturned()

    // Verify that all of the core library functions were called correctly
    expect(infoMock).toHaveBeenNthCalledWith(
      1,
      `Updating ${provisionedProductId} with artifact ${provisionedArtifactName} in region ${provisionedProductRegion}`
    )
    expect(setOutputMock).toHaveBeenNthCalledWith(
      1,
      'status',
      expect.stringMatching('SUCCEEDED')
    )
    expect(errorMock).not.toHaveBeenCalled()
  })
})
