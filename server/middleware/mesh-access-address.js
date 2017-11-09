var crypto = require('crypto');

const debug = require('debug')('loopback:dobots:mesh-access-address');

var ADVERTISING_ACCESS_ADDRESS = 0x8E89BED6;
var retries = 0;

var runner = {

	/* BLE specification's rules are defined in Core spec 4.2 Vol. 6 Part B Chapter 2.1.2 and are as follows:

	   The initiator shall ensure that the Access Address meets the following requirements:
		• It shall have no more than six consecutive zeros or ones.
		• It shall not be the advertising channel packets’ Access Address.
		• It shall not be a sequence that differs from the advertising channel packets’ Access Address by only one bit.
		• It shall not have all four octets equal.
		• It shall have no more than 24 transitions.
		• It shall have a minimum of two transitions in the most significant six bits.

	*/

	generateAccessAddress : function() {

		random = crypto.randomBytes(4);
		if (!this.validate(random.readUInt32BE())) {
			retries++;
			return this.generateAccessAddress();
		} else {
			debug('success after ' + retries + ' retries');
			debug('address: ' + random.readUInt32BE().toString(2));
			debug('address: ' + random.toString('hex'));
			retries = 0;
			return random.toString('hex');
		}

	},

	validate : function(address) {
		advertisingAccessAddress = ADVERTISING_ACCESS_ADDRESS;

		// Requirement: It shall not be the advertising channel packets’ Access Address.
		if (address == advertisingAccessAddress) {
			debug('equal');
			return false;

		// Requirement: It shall not have all four octets equal.
		} else if (((address >>> 24) == ((address >>> 16) & 0xFF)) &&
				   ((address >>> 24) == ((address >>> 8) & 0xFF)) &&
				   ((address >>> 24) == (address & 0xFF))) {
			debug('octet equal');
			return false;

		} else {
			last0 = 0;
			last1 = 0;
			diff = 0;
			transition = -1;
			lastBit = -1;
			for (i = 0; i < 32; i++) {
				// debug('address: ' + address);
				bit = address >>> 31;
				// debug('bit: ' + bit);
				// debug('  last0: ' + last0 + ' last1: ' + last1 + ' trans: ' + transition);
				if (bit != lastBit) {
					transition++;
				}
				if (bit) {
					last1++;
					last0 = 0;
				} else {
					last0++;
					last1 = 0;
				}
				if (bit != (advertisingAccessAddress >>> 31)) {
					diff++;
				}

				// Requirement: It shall have no more than six consecutive zeros or ones.
				if ((last1 >= 6) || (last0 >= 6)) {
					debug('too many consecutive 1 or 0: (' + last1 + '/' + last0 + ')');
					return false;
				}

				// Requirement: It shall have no more than 24 transitions.
				if (transition > 24) {
					debug('too many transitions: ' + transition);
					return false;
				}

				// Requirement: It shall have a minimum of two transitions in the most significant six bits.
				if (i == 5 && transition < 2) {
					debug('not enough transitions: ' + transition);
					return false;
				}
				address <<= 1;
				advertisingAccessAddress <<= 1;
				lastBit = bit;
			}

			// Requirement: It shall not be a sequence that differs from the advertising channel packets’
			//   Access Address by only one bit.
			if (diff <= 1) {
				debug('diff too small: ' + diff);
				return false;
			}

			// all checks passed, address is valid!
			return true;
		}
	}

}

module.exports = runner;
