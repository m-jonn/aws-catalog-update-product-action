import fs from 'fs'
import Ajv from 'ajv'

export class ProvisionedParameter {
  constructor(
    public Key: string,
    public Value = '',
    public UsePreviousValue = true
  ) {}
}

export type ProvisionedParameters = ProvisionedParameter[]

export function loadParametersFromFile(
  provisionedParametersJson: string
): ProvisionedParameters {
  const schema = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        Key: { type: 'string' },
        Value: { type: 'string' },
        UsePreviousValue: { type: 'boolean' }
      },
      required: ['Key', 'Value'],
      additionalProperties: false
    }
  }
  const ajv = new Ajv()
  const validate = ajv.compile(schema)

  const expectedParameters =
    JSON.parse(fs.readFileSync(provisionedParametersJson, 'utf8')) ?? []
  const valid = validate(expectedParameters)
  if (!valid) {
    throw new Error(
      `${provisionedParametersJson} is invalid: ${ajv.errorsText(
        validate.errors
      )}`
    )
  }

  return expectedParameters as ProvisionedParameters
}

export function compileToBeParameters(
  expectedParameters: ProvisionedParameters,
  provisionedParameters: ProvisionedParameters
): ProvisionedParameters {
  // Ensure all provided parameters are available
  const notAvailable: ProvisionedParameters = []
  for (const expected of expectedParameters) {
    const IsProvisioned = provisionedParameters.find(provisioned => {
      return provisioned.Key?.trim() === expected.Key?.trim()
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
  for (const provisioned of provisionedParameters) {
    const IsExpected = expectedParameters.find(expected => {
      return provisioned.Key?.trim() === expected.Key?.trim()
    })

    if (IsExpected) continue

    toBeParameters.push({
      Key: provisioned.Key,
      Value: '',
      UsePreviousValue: true
    } as ProvisionedParameter)
  }

  return toBeParameters
}
