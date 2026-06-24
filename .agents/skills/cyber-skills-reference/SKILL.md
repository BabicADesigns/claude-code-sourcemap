---
name: cyber-skills-reference
description: "Lookup reference for legal, hands-on cybersecurity training platforms - vulnerable web apps, wargames, CTFs, mobile/binary exploitation labs, and free courses. Use when asked to recommend where to practice pentesting, find a deliberately vulnerable app for a specific vulnerability class, or point to a CTF/wargame for a given skill."
homepage: https://github.com/joe-shenouda/awesome-cyber-skills
---

# Cyber Skills Reference

A curated directory of 100+ legal, free-or-freemium platforms for practicing
offensive and defensive security skills: deliberately vulnerable applications,
wargames, CTF sites, exploitation labs, and structured courses. Sourced from
[joe-shenouda/awesome-cyber-skills](https://github.com/joe-shenouda/awesome-cyber-skills)
(MIT licensed).

Use this skill to recommend a specific platform when someone wants to practice
a security skill, rather than guessing or hallucinating a tool name. Everything
listed is meant for **authorized, isolated practice only** (local VM, sandboxed
container, or a platform's own hosted environment) - never against systems you
don't own or have explicit permission to test.

## How to use

1. Identify what the person wants to practice: a vulnerability class (e.g. SQLi,
   XSS, buffer overflow), a platform type (web, mobile, binary, network, crypto),
   or a format (CTF, wargame, guided course).
2. Look up matching entries in `references/platforms.md` (the full table, grouped
   by category) and suggest 1-3 good fits with a one-line reason each.
3. Prefer actively maintained, well-known entries for general requests
   (TryHackMe, Hack The Box, PortSwigger/OWASP Juice Shop, picoCTF, OverTheWire)
   over obscure/archived ones unless the request is specifically for something
   niche (e.g. a particular CPU architecture or crypto primitive).
4. If self-hosting is implied (e.g. "set up a vulnerable app to test my scanner
   against"), point to a downloadable/dockerizable option (DVWA, Juice Shop,
   Metasploitable3, WebGoat) rather than a hosted-only platform.

## Quick picks by category

- **Web app vulnerabilities (general/OWASP Top 10):** OWASP Juice Shop, DVWA, WebGoat, Mutillidae, bWAPP
- **SQL injection specifically:** SQLI labs, exploit.co.il Vulnerable Web App, Pentesterlab
- **XSS specifically:** XSS-game, Google Gruyere
- **CTF / structured challenges:** picoCTF, TryHackMe, Hack The Box, Root Me, W3Challs
- **Wargames (ssh-based, escalating):** OverTheWire, SmashTheStack, pwnable.kr
- **Binary exploitation / reverse engineering:** Exploit-exercises.com, Microcorruption CTF, RPISEC/MBE, Reversing.kr
- **Mobile security (Android/iOS):** Damn Vulnerable Android App, DIVA Android, OWASP GoatDroid, Damn Vulnerable iOS App, OWASP iGoat
- **Cryptography:** MysteryTwister C3, CryptOMG
- **Active Directory / network pentest labs:** GOAD (Game of Active Directory), Metasploitable3
- **Cloud security:** AzureGoat
- **Free structured courses:** SANS Cyber Aces, Metasploit Unleashed, OpenSecurityTraining.info, SEED Labs, Cybrary.it

See `references/platforms.md` for the complete list with descriptions.
