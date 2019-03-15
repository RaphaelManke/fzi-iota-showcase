# Example version script.
# Please choose one version or create your own

# Node.js: grep the version from a package.json file with jq
jq -rM '.version' package.json

# Elixir: grep the version from a mix file
cat mix.exs | grep version | grep '\([0-9]\+\.\?\)\{3\}' -o
