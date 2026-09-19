# NEUBAT - Makefile
.PHONY: portal install-deps validate lint test test-vm build-iso release

install-deps:
	cd portal && npm install

portal: install-deps
	cd portal && npm start

validate:
	@for f in scripts/*.sh; do bash -n $$f && echo "OK $$f"; done
	@node --check portal/server.js && echo "OK portal/server.js"
	@node --check portal/routes/install.js && echo "OK portal/routes/install.js"
	@node --check portal/routes/status.js && echo "OK portal/routes/status.js"
	@node --check portal/routes/admin.js && echo "OK portal/routes/admin.js"
	@node --check portal/lib/db.js && echo "OK portal/lib/db.js"
	@for f in configs/*.json; do python3 -m json.tool $$f > /dev/null && echo "OK $$f"; done

lint:
	@command -v shellcheck >/dev/null && shellcheck scripts/*.sh || echo "shellcheck no instalado; omitido"

test: validate
	@cd portal && PORT=3100 timeout 8 node server.js & \
	sleep 2; \
	curl -sf http://localhost:3100/api/health && echo "OK /api/health"; \
	curl -sf -X POST http://localhost:3100/api/install -H 'Content-Type: application/json' \
		-d '{"profile":"base","hostname":"neubat-test"}' && echo "OK /api/install"; \
	wait || true

# Prueba end-to-end en VM QEMU/NVMe (larga: ~40 min). Ver tests/vm/README.md
test-vm:
	python3 tests/vm/neubat_vm_test.py

# Construir ISO híbrida con autoinstalación (requiere Docker)
build-iso:
	bash scripts/build-iso.sh

# Crear release v1.0.0 en GitHub adjuntando la ISO generada (requiere gh)
release: build-iso
	gh release create v1.0.0 out/neubat-1.0.0-x86_64.iso \
		--title "NEUBAT v1.0.0" \
		--notes-file docs/RELEASE-v1.0.0.md \
		--repo Alexendros/neubat
