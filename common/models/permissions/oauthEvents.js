let OauthEventPermissions = {
  Sphere: {},
  Location: {},
  Stone: {},
  Device: {},
  Appliance: {},
}

OauthEventPermissions['Sphere']['create']                     = {all: true};
OauthEventPermissions['Sphere']['patchAttributes']            = {all: true};
OauthEventPermissions['Sphere']['addGuest']                   = {all: true};
OauthEventPermissions['Sphere']['addMember']                  = {all: true};
OauthEventPermissions['Sphere']['addAdmin']                   = {all: true};
OauthEventPermissions['Sphere']['changeOwnership']            = {all: true};
OauthEventPermissions['Sphere']['changeRole']                 = {all: true};
OauthEventPermissions['Sphere']['deleteFile']                 = {all: true};
OauthEventPermissions['Sphere']['deleteAllFiles']             = {all: true};
OauthEventPermissions['Sphere']['uploadFile']                 = {all: true};
OauthEventPermissions['Sphere']['deleteAllLocations']         = {all: true};
OauthEventPermissions['Sphere']['deleteAllStones']            = {all: true};
OauthEventPermissions['Sphere']['deleteAllAppliances']        = {all: true};
OauthEventPermissions['Sphere']['deleteAllMessages']          = {all: true};
OauthEventPermissions['Location']['create']                   = {all: true};
OauthEventPermissions['Location']['patchAttributes']          = {all: true};
OauthEventPermissions['Location']['uploadImage']              = {all: true};
OauthEventPermissions['Location']['deleteImage']              = {all: true};
OauthEventPermissions['Stone']['create']                      = {all: true, stone_information: true};
OauthEventPermissions['Stone']['patchAttributes']             = {all: true, stone_information: true};
OauthEventPermissions['Stone']['setCurrentEnergyUsage']       = {all: true, power_consumption: true};
OauthEventPermissions['Stone']['setCurrentPowerUsage']        = {all: true, power_consumption: true};
OauthEventPermissions['Stone']['setBatchEnergyUsage']         = {all: true, power_consumption: true};
OauthEventPermissions['Stone']['setBatchPowerUsage']          = {all: true, power_consumption: true};
OauthEventPermissions['Stone']['setAppliance']                = {all: true, stone_information: true};
OauthEventPermissions['Stone']['removeAppliance']             = {all: true, stone_information: true};
OauthEventPermissions['Stone']['deleteAllEnergyUsageHistory'] = {all: true};
OauthEventPermissions['Stone']['deleteAllPowerUsageHistory']  = {all: true};
OauthEventPermissions['Stone']['deleteAllSwitchStateHistory'] = {all: true};
OauthEventPermissions['Stone']['deleteAllDiagnosticHistory']  = {all: true};
OauthEventPermissions['Stone']['setSwitchStateRemotely']      = {all: true, stone_information: true};
OauthEventPermissions['Stone']['deleteEnergyUsageHistory']    = {all: true};
OauthEventPermissions['Stone']['deletePowerUsageHistory']     = {all: true};
OauthEventPermissions['Stone']['deleteSwitchStateHistory']    = {all: true};
OauthEventPermissions['Stone']['setCurrentSwitchState']       = {all: true, stone_information: true};
OauthEventPermissions['Stone']['setDiagnostics']              = {all: true};
OauthEventPermissions['Device']['create']                     = {all: true};
OauthEventPermissions['Device']['replaceById']                = {all: true};
OauthEventPermissions['Device']['patchAttributes']            = {all: true};
OauthEventPermissions['Device']['remoteSetCurrentLocation']   = {all: true, user_location: true};
OauthEventPermissions['Device']['remoteSetCurrentSphere']     = {all: true, user_location: true};
OauthEventPermissions['Device']['createInstallation']         = {all: true};
OauthEventPermissions['Appliance']['create']                  = {all: true};
OauthEventPermissions['Appliance']['replaceById']             = {all: true};
OauthEventPermissions['Appliance']['patchAttributes']         = {all: true};

module.exports = OauthEventPermissions
