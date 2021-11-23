"""A demo for object detection.

For Raspberry Pi, you need to install 'feh' as image viewer:
sudo apt-get install feh

Example (Running under python-tflite-source/edgetpu directory):

  - Face detection:
    python3.5 demo/object_detection.py \
    --model='test_data/mobilenet_ssd_v2_face_quant_postprocess_edgetpu.tflite' \
    --input='test_data/face.jpg'

  - Pet detection:
    python3.5 demo/object_detection.py \
    --model='test_data/ssd_mobilenet_v1_fine_tuned_edgetpu.tflite' \
    --label='test_data/pet_labels.txt' \
    --input='test_data/pets.jpg'

'--output' is an optional flag to specify file name of output image.
"""
import argparse
import platform
import subprocess
import signal

from PIL import Image
from PIL import ImageDraw

import numpy as np
from pycoral.adapters import classify
from pycoral.adapters import detect
from pycoral.adapters import common
from pycoral.utils.dataset import read_label_file
from pycoral.utils.edgetpu import make_interpreter

import socket
import os, os.path
import time
from enum import Enum
from struct import *

import sys
from Adafruit_IO import MQTTClient

flag = False

### Insert the Key, Username, and Feed before use
# Set up the Key
ADAFRUIT_IO_KEY = ''

# Set up the Adafruit Username
ADAFRUIT_IO_USERNAME = ''

# Set up the Feed ID
FEED_ID = ''

###########################################
# These functions belong to the MQTT part.
# They will be called automatically when conditions are met

def connected(client):
    print('Da ket noi voi Adafruit IO! Dang lang nghe {0} thay doi...'.format(FEED_ID))
    client.subscribe(FEED_ID)

# Run when user subscribes to a feed succesfully
def subscribe(client, userdata, mid, granted_qos):
    print('Da subscribe feed {0} voi QoS la {1}'.format(FEED_ID, granted_qos[0]))

# Run when user disconnects with a feed
def disconnected(client):
    # Ham nay duoc goi khi nguoi dung thoat ket noi
    print('Thoat khoi Adafruit IO!')
    sys.exit(1)

# Run when there are changes on a feed that the user has subscribed
def message(client, feed_id, payload):
    # feed_id is the feed, payload saves the new data
    print('Feed {0} nhan duoc gia tri moi: {1}'.format(feed_id, payload))


# Create a user instance MQTT
client = MQTTClient(ADAFRUIT_IO_USERNAME, ADAFRUIT_IO_KEY)

# Set up all the functions defined above
client.on_connect    = connected
client.on_disconnect = disconnected
client.on_message    = message
client.on_subscribe  = subscribe

# Connect to the Adafruit Server
client.connect()

print("sending")
client.publish("sth", "sth")
print("sent")

client.loop_background()

###########################################

# Open connection to bot shell
botshell = socket.socket( socket.AF_UNIX, socket.SOCK_STREAM )
botshell.connect("/app/bot_shell.sock")

if os.path.exists( "/dev/libcamera_stream" ):
  os.remove( "/dev/libcamera_stream" )\

print("Opening socket...")
server = socket.socket( socket.AF_UNIX, socket.SOCK_DGRAM )
server.bind("/dev/libcamera_stream")
os.chown("/dev/libcamera_stream", 1047, 1047);

class SockState(Enum):
  SEARCHING = 1
  FILLING = 2

# Function to read labels from text files.
def readLabelFile(file_path):
  with open(file_path, 'r') as f:
    lines = f.readlines()
  ret = {}
  for line in lines:
    pair = line.strip().split(maxsplit=1)
    ret[int(pair[0])] = pair[1].strip()
  return ret

def keyboardInterruptHandler(signal, frame):
  print("Stopping...")
  botshell.sendall("manual_move 0 0\n".encode())
  exit(0)

signal.signal(signal.SIGINT, keyboardInterruptHandler)

