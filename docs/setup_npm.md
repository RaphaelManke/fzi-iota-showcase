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