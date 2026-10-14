#!/bin/sh
# Bundles the Cloudflare worker for the local test harness (needs esbuild).
D=$(cd "$(dirname "$0")" && pwd)
ESB=${ESBUILD:-esbuild}
$ESB "$D/../../cf/worker.js" --bundle --format=esm --platform=node --outfile="$D/bundle.mjs" --alias:cloudflare:workers="$D/stub-cf.js" --banner:js="import {createRequire as __cr} from 'module'; const require = __cr(import.meta.url);" --log-level=warning
