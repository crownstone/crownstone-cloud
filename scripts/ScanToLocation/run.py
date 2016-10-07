import sys;
import json;
import requests;
import time;
import md5;
import senseapi;
import os;
import getpass;
import copy;

from datetime import datetime, timedelta;
from pprint import pprint;
from termcolor import colored;

# crownstone_base_url = "http://0.0.0.0:3000"
crownstone_base_url = "https://cloud.crownstone.rocks"
crownstone_api_url = "%s/api" %crownstone_base_url

date_time_format = "%Y-%m-%dT%H:%M:%S.000Z"

sleep_time = 30

scan_interval = 60

def loginCrownstone():
	response = requests.post("%s/users/login" %crownstone_api_url,
		data = {"email": crownstone_user, "password": crownstone_password})

	if response.status_code != 200:
		print "failed to login"
		raise Exception("failed to login to crownstone cloud")

	global access_token
	access_token = json.loads(response.text)['id']

def getStonesWithLocations():
	global access_token

	stone_filter = '{"fields":["address", "id"], "include": "locations"}'

	response = requests.get("%s/Stones?filter=%s&access_token=%s" %(crownstone_api_url, stone_filter, access_token))

	if response.status_code != 200:
		print "failed to get stones"
		return None

	parsed_stones = [b for b in response.json() if b['locations']]

	return parsed_stones

def getStones():
	global access_token

	stone_filter = '{"fields":["address", "id"]}'

	response = requests.get("%s/Stones?filter=%s&access_token=%s" %(crownstone_api_url, stone_filter, access_token))

	if response.status_code != 200:
		print "failed to get stones"
		return None

	return response.json()

# def getStonesWithLastScans():
# 	global access_token

# 	# scan_filter = '{"include":"scans"}'
# 	scan_filter = '{"include":{"relation":"scans", "scope": {"order":"timestamp DESC","limit":1}}}'

# 	response = requests.get("%s/Stones?filter=%s&access_token=%s" %(crownstone_api_url, scan_filter, access_token))

# 	if response.status_code != 200:
# 		print "failed to get stones"
# 		return None

# 	parsed_stones = [b for b in response.json() if b['scans']]

# 	return parsed_stones

def getStonesAndScans():
	global access_token

	scan_filter = '{"include": "scans"}'

	# print scan_filter

	response = requests.get("%s/Stones?filter=%s&access_token=%s" %(crownstone_api_url, scan_filter, access_token))

	if response.status_code != 200:
		print "failed to get stones"
		return None

	parsed_stones = [b for b in response.json() if b['scans']]

	return parsed_stones

def getStoneWithScans(id, timestamp, ts):
	global access_token

	if timestamp:
		scan_filter = '{"include":{"relation":"scans", "scope": {"where": {"and": [{"timestamp": {"gt": "%s"}}, {"timestamp": {"lt": "%s"}}]}, "order": "timestamp DESC"}}}' %(timestamp, ts)
	else:
		scan_filter = '{"include": "scans"}'

	# print scan_filter

	response = requests.get("%s/Stones/%s?filter=%s&access_token=%s" %(crownstone_api_url, id, scan_filter, access_token))

	if response.status_code != 200:
		print "failed to get stones"
		return None

	return response.json()

def getStoneWithLastScan(id):
	global access_token

	scan_filter = '{"include":{"relation":"scans", "scope": {"order":"timestamp DESC","limit":1}}}'

	# print scan_filter

	response = requests.get("%s/Stones/%s?filter=%s&access_token=%s" %(crownstone_api_url, id, scan_filter, access_token))

	if response.status_code != 200:
		print "failed to get stones"
		return None

	return response.json()

# def getLocationsForStone():
# 	global access_token

# 	response = requests.get("%s/Stones/%s/locations?access_token=%s" %(crownstone_api_url, id, access_token))

# 	if response.status_code != 200:
# 		print "failed to get stones"
# 		return None

