import * as core from '@actions/core'

/**
 * Main function for updating provisioned Product on AWS Service Catalog.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const region: string = core.getInput('aws-region')
    const provisionedProductId: string = core.getInput('provisioned-product-id')

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Updating ${provisionedProductId} in region ${region}`)

    // Set outputs for other workflow steps to use
    core.setOutput('version', 'cd99d16')
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
