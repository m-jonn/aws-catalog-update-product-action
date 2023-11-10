import * as core from '@actions/core'
import * as sdk from '@aws-sdk/client-service-catalog'
import { ProvisionedParameters } from './params'

// https://docs.aws.amazon.com/servicecatalog/latest/dg/API_ProvisionedProductDetail.html
export class CatalogProvisionedProduct {
  private constructor(
    private client: sdk.ServiceCatalogClient,
    public region: string,
    public detail: sdk.ProvisionedProductDetail,
    public artifact: sdk.ProvisioningArtifactDetail,
    public parameters: ProvisionedParameters
  ) {}

  static async lookup(
    region: string,
    id: string
  ): Promise<CatalogProvisionedProduct> {
    const client = new sdk.ServiceCatalogClient({ region })

    /////////////
    // Product //
    /////////////
    core.debug(
      `aws --region ${region} servicecatalog describe-provisioned-product --id ${id}`
    )
    const ppResponse = (await client.send(
      new sdk.DescribeProvisionedProductCommand({ Id: id })
    )) as sdk.DescribeProvisionedProductOutput
    const detail =
      ppResponse.ProvisionedProductDetail as sdk.ProvisionedProductDetail

    ///////////////////////////
    // Artifact & Parameters //
    ///////////////////////////
    core.debug(
      `aws --region ${region} servicecatalog describe-provisioning-artifact` +
        `--provisioning-artifact-id ${detail.ProvisioningArtifactId} ` +
        `--product-id ${detail.ProductId} ` +
        '--include-provisioning-artifact-parameters'
    )

    const paResponse = await client.send(
      new sdk.DescribeProvisioningArtifactCommand({
        ProvisioningArtifactId: detail.ProvisioningArtifactId,
        ProductId: detail.ProductId,
        IncludeProvisioningArtifactParameters: true
      })
    )

    const artifact = paResponse[
      'ProvisioningArtifactDetail'
    ] as sdk.ProvisioningArtifactDetail

    const parameters = paResponse[
      'ProvisioningArtifactParameters'
    ] as sdk.ProvisioningArtifactParameter[]

    const provisionedParameters: ProvisionedParameters = []
    for (const parameter of parameters) {
      provisionedParameters.push({
        Key: parameter.ParameterKey ?? '',
        Value: '',
        UsePreviousValue: true
      })
    }

    return new CatalogProvisionedProduct(
      client,
      region,
      detail,
      artifact,
      provisionedParameters
    )
  }

  async update(toBeParameters: ProvisionedParameters): Promise<string> {
    const updateToken = (() => {
      const charSet = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let random = ''
      for (let i = 0; i < 12; i++) {
        const r = Math.floor(Math.random() * charSet.length)
        random += charSet.substring(r, r + 1)
      }
      return random
    })()

    let parametersDebugString = ''
    for (const parameter of toBeParameters) {
      parametersDebugString += `Key=${parameter.Key},Value=${
        parameter.Value
      },UsePreviousValue=${parameter.UsePreviousValue ? 'true' : 'false'} `
    }

    core.debug(
      `aws --region ${this.region} servicecatalog update-provisioned-product ` +
        `--id ${this.detail.Id} ` +
        `--product-id ${this.detail.ProductId}` +
        `--provisioning-parameters ${parametersDebugString}`
    )
    const command = new sdk.UpdateProvisionedProductCommand({
      ProvisionedProductId: this.detail.Id,
      ProductId: this.detail.ProductId,
      ProvisioningParameters:
        toBeParameters as sdk.UpdateProvisioningParameter[],
      ProvisioningArtifactId: this.detail.ProvisioningArtifactId,
      UpdateToken: updateToken
    })
    const response = await this.client.send(command)
    //const recordId = response['RecordDetail']?['RecordId'] : -1
    return response.RecordDetail?.Status ?? 'unknown'
  }
}
