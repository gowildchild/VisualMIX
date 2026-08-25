import os
import sys
import json
import hashlib
import argparse
import subprocess
from datetime import datetime

DEFAULT_CONFIG_NAME = "sign_integrity_config.json"

def get_timestamp() -> str:
    """Returns the current local execution system time string."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def log_event(msg: str):
    """Logs system events to stdout and appends to a persistent local audit file."""
    timestamp = get_timestamp()
    print(f"[{timestamp}] {msg}")
    try:
        with open("visualmix_audit.log", "a", encoding="utf-8") as log_file:
            log_file.write(f"[{timestamp}] {msg}\n")
    except Exception:
        pass

def generate_default_universal_config(path: str):
    """Natively writes out your universal default configuration to disk if missing."""
    default_data = {
        "comment": "AUDITING BLUEPRINT: Populate private_key_paths locally. Copy to sign_integrity_config.json and add to .gitignore.",
        "visualmixMeta ": {
            "CoreVersion": "v0.04",
            "policy_bitmasks": { "file_types": "0x03", "actions": "0x03" }
        },
        "private_key_paths": {
            "Platform": "",
            "Developer": "",
            "Personal": ""
        },
        "visualMixPublicKeys": [
            ["Platform",  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ4tfhIlXUXCKvFE/HOwkVFTEIjWknHayefpjqTVAwSs existenz@xsrv.net"],
            ["Developer", "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGHTQAOnKU4zaM03kASAKmrsps4ROCx8xMQZ4m12Yo8U existenz-dev-gwc@xsrv.net"],
            ["Personal",  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKn1/r+k9+T5OJyoIjcrkj0DBmLq//x0/sffNMJNWofK existenz-dev-gv@xsrv.net"]
        ]
    }
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(default_data, f, indent=2, ensure_ascii=False)
        log_event(f"ℹ️ Generated fresh universal default configuration profile at: {path}")
    except Exception as e:
        print(f"❌ CRITICAL: Failed to write baseline config profile: {e}")

def calculate_short_md5(file_path: str) -> str:
    """Calculates a deterministic 7-character MD5 hash of any target disk asset."""
    try:
        hasher = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hasher.update(chunk)
        return hasher.hexdigest()[:7]
    except Exception:
        return "ERROR"

def execute_private_existenz_signature(manifest_data: str, config_path: str, target_dir: str):
    """
    Natively checks for local private key paths from your isolated configuration file.
    If paths are populated, it triggers a local SSH signature pass.
    """
    if not os.path.exists(config_path):
        return
        
    with open(config_path, "r", encoding="utf-8") as f:
        try:
            profile = json.load(f)
        except Exception:
            return
            
    private_paths = profile.get("private_key_paths", {})
    
    # Extract your absolute local offline private key links
    platform_key = private_paths.get("Platform", "")
    developer_key = private_paths.get("Developer", "")
    personal_key = private_paths.get("Personal", "")
    
    # Resolve which key to use based on what is populated
    active_key_path = platform_key or developer_key or personal_key
    if not active_key_path:
        log_event("Ratio Core: Skipped offline signature routine. No private key paths are populated inside your hidden configuration.")
        return
        
    if not os.path.exists(active_key_path):
        log_event(f"⚠️ SIGNING FAULT: Target private key asset not found on local disk: {active_key_path}")
        return

    log_event(f"🔒 SECURING MANIFEST: Found active signing key path location at '{active_key_path}'")
    
    # Save the manifest output string to a physical file before passing to ssh-keygen
    manifest_out_path = os.path.join(target_dir, "check_integrity_source.json")
    try:
        with open(manifest_out_path, "w", encoding="utf-8") as m_file:
            m_file.write(manifest_data)
        
        log_event(f"📝 Manifest file written to {manifest_out_path}. Triggering local offline cryptographic signing...")
        
        # Invoke your local operating system's standard, safe ssh-keygen signing protocol 
        # This works completely offline on your signing machine without internet dependencies
        cmd = ["ssh-keygen", "-Y", "sign", "-f", active_key_path, "-n", "file", manifest_out_path]
        
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if result.returncode == 0:
            log_event(f"✅ SUCCESS: Cryptographic manifest verification signature file written locally ({manifest_out_path}.sig).")
        else:
            log_event(f"❌ SIGNING FAILURE: Local SSH execution system returned an error: {result.stderr.strip()}")
            
    except Exception as e:
        log_event(f"❌ CRITICAL EXCEPTION during offline signature execution: {e}")

def run_local_integrity_matrix(args):
    config_path = args.config
    scan_dir = args.dir
    
    if not os.path.exists(config_path):
        generate_default_universal_config(config_path)
        
    with open(config_path, "r", encoding="utf-8") as f:
        try:
            config_data = json.load(f)
        except Exception as e:
            log_event(f"❌ CRITICAL ERROR parsing configuration JSON metadata strings: {e}")
            sys.exit(1)
            
    # Standardized key normalization: mapping exactly to your local configuration space
    meta_profile = config_data.get("visualmixMeta ", config_data.get("visualMixMeta", {}))
    bitmasks = meta_profile.get("policy_bitmasks", {"file_types": "0x03", "actions": "0x03"})
    
    file_mask = int(bitmasks.get("file_types", "0x03"), 16)
    action_mask = int(bitmasks.get("actions", "0x03"), 16)
    
    log_event(f"🔬 INITIALIZING VisualMIX CHECK DRY LEATHER REPEAT...")
    log_event(f"-> Active Configuration Scope Path: {config_path}")
    log_event(f"-> Require Master Security Policy Mode: {args.require_master.upper()}")
    log_event(f"-> File-Type Policy Bitmask: {hex(file_mask)} | Action Policy Bitmask: {hex(action_mask)}")
    
    # Enforce strict 'change-master' directory requirements if validated by your environment policy
    if args.require_master in ["yes", "always", "change-master"]:
        master_tools_path = os.path.join(".", "master", "tools")
        if not os.path.exists(master_tools_path) and args.require_master == "change-master":
            log_event("🚨 POLICY BREACH DETECTED: Master environment tools directory tree is missing or corrupted.")
            sys.exit(1)
            
    if args.sign_verify:
        log_event("🔒 Initiating signature verification pass against configured public keys...")
        # Local public key verification routine placeholder
        sys.exit(0)
        
    target_extensions = []
    if (file_mask & 1) == 1: target_extensions.extend([".json", ".xml"])
    if (file_mask & 2) == 2: target_extensions.append(".js")
    if (file_mask & 4) == 4: target_extensions.append(".py")
    if (file_mask & 8) == 8: target_extensions.append(".pl")
    
    # Context directory route shifting based on your explicit scope flags
    if args.sign_tools:
        log_event("⚡ Execution scope locked strictly to Toolchain scripts context.")
        scan_dir = "./master/tools"
    if args.sign_dist:
        log_event("⚡ Execution scope locked strictly to Release Distribution bundle context.")
        scan_dir = "./dist"
    
    if not os.path.exists(scan_dir):
        log_event(f"❌ ERROR: Target scanning directory '{scan_dir}' does not exist.")
        sys.exit(1)
        
    log_event(f"-> Scanning directory target path: '{os.path.abspath(scan_dir)}'")
    
    valid_targets = []
    for root, dirs, files in os.walk(scan_dir):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in target_extensions and file != DEFAULT_CONFIG_NAME and file != "check_integrity_source.json":
                valid_targets.append(os.path.join(root, file))
                
    manifest_out_path = os.path.join(scan_dir, "check_integrity_source.json")
    existing_inventory = {}
    if os.path.exists(manifest_out_path):
        with open(manifest_out_path, "r", encoding="utf-8") as mf:
            try:
                existing_inventory = json.load(mf).get("verified_inventory", {})
            except Exception:
                pass
                
    if not valid_targets and not existing_inventory:
        log_event("ℹ️ Workspace iteration complete: Zero target file extensions caught in folder scope.")
        sys.exit(0)
        
    # Compile the internal manifest structure strings dynamically
    manifest_obj = {
        "manifest_version": "0.0.3-VisualMIX",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "file_type_policy_mask": hex(file_mask),
        "action_policy_mask": hex(action_mask),
        "verified_inventory": {}
    }
    
    for target_path in sorted(valid_targets):
        file_hash = calculate_short_md5(target_path)
        rel_path = os.path.relpath(target_path, scan_dir)
        
        # Intercept mutable changes and implement state validation guards
        if rel_path in existing_inventory:
            old_hash = existing_inventory[rel_path].get("hash", "")
            if old_hash != file_hash:
                if not args.allow_change:
                    log_event(f"🚨 ILLEGAL FILE MUTATION BLOCKED inside '{rel_path}': Pass --allow-change to unlock.")
                    continue
                else:
                    log_event(f"🔄 Authorized Modification caught in '{rel_path}': Updating entry state map.")
                    
        manifest_obj["verified_inventory"][rel_path] = {
            "hash": file_hash,
            "status": "VALID"
        }
        log_event(f"📁 Audited local module asset: '{rel_path}' | Computed Checksum Token: [{file_hash}]")

    manifest_json_str = json.dumps(manifest_obj, indent=2, ensure_ascii=False)
    
    # State routing processing loop derived from flag execution arguments
    if args.sign_change:
        log_event("📝 Committing authorized inventory modifications using hashing strings. Private signature bypassed.")
        with open(manifest_out_path, "w", encoding="utf-8") as f:
            f.write(manifest_json_str)
    elif args.sign_master or (action_mask & 4) == 4:
        execute_private_existenz_signature(manifest_json_str, config_path, scan_dir)
    else:
        with open(manifest_out_path, "w", encoding="utf-8") as f:
            f.write(manifest_json_str)
        log_event(f"✅ Manifest file compiled successfully and saved to disk: {manifest_out_path}")

def main():
    parser = argparse.ArgumentParser(description="VisualMIX Quick Checker & Signer Matrix")
    parser.add_argument("-c", "--config", type=str, default=DEFAULT_CONFIG_NAME,
                        help=f"Path to local validation target configuration profile. (Default: {DEFAULT_CONFIG_NAME})")
    parser.add_argument("-d", "--dir", type=str, default=".",
                        help="Target directory pathway location to scan files inside. (Default: current directory '.')")
                        
    # ⚙️ INTEGRATING ALL NEW CONSOLE UTILITY SWAP ARGUMENTS
    parser.add_argument("--sign-verify", action="store_true", help="Verify existing digital manifest signatures.")
    parser.add_argument("--sign-tools", action="store_true", help="Isolate toolchain script validation loops.")
    parser.add_argument("--sign-dist", action="store_true", help="Isolate release distribution bundles.")
    parser.add_argument("--sign-master", action="store_true", help="Force cryptographic manifest sealing.")
    parser.add_argument("--allow-change", action="store_true", help="Authorize changes to manifest state mappings.")
    parser.add_argument("--sign-change", action="store_true", help="Hash changes immediately without requesting private keys.")
    parser.add_argument("--require-master", choices=["no", "auto", "change", "change-master", "change-dist", "yes", "always"], default="change-master")
                        
    args = parser.parse_args()
    run_local_integrity_matrix(args)

if __name__ == "__main__":
    main()

