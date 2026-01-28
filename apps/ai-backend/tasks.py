import subprocess
import sys


def dev():
    sys.exit(  # Pass exit code of script to exit code of this python scrupt
        subprocess.run(
            ["fastapi", "dev", "--entrypoint", "ai_backend.main:app"]
        ).returncode
    )


def test():
    sys.exit(subprocess.run(["pytest"]).returncode)


def lint():
    sys.exit(
        subprocess.run(
            [
                "ruff",
                "check",
            ],
        ).returncode
    )


def format():
    sys.exit(
        subprocess.run(
            [
                "ruff",
                "format",
            ],
        ).returncode
    )
