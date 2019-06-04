This document is an attempt to describe the meaning behind some of the fields in the database. JSON files do not allow comments,
so this is the alternative.


####Bootloader:

| Field | Explanation |
| ----- | ----------- |
| version                    | SEMVER version of this bootloader |
| supportedHardwareVersions  | The versions of Crownstones hardware that work with this bootloader |
| minimumAppVersion          | The minimum version of the Crownstone app you need to use this bootloader |
| dependsOnBootloaderVersion | This bootloader requires to be updated from an older bootload with this verison. This allows for layered updates. |
| downloadUrl                | URL where to download this bootloader. |
| sha1hash                   | Hash of the bin file to validate the download. |
| releaseLevel               | The level of this release. 0 for public, higher for beta and alpha levels. |




####Firmware:
Most things are the same as the bootloader, except: 

| Field | Explanation |
| ----- | ----------- |
| dependsOnBootloaderVersion | This firmware requires to be used with a bootload that is this version or higher. |
| dependsOnFirmwareVersion   | This firmware requires to be updated from an older firmware with this verison. This allows for layered updates. |








