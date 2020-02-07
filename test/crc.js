let crcTable = Array(65536);
let width = 16;
let topBit = 1 << (width-1);
let uint16Max = (1 << 16) - 1;
let polynomial = 0x3D65;

let unique = {};

const generateCRCtable = function() {
  for (let i = 0; i < crcTable.length; i++) {
    crcTable[i] = hash(i);
    // console.log(i.toString(16), (remainder  ^ 0xffff).toString(16))
    if (unique[i] === undefined) {
      unique[i] = i;
    }
    else {
      console.log("duplicate", i, unique[i])
    }
  }
}


const hash = function(num) {
  console.log("from", num)
  let remainder = (num << (width-8)) & uint16Max;
  console.log("start", remainder)

  for (let bit = 16; bit > 0; bit--) {
    if (remainder & topBit) {
      console.log("R in  xor ", remainder)
      remainder = ((remainder << 1) & uint16Max) ^ polynomial;
      console.log("R out xor ", remainder)
    }
    else {
      console.log("R in      ", remainder)
      remainder = ((remainder << 1) & uint16Max);
      console.log("R out     ", remainder)
    }

  }

  return remainder;
}

