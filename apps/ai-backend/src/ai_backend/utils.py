from ai_backend.schemas import (
    Email,
    Categories,
    CategoryConfig,
)


def format_email(email: Email) -> str:
    if email.subject is None:
        return f"Email body:\n{email.body}"
    return f"Email subject:\n{email.subject}\n\nEmail body:\n{email.body}"


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
