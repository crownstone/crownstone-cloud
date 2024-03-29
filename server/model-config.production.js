module.exports ={
  "user": {
    "options": {
      "emailVerificationRequired": process.env.EMAIL_VERIFICATION_REQUIRED === 'false' ? false : true,
      "caseSensitiveEmail": false
    }
  },
  "PowerUsage": {
    "public": true
  },
  "PowerCurve": {
    "public": false
  },
  "SphereAccess": {
    "public": false
  },
  "SphereContainer": {
    "public": false
  },
  "UserContainer": {
    "public": false
  },
  "Application": {
    "public": false
  },
  "StoneLocation": {
    "public": false
  },
  "AppInstallation": {
    "public": true
  },
  "App": {
    "public": false
  },
  "Message": {
    "public": true
  },
  "MessageUser": {
    "public": false
  },
  "MessageState": {
    "public": false
  },
  "SphereKeys": {
    "public": false
  },
  "StoneKeys": {
    "public": false
  },
  "StoneBehaviour": {
    "public": false
  },
  "StoneAbility": {
    "public": false
  },
  "StoneAbilityProperty": {
    "public": false
  },
  "SpherePosition": {
    "public": false
  },
  "LocationPosition": {
    "public": false
  },
  "Email": {
    "dataSource": process.env.MAIL_PROVIDER,
  }
}
