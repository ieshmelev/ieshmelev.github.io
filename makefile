lint:
	golangci-lint run
	npm run lint

test:
	go test -v ./...
	npm run test -- --watchAll=false

parse:
	find -E public/logos -regex '.*[0-9]+\.png' -delete
	OUT_DATA=src/teams.json \
	OUT_LOGOS=public/logos \
	PATH_LOGOS=logos \
	SRC='https://www.fifaindex.com/ru/teams/fifa22/?league=80&league=4&league=1&league=14&league=61&league=60&league=13&league=16&league=17&league=19&league=20&league=2076&league=10&league=31&league=41&league=308&league=66&league=65&league=330&league=50&league=53&league=54&league=56&league=189&league=68&order=desc' \
	go run parser/main.go
