#!/bin/sh
# Install pawsee on macOS / Linux:  curl -fsSL https://raw.githubusercontent.com/henskjold73/pawsee/main/install.sh | sh
set -eu

REPO="henskjold73/pawsee"
BASE="${PAWSEE_BASE_URL:-https://github.com/$REPO/releases/latest/download}"
DIR="${PAWSEE_INSTALL_DIR:-$HOME/.local/bin}"

case "$(uname -s)-$(uname -m)" in
  Darwin-arm64)  target=darwin-arm64 ;;
  Darwin-x86_64) target=darwin-x64 ;;
  Linux-x86_64)  target=linux-x64 ;;
  *) echo "pawsee: no prebuilt binary for $(uname -s) $(uname -m) — try: npx github:$REPO" >&2; exit 1 ;;
esac

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
file="pawsee-$target.tar.gz"

echo "Downloading $file ..."
curl -fsSL "$BASE/$file" -o "$tmp/$file"
curl -fsSL "$BASE/SHA256SUMS.txt" -o "$tmp/SHA256SUMS.txt"

want="$(grep " $file\$" "$tmp/SHA256SUMS.txt" | cut -d' ' -f1)"
if command -v sha256sum >/dev/null 2>&1; then got="$(sha256sum "$tmp/$file" | cut -d' ' -f1)"; else got="$(shasum -a 256 "$tmp/$file" | cut -d' ' -f1)"; fi
if [ -z "$want" ] || [ "$want" != "$got" ]; then echo "pawsee: checksum mismatch — not installing" >&2; exit 1; fi

tar -xzf "$tmp/$file" -C "$tmp"
mkdir -p "$DIR"
install -m 755 "$tmp/pawsee" "$DIR/pawsee"

echo "Installed pawsee to $DIR/pawsee"
case ":$PATH:" in
  *":$DIR:"*) echo "Run: pawsee" ;;
  *) echo "$DIR is not on your PATH yet. Run it now with:  $DIR/pawsee"
     echo "To run it as 'pawsee' from anywhere, add this line to ~/.zshrc (or ~/.bashrc) and open a new terminal:"
     echo "  export PATH=\"$DIR:\$PATH\"" ;;
esac
