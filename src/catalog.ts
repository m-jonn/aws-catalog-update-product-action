import * as core from '@actions/core'
import * as sdk from '@aws-sdk/client-service-catalog'

// https://docs.aws.amazon.com/servicecatalog/latest/dg/API_ProvisionedProductDetail.html
export class CatalogProvisionedProduct {
  private constructor(
    private client: sdk.ServiceCatalogClient,
    public region: string,
    public detail: sdk.ProvisionedProductDetail,
    public artifact: sdk.ProvisioningArtifactDetail,
    public parameters: sdk.ProvisioningArtifactParameter[]
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

    const paResponse = (await client.send(
      new sdk.DescribeProvisioningArtifactCommand({
        ProvisioningArtifactId: detail.ProvisioningArtifactId,
        ProductId: detail.ProductId,
        IncludeProvisioningArtifactParameters: true
      })
    )) as sdk.DescribeProvisioningArtifactOutput

    const artifact = paResponse[
      'ProvisioningArtifactDetail'
    ] as sdk.ProvisioningArtifactDetail

    const parameters = paResponse[
      'ProvisioningArtifactParameters'
    ] as sdk.ProvisioningArtifactParameter[]

    return new CatalogProvisionedProduct(
      client,
      region,
      detail,
      artifact,
      parameters
    )
  }
}
