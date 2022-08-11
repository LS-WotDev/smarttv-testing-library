# smarttv-testing-library


## Getting Started
1. Add the tests folder to the project's root
2. Create a new webpack config with the following plugin: (An example is included in this repo)
```
plugins: [
    new CopyWebpackPlugin({
        patterns: [
          { from: 'tests', to: 'tests' },
        ],
    })
]
```
3. Add the following scripts to the package.json:
```
"build-test": "webpack --config webpack.testing.js"
"start-test": "webpack serve --open --hot --config webpack.testing.js"
```
4. Add the following lines to your index.jsx file:
```
const testingLib = document.createElement('script')
testingLib.type = 'text/javascript'
testingLib.src = './tests/testingLib.js'
document.body.appendChild(testingLib)
```
5. Add your commands to tests.json
6. Launch the app with build-test or start-test
