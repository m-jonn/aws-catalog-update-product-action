/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import fs from 'fs'
import * as core from '@actions/core'
import * as main from '../src/main'

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

// Mock the GitHub Actions core library
let infoMock: jest.SpyInstance
let errorMock: jest.SpyInstance
let getInputMock: jest.SpyInstance
//let setFailedMock: jest.SpyInstance
let setOutputMock: jest.SpyInstance
let fsReadFileSync: jest.SpyInstance

// See https://awscli.amazonaws.com/v2/documentation/api/latest/reference/servicecatalog/describe-provisioned-product.html
const provisionedProductRegion = 'eu-central-1'
const provisionedProductId = 'pp-jgpl6jy6aq2lu'
const provisionedParametersJson = `[]`

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    infoMock = jest.spyOn(core, 'info').mockImplementation()
    errorMock = jest.spyOn(core, 'error').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    //setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
    fsReadFileSync = jest.spyOn(fs, 'readFileSync').mockImplementation()
  })

  it('check it updates the provisioned product', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'provisioned-product-region':
          return provisionedProductRegion
        case 'provisioned-product-id':
          return provisionedProductId
        case 'provisioned-parameters-json':
          return 'aws-provisioned-parameters.json'
        default:
          return ''
      }
    })

    fsReadFileSync.mockImplementation(
      (_name: string, _encoding: string): string => {
        return provisionedParametersJson
      }
    )

    await main.run()
    expect(runMock).toHaveReturned()

    // Verify that all of the core library functions were called correctly
    expect(infoMock).toHaveBeenNthCalledWith(
      1,
      `Updating ${provisionedProductId} in region ${provisionedProductRegion}`
    )
    expect(setOutputMock).toHaveBeenNthCalledWith(
      1,
      'status',
      expect.stringMatching('SUCCEEDED')
    )
    expect(errorMock).not.toHaveBeenCalled()
  })
})
