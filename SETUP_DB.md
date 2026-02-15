# CPG Database Generation Instructions

## Step 1: Install Go 1.25+

1. Download Go 1.25+ from https://go.dev/dl/
2. Install according to instructions for your OS
3. Verify installation: `go version` (should be version 1.25.0 or higher)

## Step 2: Initialize Submodules

```bash
cd cpg-test-release
git submodule update --init
```

## Step 3: Add Fourth Module (alertmanager)

```bash
cd cpg-test-release
git clone https://github.com/prometheus/alertmanager.git
```

## Step 4: Generate Database

```bash
cd cpg-test-release
go build -o cpg-gen .
./cpg-gen -modules "./client_golang:github.com/prometheus/client_golang:client_golang,./prometheus-adapter:sigs.k8s.io/prometheus-adapter:adapter,./alertmanager:github.com/prometheus/alertmanager:alertmanager" ./prometheus cpg.db
```

This will take some time (database is ~900 MB).

## Step 5: Copy Database to Project

```bash
# Create data folder in project root
mkdir -p ../cpg-explorer/data
# Copy database
cp cpg.db ../cpg-explorer/data/cpg.db
```

After completing these steps, the database will be ready for use in the application.
