# ==========================================================================
# VisualMIX Engine: Signing Routines for autonomous public & private signing
# Copyright (c) 2002-2026 by Gunther Voet (GoWildchild) All Rights Reserved. 
# Released under strict Non-Commercial Open-Source License terms.
# ==========================================================================
# 
import os
import sys
import json
import time
import hashlib
import ast
import argparse
import getpass
import xml.etree.ElementTree as ET
from typing import Dict, Any, Tuple
from enum import IntFlag, Enum

# Global session cache to protect execution speed across large record iterations
PASSPHRASE_CACHE = {}

def calculate_visualmix_checksum(counter_hex: str, policy_hex: str, flags_hex: str) -> str:
    """Calculates an easy-to-verify 2-digit hex checksum by summing the byte values (Option B)."""
    padded_flags = flags_hex.zfill(4)
    byte1 = int(counter_hex, 16)
    byte2 = int(policy_hex, 16)
    byte3 = int(padded_flags[:2], 16)
    byte4 = int(padded_flags[2:], 16)
    return f"{(byte1 + byte2 + byte3 + byte4) % 256:02x}"


def verify_param_checksum_opt_b(param_hex: str) -> bool:
    """Validates a 9-character parameter string against its trailing 2-digit checksum."""
    if len(param_hex) != 9:
        return False
    return calculate_visualmix_checksum(param_hex[:2], param_hex[2:4], param_hex[4:7]) == param_hex[7:].lower()


def decode_visualmix_param_opt_b(param_hex: str) -> Tuple[int, dict, dict]:
    """Parses Option B bitshifting configuration layouts into functional boolean dictionaries."""
    if not verify_param_checksum_opt_b(param_hex):
        raise ValueError(f"CRITICAL ERROR: Parameter string '{param_hex}' failed its validation checksum.")

    val_counter = int(param_hex[:2], 16)
    val_policy  = int(param_hex[2:4], 16)
    val_flags   = int(param_hex[4:7], 16)

    policies = {
        "has_core_values": bool(val_policy & 1),
        "has_header_hash": bool(val_policy & 2),
        "has_private_key_sig": bool(val_policy & 4),
        "chance_to_sign": bool(val_policy & 8),
        "has_field_values": bool(val_policy & 16),
        "has_field_hash": bool(val_policy & 32),
        "has_private_key_set": bool(val_policy & 64),
        "core_sig_checked_in_advance": bool(val_policy & 128)
    }

    constraints = {
        "NONE": bool(val_flags & 1),
        "order_matters": bool(val_flags & 2),
        "sign_with_version": bool(val_flags & 4),
        "sign_with_core_magicstring": bool(val_flags & 8),
        "sign_with_core_hash": bool(val_flags & 16),
        "sign_with_private_key_1": bool(val_flags & 32),
        "sign_with_private_key_2": bool(val_flags & 64),
        "sign_with_private_key_3": bool(val_flags & 128),
        "sign_with_private_key_4": bool(val_flags & 256),
        "sign_chain": bool(val_flags & 512),
        "verify_signature": bool(val_flags & 1024)
    }

    return val_counter, policies, constraints


def normalize_and_hash_structure(data_block: Any) -> str:
    """
    Recursively normalizes any nested Python object structure into a strict text footprint.
    Safely resolves IntFlag, Enum, IntNum, and complex native tuples into strings before hashing.
    """
    if isinstance(data_block, (IntFlag, Enum)):
        return f"primitive:{int(data_block)}"
    elif isinstance(data_block, dict):
        sorted_items = sorted((str(k), normalize_and_hash_structure(v)) for k, v in data_block.items())
        return "dict:" + "".join(f"{k}->{v}" for k, v in sorted_items)
    elif isinstance(data_block, (list, tuple)):
        return "sequence:" + "".join(normalize_and_hash_structure(item) for item in data_block)
    else:
        val_str = str(data_block)
        if val_str.isdigit():
            return f"primitive:{int(val_str)}"
        return f"primitive:{val_str}"


