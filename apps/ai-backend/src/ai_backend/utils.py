from ai_backend.schemas import (
    Email,
    Category,
    ProductInquiry,
    ProductSupport,
    Complaint,
    Other,
)


def format_email(email: Email) -> str:
    if email.subject is None:
        return f"Email body:\n{email.body}"
    return f"Email subject:\n{email.subject}\n\nEmail body:\n{email.body}"


def category_to_schema(category: Category):
    if category == "Product_Inquiry":
        return ProductInquiry
    elif category == "Product_Support":
        return ProductSupport
    elif category == "Complaint":
        return Complaint
    elif category == "Other":
        return Other
    else:
        raise ValueError(f"Unknown category: {category}")


def category_to_flow(category: Category):
    if category == "Product_Inquiry":
        return "product"
    elif category == "Product_Support":
        return "product"
    elif category == "Complaint":
        return "simple"
    elif category == "Other":
        return "simple"
    else:
        raise ValueError(f"Unknown category: {category}")
