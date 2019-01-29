'use strict';

const fs = require("fs");

// read CSS
let header                = null;
let css                   = null;
let bodyStart             = null;
let emailBodyStart        = null;
let emailBodyEnd          = null;
let crownstoneHello       = null;
let headerLogo            = null;
let headerImage           = null;
let headerText            = null;
let button                = null;
let singleLinkAlternative = null;
let doubleLinkAlternative = null;
let bodyEnd               = null;
let social                = null;

let tableSpacer = '<tr style="height:30px;" />\n'

function getFreshComponents() {
  header                = fs.readFileSync('./elements/header.html', "utf8");
  css                   = fs.readFileSync('./elements/css.html', "utf8");
  bodyStart             = fs.readFileSync('./elements/bodyStart.html', "utf8");
  emailBodyStart        = fs.readFileSync('./elements/emailMainBodyStart.html', "utf8");
  crownstoneHello       = fs.readFileSync('./elements/crownstoneHello.html', "utf8");
  headerLogo            = fs.readFileSync('./elements/headerLogo.html', "utf8");
  headerImage           = fs.readFileSync('./elements/headerImage.html', "utf8");
  headerText            = fs.readFileSync('./elements/headerText.html', "utf8");
  button                = fs.readFileSync('./elements/button.html', "utf8");
  singleLinkAlternative = fs.readFileSync('./elements/singleLinkAlternative.html', "utf8");
  doubleLinkAlternative = fs.readFileSync('./elements/doubleLinkAlternative.html', "utf8");
  social                = fs.readFileSync('./elements/social.html', "utf8");
  emailBodyEnd          = fs.readFileSync('./elements/emailMainBodyEnd.html', "utf8");
  bodyEnd               = fs.readFileSync('./elements/closer.html', "utf8");
}




function generateValidation() {
  getFreshComponents();
  bodyStart = bodyStart.replace("__title__", "Verify your email for Crownstone.")
  bodyStart = bodyStart.replace("__preview__", "Let's verify your email to finalize your account creation!")

  headerText = headerText.replace("__headerText__", "Hi <%= newUser %>!")
  headerText = headerText.replace("__headerDescription__", "Do we have the right email address to reach you? To confirm your email address, click the button below.")
  headerText = headerText.replace("__secondHeaderDescription__","")

  button = button.replace("__link__", "<%= verifyHref %>")
  button = button.replace("__buttonLabel__", "Let's get started!")

  singleLinkAlternative = singleLinkAlternative.replace("__explanation__", "If the button does not work, copy the full link below into your browser and open the page.")
  singleLinkAlternative = singleLinkAlternative.replace("__link__", "<%= verifyHref %>")

  let result = "" +
    header +
    css +
    bodyStart +
    emailBodyStart +
    crownstoneHello +
    tableSpacer +
    headerText +
    button +
    tableSpacer +
    singleLinkAlternative +
    emailBodyEnd +
    tableSpacer +
    social +
    bodyEnd

  fs.writeFileSync('./verificationEmail.html', result)
}


function generateForgotPassword() {
  getFreshComponents();
  bodyStart = bodyStart.replace("__title__", "Reset Crownstone password.")
  bodyStart = bodyStart.replace("__preview__", "Reset your Crownstone Password!")

  headerText = headerText.replace("__headerText__", "Forgot your password?")
  headerText = headerText.replace("__headerDescription__", "That's okay, it happens! Click on the button below to reset your password. This link is valid for fifteen minutes.")
  headerText = headerText.replace("__secondHeaderDescription__","")

  headerImage = headerImage.replace("__altText__", "Reset password")
  headerImage = headerImage.replace("__image__", "https://crownstone.rocks/attachments/email/reset_password.png")

  button = button.replace("__link__", "<%= resetUrl %>")
  button = button.replace("__buttonLabel__", "Reset")

  singleLinkAlternative = singleLinkAlternative.replace("__explanation__", "If the button does not work, copy the full link below into your browser and open the page.")
  singleLinkAlternative = singleLinkAlternative.replace("__link__", "<%= resetUrl %>")

  let result = "" +
    header +
    css +
    bodyStart +
    headerLogo +
    emailBodyStart +
    headerImage +
    tableSpacer +
    headerText +
    button +
    tableSpacer +
    singleLinkAlternative +
    tableSpacer +
    emailBodyEnd +
    social +
    bodyEnd

  fs.writeFileSync('./passwordResetEmail.html', result)
}