def run_scope_hashing_routine(scope_name: str, scope_file: str, scope_hash_targets: str):
    """Locates target structural components inside the target file and returns a unified hash fingerprint."""
    if not os.path.exists(scope_file):
        print(f"[!] Scope File Error: Unable to locate source file footprint at: {scope_file}")
        sys.exit(1)

    with open(scope_file, 'r', encoding='utf-8') as f:
        file_contents = f.read()

    try:
        parsed_workspace = ast.literal_eval(file_contents)
    except Exception:
        global_space = {}
        try:
            exec(file_contents, global_space)
            parsed_workspace = global_space
        except Exception as e:
            print(f"[!] Core Script Parse Failure: Unable to cleanly evaluate file symbols. Details: {str(e)}")
            sys.exit(1)

    targets = [t.strip() for t in scope_hash_targets.split(',')]
    combined_payloads = []

    print(f"\n[+] Analyzing Scope Matrix Target: [{scope_name}]")
    print(f"[+] Targeting File Source Path: {scope_file}")

    for target in targets:
        if target not in parsed_workspace:
            print(f"[ERROR] Mapping Error: Unable to locate target structure identifier token: '{target}' inside scope file.")
            sys.exit(1)

        target_data = parsed_workspace[target]
        struct_fingerprint = normalize_and_hash_structure(target_data)
        combined_payloads.append(struct_fingerprint)
        print(f" -> Structure '{target}' isolated. Intermediate Footprint: {hashlib.sha256(struct_fingerprint.encode('utf-8')).hexdigest()[:16]}...")

    master_raw_blob = "master_chain:" + "".join(combined_payloads)
    master_hash = hashlib.sha256(master_raw_blob.encode('utf-8')).hexdigest()

    print("\n========================================================")
    print(f"   DETERMINISTIC SCOPE MASTER HASH: {master_hash}")
    print("========================================================\n")


class VisualMixEngine:
    def __init__(self, target_path: str, config_data: Dict[str, Any] = None, namespace="visualMix"):
        self.target_path = target_path
        self.config_data = config_data or {}
        self.namespace = namespace
    def compute_core_hash(self, data: Dict[str, Any]) -> str:
        core_keys = [f"{self.namespace}Magic", f"{self.namespace}Version", f"{self.namespace}Creation", f"{self.namespace}Scope"]
        salt_string = "".join(str(data.get(k, "")) for k in sorted(core_keys))
        return hashlib.sha256(salt_string.encode('utf-8')).hexdigest()

    def process_scope_entries(self, data: Dict[str, Any], overwrite_hashes: bool = False) -> Dict[str, Any]:
        updated_scopes = []
        for entry in data.get(f"{self.namespace}ScopeSignatures", ()):
            s_id, s_scope, s_salt, s_short, s_sig, s_param = entry
            if not s_salt or s_salt == "pending_salt" or overwrite_hashes:
                s_salt = hashlib.sha256(f"{s_id}:{s_scope}:{s_param}".encode('utf-8')).hexdigest()
                s_short = s_salt[:8]
            updated_scopes.append((s_id, s_scope, s_salt, s_short, s_sig, s_param))
        data[f"{self.namespace}ScopeSignatures"] = tuple(updated_scopes)
        return data

    def load_target_file(self) -> Dict[str, Any]:
        """Loads file configurations smoothly matching extensions."""
        if not os.path.exists(self.target_path):
            skeleton = {
                f"{self.namespace}Magic": self.config_data.get(f"{self.namespace}Magic", "VMIX25IMMUT32CORE7617"),
                f"{self.namespace}Version": self.config_data.get(f"{self.namespace}Version", "0.70"),
                f"{self.namespace}Creation": self.config_data.get(f"{self.namespace}Creation", int(time.time())),
                f"{self.namespace}Scope": self.config_data.get(f"{self.namespace}Scope", "default_scope"),
                f"{self.namespace}Signature": "",
                f"{self.namespace}PublicKeys": self.config_data.get(f"{self.namespace}PublicKeys", ()),
                f"{self.namespace}ScopeSignatures": self.config_data.get(f"{self.namespace}ScopeSignatures", ())
            }
            skeleton[f"{self.namespace}Salt"] = self.compute_core_hash(skeleton)
            return self.process_scope_entries(skeleton)

        ext = os.path.splitext(self.target_path).lower()
        if ext == '.json':
            with open(self.target_path, 'r', encoding='utf-8') as f:
                raw = json.load(f)
                raw[f"{self.namespace}PublicKeys"] = tuple(tuple(x) for x in raw.get(f"{self.namespace}PublicKeys", []))
                raw[f"{self.namespace}ScopeSignatures"] = tuple(tuple(x) for x in raw.get(f"{self.namespace}ScopeSignatures", []))
                return raw
        elif ext == '.xml':
            return self._load_xml()
        else:
            with open(self.target_path, 'r', encoding='utf-8') as f:
                return ast.literal_eval(f.read())

    def save_target_file(self, data: Dict[str, Any]):
        ext = os.path.splitext(self.target_path).lower()
        if ext == '.json':
            with open(self.target_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4)
        elif ext == '.xml':
            self._save_xml(data)
        else:
            with open(self.target_path, 'w', encoding='utf-8') as f:
                f.write(repr(data))

    def _save_xml(self, data: Dict[str, Any]):
        root = ET.Element(f"{self.namespace}Config")
        for k, v in data.items():
            if k in [f"{self.namespace}PublicKeys", f"{self.namespace}ScopeSignatures"]:
                sub = ET.SubElement(root, k)
                for tup in v:
                    item = ET.SubElement(sub, "tupleItem")
                    for val in tup: ET.SubElement(item, "value").text = str(val)
            else:
                ET.SubElement(root, k).text = str(v)
        ET.ElementTree(root).write(self.target_path, encoding='utf-8', xml_declaration=True)

    def _load_xml(self) -> Dict[str, Any]:
        root = ET.parse(self.target_path).getroot()
        data = {}
        for elem in root:
            if elem.tag in [f"{self.namespace}PublicKeys", f"{self.namespace}ScopeSignatures"]:
                data[elem.tag] = tuple(tuple(val.text for val in item) for item in elem)
            else:
                data[elem.tag] = int(elem.text) if elem.tag == f"{self.namespace}Creation" else (elem.text or "")
        return data

