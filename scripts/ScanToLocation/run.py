import sys;
import json;
import requests;
import time;
import md5;
import senseapi;
import os;
import getpass;

from pprint import pprint;

# crownstone_base_url = "http://0.0.0.0:3000"
crownstone_base_url = "http://crownstone-cloud.herokuapp.com"
crownstone_api_url = "%s/api" %crownstone_base_url

date_time_format = "%Y-%m-%dT%H:%M:%S.000Z"

sleep_time = 30

def loginCrownstone():
	response = requests.post("%s/users/login" %crownstone_api_url,
		data = {"email": crownstone_user, "password": crownstone_password})

	if response.status_code != 200:
		print "failed to login"
		raise Exception("failed to login to crownstone cloud")

	global access_token
	access_token = json.loads(response.text)['id']

def getBeacons():
	global access_token

	beacon_filter = '{"fields":["address", "id"]}'

	response = requests.get("%s/Beacons?filter=%s&access_token=%s" %(crownstone_api_url, beacon_filter, access_token))

	if response.status_code != 200:
		print "failed to get beacons"
		return None

	return response.json()

def getBeaconsWithLastScans():
	global access_token

	# scan_filter = '{"include":"scans"}'
	scan_filter = '{"include":{"relation":"scans", "scope": {"order":"timestamp DESC","limit":1}}}'

	response = requests.get("%s/Beacons?filter=%s&access_token=%s" %(crownstone_api_url, scan_filter, access_token))

	if response.status_code != 200:
		print "failed to get beacons"
		return None

	parsed_beacons = [b for b in response.json() if b['scans']]

	return parsed_beacons

def getBeaconWithScans(id, timestamp):
	global access_token

	if timestamp:
		scan_filter = '{"include":{"relation":"scans", "scope": {"where": {"timestamp": {"gt": "%s"}}}}}' %timestamp
	else:
		scan_filter = '{"include": "scans"}'

	# print scan_filter

	response = requests.get("%s/Beacons/%s?filter=%s&access_token=%s" %(crownstone_api_url, id, scan_filter, access_token))

	if response.status_code != 200:
		print "failed to get beacons"
		return None

	return response.json()

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

location_dict = {}

if __name__ == "__main__":

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

		beacons = getBeaconsWithLastScans();

		for b in beacons:
			beaconAddress = b['address']

			for d in b['scans'][0]['scannedDevices']:
				update = False
				deviceAddress = d['address']
				if location_dict.has_key(deviceAddress):
					if location_dict[deviceAddress]['rssi'] < d['rssi']:
						update = True
				else:
					location_dict[deviceAddress] = {}
					update = True

				if update:
					location_dict[deviceAddress]['rssi'] = d['rssi']
					location_dict[deviceAddress]['beacon'] = beaconAddress

	except KeyboardInterrupt:
		print "\n\nexiting ..."

