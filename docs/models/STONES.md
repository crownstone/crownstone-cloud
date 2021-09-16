# Stones

If you want to get a full list of all Crownstones that your account has access to (regardless of Sphere), use the all endpoint.
<details>
<summary>GET /Stones/all</summary>

> Get a list of all Crownstones you have access to.
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

If you switch a Crownstone via the phone, it will tell the cloud it has done so. If you have a hub, it will also keep track of Crownstones
switched via SwitchCraft and update the cloud. Keep in mind that the user can opt-out of this behaviour in the privacy settings in the app.
<details>
<summary>GET /Stones/{id}/currentSwitchStateV2</summary>

> Get the last known switch state of the Crownstone (whether it was on, off or dimmed)
> Keep in mind that the user can opt-out of this behaviour in the privacy settings in the app.
>
> Response code: <b>200</b>
>
> Reply format:
> ```js
> {
>   "timestamp":   string, // when this was updated, timestring like "2021-09-14T07:22:39.794Z"
>   "switchState": number  // 0 .. 100
> }
> ```
</details>

If you want to switch your Crownstone via a cloud call, use the switch endpoint! This is often used for integrations. If you want to switch many
Crownstones at once, use the switchCrownstones endpoint on the Sphere model.

<details>
<summary>POST /Stones/{id}/switch</summary>

> Switch the Crownstone.
> This will send a push notification to your phone, which will then switch the Crownstone.
>
> A server sent event is also sent. If you have a hub or Home Assistant with a Crownstone USB dongle, they will also attempt to switch
> the Crownstone for you.
>
> If you want to switch many Crownstones at once, use the switchCrownstones endpoint on the Sphere model.
>
> Response code: <b>204</b>
>
> Request format:
> ```js
> [
>   { type: "PERCENTAGE", percentage: number },
>   { type: "TURN_ON" },
>   { type: "TURN_OFF" },
>   ...
> ]
> ```
>
> The difference between TURN_ON and PERCENTAGE 100, is that TURN_ON will respect any existing twilight behaviour
> (it will act as if you switch via the app room overview, or via a wall switch).
</details>
