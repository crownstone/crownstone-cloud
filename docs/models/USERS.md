# users

The user represents your account. It is the startingpoint to start using the Crownstone cloud. From the user model, there are 5 important parts.

You can log in via the form at [https://my.crownstone.rocks](https://my.crownstone.rocks), or you can do it programatically using the login endpoint.

<details>
<summary style="font-size: 16px; font-weight: bold;">POST /users/login</summary>

> Log into you account. Used to get the access token.
>
> <b><i>Important! Do not provide an access token with this request.</i></b>
>
> Response code: <b>200</b>
>
> Request format:
> ```js
> {
>   "email":    string,
>   "password": string,        // this is a SHA1 hash of the plaintext password.
> }
>```
>
> Reply format:
> ```js
> {
>    "id":            string,  // this is the access token used for authorization
>    "ttl":           number,  // amount of seconds until access token is expired
>    "created":       string,
>    "userId":        string,  // ID of your user
>    "principalType": string
> }
 >```
</details>

Often, you will already have the access token, but you might still need to get the user ID. To quickly get the id, you can use /users/me or /users/userId.

<details>
<summary style="font-size: 16px; font-weight: bold;">GET /users/me</summary>

> Get your user data. This is often used to obtain the user ID.
>
> Response code: <b>200</b>
>
> Reply format:
> ```js
> {
>   "profilePicId":        string,        // used for syncing profile picture
>   "firstName":           string,
>   "lastName":            string,
>   "new":                 boolean,       // indicate that the user is new and does not yet have a sphere
>   "uploadLocation":      boolean,       // privacy options, settable in app.
>   "uploadSwitchState":   boolean,       // privacy options, settable in app.
>   "uploadDeviceDetails": boolean,       // privacy options, settable in app.
>   "language":            string,
>   "email":               string,
>   "emailVerified":       boolean,
>   "id":                  string,
>   "createdAt":           string,        // timestring like "2021-09-14T07:22:39.794Z"
>   "updatedAt":           string         // timestring like "2021-09-14T07:22:39.794Z"
> }
 >```
</details>
<details>
<summary style="font-size: 16px; font-weight: bold;">GET /users/userId</summary>

> Get your user ID.
>
> Response code: <b>200</b>
>
> Reply format:
> ```
> string
> ```
</details>

The Spheres represent a group of Crownstones, which can communicate with eachothers and the users in the sphere via a set of shared encryption keys.
To get the spheres you have access to you can use the GET /users/id/spheres endpoint. We'll discuss spheres more later on.

<details>
<summary style="font-size: 16px; font-weight: bold;">GET /users/{id}/spheres</summary>

> Get your Spheres
>
> Response code: <b>200</b>
>
> Reply format:
> ```js
> [
>   {
>     "name":      string,
>     "uid":       number,   // short id [0 .. 255] to represent a sphere
>     "uuid":      string,   // iBeacon uuid
>     "aiName":    string,
>     "gpsLocation": {       // coordinates used to calculate sunrise/sundown times
>       "lat":     number,
>       "lng":     number,
>     },
>     "id":        string,
>     "createdAt": string,        // timestring like "2021-09-14T07:22:39.794Z"
>     "updatedAt": string         // timestring like "2021-09-14T07:22:39.794Z"
>   },
>   ...
> ]
> ```
</details>


If you want to use one of our Bluetooth libraries, you can get use the /users/{id}/keysV2 endpoint to get all the encryption keys you have access to. These keys are per Sphere
and the keys you have access to are dependent on your access level per sphere.
<details>
<summary style="font-size: 16px; font-weight: bold;">GET /users/{id}/keysV2</summary>

> Get all the encryption keys you have access to. If you're an admin, you also receive keys per stone.
>
> Response code: <b>200</b>
>
> Reply format:
> ```js
> [
>   {
>     "sphereId": string,
>     "sphereAuthorizationToken": string, // token used to authorize yourself with a hub in your Sphere
>     "sphereKeys": [
>       {
>         "id":        string,
>         "keyType":   string,            // type of key
>         "key":       string,
>         "ttl":       number,            // ttl 0 means it does not expire.
>         "createdAt": number,            // timestring like "2021-09-14T07:22:39.794Z"
>       },
>       ...
>     ],
>     "stoneKeys": {                      // not available if you're not an admin of this Sphere
>       "599b341baaa01b001a2b911f": [     // stoneId
>         {
>           "id":        string,
>           "keyType":   string,
>           "key":       string,
>           "ttl":       number,
>           "createdAt": string
>         },
>         ...
>       ],
>       ...
>     }
>   },
>   ...
> ]
> ```
</details>

If you want to get your current location, you can use the /users/{id}/currentLocation.
If you require a notification when location changes, take a look at the [server-sent events](https://events.crownstone.rocks). Do not poll this endpoint for changes!

<details>
<summary style="font-size: 16px; font-weight: bold;">GET /users/{id}/currentLocation</summary>

> Get your current location, based on the devices you have. Each device can be in a different location.
> Keep in mind that the user can opt-out of sharing his/her location with the cloud. If the app's privacy settings allow sharing location,
> this endpoint will have data if you're in a sphere or room that you're a part of.
>
> If you require a notification when location changes, take a look at the [server-sent events](https://events.crownstone.rocks). Do not poll this endpoint for changes!
>
> If you'd like to know the location of the people in a Sphere, take a look at the presentPeople endpoint below in the Sphere section.
>
> Response code: <b>200</b>
>
> Reply format:
> ```js
> [
>   {
>     "deviceId":   string,
>     "deviceName": string,
>     "inSpheres": [
>       {
>         "sphereId":   string,
>         "sphereName": string,
>         "inLocation": {   // can be empty if not in a location (no indoor localization available in sphere)
>           "locationId":   string,
>           "locationName": string
>         }
>       }
>     ]
>   }
> ]
> ```
</details>
