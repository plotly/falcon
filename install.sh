npm install || cd node_modules/electron-prebuilt/ && npm run postinstall && cd ../..
cd ./node_modules/sqlite3
npm install nan@~2.3.3
npm run prepublish
node-gyp configure --module_name=node_sqlite3 --module_path=../lib/binding/node-v56-darwin-x64
node-gyp rebuild --target=1.2.0 --arch=x64 --target_platform=darwn --dist-url=https://atom.io/download/atom-shell --module_name=node_sqlite3 --module_path=../lib/binding/electron-v1.2-darwin-x64
