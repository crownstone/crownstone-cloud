const loopback = require('loopback');
const util = require("./util");
const req = util.setupRequest;

let superSecretPassword = "helloWorld";


function createUser(emailUser) {
  return req('POST',
    'users',
    {data: {email: emailUser, password: superSecretPassword, firstName:"Testing", lastName:"Employee"}},
    null,
    'body'
  )
}

function markAsVerified(userId) {
  console.log("Marking as verified", userId)
  const user = loopback.getModel('user');
  return user.findById(userId)
    .then((usr) => {
      usr.emailVerified = true
      return usr.save()
    })
}

function login(emailUser) {
  return req('POST',
    'users/login',
    {data: {email: emailUser, password: superSecretPassword}},
    null,
    'body'
  )
}

function createSphere(userObj, sphereName = "mySphere") {
  return req('POST',
    'users/'+userObj.id+'/spheres',
    {data: {name: sphereName}},
    userObj.token,
    'body'
  )
}

function inviteUser(userEmail, sphereId, adminUserObj) {
  return req('PUT',
    'Spheres/'+sphereId+'/admins',
    {data: {email: userEmail}},
    adminUserObj.token,
    'query'
  )
}

function forgotPassword(userObj) {
  return req('POST',
    'users/reset',
    { data: { email: userObj.email }},
    userObj.token,
    'body'
  )
}

module.exports = {
  createUser,
  createSphere,
  markAsVerified,
  login,
  inviteUser,
  forgotPassword,
}
