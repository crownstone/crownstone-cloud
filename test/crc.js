let crcTable = Array(65536);
let width = 16;
let topBit = 1 << (width-1);
let uint16Max = (1 << 16) - 1;
let polynomial = 0x3D65;

let unique = {};


function rotl(x, shift, count= 16) {
  let comp = (1 << count) - 1
  let x1 = (x << (shift%count))%comp;
  let x2 = (x1 >> count) & comp;
  return x1 + x2;
}


function rotr(x, shift, count= 16) {
  shift = shift%count;
  let comp = (1 << count) - 1
  let x1 = (x >> shift);
  let x2 = (x << (count - shift)) & comp;
  // console.log("-----", shift, x1, x2)
  return x1 + x2;
}


let cnt = 0
const generateCRCtable = function() {
  for (let i = 0; i < crcTable.length; i++) {
    crcTable[i] = hash(i);
    if (unique[crcTable[i]] === undefined) {
      unique[crcTable[i]] = i;
    }
    else {
      cnt += 1
      console.log("duplicate", i, unique[crcTable[i]])
    }
  }
}


const hash = function(num) {
  let remainder = (num << (width-8)) & uint16Max;

  for (let bit = 16; bit > 0; bit--) {
    if (remainder & topBit) {
      remainder = (rotl(remainder ,1) & uint16Max) ^ polynomial;
    }
    else {
      remainder = (rotl(remainder ,1) & uint16Max);
    }
  }

  return remainder;
}
//
// generateCRCtable()
// console.log(unique)
//

function Fletcher16(data, count ) {
  let sum1 = 0;
  let sum2 = 0;
  let index;

  for ( index = 0; index < count; index++ )
  {
    sum1 = (sum1 + data[index]) % 255;
    sum2 = (sum2 + sum1) % 255;
  }

  return (sum2 << 8) | sum1;
}


