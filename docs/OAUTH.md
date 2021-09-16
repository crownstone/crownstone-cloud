# OAUTH 2

You can also use OAUTH to use our cloud services.

## Using OAUTH for your users

You need a OAUTH account before you can have your users log into our cloud services via OAUTH. Contact us for an account.

## Scopes

OAUTH 2 uses scopes to inform the user how much control they give external parties. Here is a list of available scopes and their access.

### user_information
- GET: /api/users/me
- GET: /api/users/userId

### user_id
- GET: /api/users/userId

### user_location
- GET: /api/users/:id/currentLocation
- GET: /api/users/:id/devices

### stone_information
- GET: /api/Stones/all

### switch_stone
- GET: /api/Stones/:id/currentSwitchState
- GET: /api/Stones/:id/currentSwitchStateV2
- PUT: /api/Stones/:id/setSwitchStateRemotely
- POST: /api/Stones/:id/switch
- POST: /api/Spheres/:id/switchCrownstones

### sphere_information
- GET: /api/users/:id/spheres

### location_information
- GET: /api/Locations/all

### all
- Every endpoint. (used for development)


If you require access to other endpoints with OAUTH, contact us.

## Events

OAUTH scopes also effect the which SSE events you can receive on the eventserver. For more information on this, refer to the documentation
on the SSE server.
