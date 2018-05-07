
default: start

build:
	docker build -t bobot .

start:
	docker rm -f bobot; docker run --name bobot -dit --net tiab_demo --restart always bobot
