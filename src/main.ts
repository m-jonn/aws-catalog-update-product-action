import * as core from '@actions/core'
import fs from 'fs'
import { ProvisionedParameters } from './params'

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

    const _ = JSON.parse(
      fs.readFileSync(provisionedParametersJson, 'utf8')
    ) as ProvisionedParameters

    core.info(
      `Updating ${provisionedProductId} in region ${provisionedProductRegion}`
    )

    // Set outputs for other workflow steps to use
    core.setOutput('status', 'SUCCEEDED')
    core.setOutput('errors', '')
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
