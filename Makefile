
default: start

build:
	docker build -t bobot .

start:
	docker rm -f wn-bobot; docker run -p 65000:65000 --name wn-bobot -dit --network=team -v ~/bobot:/usr/src/app -w /usr/src/app bobot
