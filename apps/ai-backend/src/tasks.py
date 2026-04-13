import subprocess
import sys


def run_command(command):
    sys.exit(  # Pass exit code of script to exit code of this python script
        subprocess.run(command).returncode
    )


def dev():
    run_command(["fastapi", "dev", "--entrypoint", "ai_backend.main:app"])


def test():
    run_command(["pytest"])


def lint():
    run_command(["ruff", "check"])


def format():
    run_command(["ruff", "format"])


def typecheck():
    run_command(["ty", "check"])


def evaluate():
    run_command(["python", "tests/eval_suite.py"])
