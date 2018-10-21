'use strict'

var SerialPort = require('serialport')

var DMXKING_ULTRA_DMX_PRO_DMX_STARTCODE = 0x00
var DMXKING_ULTRA_DMX_PRO_START_OF_MSG = 0x7e
var DMXKING_ULTRA_DMX_PRO_END_OF_MSG = 0xe7
var DMXKING_ULTRA_DMX_PRO_SEND_DMX_RQ = 0x06
var DMXKING_ULTRA_DMX_PRO_SEND_DMX_A_RQ = 0x64
var DMXKING_ULTRA_DMX_PRO_SEND_DMX_B_RQ = 0x65
var DMXKING_ULTRA_DMX_PRO_RECV_DMX_PKT = 0x05

function DMXKingUltraDMXPro (deviceId, options) {
  var self = this
  this.device_id = deviceId
  this.options = options || {}
  this.universe = Buffer.alloc(513, 0)
  this.universe.fill(0)

  this.sendDMXReq = DMXKING_ULTRA_DMX_PRO_SEND_DMX_RQ
  if (this.options.port === 'A') {
    this.sendDMXReq = DMXKING_ULTRA_DMX_PRO_SEND_DMX_A_RQ
  } else if (this.options.port === 'B') {
    this.sendDMXReq = DMXKING_ULTRA_DMX_PRO_SEND_DMX_B_RQ
  }
  self.reopen()
}

DMXKingUltraDMXPro.prototype.reopen = function () {
  var self = this
  if (this.isOpen === true) {
    return
  }
  this.dev = new SerialPort(this.device_id, {
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
      console.log('port closed', err)
    })
  })
}

DMXKingUltraDMXPro.prototype.send_universe = function () {
  try {
    if (this.isOpen === false) {
      console.log('try to reopen port')
      this.reopen()
    }

    if (!this.dev.writable) {
      console.log('ndevice')
      return
    }
    var hdr = Buffer.from([
      DMXKING_ULTRA_DMX_PRO_START_OF_MSG,
      this.sendDMXReq,
      (this.universe.length) & 0xff,
      ((this.universe.length) >> 8) & 0xff,
      DMXKING_ULTRA_DMX_PRO_DMX_STARTCODE
    ])

    var msg = Buffer.concat([
      hdr,
      this.universe.slice(1),
      Buffer.from([DMXKING_ULTRA_DMX_PRO_END_OF_MSG])
    ])
    // console.log('send Message')
    this.dev.write(msg)
  } catch (error) {
    console.log(error)
  }
}

DMXKingUltraDMXPro.prototype.start = function () {}
DMXKingUltraDMXPro.prototype.stop = function () {}

DMXKingUltraDMXPro.prototype.close = function (cb) {
  this.dev.close(cb)
}

DMXKingUltraDMXPro.prototype.update = function (u) {
  for (var c in u) {
    this.universe[c] = u[c]
  }
  this.send_universe()
}

DMXKingUltraDMXPro.prototype.updateAll = function (v) {
  for (var i = 1; i <= 512; i++) {
    this.universe[i] = v
  }
  this.send_universe()
}

DMXKingUltraDMXPro.prototype.get = function (c) {
  return this.universe[c]
}

module.exports = DMXKingUltraDMXPro
