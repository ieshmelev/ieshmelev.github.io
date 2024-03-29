lint:
	golangci-lint run
	npm run lint

test:
	go test -v ./...
	npm run test -- --watchAll=false

fifaindex-parse:
	find -E public/fifaindex-logos -regex '.*[0-9]+\.png' -delete
	go run fifaindex-parser/main.go \
	-out_data=src/teams.json \
	-out_logos=public/fifaindex-logos \
	-path_logos=fifaindex-logos \
	-src='https://www.fifaindex.com/ru/teams/fifa22/?league=80&league=4&league=1&league=14&league=61&league=60&league=13&league=16&league=17&league=19&league=20&league=2076&league=10&league=31&league=41&league=308&league=66&league=65&league=330&league=50&league=53&league=54&league=56&league=189&league=68&order=desc'

inshaker-parse:
	go run inshaker-parser/main.go \
	-out_data=src/cocktails.json \
	-src='https://ru.inshaker.com/cocktails?random_page=1&pagination=random&respond_with=body'
