import subprocess
import sys


def runCommand(command):
    sys.exit(  # Pass exit code of script to exit code of this python script
        subprocess.run(command).returncode
    )


def dev():
    runCommand(["fastapi", "dev", "--entrypoint", "ai_backend.main:app"])


def test():
    runCommand(["pytest"])


def lint():
    runCommand(["ruff", "check"])


def format():
    runCommand(["ruff", "format"])


def typecheck():
    runCommand(["ty", "check"])
