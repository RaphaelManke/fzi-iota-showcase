# How-to setup npm
- (optional) install `npm i npmrc -g` and then create a profil like `npmrc -c fzi-iota`
- click [this link to open azure arifcats](https://dev.azure.com/FZI-IOTA-showcase/IOTA-showcase/_packaging?_a=feed&feed=FZI-IOTA-NPM)    
- if select `connect to feed`
- in the popup click on `npm`
- scroll down to the bottom and generate credententials
- copy the content of the box to clipboard
- open a commandline and type `npm config ls -l`
- search line `userconfig = "/path/username/.npmrc"`
- open the userconfig file `/path/username/.npmrc`
- paste the credentials from azure artifacts
- save & close file

# Setup overwriting dependencies for local development
If you want to use changes you made to a package, that are not yet commited, locally in another package, you can use `npm link` to override this depedency in the node_modules folder. This doesn't alter your package.json.
1. navigate to the folder of the package you want to use e.g. `client`.
2. Open a commandline and type `npm link`.
3. Now navigate to the package where you want to use the package which you made changes to e.g. `vehicle-client`.
4. Type `npm link fzi-iota-showcase-client`, where the parameter has to be substituted by the name of the package you want to use. The name of this package is found in its package.json
5. Be sure to repeat step 4 everytime you run `npm install` on the package that uses the locally changed package.