# ========================================================
# 3. DOT-NOTATION NODE MANIPULATION REQUISITES
# ========================================================

def set_by_dot_path(data: Dict[str, Any], dot_path: str, value: Any, overwrite: bool = False) -> bool:
    parts = dot_path.split('.')
    current = data
    for part in parts[:-1]:
        if part not in current or not isinstance(current[part], dict):
            current[part] = {}
        current = current[part]

    last_key = parts[-1]
    if last_key in current and current[last_key] not in ("", None, [], ()) and not overwrite:
        print(f"[ERROR] COMPLAINT: Field '{dot_path}' already contains active data. Use --set-overwrite.")
        return False

    if str(value).isdigit(): value = int(value)
    current[last_key] = value
    return True

# ========================================================
# 4. ED25519 CRYPTOGRAPHIC CORE SIGNING ENGINE (CACHED)
# ========================================================

from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

def execute_ed25519_sign(private_key_path: str, data_to_sign: str, scope_id: str) -> str:
    global PASSPHRASE_CACHE
    if private_key_path in PASSPHRASE_CACHE:
        passphrase_bytes = PASSPHRASE_CACHE[private_key_path]
    else:
        print(f"\n 🔑 [PASSPHRASE REQUIRED] Unlocking Private Key for Scope ID: {scope_id}")
        pwd = getpass.getpass(prompt=f"Enter passphrase for [{scope_id}]: ")
        passphrase_bytes = pwd.encode('utf-8') if pwd else None
        PASSPHRASE_CACHE[private_key_path] = passphrase_bytes

    with open(private_key_path, "rb") as key_file:
        try:
            private_key = serialization.load_pem_private_key(key_file.read(), password=passphrase_bytes)
        except Exception:
            print(f"[!!!] Decryption Error: Invalid passphrase matching key reference: {scope_id}.")
            if private_key_path in PASSPHRASE_CACHE: del PASSPHRASE_CACHE[private_key_path]
            return ""
    return private_key.sign(data_to_sign.encode('utf-8')).hex()

