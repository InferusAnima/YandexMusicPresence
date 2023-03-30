import sys
import datetime
import base64
import hmac
import hashlib

track_id = int(sys.argv[1])
DEFAULT_SIGN_KEY = 'p93jhgh689SBReK6ghtw62'

timestamp = int(datetime.datetime.now().timestamp())
message = f'{track_id}{timestamp}'
hmac_sign = hmac.new(DEFAULT_SIGN_KEY.encode('UTF-8'), message.encode('UTF-8'), hashlib.sha256).digest()
sign = base64.b64encode(hmac_sign).decode('UTF-8')
print({'sign': sign, 'timestamp': timestamp})
sys.stdout.flush()