# 	return response.json()

def getDevice(address):
	global access_token

	filter = '{"where": {"address" : "%s"}}' %address

	response = requests.get("%s/Devices/?filter=%s&access_token=%s" %(crownstone_api_url, filter, access_token))

	if response.status_code != 200:
		print "failed to get device"
		return None

	return response.json()[0]

def updateDevice(device):
	global access_token

	response = request.put("%s/Devices/?access_token=%s" %(crownstone_api_url, access_token), data=device)

	if response.status_code != 200:
		print "failed to update device"
		return False

	return True


def checkCredentials():
	global crownstone_user, crownstone_password, sense_user, sense_password

	try:
		crownstone_user = os.environ['CROWNSTONE_USER']
	except KeyError:
		print "missing crownstone user name"
		print "(might want to set it as environement variable CROWNSTONE_USER)"
		print "User: ",
		crownstone_user = sys.stdin.readline()[0:-1]
		print

	try:
		crownstone_password = os.environ['CROWNSTONE_PASSWORD']
	except KeyError:
		print "missing crownstone password"
		print "(might want to set it as environement variable CROWNSTONE_PASSWORD?)"
		# crownstone_password = sys.stdin.readline()[0:-1]
		crownstone_password = getpass.getpass()
		print

def test(start_time):
	global access_token

	scan_filter = '{"include":{"relation":"scans", "scope": { "fields" : ["timestamp"], "where": {"timestamp": {"gt": "%s"}}, "limit": 500, "order": "timestamp ASC"}}}' %start_time

	response = requests.get("%s/Stones/?filter=%s&access_token=%s" %(crownstone_api_url, scan_filter, access_token))

	if response.status_code != 200:
		print "failed"

	parsed_stones = [b for b in response.json() if b['scans']]

	return parsed_stones


location_dict = {}

