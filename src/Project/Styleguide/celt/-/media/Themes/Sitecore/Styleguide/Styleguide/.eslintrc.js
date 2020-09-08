module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly",
        "$": false,
        "jQuery": false,
        "Sitecore": false,
        "XA": false,
        "_": false
    },
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "rules": {
        "no-alert": 1,
        "no-bitwise": 0,
        "camelcase": 1,
        "curly": 1,
        "eqeqeq": 0,
        "no-eq-null": 0,
        "guard-for-in": 1,
        "no-empty": 1
    }
};