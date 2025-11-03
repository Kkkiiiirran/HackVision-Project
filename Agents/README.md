Setup and run instructions for the Agents scripts

Windows (PowerShell) - recommended

1) From the workspace root, create and activate a virtual environment inside `Agents/`:

```powershell
cd "C:\Users\Kiranpreet Kaur\OneDrive\Desktop\Codemate Internship Final\Agents"
py -3 -m venv .venv
# activate (PowerShell)
.venv\Scripts\Activate.ps1
```

2) Upgrade pip and install dependencies:

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

3) Run the agent script (this will print logs to the console and create `quiz_module.json` when finished):

```powershell
python main.py
```

Run Agents via HTTP (FastAPI)
--------------------------------
After installing FastAPI and uvicorn into the venv (requirements.txt includes them), you can run a small HTTP wrapper that exposes `POST /generate`:

```powershell
# from the Agents folder
.venv\Scripts\Activate.ps1
python -m uvicorn api:app --host 127.0.0.1 --port 8000 --reload
```

Then POST to `http://127.0.0.1:8000/generate` with JSON { "description": "..." } and the API will return the generated module JSON.

4) If you want the backend Node app to spawn the same Python executable, set `PYTHON_BIN` in your environment before starting the backend (temporary for current shell):

```powershell
$env:PYTHON_BIN = 'py'   # or full path to python.exe
cd ..\backend
npm run dev
```

Notes & troubleshooting
- If `ModuleNotFoundError` appears for any package, install it into the virtualenv: `python -m pip install <package>` and re-run.
- The `requirements.txt` file contains a minimal set (python-dotenv and google-genai). If `main.py` imports other packages, add them to `requirements.txt` and re-run `pip install -r requirements.txt`.
- If the Agent script relies on credentials for Google GenAI or other services, set those environment variables before running (e.g., `GOOGLE_API_KEY`, or follow the provider docs).

If you want, I can add a short `make`/npm script or VS Code task next to automate venv creation and installation.