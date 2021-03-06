var g           = global.LINDEN;
var fs          = require('fs');
var path        = require('path');
var helper      = require('./helper');
var webdriver   = require('selenium-webdriver');
var phantom     = webdriver.Capabilities.phantomjs().set('phantomjs.binary.path', g.phantomPath);
var driver      = null;
var cases       = [];

function saveScreenshot(testCase, image) {
    var fileName = `${testCase.name}.png`;

    fs.writeFile(path.join(g.cwd, g.config.dir, g.runDateTime, fileName), image, 'base64', function(error) {
        if (error) { g.log(error); }
    });
}

function runNext() {
    if (cases.length === 0) {
        driver.quit();
        driver = null;
        g.log('Done');
        return;
    }

    var testCase = cases.shift();

    g.log('Running:', testCase.name, `(${testCase.url})`);

    driver.manage().deleteAllCookies();
    driver.manage().window().setSize(testCase.viewport.width, testCase.viewport.height);
    driver.get(testCase.url).then(function () {
        driver.takeScreenshot().then(function(image, err) {
            saveScreenshot(testCase, image);
            runNext();
        });
    });
}

function getCases() {
    return cases;
}

function reset() {
    cases = [];
    if (driver) {
        driver.quit();
    }
    driver = null;
}

function validate(testCase) {
    // Should handle viewport width/height aswell
    if (!testCase || !testCase.name || !testCase.url || !helper.isObject(testCase.viewport)) {
        return false;
    }

    return true;
}

function addCase(testCase) {
    if (validate(testCase)) {
        cases.push(testCase);
        return true;
    } else {
        g.log('Invalid case');
        return false;
    }
}

function start() {
    if (cases.length > 0 && driver === null) {
        init();
        driver.get('about:blank').then(function () {
            g.log('Cases to run:', `${cases.length}`);
            runNext();
        });
    } else if (driver !== null) {
        g.log('Driver already initialized');
    } else {
        g.log('Nothing to run');
    }
}

function init() {
    g.log('Initializing driver');
    driver = new webdriver.Builder().withCapabilities(phantom).build();

    return driver;
}

module.exports = {
    init:       init,
    start:      start,
    reset:      reset,
    addCase:    addCase,
    validate:   validate,
    getCases:   getCases
}
