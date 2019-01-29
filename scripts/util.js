'use strict';

const fetch = require("node-fetch")

const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};


const CLOUD_ADDRESS = "http://localhost:3000/api/"
/**
 *
 * This method communicates with the cloud services.
 *
 * @param options        // { endPoint: '/users/', data: JSON, type:'body'/'query' }
 * @param method
 * @param headers
 * @param id
 * @param accessToken
 * @param doNotStringify
 */
function request(
  options,
  method,
  headers = defaultHeaders,
  accessToken,
  doNotStringify) {
  // append _accessToken, data that goes into the query and insert ids
  let { endPoint, body } = prepareEndpointAndBody(options, accessToken, doNotStringify);

  // setup the request configuration
  let requestConfig = { method, headers, body };

  // two semi-global variables in this promise:
  let STATUS = 0;

  // parse the reply
  let handleInitialReply = (response) => {
    STATUS = response.status;
    if (STATUS === 200) {
      if (response && response.headers && response.headers._headers && response.headers._headers['content-type']) {
        let responseHeaders = response.headers._headers['content-type']

        if (!Array.isArray(responseHeaders) && typeof responseHeaders === 'string') {
          responseHeaders = responseHeaders.split("; ");
        } else if (responseHeaders.length == 1) {
          responseHeaders = responseHeaders[0].split("; ");
        }

        // this part: responseHeaders[0].substr(0,16) === 'application/json' is legacy. It's ugly and imprecise, but we will keep it for legacy for now.
        if (responseHeaders[0].substr(0, 16) === 'application/json' || responseHeaders.indexOf("application/json") !== -1) {
          return response.json(); // this is a promise
        } else {
          return response.text();
        }
      }
      return response.text(); // this is a promise
    }
    return null
  };


  let url = endPoint;
  if (endPoint.substr(0,4) !== 'http') {
    url = CLOUD_ADDRESS + endPoint;
  }

  // the actual request
  return new Promise((resolve, reject) => {
    // console.log("Fetching", url, requestConfig)
    fetch(url, requestConfig)
      .catch((connectionError) => {
        reject('Network request to ' + CLOUD_ADDRESS + endPoint + ' failed');
      })
      .then((response) => {
        return handleInitialReply(response);
      })
      .catch((parseError) => {
        console.log("Parse Error", parseError)
        return '';
      })
      .then((parsedResponse) => {
        // console.log("REPLY from", endPoint, " with options: ", requestConfig, " is: ", {status: STATUS, data: parsedResponse});
        resolve({status: STATUS, data: parsedResponse});
      })
      .catch((err) => {
          reject(err);
      })
  });
}

const setupRequest = function(reqType, endpoint, options, token, type = 'query') {
  let promiseBody = {endPoint: endpoint, data: options.data, type: type, options: options};
  let promise;
  switch (reqType) {
    case 'POST':
      promise = request(promiseBody, 'POST',   defaultHeaders, token);
      break;
    case 'GET':
      promise = request(promiseBody, 'GET',    defaultHeaders, token);
      break;
    case 'PUT':
      promise = request(promiseBody, 'PUT',    defaultHeaders, token);
      break;
    case 'DELETE':
      promise = request(promiseBody, 'DELETE', defaultHeaders, token);
      break;
    case 'HEAD':
      promise = request(promiseBody, 'HEAD',   defaultHeaders, token);
      break;
    default:
      return;
  }
  return finalizeRequest(promise, options, endpoint, promiseBody);
}

const finalizeRequest = function(promise, options, endpoint, promiseBody) {
  return new Promise((resolve, reject) => {
    promise
      .then((reply) => {
        if (reply.status === 200 || reply.status === 204)
          resolve(reply.data);
        else
          reject(reply)
      })
      .catch((error) => {
        console.log("ERROR:", error)
      })
  });
}

function prepareEndpointAndBody(options, accessToken, doNotStringify) {
  let endPoint = options.endPoint;

  if (endPoint.substr(0,1) === '/') {
    endPoint = endPoint.substr(1,endPoint.length)
  }

  let skipAccessToken = options && options.options && options.options.noAccessToken || false;
  // append the access token to the url if we have it.
  if (accessToken && !skipAccessToken) {
    endPoint = _appendToURL(endPoint, {access_token: accessToken});
  }

  // check if we have to define the body content or add it to the url
  let body = undefined;
  if (options.type === 'body' || options.type === undefined) {
    if (typeof options.data === 'object' && doNotStringify !== true) {
      body = JSON.stringify(options.data);
    }
    else {
      body = options.data;
    }
  }
  else if (options.type === 'body-urlencoded') {
    body = '';
    if (typeof options.data === 'object') {
      let keys = Object.keys(options.data);
      for (let i = 0; i < keys.length; i++) {
        body += keys[i] + '=' + options.data[keys[i]] + '&'
      }
      // strip last &
      body = body.substr(0, body.length-1);
    }
  }
  else
    endPoint = _appendToURL(endPoint, options.data);

  return { endPoint, body };
}

function _appendToURL(url, toAppend) {
  if (toAppend) {
    let appendString = '';
    if (typeof toAppend === 'object') {
      let keyArray = Object.keys(toAppend);
      for (let i = 0; i < keyArray.length; i++) {
        appendString += keyArray[i] + '=' + _htmlEncode(toAppend[keyArray[i]]);
        if (i != keyArray.length - 1) {
          appendString += '&';
        }
      }
    }
    else
      throw new Error('ERROR: cannot append anything except an object to an URL. Received: ' + toAppend);

    if (url.indexOf('?') === -1)
      url += '?';
    else if (url.substr(url.length - 1) !== '&')
      url += '&';

    url += appendString;
  }
  return url;
}
function _htmlEncode(str) {
  if (Array.isArray(str) || typeof str === 'object') {
    return encodeURIComponent(JSON.stringify(str));
  }
  else {
    return encodeURIComponent(str + '');
  }
}

function htmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// I needed the opposite function today, so adding here too:
function htmlUnescape(value){
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

module.exports = {setupRequest}
