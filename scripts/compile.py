import json
from solcx import compile_standard, install_solc

print("Installing Solidity Compiler...")
install_solc("0.8.19")

with open("./contracts/SwitchSmartVault.sol", "r") as file:
    simple_storage_file = file.read()

print("Compiling...")
compiled_sol = compile_standard(
    {
        "language": "Solidity",
        "sources": {"SwitchSmartVault.sol": {"content": simple_storage_file}},
        "settings": {
            "outputSelection": {
                "*": {"*": ["abi", "metadata", "evm.bytecode", "evm.sourceMap"]}
            }
        },
    },
    solc_version="0.8.19",
)

bytecode = compiled_sol["contracts"]["SwitchSmartVault.sol"]["SwitchSmartVault"]["evm"]["bytecode"]["object"]
abi = json.loads(compiled_sol["contracts"]["SwitchSmartVault.sol"]["SwitchSmartVault"]["metadata"])["output"]["abi"]

output_data = {
    "abi": abi,
    "bytecode": bytecode
}

with open("./backend/SwitchSmartVault_Build.json", "w") as file:
    json.dump(output_data, file)

print("Compilation Successful! Build file saved to backend/SwitchSmartVault_Build.json")