function generateInviteNew() {
  getFreshComponents();
  bodyStart = bodyStart.replace("__title__", "You have been invited to Crownstone!")
  bodyStart = bodyStart.replace("__preview__", "You've been invited!")

  headerText = headerText.replace("__headerText__", "Welcome to Crownstone!")
  headerText = headerText.replace("__headerDescription__", "You just have been invited <%= invitedByText %>to join a Crownstone sphere with the name <%= sphereName %>!")
  headerText = headerText.replace("__secondHeaderDescription__", '<p class="description">Get started by creating a account for yourself by clicking the button below. This invitation will expire after 7 days.</p>')

  let button2 = button;

  button = button.replace("__link__", "<%= acceptUrl %>")
  button = button.replace("__buttonLabel__", "Accept")

  button2 = button2.replace("__link__", "<%= declineUrl %>")
  button2 = button2.replace("__buttonLabel__", "Decline")

  doubleLinkAlternative = doubleLinkAlternative.replace("__explanation1__", "If the button does not work, copy the full link below into your browser and open the page. To accept:")
  doubleLinkAlternative = doubleLinkAlternative.replace("__link1__", "<%= acceptUrl %>")
  doubleLinkAlternative = doubleLinkAlternative.replace("__explanation2__", "If you want to decline, copy this link in the browser:")
  doubleLinkAlternative = doubleLinkAlternative.replace("__link2__", "<%= declineUrl %>")

  let result = "" +
    header +
    css +
    bodyStart +
    emailBodyStart +
    crownstoneHello +
    tableSpacer +
    headerText +
    button +
    '<tr><td align="center"><p class="small_text">Or</td></tr>' +
    button2 +
    tableSpacer +
    doubleLinkAlternative +
    tableSpacer +
    emailBodyEnd +
    social +
    bodyEnd

  fs.writeFileSync('./inviteNewUserEmail.html', result)
}

function generateInviteExistingUser() {
  getFreshComponents();
  bodyStart = bodyStart.replace("__title__", "You have been invited to Crownstone!")
  bodyStart = bodyStart.replace("__preview__", "You've been invited!")

  headerImage = headerImage.replace("__altText__", "Invite")
  headerImage = headerImage.replace("__image__", "https://crownstone.rocks/attachments/email/invite.png")

  headerText = headerText.replace("__headerText__", "Your invitation awaits!")
  headerText = headerText.replace("__headerDescription__", "You just have been invited <%= invitedByText %>to join a Crownstone sphere with the name <%= sphereName %>!")
  headerText = headerText.replace("__secondHeaderDescription__", '<p class="description">By clicking the button below you can link your existing account to their sphere. This invitation will expire after 7 days.</p>')

  let button2 = button;

  button = button.replace("__link__", "<%= acceptUrl %>")
  button = button.replace("__buttonLabel__", "Accept")

  button2 = button2.replace("__link__", "<%= declineUrl %>")
  button2 = button2.replace("__buttonLabel__", "Decline")

  doubleLinkAlternative = doubleLinkAlternative.replace("__explanation1__", "If the button does not work, copy the full link below into your browser and open the page. To accept:")
  doubleLinkAlternative = doubleLinkAlternative.replace("__link1__", "<%= acceptUrl %>")
  doubleLinkAlternative = doubleLinkAlternative.replace("__explanation2__", "If you want to decline, copy this link in the browser:")
  doubleLinkAlternative = doubleLinkAlternative.replace("__link2__", "<%= declineUrl %>")

  let result = "" +
    header +
    css +
    bodyStart +
    headerLogo +
    emailBodyStart +
    headerImage +
    tableSpacer +
    headerText +
    button +
    '<tr><td align="center"><p class="small_text">Or</td></tr>' +
    button2 +
    tableSpacer +
    doubleLinkAlternative +
    tableSpacer +
    emailBodyEnd +
    social +
    bodyEnd

  fs.writeFileSync('./inviteExistingUserEmail.html', result)
}


generateValidation()
generateForgotPassword()
generateInviteNew()
generateInviteExistingUser()
