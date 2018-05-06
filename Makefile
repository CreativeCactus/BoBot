
default: start

build:
	docker build -t bobot .

start:
	docker rm -f bobot; docker run -p 65000:65000 --name bobot -ditw /usr/src/app bobot