def execute_ed25519_verify(public_key_str: str, data_to_verify: str, signature_hex: str) -> bool:
    try:
        if public_key_str.startswith("ssh-ed25519"):
            public_key = serialization.load_ssh_public_key(public_key_str.encode('utf-8'))
        else:
            public_key = ed25519.Ed25519PublicKey.from_public_bytes(bytes.fromhex(public_key_str))
        public_key.verify(bytes.fromhex(signature_hex), data_to_verify.encode('utf-8'))
        return True
    except Exception:
        return False

# ========================================================
# 4B. EXPERT FEATURE: INTERACTIVE PARAMETER PARSER DETECTOR
# ========================================================

def process_scope_param_argument(param_str: str, strict_mode: bool) -> str:
    """Processes incoming -scopeparam arguments dynamically against Option B parameters."""
    clean_p = param_str.strip().lower()

    # Context 1: User provided a partial 7-character string. Calculate trailing checkbit.
    if len(clean_p) == 7:
        c_hex = clean_p[:2]
        p_hex = clean_p[2:4]
        f_hex = clean_p[4:7]
        csum = calculate_visualmix_checksum(c_hex, p_hex, f_hex)
        full_p = f"{clean_p}{csum}"
        print(f" - Parameter padding executed. Finalized validation token: {full_p}")
        return full_p

    # Context 2: User provided a full 9-character string. Apply check procedures.
    elif len(clean_p) == 9:
        if verify_param_checksum_opt_b(clean_p):
            print(f"[OK] Parameter String Verified Successfully: {clean_p}")
            return clean_p
        else:
            msg = f"[!!!] Integrity Error: Passed string '{clean_p}' failed Option B validation checks."
            if strict_mode:
                print(f"{msg} --strict flag triggered. Halting pipeline execution.")
                sys.exit(1)
            else:
                print(f"{msg} Warning ignored. Recalculating appropriate checksum bounds...")
                return process_scope_param_argument(clean_p[:7], strict_mode=False)
    else:
        print("[!!!] Formatting Error: -scopeparam parameter length must be either 7 or 9 characters long.")
        sys.exit(1)

