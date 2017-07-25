
let promiseBatchPerformer = (arr, index, method) => {
  return new Promise((resolve, reject) => {
    if (index < arr.length) {
      method(arr[index])
        .then(() => {
          return promiseBatchPerformer(arr, index+1, method);
        })
        .then(() => {
          resolve()
        })
        .catch((err) => reject(err))
    }
    else {
      resolve();
    }
  })
};

const rl = require('readline');
function ask(question) {
  return new Promise((resolve, reject) => {
    let r = rl.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    r.question(question + '\n', function(answer) {
      r.close();
      resolve(answer);
    });
  })
}

module.exports = { promiseBatchPerformer, ask };
