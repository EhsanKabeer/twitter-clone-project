"""
stress_test.py
================

This script exercises the microblogging API by sending concurrent
requests for creating posts and liking posts.  It mixes valid and
invalid inputs to verify that the server returns appropriate
responses and remains stable under load.  Only built‑in Python
modules (`urllib`, `threading`) are used.

Usage::

    python stress_test.py

Before running the test, ensure that the server is running on the
default port (5000) by executing ``node server.js`` in another
terminal.
"""

import json
import threading
import time
import urllib.request
import urllib.error

BASE_URL = 'http://localhost:5000'


def post_message(author, content):
    payload = {'author': author, 'content': content}
    req = urllib.request.Request(
        f'{BASE_URL}/api/posts',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = resp.read().decode('utf-8')
            print(f'POST {payload} → {body}')
    except urllib.error.HTTPError as e:
        print(f'POST {payload} → HTTP {e.code}: {e.read().decode()}')
    except Exception as e:
        print(f'POST {payload} → Error: {e}')


def like_post(post_id):
    payload = {'id': post_id}
    req = urllib.request.Request(
        f'{BASE_URL}/api/like',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = resp.read().decode('utf-8')
            print(f'LIKE {payload} → {body}')
    except urllib.error.HTTPError as e:
        print(f'LIKE {payload} → HTTP {e.code}: {e.read().decode()}')
    except Exception as e:
        print(f'LIKE {payload} → Error: {e}')


def run_tests():
    # Define test cases: tuples of (function, args)
    tests = [
        # Valid posts
        (post_message, ('Alice', 'Hello world!')),
        (post_message, ('Bob', 'This is a test post.')),
        # Invalid posts
        (post_message, ('', 'No author')),  # empty author
        (post_message, ('Charlie', '')),  # empty content
        (post_message, ('Dave', 'x' * 300)),  # content too long (>280)
        # Like operations (will need to run after some posts exist)
        (like_post, (1,)),  # assume post with id 1 exists
        (like_post, ('abc',)),  # invalid id type
        (like_post, (999,)),  # non‑existent post
    ]
    threads = []
    for func, args in tests:
        t = threading.Thread(target=func, args=args)
        threads.append(t)
        t.start()
        time.sleep(0.1)
    for t in threads:
        t.join()


if __name__ == '__main__':
    run_tests()