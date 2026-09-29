# Weatherly Security Policy

Weatherly is a client-side weather dashboard. We take reports about security, privacy, and unsafe handling of data seriously, and we appreciate the time it takes to report them responsibly.

## Supported versions

Only the latest version on the `main` branch is actively supported with security fixes.

## Reporting a vulnerability

Please report suspected vulnerabilities privately through [GitHub's private vulnerability reporting](https://github.com/Izzo047/weatherly-dashboard/security/advisories/new). Do not open a public issue or pull request for a vulnerability, because public details can put users at risk before a fix is available.

A useful report includes:

- A clear description of the issue and its potential impact.
- The affected page, file, dependency, or commit.
- Reproduction steps or a small proof of concept.
- Any conditions required to reproduce the issue.
- Your suggested fix, if you have one.

Please avoid including real personal data, API keys, access tokens, or credentials in a report. Redact sensitive values before attaching logs or screenshots.

If private vulnerability reporting is unavailable, contact the maintainer privately through GitHub with the same information. Please allow time for an acknowledgement and coordinated response before sharing details publicly.

## Scope notes

The dashboard uses public, no-key services from Open-Meteo, RainViewer, Leaflet, and OpenStreetMap. Reports about a third-party service should also be sent to that service's security contact when the issue is outside Weatherly's code or configuration.

Weatherly does not ask users to enter secrets. Please report any change that introduces credential collection, exposes private data, weakens dependency security, or creates a path for malicious code execution.

Thank you for helping keep Weatherly trustworthy for everyone who uses or contributes to it.
