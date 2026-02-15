# Инструкция по генерации базы данных CPG

## Шаг 1: Установка Go 1.25+

1. Скачайте Go 1.25+ с https://go.dev/dl/
2. Установите согласно инструкциям для вашей ОС
3. Проверьте установку: `go version` (должна быть версия 1.25.0 или выше)

## Шаг 2: Инициализация submodules

```bash
cd cpg-test-release
git submodule update --init
```

## Шаг 3: Добавление четвёртого модуля (alertmanager)

```bash
cd cpg-test-release
git clone https://github.com/prometheus/alertmanager.git
```

## Шаг 4: Генерация базы данных

```bash
cd cpg-test-release
go build -o cpg-gen .
./cpg-gen -modules "./client_golang:github.com/prometheus/client_golang:client_golang,./prometheus-adapter:sigs.k8s.io/prometheus-adapter:adapter,./alertmanager:github.com/prometheus/alertmanager:alertmanager" ./prometheus cpg.db
```

Это займёт некоторое время (база данных ~900 MB).

## Шаг 5: Копирование базы в проект

```bash
# Создайте папку data в корне проекта
mkdir -p ../cpg-explorer/data
# Скопируйте базу
cp cpg.db ../cpg-explorer/data/cpg.db
```

После выполнения этих шагов база данных будет готова для использования в приложении.

