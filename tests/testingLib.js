// Config file location
const config = "./tests/testingLib.config.json"

// Config parameters
let keys = {}
let timeout = 0
let url = ''
let delayBetween = 0

// Local data
let tests = []
let notCompleted = []
let report = null 
let start = null
let clearLocalStorage = false

function getElement(selector) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(selector)) {
            resolve(document.querySelector(selector));
        }

        const timer = setTimeout(() => {
            reject(`[getElement] Could not find ${selector} after ${timeout} ms`);
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
    return new Promise((resolve, reject) => {
        getElement(selector).then((elm) => {
            resolve(`Waited for ${selector}`)
        }).catch(() => {
            reject(`[waitForElement] Could not find ${selector}`)
        })
    })
}

function keyPress(key) {
    return new Promise((resolve, reject) => {
        let res = window.dispatchEvent(new KeyboardEvent('keydown', {'keyCode': keys[key]}))

        if (res) {
            resolve(`Pressed ${key}`)
        } else {
            reject(`[keyPress] Could not press ${key}`)
        }
    })
}

function checkFocus(command) {
    let foundFocus = false

    return new Promise((resolve, reject) => {
        document.querySelectorAll('*').forEach((elm) => {
            elm.classList.forEach((className) => {
                if (className.includes('focus')) {
                    foundFocus = true
                }
            })
        })

        if (foundFocus) {
            resolve(`Focus OK after ${command}`)
        } else {
            reject(`[checkFocus] Focus lost after pressing ${command}`)
            
            notCompleted = tests
            tests = []
        }
    })
}

function click(selector) {
    return new Promise((resolve, reject) => {
        getElement(selector).then((elm) => {
            elm.click()
            resolve(`Clicked on ${selector}`)
        }).catch(() => {
            reject(`[click] Could not find ${selector}`)
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
    return new Promise((resolve, reject) => {
        getElement(selector).then((elm) => {
            elm.value = text
            resolve(`Typed ${text} into ${selector}`)
        }).catch(() => {
            reject(`[type] Could not find ${selector}`)
        })
    })
}

function typeWithKeyboard(selector, text) {
    return new Promise((resolve, reject) => {
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
            reject(`[typeWithKeyboard] Could not find ${selector}`)
        })
    })
}

function asserts(selector, expected) {
    return new Promise((resolve, reject) => {
        getElement(selector).then((elm) => {
            if (elm.value == expected)
                resolve(`Value in ${selector} matches ${expected}`)
            else 
                reject(`[asserts] Value in ${selector} does not match ${expected}`)
        }).catch(() => {
            reject(`[asserts] Could not find ${selector}`)
        })
    })
}

function beaconStart() {
    return new Promise (resolve => {
        start = Date.now()
        report = []
        resolve('Beacon started')
    })
}

function generateReport() {
    let end = Date.now()
    console.log('All tests completed')

    if (clearLocalStorage) {
        localStorage.clear()
        console.log('Local storage cleared')
    }

    if (report.length > 0) {
        console.log('Generating report')

        let success = []
        let failed = []
        let addedDelays = report.length * delayBetween
        let timeDelta = Math.ceil((end - start) / 1000)
        let timeDeltaNoDelays = Math.ceil((end - start - addedDelays) / 1000)

        report.forEach((test) => {
            test[0] ? success.push(test[1]) : failed.push(test[1])
        })

        let html = `<h1 style='margin-top: 5vh'>Testing Report</h1>`
        html += `<h2>Finished in ${timeDelta}s (${timeDeltaNoDelays}s without added delays)</h2>`
        html += `<p>${success.length} tests passed</p>`
        html += `<p>${failed.length} tests failed</p>`

        if (failed.length > 0) {
            html += `<h2 style='margin-top: 5vh'>Failed tests</h2>`
            failed.forEach((test) => {
                html += `<p>${test}</p>`
            })
        }

        if (notCompleted.length > 0) {
            html += `<h2 style='margin-top: 5vh'>Unable to complete the following tests (lost focus)</h2>`
            notCompleted.forEach((test) => {
                html += `<p>${test}</p>`
            })
        }

        let elm = document.body
        elm.style.background = '#ffffff'
        elm.style.display = 'flex'
        elm.style.flexDirection = 'column'
        elm.style.justifyContent = 'center'
        elm.style.alignItems = 'center'

        elm.innerHTML = html
    }
    
    report = null
}

fetch(config)
    .then(response => response.json())
    .then(json => {
        keys = json.keyMap
        timeout = json.timeout
        url = json.testFile
        delayBetween = json.delayBetween
        clearLocalStorage = json.clearLocalStorage

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
    let param = test.split('(').length > 1 ? test.split('(')[1].split(')')[0].split(',') : null

    let fn = window[command]

    fn.apply(null, param).then(res => {
        console.log(res)
        if (report != null && command != 'wait') {report.push([1, res])}

    }).catch(err => {
        console.log(err)
        if (report != null && command != 'wait') {report.push([0, err])}
        
    }).finally(() => {
        if (command == 'keyPress') {tests.unshift(`checkFocus(${param})`)}
        if (command != 'wait' && delayBetween > 0) {tests.unshift(`wait(${delayBetween})`)}
        (tests.length > 0) ? runTests() : generateReport()   
    })
}