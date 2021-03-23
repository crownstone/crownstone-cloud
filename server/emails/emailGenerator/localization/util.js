

function htmlPrepare(obj) {
  let languages = Object.keys(obj);
  languages.forEach((lang) => {
    let keys = Object.keys(obj[lang]);
    keys.forEach((key) => {
      obj[lang][key] = unescape(encodeURIComponent(obj[lang][key]));
    })
  })
  return obj;
}

module.exports = {
  htmlPrepare: htmlPrepare
};
