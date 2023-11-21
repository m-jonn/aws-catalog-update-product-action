# Update Provisioned Products in AWS Service Catalog using Github Actions

This Github Action is designed to automate parameter updates of Provisioned Products in AWS Service Catalog. 
It reads provisioning parameters from a "aws-provisioned-parameters.json" file committed to the Github Repository.

## Use Case

The project was designed to provide Self-Service Layer for End Users of Provisioned Products in AWS Service Catalog.
End Users should be able to adjust the parameters of their Provisioned Product without access to AWS Console.
Instead End Users use Github Workflows to update parameters of their Provisioned Product:

![](docs/use-case.png)

## Usage 

When added to Github Workflows it uses a project local "aws-provisioned-parameters.json" file to define parameters of the provisioned product.


``` yaml
# .github/workflows/your-workflow.yaml
- uses: aws-actions/configure-aws-credentials@v3
  with:
    ...

- name: Update Provisioned Products
  uses: m-jonn/aws-servicecatalog-update-provisioned-product-action@v0.1.1
  with:
    provisioned-product-region: "eu-central-1" # AWS Region code of the Provisioned Product in AWS Service Catalog
    provisioned-product-id: "pp-jgpsampleaq2lu" # The Id of the Provisioned Product in AWS Service Catalog
    provisioned-parameters-json: "aws-provisioned-parameters.json" # Optional: relative path to aws-provisioned-parameters.json
```
``` json
# aws-provisioned-parameters.json
[
  {
    "Key": "TrustedCidrs",
    "Value": "128.4.2.0/28, 89.4.2.0/28, 88.4.2.0/28"
  },
  {
    "Key": "IAMRoles",
    "UsePreviousValue": true
  }
]
```

which uses the official JSON Syntax for parameters of the ["update-provisioned-product"](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/servicecatalog/update-provisioned-product.html) AWS CLI function, i.e. [{"Key": "string","Value":"string","UsePreviousValue": true|false}]. Note, all parameters which are not explicitly added to "aws-provisioned-parameters.json" will implicitly use "UsePreviousValue: true" and
thus will not change.

## AWS IAM Policy 

The following AWS IAM Policy enables updates of AWS Service Catalog Products and need to be attached to the IAM Principal (IAM Role, IAM User) which is assumed by "aws-actions/configure-aws-credentials@v3":  

``` json
{
  "Version": "2012-10-17",
  "Statement": [
      {
          "Sid": "required-by-describe-provisioning-artifact",
          "Effect": "Allow",
          "Action": [
              "s3:Get*"
          ],
          "Resource": [ "*" ]
      },
      {
          "Sid": "required-by-update-provisioning-artifact",
          "Effect": "Allow",
          "Action": [
              "cloudformation:CreateStack",
              "cloudformation:DeleteStack",
              "cloudformation:DescribeStackEvents",
              "cloudformation:DescribeStacks",
              "cloudformation:SetStackPolicy",
              "cloudformation:ValidateTemplate",
              "cloudformation:UpdateStack",
              "cloudformation:CreateChangeSet",
              "cloudformation:DescribeChangeSet",
              "cloudformation:ExecuteChangeSet",
              "cloudformation:ListChangeSets",
              "cloudformation:DeleteChangeSet",
              "cloudformation:TagResource",
              "cloudformation:CreateStackSet",
              "cloudformation:CreateStackInstances",
              "cloudformation:UpdateStackSet",
              "cloudformation:UpdateStackInstances",
              "cloudformation:DeleteStackSet",
              "cloudformation:DeleteStackInstances",
              "cloudformation:DescribeStackSet",
              "cloudformation:DescribeStackInstance",
              "cloudformation:DescribeStackSetOperation",
              "cloudformation:ListStackInstances",
              "cloudformation:ListStackResources",
              "cloudformation:ListStackSetOperations",
              "cloudformation:ListStackSetOperationResults"
          ],
          "Resource": [
              "arn:aws:cloudformation:${AWS::Region}:${AWS::AccountId}:stack/${AWS::StackName}/*"
          ]
      },
      {
          "Sid": "required-by-describe-provisioned-product",
          "Effect": "Allow",
          "Action": [
              "servicecatalog:DescribeProduct"
          ],
          "Resource": "arn:aws:catalog:${AWS::Region}:${AWS::AccountId}:product/${ProductId}"
      },
      {
          "Sid": "required-by-multiple-service-catalog-functions",
          "Effect": "Allow",
          "Action": [
              "servicecatalog:DescribeProvisionedProduct",
              "servicecatalog:DescribeProvisioningArtifact",
              "servicecatalog:DescribeRecord",
              "servicecatalog:UpdateProvisionedProduct",
              "cloudformation:GetTemplateSummary"
          ],
          "Resource": "*"
      }
  ]
}
```