def run_pipeline(args):
    # Route execution options matching parameters configuration states early
    if args.scopeparam:
        resolved_p = process_scope_param_argument(args.scopeparam, args.strict)
        if args.scopehash:
            run_scope_hashing_routine(args.scope or "cli_scope", args.scopefile, args.scopehash)
        sys.exit(0)

    if args.scopehash:
        if not args.scope or not args.scopefile:
            print("[!!!] Input Error: Running -scopehash requires providing both -scope and -scopefile arguments.")
            sys.exit(1)
        run_scope_hashing_routine(args.scope, args.scopefile, args.scopehash)
        sys.exit(0)

    if not args.c or not args.target_file:
        print("[!!!] Missing configuration values. Arguments -c and target_file are required.")
        sys.exit(1)

    with open(args.c, 'r', encoding='utf-8') as f:
        config_data = json.load(f)

    ns = getattr(args, 'namespace', 'visualmix')
    engine = VisualMixEngine(args.target_file, config_data, namespace=ns)
    data = engine.load_target_file()
    modified = False

    # Value Setters
    if args.set or args.set_overwrite:
        expr = args.set or args.set_overwrite
        if '=' in expr:
            d_path, d_val = expr.split('=', 1)
            if set_by_dot_path(data, d_path.strip(), d_val.strip(), overwrite=bool(args.set_overwrite)):
                modified = True

    # Processing Hashes
    if args.hash:
        mode = args.hash.lower()
        if mode in ['all', 'overwrite']:
            data[f"{ns}Salt"] = engine.compute_core_hash(data)
            data = engine.process_scope_entries(data, overwrite_hashes=True)
            modified = True
        elif mode == 'empty':
            if not data.get(f"{ns}Salt"): data[f"{ns}Salt"] = engine.compute_core_hash(data)
            data = engine.process_scope_entries(data, overwrite_hashes=False)
            modified = True

    # Cryptographic Signing Blocks
    if args.sign:
        mode = args.sign.lower()
        private_keys_map = {k: v for k, v in config_data.get(f"{ns}PrivateKeys", [])}
        updated_scopes = []

        for entry in data.get(f"{ns}ScopeSignatures", ()):
            s_id, s_scope, s_salt, s_short, s_sig, s_param = entry
            _, _, flags = decode_visualmix_param_opt_b(s_param)

            requires_4_keys = flags.get("sign_with_private_key_1", False) and flags.get("sign_with_private_key_4", False)
            should_sign = (mode == 'all') or (mode == 'scope' and s_id == args.target_file) or (mode == 'empty' and not s_sig) or (mode == 'overwrite')

            if should_sign:
                if s_id in private_keys_map and os.path.exists(private_keys_map[s_id]):
                    sig_out = execute_ed25519_sign(private_keys_map[s_id], s_salt, scope_id=s_id)
                    if sig_out:
                        s_sig = sig_out
                        modified = True
                else:
                    if requires_4_keys:
                        print(f"[CRITICAL] CONSTRAINT VIOLATION: Scope ID [{s_id}] requires mandatory 4-key signature matrix, but local file handle is missing.")
                        sys.exit(1)
            updated_scopes.append((s_id, s_scope, s_salt, s_short, s_sig, s_param))
        data[f"{ns}ScopeSignatures"] = tuple(updated_scopes)

    if modified:
        engine.save_target_file(data)

    # Verification Sweep Engine Checks
    if args.check or args.verify:
        errors = []
        for entry in data.get(f"{ns}ScopeSignatures", ()):
            s_id, _, _, _, _, s_param = entry
            if not verify_param_checksum_opt_b(s_param):
                errors.append(f"Scope Entry Row '{s_id}' failed Option B validation checks.")

        if data.get(f"{ns}Salt") != engine.compute_core_hash(data):
            errors.append("VisualMIX Header salt properties hash integrity trace failure detected.")

        public_keys_map = {k: v for k, _, v in data.get(f"{ns}PublicKeys", ())}
        for entry in data.get(f"{ns}ScopeSignatures", ()):
            s_id, _, s_salt, _, s_sig, _ = entry
            if s_sig and s_id in public_keys_map:
                if not execute_ed25519_verify(public_keys_map[s_id], s_salt, s_sig):
                    errors.append(f"Ed25519 cryptographic mismatch validation fault on row ID: {s_id}")

        if errors:
            print("[!!!] SECURITY AUDIT CONSTRAINTS CORRUPTED:")
            for err in errors: print(f" -> {err}")
            sys.exit(1)
        elif not args.quiet:
            print("[OK] SYSTEM INTEGRITY SECURE: All structural files pass verification bounds perfectly.")

def main():
    parser = argparse.ArgumentParser(description="VisualMIX Cryptographic Engine (c)2002-2026 by Gunther Voet")
    parser.add_argument("-ns", default="visualmix", help="Application namespace prefix.")
    parser.add_argument("-c", help="Path to absolute key registry layout configuration.")
    parser.add_argument("target_file", nargs="?", help="Working structural destination manifest payload path.")

    parser.add_argument("-hash", choices=["all", "fieldname", "empty", "overwrite"])
    parser.add_argument("-sign", choices=["all", "fieldname", "empty", "overwrite", "scope"])
    parser.add_argument("-check", choices=["all", "fieldname", "scope", "hashes", "signatures"])
    parser.add_argument("-verify", action="store_true")

    # Advanced Structural Data Constraints Flags
    parser.add_argument("-scope")
    parser.add_argument("-scopefile")
    parser.add_argument("-scopehash")

    # Cherry-On-Top Parameter Policy Enforcement Arguments
    parser.add_argument("-scopeparam", help="Target Option B parameter validation string to parse or verify.")
    parser.add_argument("-strict", action="store_true", help="Forces a pipeline structural failure if checksum rules fail to pass.")

    parser.add_argument("-set")
    parser.add_argument("-set-overwrite")
    parser.add_argument("-quiet", action="store_true")

    run_pipeline(parser.parse_args())

if __name__ == "__main__":
    main()
