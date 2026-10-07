from setuptools import setup, find_packages

setup(
    name="agenticpay",
    version="1.0.0",
    description="Official Python SDK for AgenticPay - Institutional Financial Firewall for AI Agents",
    packages=find_packages(),
    install_requires=[
        "httpx>=0.25.0",
        "pydantic>=2.0.0"
    ],
    extras_require={
        "langchain": ["langchain-core>=0.1.0"],
        "crewai": ["crewai>=0.28.0"],
    },
    python_requires=">=3.9",
)
