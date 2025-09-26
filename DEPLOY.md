# Deploying Aspire Lenos to Azure Container Apps

This document describes the required secrets and steps to use the provided GitHub Actions workflow which builds images and deploys them to Azure Container Apps.

Required GitHub secrets
- AZURE_CREDENTIALS - JSON object for a service principal with contributor rights. Create it using:
  ```powershell
  az ad sp create-for-rbac --name gh-deploy-aspire-lenos --role contributor --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP> --sdk-auth
  ```
  The output of that command is the `AZURE_CREDENTIALS` JSON.
- ACR_NAME - The name of your Azure Container Registry (no .azurecr.io suffix)
- RESOURCE_GROUP - Azure resource group containing Container Apps environment
- CONTAINERAPPS_ENV - Container Apps environment name

How the workflow works
- Builds images for `aspire-lenos-api` and `aspire-lenos-web` using `az acr build`.
- Pushes images to your ACR.
- Updates the two Container Apps to use the newly built images.

Notes
- The workflow expects two Container Apps named `aspire-lenos-api` and `aspire-lenos-web` to already exist in the target resource group and environment.
- Use managed identities and RBAC for production-grade deployments.
