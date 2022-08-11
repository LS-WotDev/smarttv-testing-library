// Config file location
const config = "./tests/testingLib.config.json"

// Config parameters
let keys = {}
let timeout = 0
let url = ''
let delayBetween = 0

// Local data
let tests = []
let report = []

function getElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const timer = setTimeout(() => {
            resolve(new Error(`Promise timed out after ${timeout} ms`));
        }, timeout);

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                clearTimeout(timer);
                resolve(document.querySelector(selector))
                observer.disconnect()
            }
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true
        })
    })
}

function waitForElement(selector) {
    return new Promise(resolve => {
        getElement(selector).then((elm) => {
            resolve(`Waited for ${selector}`)
        }).catch(() => {
            resolve(`Could not find ${selector}`)
        })
    })
}

function keyPress(key) {
    return new Promise(resolve => {
        window.dispatchEvent(new KeyboardEvent('keydown', {'keyCode': keys[key]}))
        resolve(`Pressed ${key}`)
    })
}

function click(selector) {
    return new Promise(resolve => {
        getElement(selector).then((elm) => {
            elm.click()
            resolve(`Clicked on ${selector}`)
        }).catch(() => {
            resolve(`Could not find ${selector}`)
        })
    })
}

function wait(delay) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(`Waited for ${delay} ms`)
        }, delay)
    })
}

function type(selector, text) {
    return new Promise(resolve => {
        getElement(selector).then((elm) => {
            elm.value = text
            resolve(`Typed ${text} into ${selector}`)
        }).catch(() => {
            resolve(`Could not find ${selector}`)
        })
    })
}

function typeWithKeyboard(selector, text) {
    return new Promise(resolve => {
        getElement(selector).then((elm) => {
            let keyboard = elm.getElementsByTagName('span')
            let keyOptions = {}

            for (var i = 0; i < keyboard.length; i++) {
                var parent = keyboard[i].parentNode

                if (keyboard[i].innerHTML !== '') {
                    keyOptions[keyboard[i].innerHTML] = parent
                } else {
                    nodes = parent.childNodes

                    for (var j = 0; j < nodes.length; j++) {
                        if (nodes[j].alt == 'shift') {
                            keyOptions[nodes[j].alt] = parent
                        }
                    }
                }
            }

            text.split('').forEach((key) => {
                (key.toUpperCase() == key) ? keyOptions['shift'].click() : null
                keyOptions[key.toLowerCase()].click()
            })

            resolve(`Typed ${text} using onScreen keyboard`)
        }).catch(() => {
            resolve(`Could not find ${selector}`)
        })
    })
}

function asserts(selector, expected) {
    return new Promise(resolve => {
        getElement(selector).then((elm) => {
            if (elm.value == expected)
                resolve(`SUCCESS: Value in ${selector} matches ${expected}`)
            else 
                resolve(`FAILED: Value in ${selector} does not match ${expected}`)
        }).catch(() => {
            resolve(`FAILED: Could not find ${selector}`)
        })
    })
}

fetch(config)
    .then(response => response.json())
    .then(json => {
        keys = json.keyMap
        timeout = json.timeout
        url = json.testFile
        delayBetween = json.delayBetween

        fetch(url)
            .then(response => response.json())
            .then(data => {
                data.forEach(element => {
                    tests.push(element)
                })
                runTests()
    })
});

async function runTests() {
    let test = tests.shift()
    let command = test.split('(')[0]
    let param = test.split('(')[1].split(')')[0].split(',')

    let fn = window[command]

    fn.apply(null, param).then((res) => {
        console.log(res)

        if (command != 'wait') {tests.unshift('wait(500)')}
        (tests.length > 0) ? runTests() : console.log('All tests completed')  
    })
}