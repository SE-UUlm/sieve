from pydantic import TypeAdapter
from ai_backend.schemas import (
    Email,
    Categories,
    CategoryConfig,
)


def format_email(email: Email) -> str:
    if email.subject is None:
        return f"Customer email:\nBody:\n{email.body}"
    return f"Customer email:\nSubject: {email.subject}\nBody:\n{email.body}"


def get_categories(categories: Categories) -> list[str]:
    return [category.name for category in categories]


def get_category(category: str, categories: Categories) -> CategoryConfig:
    for cat in categories:
        if cat.name == category:
            return cat

    raise ValueError(f"Unknown category: {category}")


def get_provider_name(provider: str) -> str:
    if provider == "OPENAI":
        return "openai"
    elif provider == "ANTHROPIC":
        return "anthropic"
    elif provider == "GOOGLE_VERTEX_AI":
        return "google_vertexai"
    else:
        raise ValueError(f"Unknown provider: {provider}")


def dict_to_json(data: dict) -> str:
    """Convert a dict to json, this can contain pydantic objects or python dicts"""
    adapter = TypeAdapter(dict)
    json_bytes = adapter.dump_json(data)
    return json_bytes.decode()
