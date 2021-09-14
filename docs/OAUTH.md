# OAUTH 2

You can also use OAUTH to use our cloud services. If you're working on an integration for which you need to use OAUTH, contact us to get an OAUTH client.

### Scopes

OAUTH 2 uses scopes to inform the user how much control they give external parties. Here is a list of available scopes and their access.

```json
{
  "user_information": [
    {
      "methods": "get",
      "path": "/api/users/me"
    },
    {
      "methods": "get",
      "path": "/api/users/userId"
    }
  ],
  "user_id": [
    {
      "methods": "get",
      "path": "/api/users/userId"
    }
  ],
  "user_location": [
    {
      "methods": "get",
      "path": "/api/users/:id/currentLocation"
    },
    {
      "methods": "get",
      "path": "/api/users/:id/devices"
    }
  ],
  "stone_information": [
    {
      "methods": "get",
      "path": "/api/Stones/all"
    }
  ],
  "switch_stone": [
    {
      "methods": "get",
      "path": "/api/Stones/:id/currentSwitchState"
    },
    {
      "methods": "get",
      "path": "/api/Stones/:id/currentSwitchStateV2"
    },
    {
      "methods": "put",
      "path": "/api/Stones/:id/setSwitchStateRemotely"
    },
    {
      "methods": "post",
      "path": "/api/Stones/:id/switch"
    },
    {
      "methods": "post",
      "path": "/api/Spheres/:id/switchCrownstones"
    }
  ],
  "sphere_information": [
    {
      "methods": "get",
      "path": "/api/users/:id/spheres"
    }
  ],
  "location_information": [
    {
      "methods": "get",
      "path": "/api/Locations/all"
    }
  ],
  "all": [
    {
      "methods": "all",
      "path": "/api"
    }
  ]
}
```
