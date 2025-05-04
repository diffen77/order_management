# Contributing to Order Management System

Thank you for your interest in contributing to the Order Management System! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We aim to foster an inclusive and welcoming environment for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug in the application, please create an issue on GitHub with the following information:

1. A clear, descriptive title
2. Steps to reproduce the bug
3. Expected behavior
4. Actual behavior
5. Screenshots (if applicable)
6. Environment details (browser, OS, etc.)

### Suggesting Enhancements

If you have an idea for an enhancement, please create an issue with:

1. A clear, descriptive title
2. A detailed description of the enhancement
3. Any relevant mockups or examples
4. Explanation of why this enhancement would be useful

### Pull Requests

1. Fork the repository
2. Create a new branch from `develop`
3. Make your changes
4. Add tests for your changes (if applicable)
5. Ensure all tests pass
6. Create a pull request to the `develop` branch

## Development Process

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features and bug fixes
- `feature/<feature-name>`: Feature branches
- `bugfix/<bug-name>`: Bug fix branches
- `hotfix/<fix-name>`: Urgent fixes for production

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or updating tests
- `chore`: Changes to the build process or auxiliary tools

### Code Style

- Frontend: Follow the ESLint and Prettier configurations
- Backend: Follow PEP 8 guidelines

## Setting Up Development Environment

See the README.md file for instructions on setting up the development environment.

## Testing

Please ensure all tests pass before submitting a pull request:

- Frontend: `npm test`
- Backend: `pytest`
- End-to-End: `cd e2e && npm test`

## Documentation

- Document new features, APIs, and significant changes
- Update README.md if necessary
- Add JSDoc or docstring comments to your code

## Questions?

If you have any questions about contributing, please contact the project maintainers.

---

Thank you for your contributions! 