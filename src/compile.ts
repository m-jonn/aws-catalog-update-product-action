import { CatalogProvisionedProduct } from './catalog'
import { ProvisionedParameters, ProvisionedParameter } from './params'

export function compileToBeParameters(
  expectedParameters: ProvisionedParameters,
  provisionedProduct: CatalogProvisionedProduct
): ProvisionedParameters {
  // Ensure all provided parameters are available
  const notAvailable: ProvisionedParameters = []
  for (const expected of expectedParameters) {
    const IsProvisioned = provisionedProduct.parameters.find(provisioned => {
      return provisioned.ParameterKey?.trim() === expected.Name?.trim()
    })

    if (IsProvisioned) continue

    notAvailable.push(expected)
  }

  if (notAvailable.length > 0) {
    throw Error(
      `the following parameters are not available by the product ${notAvailable}`
    )
  }

  const toBeParameters: ProvisionedParameters = [...expectedParameters]
  for (const provisioned of provisionedProduct.parameters) {
    const IsExpected = expectedParameters.find(expected => {
      return provisioned.ParameterKey?.trim() === expected.Name?.trim()
    })

    if (IsExpected) continue

    toBeParameters.push({
      Name: provisioned.ParameterKey as string,
      Value: '',
      UsePreviousValue: true
    } as ProvisionedParameter)
  }

  return toBeParameters
}
