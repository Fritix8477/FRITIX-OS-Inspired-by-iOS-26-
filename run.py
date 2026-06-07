from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import webbrowser


ROOT = Path(__file__).resolve().parent
BDD_DIR = ROOT / "bdd"
STATE_FILE = BDD_DIR / "etat-telephone.json"
MESSAGES_DIR = BDD_DIR / "messages"
CONVERSATIONS_FILE = MESSAGES_DIR / "conversations.json"
HOST = "127.0.0.1"
PORT = 8765


def ensure_database():
    BDD_DIR.mkdir(exist_ok=True)
    MESSAGES_DIR.mkdir(exist_ok=True)
    if not STATE_FILE.exists():
        STATE_FILE.write_text(
            json.dumps(
                {
                    "schema": 1,
                    "updatedAt": "",
                    "settings": {},
                    "notes": "",
                    "messages": [],
                    "photos": [],
                    "notifications": [],
                    "lastApps": [],
                    "phoneTab": "recents",
                    "phoneDraft": "",
                    "music": {}
                },
                indent=2,
                ensure_ascii=True,
            ),
            encoding="utf-8",
        )
    if not CONVERSATIONS_FILE.exists():
        CONVERSATIONS_FILE.write_text(
            json.dumps({"schema": 1, "updatedAt": "", "conversations": []}, indent=2, ensure_ascii=True),
            encoding="utf-8",
        )


class EmulatorHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_json(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def do_GET(self):
        if self.path.split("?", 1)[0] == "/":
            self.path = "/index.html"
        if self.path.split("?", 1)[0] == "/api/state":
            ensure_database()
            self.end_json()
            self.wfile.write(STATE_FILE.read_bytes())
            return
        super().do_GET()

    def do_POST(self):
        if self.path.split("?", 1)[0] != "/api/state":
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
            ensure_database()
            STATE_FILE.write_text(json.dumps(payload, indent=2, ensure_ascii=True), encoding="utf-8")
            if isinstance(payload.get("conversations"), list):
                CONVERSATIONS_FILE.write_text(
                    json.dumps(
                        {
                            "schema": 1,
                            "updatedAt": payload.get("updatedAt", ""),
                            "autoReply": payload.get("autoReply", True),
                            "conversations": payload["conversations"],
                        },
                        indent=2,
                        ensure_ascii=True,
                    ),
                    encoding="utf-8",
                )
            self.end_json()
            self.wfile.write(b'{"ok":true}')
        except Exception as error:
            self.end_json(500)
            self.wfile.write(json.dumps({"ok": False, "error": str(error)}).encode("utf-8"))


def main():
    ensure_database()
    server = ThreadingHTTPServer((HOST, PORT), EmulatorHandler)
    url = f"http://{HOST}:{PORT}/index.html"
    print(f"Emulator iPhone: {url}")
    webbrowser.open(url)
    server.serve_forever()


if __name__ == "__main__":
    main()