def main():
  parser = argparse.ArgumentParser()
  parser.add_argument(
      '--model', help='Path of the detection model.', required=True)
  parser.add_argument(
      '--label', help='Path of the labels file.')
  args = parser.parse_args()

  # Initialize interpreter
  interpreter = make_interpreter(args.model)
  interpreter.allocate_tensors()

  # Read label file if any
  labels = readLabelFile(args.label) if args.label else {}

  # Model must be uint8 quantized
  if common.input_details(interpreter, 'dtype') != np.uint8:
    raise ValueError('Only support uint8 input type.')

  state = SockState.SEARCHING
  imgdata = None
  framewidth = 0
  frameheight = 0
  frameformat = 0
  framesize = 0

  lastrot = 0
  lastvel = 0
  nodetlag = 5
  nodetcount = 0

  lastservoy = 512
  servoy = 512

  print("Listening...")
  server.settimeout(0.5)
  while True:
    global flag
    try:
      datagram = server.recv(65536)
    except socket.timeout:
      if lastrot != 0 or lastvel != 0:
        print("socket timeout, clear manual_move")
        botshell.sendall("manual_move 0 0\n".encode())
        lastrot = 0
        lastvel = 0
      continue

    if not datagram:
      break

    # Searching for picture
    if state == SockState.SEARCHING:

      # Check for non-control packets
      if len(datagram) < 12 or len(datagram) > 64:
        continue

      # Check for magic
      if not datagram.startswith(b'OHMNICAM'):
        continue

      # Unpack the bytes here now for the message type
      msgtype = unpack("I", datagram[8:12])
      if msgtype[0] == 1:
        params = unpack("IIII", datagram[12:28])

        state = SockState.FILLING
        imgdata = bytearray()

        framewidth = params[0]
        frameheight = params[1]
        frameformat = params[2]
        framesize = params[3]

    # Filling image buffer now
    elif state == SockState.FILLING:
      # Append to buffer here
      imgdata.extend(datagram)

      # Check size
      if len(imgdata) < framesize:
        continue

      # Resize and submit
      imgbytes = bytes(imgdata)
      newim = Image.frombytes("L", (framewidth, frameheight), imgbytes, "raw", "L")
      size = common.input_size(interpreter)
      rgbim = newim.convert("RGB").resize(size, Image.ANTIALIAS)

      common.set_input(interpreter, rgbim)
      interpreter.invoke()
      ans = detect.get_objects(interpreter, 0.05)

      print('-------RESULTS--------')
      for c in ans:
        print('%s: %.5f' % (labels.get(c.id, c.id), c.score))

      # Best face to follow
      best = None

      # Display result.
      currfaces = 0

      if ans:
        currfaces = len(ans)
        for obj in ans:
          print ('-----------------------------------------')
          print ('score = ', obj.score)

          if obj.score > 0.45:
            bb = obj.bbox
            print(bb)
            cx = (bb.xmin + bb.xmax) * 0.5 * (1280/300)
            cy = (bb.ymin + bb.ymax) * 0.5 * (960/300)
            wid = bb.width * (960/300)
            hei = bb.height * (1280/300)
            avgsz = (wid + hei) * 0.5
            if avgsz > 72 and (best is None or avgsz > best[0]):
              best = [avgsz, cx, cy, obj.score]
            if flag == False:
                client.publish("sth", str(obj.score))
                flag = True
      else:
        if flag == True:
            flag = False
            client.publish("sth", "No detection")
        print("No detections.")

      # Update speed here if needed
      newrot = 0
      newvel = 0
      sdelta = 0
      if best:
        nx = (best[1] - 640) / 640.0
        ny = (best[2] - 512) / 512.0
        print("Face at {} {} size {} score {}".format(nx, ny, best[0], best[3]))
        newrot = nx * 800
        if newrot < -400: newrot = -400
        if newrot > 400: newrot = 400

        best_avg_size = 570
        min_avg_size = best_avg_size - 200
        max_avg_size = best_avg_size + 100

        if best[0] < min_avg_size: # 180
          newvel = (min_avg_size-best[0]) * 1000 # 180
          if newvel > 500: newvel = 500

        if best[0] > max_avg_size:
          newvel = -((best[0] - max_avg_size) * 600)
          if newvel < -500: newvel = -500

        ny += 0.2
        sdelta = ny * -10.0
        if sdelta < -25: sdelta = -25
        if sdelta > 25: sdelta = 25

      # Hack in case we lose a few frames
      if best is None:
        if nodetcount < nodetlag:
          newrot = lastrot
          newvel = lastvel
          nodetcount += 1
      else:
        nodetcount = 0

      # check delta
      newrot = round(newrot)
      newvel = round(newvel)
      if newrot != lastrot or newvel != lastvel:
        botshell.sendall("manual_move {} {}\n".format(newrot + newvel, newrot - newvel).encode())
        lastrot = newrot
        lastvel = newvel

      # check sdelta
      if sdelta != 0:
        servoy += sdelta
        if servoy > 700: servoy = 700
        if servoy < 300: servoy = 300
        if servoy != lastservoy:
          botshell.sendall("pos 3 {} 15\n".format(servoy).encode())
          lastservoy = servoy

      # Go back to initial state
      state = SockState.SEARCHING

  print("-" * 20)
  print("Shutting down...")
  server.close()

  os.remove( "/dev/libcamera_stream" )
  print("Done")

if __name__ == '__main__':
  main()
