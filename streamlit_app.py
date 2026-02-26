"""
Exotel Hub — Streamlit Wrapper
================================
Serves the built React app (dist/) via a local HTTP server
and embeds it in Streamlit.

QUICK START
-----------
1.  Build the React app first:
        npm install && npm run build

2.  Set API keys either via .streamlit/secrets.toml or environment:
        VITE_GEMINI_API_KEY = "your_key"
        VITE_GOOGLE_CLIENT_ID = "your_client_id"

3.  Run:
        streamlit run streamlit_app.py
"""

import os
import threading
import http.server
import socketserver
import subprocess
import time
from pathlib import Path

import streamlit as st

# ─── Config ────────────────────────────────────────────────────────────────────
APP_DIR  = Path(__file__).parent
DIST_DIR = APP_DIR / "dist"
PORT     = 3001

st.set_page_config(
    page_title="Exotel Hub",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ─── Inject secrets into environment so the build can use them ─────────────────
# (Secrets set in Streamlit Cloud or .streamlit/secrets.toml)
for key in ["VITE_GEMINI_API_KEY", "VITE_GOOGLE_CLIENT_ID"]:
    try:
        val = st.secrets.get(key)
        if val:
            os.environ[key] = val
    except Exception:
        pass


# ─── Ensure dist/ is built ─────────────────────────────────────────────────────
def ensure_built():
    if not DIST_DIR.exists() or not (DIST_DIR / "index.html").exists():
        st.info("⚙️  First run: building the React app (this takes ~30 seconds)...")
        try:
            # Install node deps
            subprocess.run(["npm", "install"], cwd=str(APP_DIR), check=True,
                           capture_output=True)
            # Build (env vars are inherited from os.environ above)
            subprocess.run(["npm", "run", "build"], cwd=str(APP_DIR), check=True,
                           capture_output=True)
            st.success("✅ Build complete — loading app...")
            time.sleep(1)
            st.rerun()
        except subprocess.CalledProcessError as e:
            st.error(f"Build failed: {e.stderr.decode()}")
            st.stop()
        except FileNotFoundError:
            st.error(
                "❌ `npm` not found. Please build the app manually:\n\n"
                "```bash\nnpm install && npm run build\n```\n"
                "Then re-run `streamlit run streamlit_app.py`."
            )
            st.stop()


# ─── Start HTTP server (once per session) ──────────────────────────────────────
class SilentHandler(http.server.SimpleHTTPRequestHandler):
    """Suppress access logs to keep Streamlit output clean."""
    def log_message(self, *args):
        pass


def start_server():
    os.chdir(str(DIST_DIR))
    with socketserver.TCPServer(("", PORT), SilentHandler) as httpd:
        httpd.serve_forever()


def ensure_server():
    if "server_started" not in st.session_state:
        t = threading.Thread(target=start_server, daemon=True)
        t.start()
        time.sleep(1.5)          # Brief wait for the server to bind
        st.session_state.server_started = True


# ─── Main ──────────────────────────────────────────────────────────────────────
ensure_built()
ensure_server()

# Hide Streamlit chrome so the React app fills the viewport
st.markdown("""
<style>
  #MainMenu { visibility: hidden; }
  footer    { visibility: hidden; }
  header    { visibility: hidden; }
  .block-container { padding: 0 !important; max-width: 100% !important; }
  iframe { border: none; }
</style>
""", unsafe_allow_html=True)

# Embed the React SPA
st.components.v1.iframe(
    src=f"http://localhost:{PORT}",
    height=900,
    scrolling=True,
)

# Small helper footer
st.caption(
    "Exotel Hub · Internal L&D Platform · "
    f"[Open in new tab](http://localhost:{PORT})"
)
