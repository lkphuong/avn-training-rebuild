# Avn Training Rebuild

## Description
This project using Azure Functions and Cosmos DB to create a serverless API for managing data.

## Prerequisites
Before you begin, ensure you have met the following requirements:
- Azure Subscription: You need an active Azure subscription.
- Azure Functions Core Tools: You can install it with npm using `npm install -g azure-functions-core-tools@3 --unsafe-perm true`.
- Azure CLI: You need the Azure Command-Line Interface (CLI) to deploy your function app. Install it from [here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli).
- Node.js and npm: Make sure you have Node.js (LTS version) and npm installed.
- Visual Studio Code (optional): You can use VS Code as your development environment.

## Getting Started
To get started with this project, follow these steps:

1. **Clone the Repository**
    ```bash
    git clone https://github.com/lkphuong/avn-training-rebuild.git
    cd avn-training-rebuild
    ```

2. **Install Dependencies**
    ```bash
    npm install
    ```

3. **Create Azure Resources**
    - Create an Azure Cosmos DB instance.
    - Configure your connection string in `local.settings.json`.

4. **Local Development**
    You can run the Azure Function locally for testing and development.
    ```bash
    func start
    ```

5. **Deploy to Azure**
    Use the Azure CLI to deploy your Function App to Azure.
    ```bash
    az login
    az functionapp create --resource-group your-resource-group --consumption-plan-location eastus --name your-function-app-name --storage-account your-storage-account-name
    func azure functionapp publish your-function-app-name
    ```

6. **Access the API**
    After deployment, your Function App will be available at `https://your-function-app-name.azurewebsites.net`.

## Project Structure
- `azure-function`: Contains the Azure Function code.
- `cosmos-scripts`: Contains scripts for setting up Cosmos DB.
- `test`: Contains test scripts and data.

## Contributing
Contributions are welcome! If you find any issues or have suggestions for improvement, please create an issue or a pull request.

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments
- Microsoft Azure for providing a powerful serverless platform.
- The community for their support and contributions.

Happy coding!
