# How-to Setup Azure Docker Registry

[see official reference](https://docs.microsoft.com/de-de/azure/container-registry/container-registry-authentication)

* Ask the Admin to add you to the AD
* Install the Azure CLI [[1]](https://docs.microsoft.com/de-de/cli/azure/install-azure-cli?view=azure-cli-latest) 
* `az login` -> Browser window will open to authenticate
* `az acr login --name fziiota` -> will run docker login 
