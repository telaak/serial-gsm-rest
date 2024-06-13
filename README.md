# Serialport GSM modem REST interface

Simple WebSocket & REST interface for interacting with a GSM modem. Allows you to send and receive messages, also includes a SQLite database.

# [TypeDoc](https://telaak.github.io/serial-gsm-rest/index.html)

## Description

This project consists of 3 main parts:

1. The GSM (modem) handler, which connects through a serial port and interacts through standard AT commands. Emits events on received and sent messages.
2. A WebSocket and REST interface that relays the emitted events from the GSM handler and allows you to get messages from the SIM card and send SMS.
3. A simple SQLite database that saves all received and sent messages

### WebSocket and HTTP interface

* The address for WebSocket connections is http://localhost:4000/ws/connect
* The address for the HTTP interface is http://localhost:4000/

See the route handlers for more information.

## Getting Started

### Dependencies

* Node 21/20/18

### Installing

1. Pull the repository `git pull github.com/telaak/serial-gsm-rest.git`
2. Install all dependencies `npm i`
3. Run the TypeScript compiler `npx tsc`
4. Fill out the required environmental variables:
 * GSMTTY (path for the serial device e.g. `/dev/tty.usbserial-2120`)
 * SQLITE_PATH (path to the sqlite database)
5. Run the main file `node ./dist/index.js`


### Docker

## Building

* `docker build -t username/serial-gsm-rest`

## Compose

```
version: '2.3'

services:

  serial-gsm-rest:
    image: telaaks/serial-gsm-rest
    container_name: serial-gsm-rest
    restart: unless-stopped
    volumes:
      - /data/sqlite:/app/sqlite/
    environment:
      GSMTTY: /dev/tty.usbserial-2120
      SQLITE_PATH: ./sqlite/db.sqlite
```

## License

This project is licensed under the MIT License - see the LICENSE.md file for details
