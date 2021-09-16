# Spheres

Your sphere is a collection of Crownstones, rooms (which we call Locations), users and many other things.

Since we often refer to a room by it's ID, you can get all rooms in a sphere via the ownedLocations endpoint.
<details>
<summary>GET /Spheres/{id}/ownedLocations</summary>

> Get a list of all rooms (Locations) in this Sphere
>
> Response code: <b>200</b>
>
> Reply format:
> ```js
> [
>   {
>     "name":      string,
>     "uid":       number,   // this is a shortId representation [0 .. 255] of the room, which is unique in the Sphere
>     "icon":      string,
>     "imageId":   string,
>     "id":        string,
>     "sphereId":  string,
>     "createdAt": string,   // timestring like "2021-09-14T07:22:39.794Z"
>     "updatedAt": string    // timestring like "2021-09-14T07:22:39.794Z"
>   },
>   ...
> ]
> ```
</details>

A Sphere also contains Crownstones. You can get a list of all Crownstones in a Sphere via the ownedStones endpoint.
<details>
<summary>GET /Spheres/{id}/ownedStones</summary>

> Get a list of all Crownstones in this Sphere
>
> Response code: <b>200</b>
>
> Reply format:
> ```js
> [
>   {
>     "name":                 string,
>     "address":              string,   // this is the MAC address of the Crownstone and must be unique in the sphere
>     "description":          string,
>     "type":                 string,
>     "major":                number,   // iBeacon major
>     "minor":                number,   // iBeacon minor
>     "uid":                  number,   // this is a shortId representation [0 .. 255] of the Crownstone which is unqiue in the sphere
>     "icon":                 string,
>     "firmwareVersion":      string,
>     "bootloaderVersion":    string,
>     "hardwareVersion":      string,
>     "currentSwitchStateId": string,
>     "hidden":               boolean,
>     "locked":               boolean,
>     "id":                   string,
>     "locationId":           string,
>     "sphereId":             string,
>     "createdAt":            string,   // timestring like "2021-09-14T07:22:39.794Z"
>     "updatedAt":            string    // timestring like "2021-09-14T07:22:39.794Z"
>   },
>   ...
> ]
> ```
</details>

If you want to switch multiple Crownstones at once, you can use the switchCrownstones endpoint! This will be supported from the upcoming app version.
Untill then, please use the Stones/{id}/switch endpoint to switch a single stone, and call it for each stone.
<details>
<summary>POST /Spheres/{id}/switchCrownstones</summary>

> Switch a number of Crownstones in the Sphere. This endpoint will be supported from app versions 4.5 and above.
> This will send a push notification to your phone, which will then switch the Crownstone.
>
> A server sent event is also sent. If you have a hub or Home Assistant with a Crownstone USB dongle, they will also attempt to switch
> the Crownstone(s) for you.
>
> Response code: <b>204</b>
>
> Request format:
> ```js
> [
>   { stoneId: string, type: "PERCENTAGE", percentage: number },
>   { stoneId: string, type: "TURN_ON" },
>   { stoneId: string, type: "TURN_OFF" },
>   ...
> ]
> ```
>
> The difference between TURN_ON and PERCENTAGE 100, is that TURN_ON will respect any existing twilight behaviour
> (it will act as if you switch via the app room overview, or via a wall switch).
</details>

To get a list of all users, including their permission levels, you have the users endpoint.
<details>
<summary>GET /Spheres/{id}/users</summary>

> Get all users in this Sphere, along with their corresponding permission levels.
>
> Reply format:
> ```js
> {
>   "admins": [
>     {
>       "profilePicId":        string,        // used for syncing profile picture
>       "firstName":           string,
>       "lastName":            string,
>       "new":                 boolean,       // indicate that the user is new and does not yet have a sphere
>       "uploadLocation":      boolean,       // privacy options, settable in app.
>       "uploadSwitchState":   boolean,       // privacy options, settable in app.
>       "uploadDeviceDetails": boolean,       // privacy options, settable in app.
>       "language":            string,
>       "email":               string,
>       "emailVerified":       boolean,
>       "id":                  string,
>       "createdAt":           string,        // timestring like "2021-09-14T07:22:39.794Z"
>       "updatedAt":           string         // timestring like "2021-09-14T07:22:39.794Z"
>     },
>     ...
>  ],
>  "members": [...],  // same dataformat as admins
>  "guests":  [...],  // same dataformat as admins
>}
> ```
</details>

To get an overview of which users are in the Sphere, use the presentPeople endpoint. Do not poll this! Take a look at the [server-sent events](https://events.crownstone.rocks)
for real-time updates.
<details>
<summary>GET /Spheres/{id}/presentPeople</summary>

> Get the current location of everyone in this Sphere.
> Keep in mind that the user can opt-out of sharing his/her location with the cloud. If the app's privacy settings allow sharing location,
> this endpoint will have data if someone is in a sphere or room that you're a part of.
>
> Since a user can have multiple devices, and location is based on devices, a user can have multiple locations. As long as a user is in this
> list, they are in the Sphere. If the location array is empty, that means that the indoor localization could not determine which room they are in.
>
> If you require a notification when a user's location changes, take a look at the [server-sent events](https://events.crownstone.rocks). Do not poll this endpoint for changes!
>
> Response code: <b>200</b>
>
> Reply format:
> ```js
> [
>   {
>     "userId": string,
>     "locations": [
>       string,         // locationId
>       ...
>     ]
>   },
>   ...
> ]
</details>