# if __name__ == "__main__":
def run(startTime = None):
	global scan_interval

	try:
		print "*****************************************************"
		print "* Starting Evaluation of Crownstone cloud scan data *"
		print "*****************************************************"
		print

		checkCredentials()

		### FIRST TIME

		print "logging in to crownstone cloud ...",
		loginCrownstone()
		print "done"

		# stones = getStonesWithLocations();
		# stones = test(startTime);

		# locationLookup = {b['address'] : b['locations'][0] for b in stones if b['locations']}

		if not startTime:
			# this is the first timestamp we will be using to check for new scans
			timestamp = datetime.fromtimestamp(time.time() - scan_interval) # time_now - scan_interval
		else:
			# for debugging purposes, use provided start time
			timestamp = datetime.strptime(startTime, date_time_format)

		# stones = test("2016-01-22T00:00:00.000Z")
		# today = datetime.date(datetime.now()).strftime(date_time_format)
		# stones = test(today)

		iteration = 1

		while True:
			old_loc_dict = copy.deepcopy(location_dict)

			# reset rssi values for all devices
			for addr, loc in location_dict.items():
				loc['rssi'] = -255

			print "%s, starting run %s" %(time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()), iteration)

			print "checking new scans since %s" %(timestamp.strftime(date_time_format))

			# pprint(stones)

			# get scans for stones, newer than timestamp
			for b in stones:
			# for i in range(len(stones)):
				# b = stones[i]
				stones = getStonesWithScans(b['id'], timestamp.strftime(date_time_format), (timestamp + timedelta(seconds=scan_interval)).strftime(date_time_format))

				if not stone:
					print colored("failed to get stone with scans", "red")
					continue

				# stone = getStoneWithLastScan(b['id'])
				stoneAddress = stone['address']

				# gather some statistics
				if not stone['scans']:

					b['caught'] = 0
					if not b.has_key('totalCaught'):
						b['totalCaught'] = 0

					if b.has_key('missed') and b.has_key('totalMissed'):
						b['missed'] += 1
						b['totalMissed'] += 1
					else:
						b['missed'] = 1
						b['totalMissed'] = 1

					print "{:s} [{:17s}] (caught {:3d}/{:3d}, missed {:s}/{:s})".format(colored("No scans found for", "red"), stoneAddress, b['caught'], b['totalCaught'], colored("{:3d}".format(b['missed']), "red"), colored("{:3d}".format(b['totalMissed']), "red"))
					#print "No scans found for [%s] (caught %d/%d, missed %d/%d)" %(stoneAddress, b['caught'], b['totalCaught'], b['missed'], b['totalMissed'])

				else:
					# reset missed counter, but leave totalMissed counter
					if b.has_key('caught') and b.has_key('totalCaught'):
						b['caught'] += 1
						b['totalCaught'] += 1
					else:
						b['caught'] = 1
						b['totalCaught'] = 1

					b['missed'] = 0
					if not b.has_key('totalMissed'):
						b['totalMissed'] = 0

					print "{:s} [{:17s}] (caught {:s}/{:s}, missed {:3d}/{:3d})".format(colored("found scans for   ", "green"), stoneAddress, colored("{:3d}".format(b['caught']), "green"), colored("{:3d}".format(b['totalCaught']), "green"), b['missed'], b['totalMissed'])
					#print "found scans for [%s] (caught %d/%d, missed %d/%d)" %(stoneAddress, b['caught'], b['totalCaught'], b['missed'], b['totalMissed'])

				# if  no scans found for this stone, continue with next
				if not stone['scans']:
					continue

				# for all scanned devices, check if rssi is bigger than last
				for d in stone['scans'][0]['scannedDevices']:
					update = False
					deviceAddress = d['address']
					# print "> %s" %deviceAddress

					# if new rssi is bigger than old, update
					if location_dict.has_key(deviceAddress):
						if d['rssi'] > location_dict[deviceAddress]['rssi']:
							update = True

					# if address hasn't been seen before, update
					else:
						location_dict[deviceAddress] = {}
						update = True

					if update:
						location_dict[deviceAddress]['rssi'] = d['rssi']
						location_dict[deviceAddress]['stone'] = stoneAddress
						location_dict[deviceAddress]['update'] = True

			# pprint({addr : loc['stone'] for addr, loc in location_dict.items()})
			# pprint(location_dict)
			# pprint(old_loc_dict)

			# TODO: OUTLIER REMOVAL. only create a location change if location is the same for (at least) 2 subsequent scans!

			for a, l in location_dict.items():
				if old_loc_dict.has_key(a):
					if old_loc_dict[a]['stone'] != l['stone']:
						print ">> [%s] LOCATION CHANGED from %s to %s" %(a, old_loc_dict[a]['stone'], location_dict[a]['stone'])

			print

			# pprint(location_dict)

			# # loop through all devices, if updated, update location and send to cloud
			# for addr, loc in location_dict.items():
			# 	if loc['update']:
			# 		# get the device object from the address
			# 		device = getDevice(address)

			# 		# get location of stone
			# 		location = locationLookup[b['address']]

			# 		# update location id of device
			# 		device['locationId'] = location['id']

			# 		# update cloud
			# 		updateDevice(device)

			iteration += 1

			#update timestamp and wait
			timestamp += timedelta(seconds=scan_interval)
			now = datetime.fromtimestamp(time.time())

			next_check = timestamp + timedelta(seconds=scan_interval)

			# if simulated (debugging)
			if startTime:
				time.sleep(0)
			# if next time to check is in the future, sleep until that time
			elif now < next_check:
				time.sleep((next_check - now).seconds)
			# if next time is in the past, we can't keep up, so increase scan_interval
			else:
				dt = (now - next_check).seconds
				scan_interval += dt
				print "can't keep up, increase scan_interval time by %d to %d sec" %(dt, scan_interval)


	except KeyboardInterrupt:
		print "\n\nexiting ..."

