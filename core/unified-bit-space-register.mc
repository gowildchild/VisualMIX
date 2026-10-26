[ THE VISUALMIX UNIFIED BIT-SPACE REGISTER ] (in short) Aren't some humans complicated ? :D

CONTRIBU = Contributions to the system might need some 32-bit space
CORE SYS = CORE SYSTEM, The low level core which is reachable through python code and Bitmask structures
CORE ONE = BASIC CORE, The lower core which can only access the system core through VEXX (virtual executables)
    FEAT = Features, could be anything really
      SS = 255 Software Settings - PS = 255 Personal Settings - POLICIES, CONSTRAINS
       + = COUNTERS, Developers can choose how they designate their 16-32-bit space, for anything a token can do.
           It is upgradable on the right and extendable to the left.

      CONTRIBU CORE SYS CORE ONE FEAT SSPS POL+-CON+ ──► One Program can have multiple tokens, for users, admins, daemons, ...

├──                            0x0000 0000-0001-0000 ──► DUMB APPS          (An alarm clock, Gadgets, Fun, Entertaining)
├──                       0x0000-0000 0000-0001-0000 ──► USERSPACE          (A shared recipy book, A kiosk, a public space, ..)
├──                   0x00000000-0000 0000-0001-0000 ──► APPLICATIONS       (Project-Saver, Medicine Alarm, Domotica, DMS system)
├──                   0x00000000-0000 0000-0001-0000 00 ──► SECURE-APPS     (Document Conversion, Manager, Things that matter)
├──          0x00000000-00000000-0000 0000-0001-0000 00 ──► SERVER-APPS     (Daemons, Webhook Receiver, Online Format Conversion)
├── 0x00000000-00000000-00000000-0000 0000-0001-0000 00 ──► CLIENT-SERVER   (Foo-Glass, TCP Listeners, Security Daemons)
├── 0x00000000-00000000-00000000-0000 0000-0001-0000 00 ──► SERVER-LIBS     (connectivity libraries and bitwise security)
├── 0x00000000-00000000-00000000-0000 0000-0002-0000 00 ──► SHARED-LIBS     (Bitmask Sorting, Hashing Consistency, Signs)
├── 0x00000000-00000000-00000000-0000 0000-0003-0000 00 ──►  DATA-LIBS      (Suricata Ingestion, OCR parsing, Firewalls)
├── 0x00000000-00000000-00000000-0000 0000-0000-0000-000400 00 ──► SEC1     (REST routing, Async webhooks, OAUTH2)
└── 0x00000000-00000000-00000000-0000 0000-0000-0000-00000000-000500 00 ──► (The highest security of account. )
              
How the token would "look" like, the ones with 2 check digits at the back can be encrypted:

- Random User on the internet gets a cookie:    0000-0000-0001-0000
- Guest User, cannot save things, limited:      0000-0000-0001-0000
- Basic User, can use apps/tools/...:      0000-0000-0000-0001-0000
- Serious User, can use apps and save: 00000000-0000-0000-0001-0000
- Pro User, encrypted is better:       00000000-0000-0000-0001-0000 00
- Small Project Developer:        0000-00000000-0000-0000-0001-0000 00
- Big Project Developer:      00000000-00000000-0000-0000-0001-0000 00
- Resident Tools & Adm:  0000-00000000-00000000-0000 0000-0003-0000 00 
- Server Apps:       00000000-00000000-00000000-0000 0000-0003-0000 00
- Private/Medical:   00000000-00000000-00000000-0000 0000-0000-0000-000400 00
- (Medical) Vaults:  00000000-00000000-00000000-0000 0000-0000-0000-00000000-000500 00 (is upgradable in security)
