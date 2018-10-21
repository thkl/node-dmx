'use strict'

var SerialPort = require('serialport')

var ENTTEC_PRO_DMX_STARTCODE = 0x00
var ENTTEC_PRO_START_OF_MSG = 0x7e
var ENTTEC_PRO_END_OF_MSG = 0xe7
var ENTTEC_PRO_SEND_DMX_RQ = 0x06
var ENTTEC_PRO_RECV_DMX_PKT = 0x05

function EnttecUSBDMXPRO (deviceId, options) {
  var self = this
  this.options = options || {}
  this.deviceId = deviceId
  this.channels = 512
  if ((this.options !== undefined) && (this.options.channels !== undefined)) {
    this.channels = this.options.channels
  }
  this.universe = Buffer.alloc(this.channels + 1, 0)
  this.universe.fill(0)
  self.reopen()
}

EnttecUSBDMXPRO.prototype.reopen = function () {
  var self = this
  if (this.isOpen === true) {
    return
  }
  this.dev = new SerialPort(this.deviceId, {
    'baudRate': 250000,
    'dataBits': 8,
    'stopBits': 2,
    'parity': 'none'
  }, function (err) {
    if (!err) {
      self.isOpen = true
      self.send_universe()
    } else {
      console.log('Cannot open Port: ', err.message)
    }
  })

  this.dev.on('error', function (err) {
    console.log('Error: ', err.message)
    self.isOpen = false
    self.dev.close(function (err) {
      console.log(err)
    })
  })
}

EnttecUSBDMXPRO.prototype.send_universe = function () {
  try {
    if (this.isOpen === false) {
      this.reopen()
    }

    if (!this.dev.writable) {
      return
    }

    var hdr = Buffer.from([
      ENTTEC_PRO_START_OF_MSG,
      ENTTEC_PRO_SEND_DMX_RQ,
      (this.universe.length) & 0xff,
      ((this.universe.length) >> 8) & 0xff,
      ENTTEC_PRO_DMX_STARTCODE
    ])

    var msg = Buffer.concat([
      hdr,
      this.universe.slice(1),
      Buffer.from([ENTTEC_PRO_END_OF_MSG])
    ])
    this.dev.write(msg)
  } catch (error) {
    console.log(error)
  }
}

EnttecUSBDMXPRO.prototype.start = function () {}
EnttecUSBDMXPRO.prototype.stop = function () {}

EnttecUSBDMXPRO.prototype.close = function (cb) {
  this.dev.close(cb)
}

EnttecUSBDMXPRO.prototype.update = function (u) {
  for (var c in u) {
    this.universe[c] = u[c]
  }
  this.send_universe()
}

EnttecUSBDMXPRO.prototype.updateAll = function (v) {
  for (var i = 1; i <= this.channels; i++) {
    this.universe[i] = v
  }
  this.send_universe()
}

EnttecUSBDMXPRO.prototype.get = function (c) {
  return this.universe[c]
}

module.exports = EnttecUSBDMXPRO
