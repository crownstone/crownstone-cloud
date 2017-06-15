"use strict";

const parseDomain = require('parse-domain');


console.log(parseDomain('http://google.com:3000/api/test'));
console.log(parseDomain('http://google.com/localhost:3000/api/test'));
console.log(parseDomain('http://google.com/../localhost:3000/api/test'));
console.log(parseDomain('localhost:3000', { customTlds:/localhost|\.local/ }));

