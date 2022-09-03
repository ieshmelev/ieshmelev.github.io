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
	SRC=https://www.fifaindex.com/ru/teams/fifa22/ \
	go run parser/main.go
