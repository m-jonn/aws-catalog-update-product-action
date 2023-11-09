import * as core from '@actions/core'
import { CatalogProvisionedProduct } from './catalog'
import { loadParametersFromFile, compileToBeParameters } from './params'

/**
 * Main function for updating provisioned Product on AWS Service Catalog.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const provisionedProductRegion: string = core.getInput(
      'provisioned-product-region'
    )
    const provisionedProductId: string = core.getInput('provisioned-product-id')
    const provisionedParametersJson: string = core.getInput(
      'provisioned-parameters-json'
    )

    // 1.) Query Details
    const provisionedProduct = await CatalogProvisionedProduct.lookup(
      provisionedProductRegion,
      provisionedProductId
    )

    core.info(
      `Updating ${provisionedProduct.detail.Id} with artifact ${provisionedProduct.artifact.Name} in region ${provisionedProductRegion}`
    )

    // 2.) Compile Parameters
    const expectedParameters = loadParametersFromFile(provisionedParametersJson)
    const _ = compileToBeParameters(
      expectedParameters,
      provisionedProduct.parameters
    )

    // 3.) Apply Parameters

    // Set outputs for other workflow steps to use
    core.setOutput('status', 'SUCCEEDED')
    core.setOutput('errors', '')
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
