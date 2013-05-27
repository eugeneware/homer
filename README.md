# homer

A dynamic dns server written in node.js

# Installation

homer can be installed with npm:

```
$ npm install -g homer
```

# Running the server

```
$ sudo homer start -d 53 -l 3000
Server listening on HTTP host 127.0.0.1:3000 and DNS port 53
```

# Registering your domain name with homer

```
$ homer register -h myhostname.com -p mypassword -s homerserver.com -l 3000
Registration successful

$ homer update -h myhostname.com -p mypassword -s homerserver.com -l 3000
IP Address Update successful
```

# Querying your domain name with homer

```
$ dig @homerserver.com -p 53 a myhostname.com
```
