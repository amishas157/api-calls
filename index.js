'use strict';

const pQueue = require('p-queue');
const request = require('request');
const argv = require('minimist')(process.argv.slice(2));
const linebyline = require('linebyline');
const input = linebyline(__dirname + '/' + argv.input);
const output = argv.output;
const fs = require('fs');

const queue = new pQueue({ concurrency: 10 });
const promises = [];

input.on('line', function (line) {
    if (!line.length)
        return;
    let tweet = line;
    tweet = tweet.replace(/#/g, '');
    promises.push(queue.add(() => {
        return requestAPI(tweet);
    }));
});

input.on('end', () => {
    Promise.all(promises)
    .then(() => {
        console.log('done');
    })
    .catch((err) => {
        console.log(JSON.stringify(err));
    });
});

function requestAPI(text) {
    const apiEndPoint = `http://api1.webpurify.com/services/rest/?api_key=b4efc5cfca9391527dd907ac6e69b5b4&method=webpurify.live.check&text=${text}&semail=1&sphone=1&slink=1&format=json`;
    return new Promise((resolve, reject) => {
        request(apiEndPoint, (req, res) => {
            if (!res || res.statusCode !== 200) {
                return reject({req: text, rsp: res});
            }
            fs.appendFileSync(output, text + ',' + JSON.parse(res.body).rsp.found + '\n');
            return resolve();
        });
    });
}
