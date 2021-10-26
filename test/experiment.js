

let packet = {type:"PERCENTAGE", percentage:'123132'}

if (packet && packet.type === "PERCENTAGE") {
  if (packet.percentage !== undefined && typeof packet.percentage === 'string') {
    packet.percentage = Number(packet.percentage)
  }
  if (packet.percentage === undefined || (packet.percentage > 0 && packet.percentage <=1) || packet.percentage < 0 || packet.percentage > 100) {
    throw ("SwitchPackets with type PERCENTAGE require a percentage between 0 and 100:");
  }
}

console.log(packet)
