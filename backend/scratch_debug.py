import requests

BASE_URL = "http://127.0.0.1:8000/api"

with open("dummy.mp3", "wb") as f:
    f.write(b"ID3\x03\x00\x00\x00\x00\x00\x00")

files = {"file": ("dummy.mp3", open("dummy.mp3", "rb"), "audio/mpeg")}
r = requests.post(f"{BASE_URL}/upload/", files=files)
print("Upload:", r.status_code, r.text)

if r.status_code == 200:
    session_id = r.json().get("session_id")
    print(session_id)
    payload = {"session_id": session_id, "job_role": "SWE", "experience_level": "mid"}
    r2 = requests.post(f"{BASE_URL}/analyze/", json=payload)
    print("Analyze:", r2.status_code, r2.text[:500])
