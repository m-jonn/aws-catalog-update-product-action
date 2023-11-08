export class ProvisionedParameter {
  constructor(
    public Name: string,
    public Value = '',
    public UsePreviousValue = true
  ) {}
}

export type ProvisionedParameters = ProvisionedParameter[]
