import urllib.request
import urllib.error

url = "http://127.0.0.1:8000/auth/login"

origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

for origin in origins:
    print("----------------------------------------")
    print(f"Testing Origin: {origin}")
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    }

    req = urllib.request.Request(url, headers=headers, method="OPTIONS")

    try:
        with urllib.request.urlopen(req) as response:
            print("Status Code:", response.status)
            print("Headers:")
            for k, v in response.getheaders():
                print(f"  {k}: {v}")
    except urllib.error.HTTPError as e:
        print("HTTPError Status:", e.code)
        print("HTTPError Reason:", e.reason)
        print("HTTPError Body:", e.read().decode("utf-8", errors="ignore"))
    except Exception as e:
        print("Error:", e)

