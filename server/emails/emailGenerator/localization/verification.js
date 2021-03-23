const htmlPrepare = require("./util")['htmlPrepare']

module.exports = htmlPrepare({
  en_us: {
    subject:                 "Welcome to Crownstone!",
    title:                   "Verify your email for Crownstone.",
    preview:                 "Let's verify your email to finalize your account creation!",
    headerText:              "Hi <%= newUser %>!",
    headerDescription:       "Do we have the right email address to reach you? To confirm your email address, click the button below.",
    secondHeaderDescription: '',
    buttonLabel:             "Let's get started!",
    explanation:             "If the button does not work, copy the full link below into your browser and open the page.",
  },
  nl_nl: {
    subject:                 "Welkom bij Crownstone!",
    title:                   "Verifiëer je e-mailadres.",
    preview:                 "Verifiëer je e-mailadres om je account te activeren!",
    headerText:              "Hoi <%= newUser %>!",
    headerDescription:       "Hebben we het juiste e-mailadres om je te bereiken? Klik op de onderstaande knop om je e-mailadres te bevestigen.",
    secondHeaderDescription: '',
    buttonLabel:             "Laten we beginnen!",
    explanation:             "Als de knop niet werkt, kopiëer de link in de browser en open de pagina.",
  }
});
