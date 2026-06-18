# Awesome Hacking

A curated list of hacking, penetration testing, and reverse engineering tutorials, tools, and resources.

Modeled on and credited to [carpedm20/awesome-hacking](https://github.com/carpedm20/awesome-hacking), which is itself inspired by [awesome-machine-learning](https://github.com/josephmisiti/awesome-machine-learning). For free hacking books, see [Free-Security-eBooks](https://github.com/Hack-with-Github/Free-Security-eBooks).

## Table of Contents

- [System](#system)
- [Reverse Engineering](#reverse-engineering)
- [Web](#web)
- [Network](#network)
- [Forensic](#forensic)
- [Cryptography](#cryptography)
- [Wargame](#wargame)
- [CTF](#ctf)
- [OS](#os)
- [Post Exploitation](#post-exploitation)
- [ETC](#etc)

## System

### Tutorials
- [Roppers Computing Fundamentals](https://www.roppers.org/courses/fundamentals) - Free, self-paced curriculum building a base of knowledge in computers and networking.
- [Corelan Team's Exploit writing tutorial](https://www.corelan.be/index.php/2009/07/19/exploit-writing-tutorial-part-1-stack-based-overflows/)
- [Exploit Writing Tutorials for Pentesters](http://web.archive.org/web/20140916085343/http://www.punter-infosec.com/exploit-writing-tutorials-for-pentesters/)
- [Understanding the basics of Linux Binary Exploitation](https://github.com/r0hi7/BinExp)
- [Shells](https://www.youtube.com/playlist?list=PLyzOVJj3bHQuloKGG59rS43e29ro7I57J)
- [Missing Semester](https://missing.csail.mit.edu/2020/course-shell/)

### Tools
- [Metasploit](https://github.com/rapid7/metasploit-framework) - Penetration testing and IDS signature development framework.
- [mimikatz](https://github.com/gentilkiwi/mimikatz) - A little tool to play with Windows security.
- [Hackers tools](https://www.youtube.com/playlist?list=PLyzOVJj3bHQuiujH1lpn8cA9dsyulbYRv) - Tutorial on tools.

### Docker Images for Penetration Testing & Security
- [Kali Linux](https://hub.docker.com/r/kalilinux/kali-last-release/)
- [OWASP ZAP](https://github.com/zaproxy/zaproxy)
- [WPScan](https://hub.docker.com/r/wpscanteam/wpscan/)
- [Metasploit Framework](https://hub.docker.com/r/metasploitframework/metasploit-framework/)
- [Damn Vulnerable Web Application (DVWA)](https://hub.docker.com/r/citizenstig/dvwa/)
- [Vulnerable WordPress Installation](https://hub.docker.com/r/wpscanteam/vulnerablewordpress/)
- [Vulnerability as a service: Shellshock](https://hub.docker.com/r/hmlio/vaas-cve-2014-6271/)
- [Vulnerability as a service: Heartbleed](https://hub.docker.com/r/hmlio/vaas-cve-2014-0160/)
- [Security Ninjas](https://hub.docker.com/r/opendns/security-ninjas/)
- [Arch Linux Penetration Tester](https://hub.docker.com/r/noncetonic/archlinux-pentest-lxde)
- [Docker Bench for Security](https://hub.docker.com/r/diogomonica/docker-bench-security/)
- [OWASP Security Shepherd](https://hub.docker.com/r/ismisepaul/securityshepherd/)
- [OWASP WebGoat Project](https://hub.docker.com/r/danmx/docker-owasp-webgoat/)
- [OWASP NodeGoat](https://github.com/owasp/nodegoat#option-3---run-nodegoat-on-docker)
- [OWASP Mutillidae II](https://hub.docker.com/r/citizenstig/nowasp/)
- [OWASP Juice Shop](https://github.com/bkimminich/juice-shop#docker-container--)
- [Docker Metasploit](https://hub.docker.com/r/phocean/msf/)

### General
- [Exploit database](https://www.exploit-db.com/) - An ultimate archive of exploits and vulnerable software.

## Reverse Engineering

### Tutorials
- [Begin RE: A Reverse Engineering Tutorial Workshop](https://www.begin.re/the-workshop)
- [Malware Analysis Tutorials: a Reverse Engineering Approach](http://fumalwareanalysis.blogspot.kr/p/malware-analysis-tutorials-reverse.html)
- [Malware Unicorn Reverse Engineering Tutorial](https://malwareunicorn.org/workshops/re101.html#0)
- [Lena151: Reversing With Lena](https://archive.org/details/lena151)

### Disassemblers and Debuggers
- [IDA](https://www.hex-rays.com/products/ida/) - Multi-processor disassembler and debugger.
- [OllyDbg](http://www.ollydbg.de/) - A 32-bit assembler level analysing debugger for Windows.
- [x64dbg](https://github.com/x64dbg/x64dbg) - An open-source x64/x32 debugger for Windows.
- [radare2](https://github.com/radare/radare2) - A portable reversing framework.
- [plasma](https://github.com/joelpx/plasma) - Interactive disassembler for x86/ARM/MIPS.
- [ScratchABit](https://github.com/pfalcon/ScratchABit) - Retargetable interactive disassembler with IDAPython-compatible plugin API.
- [Capstone](https://github.com/aquynh/capstone)
- [Ghidra](https://ghidra-sre.org/) - NSA's software reverse engineering (SRE) suite.

### Decompilers
**JVM-based languages**
- [Krakatau](https://github.com/Storyyeller/Krakatau) - Decompiles Scala/Kotlin/Java bytecode into Java code.
- [JD-GUI](https://github.com/java-decompiler/jd-gui)
- [procyon](https://bitbucket.org/mstrobel/procyon/wiki/Java%20Decompiler)
- [Luyten](https://github.com/deathmarine/Luyten)
- [JAD](http://varaneckas.com/jad/) - Closed-source, unmaintained.
- [JADX](https://github.com/skylot/jadx) - Decompiler for Android apps.

**.NET-based languages**
- [dotPeek](https://www.jetbrains.com/decompiler/) - Free .NET decompiler from JetBrains.
- [ILSpy](https://github.com/icsharpcode/ILSpy/) - Open-source .NET assembly browser and decompiler.
- [dnSpy](https://github.com/0xd4d/dnSpy) - .NET assembly editor, decompiler, and debugger.

**Native code**
- [Hopper](https://www.hopperapp.com) - macOS/Linux disassembler/decompiler.
- [cutter](https://github.com/radareorg/cutter) - Decompiler GUI based on radare2.
- [retdec](https://github.com/avast-tl/retdec)
- [snowman](https://github.com/yegord/snowman)
- [Hex-Rays](https://www.hex-rays.com/products/decompiler/)

**Python**
- [uncompyle6](https://github.com/rocky/python-uncompyle6) - Decompiler for CPython bytecode.

### Deobfuscators
- [de4dot](https://github.com/0xd4d/de4dot) - .NET deobfuscator and unpacker.
- [JS Beautifier](https://github.com/beautify-web/js-beautify) - Reformats minified JavaScript for readability.
- [JS Nice](http://jsnice.org/) - Guesses JS variable names and types from an open-source model.

### Other
- [nudge4j](https://github.com/lorenzoongithub/nudge4j) - Lets the browser talk to the JVM.
- [dex2jar](https://github.com/pxb1988/dex2jar) - Tools to work with Android `.dex` and Java `.class` files.
- [androguard](https://code.google.com/p/androguard/) - Reverse engineering, malware and goodware analysis of Android apps.
- [antinet](https://github.com/0xd4d/antinet) - .NET anti-managed debugger and anti-profiler code.
- [UPX](http://upx.sourceforge.net/) - The Ultimate Packer (and unpacker) for executables.

### Execution Logging and Tracing
- [Wireshark](https://www.wireshark.org/) - Free and open-source packet analyzer.
- [tcpdump](http://www.tcpdump.org/) - Command-line packet analyzer.
- [mitmproxy](https://github.com/mitmproxy/mitmproxy) - Interactive SSL-capable man-in-the-middle proxy for HTTP.
- [Charles Proxy](https://charlesproxy.com) - Cross-platform GUI web debugging proxy.
- [usbmon](https://www.kernel.org/doc/Documentation/usb/usbmon.txt) - USB capture for Linux.
- [USBPcap](https://github.com/desowin/usbpcap) - USB capture for Windows.
- [dynStruct](https://github.com/ampotos/dynStruct) - Structures recovery via dynamic instrumentation.
- [drltrace](https://github.com/mxmssh/drltrace) - Shared library call tracing.

### Binary Examination and Editing
**Hex editors**
- [HxD](http://mh-nexus.de/en/hxd/)
- [WinHex](http://www.winhex.com/winhex/)
- [wxHexEditor](https://github.com/EUA/wxHexEditor)
- [Synalize It](https://www.synalysis.net/) / [Hexinator](https://hexinator.com/)

**Other**
- [Binwalk](https://github.com/ReFirmLabs/binwalk) - Detects signatures, unpacks archives, visualizes entropy.
- [Veles](https://github.com/codilime/veles) - Visualizer for statistical properties of blobs.
- [Kaitai Struct](https://github.com/kaitai-io/kaitai_struct) - DSL for creating binary format parsers.
- [Protobuf inspector](https://github.com/jmendeth/protobuf-inspector)
- [DarunGrim](https://github.com/ohjeongwook/DarunGrim) - Executable differ.
- [DBeaver](https://github.com/dbeaver/dbeaver) - DB editor.
- [Dependencies](https://github.com/lucasg/Dependencies) - FOSS replacement to Dependency Walker.
- [PEview](http://wjradburn.com/software/) - View structure/content of PE and COFF files.
- [BinText](https://web.archive.org/web/http://www.mcafee.com/kr/downloads/free-tools/bintext.aspx) - Fast text extractor for binaries.

### General
- [Open Malware](http://www.offensivecomputing.net/)

## Web

### Tools
- [Spyse](https://spyse.com/) - OSINT data gathering: hosts, domains/whois, ports/banners, TLS DB, and more.
- [sqlmap](https://github.com/sqlmapproject/sqlmap) - Automatic SQL injection and database takeover tool.
- [NoSQLMap](https://github.com/codingo/NoSQLMap) - Automated NoSQL database enumeration and exploitation tool.
- [tools.web-max.ca](http://tools.web-max.ca/encode_decode.php) - base64/base85/MD4/MD5/SHA1 encode/decode.
- [VHostScan](https://github.com/codingo/VHostScan) - Virtual host scanner with reverse lookups and catch-all detection.
- [SubFinder](https://github.com/subfinder/subfinder) - Subdomain discovery tool using passive sources.
- [Findsubdomains](https://findsubdomains.com/) - Subdomain discovery via open-source intel and validation.
- [badtouch](https://github.com/kpcyrd/badtouch) - Scriptable network authentication cracker.
- [PhpSploit](https://github.com/nil0x42/phpsploit) - C2 framework that persists via a PHP one-liner.
- [Git-Scanner](https://github.com/HightechSec/git-scanner) - Find publicly exposed `.git` repositories.
- [CSP Scanner](https://cspscanner.com/) - Analyze Content-Security-Policy for bypasses/missing directives.
- [Shodan](https://www.shodan.io/) - Search engine for internet-connected devices.
- [masscan](https://github.com/robertdavidgraham/masscan) - Internet-scale port scanner.
- [Keyscope](https://github.com/SpectralOps/keyscope) - Validate active secrets against SaaS vendors.
- [Decompiler.com](https://www.decompiler.com/) - Online decompiler for Java, Android, Python, C#.

### General
- [Strong node.js](https://github.com/jesusprubio/strong-node) - Checklist for source-level security analysis of Node.js services.

## Network

### Tools
- [NetworkMiner](http://www.netresec.com/?page=NetworkMiner) - Network Forensic Analysis Tool (NFAT).
- [Paros](http://sourceforge.net/projects/paros/) - Java-based HTTP/HTTPS proxy for web app vulnerability assessment.
- [pig](https://github.com/rafael-santiago/pig) - Linux packet crafting tool.
- [cirt-fuzzer](http://www.cirt.dk/) - Simple TCP/UDP protocol fuzzer.
- [ASlookup](https://aslookup.com/) - Explore autonomous systems (CIDR, ASN, Org...).
- [ZAP](https://www.owasp.org/index.php/OWASP_Zed_Attack_Proxy_Project) - Integrated penetration testing proxy for web apps.
- [mitmsocks4j](https://github.com/Akdeniz/mitmsocks4j) - Man-in-the-middle SOCKS proxy for Java.
- [ssh-mitm](https://github.com/jtesta/ssh-mitm) - SSH/SFTP MITM tool that logs sessions and passwords.
- [nmap](https://nmap.org/) - Network Mapper security scanner.
- [Aircrack-ng](http://www.aircrack-ng.org/) - 802.11 WEP/WPA-PSK key cracking suite.
- [Nipe](https://github.com/GouveaHeitor/nipe) - Make Tor your default gateway.
- [Habu](https://github.com/portantier/habu) - Python network hacking toolkit.
- [Scapy](https://github.com/secdev/awesome-scapy) - Python library for packet creation/manipulation.
- [Amass](https://github.com/OWASP/Amass) - In-depth subdomain enumeration (scraping, brute force, crawling).
- [sniffglue](https://github.com/kpcyrd/sniffglue) - Secure multithreaded packet sniffer.
- [Netz](https://github.com/spectralops/netz) - Discover internet-wide misconfigurations via zgrab2.
- [RustScan](https://github.com/rustscan/rustscan) - Extremely fast port scanner built with Rust.
- [PETEP](https://github.com/Warxim/petep) - Extensible TCP/UDP proxy with GUI for traffic analysis/modification.

## Forensic

### Tools
- [Autopsy](http://www.sleuthkit.org/autopsy/) - Digital forensics platform/GUI for The Sleuth Kit.
- [sleuthkit](https://github.com/sleuthkit/sleuthkit) - Library and CLI digital forensics tools.
- [malzilla](http://malzilla.sourceforge.net/) - Malware hunting tool.
- [IPED](https://servicos.dpf.gov.br/ferramentas/IPED/) - Brazilian Federal Police forensic investigation tool.
- [CyLR](https://github.com/orlikoski/CyLR) - NTFS forensic image collector.
- [CAINE](https://www.caine-live.net/) - Ubuntu-based forensic environment with timeline extraction from RAM.

## Cryptography

### Tools
- [xortool](https://github.com/hellman/xortool) - Analyze multi-byte XOR ciphers.
- [John the Ripper](http://www.openwall.com/john/) - Fast password cracker.
- [Aircrack-ng](http://www.aircrack-ng.org/) - 802.11 WEP/WPA-PSK key cracking.
- [Ciphey](https://github.com/ciphey/ciphey) - Automated decryption using AI/NLP.

## Wargame

### System
- [pwnable.kr](http://pwnable.kr/) - Pwn challenges around system security.
- [Exploit Exercises - Nebula](https://exploit-exercises.com/nebula/)
- [SmashTheStack](http://smashthestack.org/)
- [HackingLab](https://www.hacking-lab.com/)

### Reverse Engineering
- [Reversing.kr](http://www.reversing.kr/) - Tests cracking and reverse code engineering skill.
- [CodeEngn](http://codeengn.com/challenges/)
- [Crackmes.de](http://crackmes.de/) - Community site for crackmes/reversemes.

### Web
- [Hack This Site!](https://www.hackthissite.org/) - Free, legal training ground for hacking skills.
- [Hack The Box](https://www.hackthebox.eu) - Pentest a variety of systems.
- [Webhacking.kr](http://webhacking.kr/)
- [Gruyere](https://google-gruyere.appspot.com/)
- [OWASP Vulnerable Web Applications Directory](https://www.owasp.org/index.php/OWASP_Vulnerable_Web_Applications_Directory_Project#tab=On-Line_apps)
- [TryHackMe](https://tryhackme.com/) - Hands-on cyber security training scenarios.

### Cryptography
- [OverTheWire - Krypton](http://overthewire.org/wargames/krypton/)

### Bug Bounty
- [Awesome bug bounty resources by EdOverflow](https://github.com/EdOverflow/bugbounty-cheatsheet)
- [Bugcrowd](https://www.bugcrowd.com/)
- [HackerOne](https://www.hackerone.com/start-hacking)
- [Intigriti](https://www.intigriti.com/)

## CTF

### Competitions
- [DEF CON](https://legitbs.net/)
- [CSAW CTF](https://ctf.isis.poly.edu/)
- [hack.lu CTF](http://hack.lu/)
- [PlaidCTF](http://www.plaidctf.com/)
- [Ghost in the Shellcode](http://ghostintheshellcode.com/)
- [Boston Key Party CTF](http://bostonkeyparty.net/)
- [Insomni'hack](https://insomnihack.ch/)
- [picoCTF](https://picoctf.com/)
- [prompt(1) to win](http://prompt.ml/) - XSS challenges.
- [HackTheBox](https://www.hackthebox.eu/)

### General
- [CTFtime.org](https://ctftime.org/) - Hub for CTF events and rankings.
- [WeChall](http://www.wechall.net/)
- [CTF archives (shell-storm)](http://shell-storm.org/repo/CTF/)
- [Pentest Cheat Sheets](https://github.com/coreb1t/awesome-pentest-cheat-sheets)
- [Movies For Hackers](https://github.com/k4m4/movies-for-hackers)
- [Roppers CTF Fundamentals Course](https://www.roppers.org/courses/ctf)

## OS

### Online Resources
- [Security related Operating Systems @ Rawsec](https://inventory.raw.pm/operating_systems.html)
- [Best Linux Penetration Testing Distributions @ CyberPunk](https://n0where.net/best-linux-penetration-testing-distributions/)
- [Security @ Distrowatch](http://distrowatch.com/search.php?category=Security)

## Post Exploitation

### Tools
- [empire](https://github.com/EmpireProject/Empire) - Post-exploitation framework for PowerShell and Python.
- [silenttrinity](https://github.com/byt3bl33d3r/SILENTTRINITY) - Post-exploitation tool using IronPython to bypass PowerShell restrictions.
- [PowerSploit](https://github.com/PowerShellMafia/PowerSploit) - PowerShell post-exploitation framework.
- [ebowla](https://github.com/Genetic-Malware/Ebowla) - Framework for environmentally keyed payloads.

## ETC

- [SecTools](http://sectools.org/) - Top network security tools.
- [Roppers Security Fundamentals](https://www.roppers.org/courses/security)
- [Roppers Practical Networking](https://www.roppers.org/courses/networking)
- [Rawsec's CyberSecurity Inventory](https://inventory.raw.pm/) ([source](https://gitlab.com/rawsec/rawsec-cybersecurity-list))
- [The Cyberclopaedia](https://cr0mll.github.io/cyberclopaedia/) ([GitHub](https://github.com/cr0mll/cyberclopaedia))

---

All listed tools and resources are intended for authorized security testing, CTF competitions, security research, and education. Always obtain explicit authorization before testing systems you do not own.
