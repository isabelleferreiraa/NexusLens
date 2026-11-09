"""Download the synthetic IBM AML HI-Small CSV from a public community mirror.

Downloads ~476 MB. It never connects to PostgreSQL, never imports data,
and refuses a file that fails the pinned checksum or size verification.
The primary publisher is IBM: https://github.com/IBM/AML-Data
"""

from __future__ import annotations

import argparse
import hashlib
import os
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

# Public third-party mirror. Verify against a previously published checksum;
# this repository does not redistribute any CSV rows.
MIRROR_URL = (
    "https://huggingface.co/datasets/OsamaMIT/IBM-AML-HI/resolve/main/"
    "HI-Small_Trans.csv?download=true"
)
EXPECTED_SIZE = 475_664_283
EXPECTED_SHA256 = "b19d39f515523373f991b689c07e11e7b0b95c17a2c27a87d91584ae16c5b040"
CHUNK = 4 * 1024 * 1024
DEFAULT_PATH = Path(__file__).resolve().parents[2] / "data/raw/ibm_aml/HI-Small_Trans.csv"


def calculate_digest(path: Path, chunk_size: int = CHUNK):
    digest = hashlib.sha256()
    size = 0
    with path.open("rb") as stream:
        while chunk := stream.read(chunk_size):
            digest.update(chunk)
            size += len(chunk)
    return size, digest.hexdigest()


def verified(path: Path, expected_size=EXPECTED_SIZE, expected_sha256=EXPECTED_SHA256):
    if not path.is_file() or path.is_symlink():
        return False
    size, digest = calculate_digest(path)
    return size == expected_size and digest.lower() == expected_sha256.lower()


def download_csv(destination: Path, url=MIRROR_URL, expected_size=EXPECTED_SIZE,
                 expected_sha256=EXPECTED_SHA256, opener=urlopen):
    """Download with bounded memory, atomic move, and content verification."""
    if urlsplit(url).scheme != "https":
        raise ValueError("A origem do dataset precisa usar HTTPS.")
    if destination.is_symlink():
        raise ValueError("O destino não pode ser um link simbólico.")
    if destination.exists():
        if verified(destination, expected_size, expected_sha256):
            return "already_verified"
        raise FileExistsError(
            f"Já existe um arquivo diferente em {destination}. "
            "Não substituirei automaticamente; confira antes de remover."
        )
    destination.parent.mkdir(parents=True, exist_ok=True)
    partial = destination.with_name(destination.name + ".partial")
    if partial.exists():
        raise FileExistsError(f"Download incompleto já existe: {partial}. Remova apenas após conferir.")
    request = Request(url, headers={"User-Agent": "NexusLens-AML-Data-Setup/1.0"})
    size = 0
    digest = hashlib.sha256()
    try:
        with opener(request, timeout=120) as response:
            resolved = response.geturl() if hasattr(response, "geturl") else url
            if urlsplit(resolved).scheme != "https":
                raise ValueError("O download foi redirecionado para uma origem sem HTTPS.")
            with partial.open("xb") as output:
                while chunk := response.read(CHUNK):
                    size += len(chunk)
                    if size > expected_size:
                        raise ValueError("Arquivo maior que o tamanho esperado; download interrompido.")
                    output.write(chunk)
                    digest.update(chunk)
        if size != expected_size or digest.hexdigest().lower() != expected_sha256.lower():
            raise ValueError("Tamanho ou SHA-256 do CSV diferente da referência; importação bloqueada.")
        os.replace(partial, destination)
    except Exception:
        partial.unlink(missing_ok=True)
        raise
    return "downloaded_and_verified"


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--destination", type=Path, default=DEFAULT_PATH)
    args = parser.parse_args(argv)
    result = download_csv(args.destination)
    if result == "already_verified":
        print("CSV já disponível e verificado:", args.destination)
    else:
        print("CSV baixado e verificado:", args.destination)
    print("Nenhum banco foi alterado. Execute import_ibm_aml.py primeiro sem --apply.")


if __name__ == "__main__":
    main()
