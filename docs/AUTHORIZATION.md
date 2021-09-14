# Authorization

This is a quick rundown of how to access the Crownstone cloud.

## Account & Access

Before you can start using the Crownstone Cloud, you need to create a Crownstone account. This is usually done via our consumer app
but can also be done at [https://my.crownstone.rocks](https://my.crownstone.rocks). We'd recommend to use the app since that will also
initialize you account, create a Sphere and allow you to add Crownstones.

Once you have your account, you can either use the form at [https://my.crownstone.rocks](https://my.crownstone.rocks) to log in, or do so programatically
via the /user/login endpoint. [More information on the endpoint here.](./models/USERS.md).

Once you logged in, you are presented with your access token which looks something like this:
```
N2eqcnDVWFBtbAjBYGeQQl5Gc52AhzUh74NpOXC23Ahhbhqvz75bso3XWGzKtEfg
```

You now have your token! So what do you do with this? Well you use it to tell our cloud that you are you, and you have access to your data.

You do this by adding the token to your header like so:

```js
const header = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  "Authorization": "N2eqcnDVWFBtbAjBYGeQQl5Gc52AhzUh74NpOXC23Ahhbhqvz75bso3XWGzKtEfg"
}
```

You can also add it to your query by appending it like so:
```
https://my.crownstone.rocks/api/users/me?access_token=N2eqcnDVWFBtbAjBYGeQQl5Gc52AhzUh74NpOXC23Ahhbhqvz75bso3XWGzKtEfg
```
This is not recommended however, since this will cause your token to end up in the logs.

## OAUTH 2

[If you require oauth access, take a look here.](./OAUTH.md)
